begin;
create table public.evidence_submissions (
 id uuid primary key default gen_random_uuid(), obligation_id uuid not null unique references public.daily_obligations(id),
 challenge_id uuid not null references public.challenges(id), user_id uuid not null references public.profiles(id),
 status text not null default 'pending' check(status in ('pending','ai_reviewed','accepted','rejected','disputed')),
 note text not null check(length(note)<=500), source text not null check(source in ('camera','upload')),
 path text not null unique, received_at timestamptz, review jsonb, round integer not null default 0 check(round in (0,1)), created_at timestamptz not null default now()
);
create index evidence_challenge_idx on public.evidence_submissions(challenge_id,created_at);
create table public.evidence_votes (
 proof_id uuid not null references public.evidence_submissions(id), user_id uuid not null references public.profiles(id),
 round integer not null, decision text not null check(decision in ('accept','reject')), reason text not null check(length(btrim(reason)) between 5 and 500),
 created_at timestamptz not null default clock_timestamp(), primary key(proof_id,user_id,round)
);
create table public.evidence_events (
 id uuid primary key default gen_random_uuid(), proof_id uuid not null references public.evidence_submissions(id),
 actor_id uuid not null references public.profiles(id), kind text not null, reason text not null default '', created_at timestamptz not null default clock_timestamp()
);
alter table public.evidence_submissions enable row level security;
alter table public.evidence_votes enable row level security;
alter table public.evidence_events enable row level security;
revoke all on public.evidence_submissions,public.evidence_votes,public.evidence_events from anon,authenticated;
grant select on public.evidence_submissions,public.evidence_votes,public.evidence_events to authenticated;
create function private.can_read_proof(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.evidence_submissions s join public.challenges c on c.id=s.challenge_id where s.id=pid and private.is_circle_member(c.circle_id))
$$;
revoke all on function private.can_read_proof(uuid) from public,anon;
grant execute on function private.can_read_proof(uuid) to authenticated;
create policy evidence_member_read on public.evidence_submissions for select to authenticated using(private.can_read_proof(id));
create policy votes_member_read on public.evidence_votes for select to authenticated using(private.can_read_proof(proof_id));
create policy evidence_events_member_read on public.evidence_events for select to authenticated using(private.can_read_proof(proof_id));
create function private.proof_json(pid uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',s.id,'obligationId',s.obligation_id,'challengeId',s.challenge_id,'userId',s.user_id,'name',p.display_name,
 'localDate',o.local_date,'deadlineAt',o.deadline_at,'receivedAt',s.received_at,'status',case when s.status='pending' and clock_timestamp()>o.deadline_at then 'expired' else s.status end,
 'note',s.note,'source',s.source,'path',s.path,'review',s.review,'round',s.round,
 'votes',(select coalesce(jsonb_agg(jsonb_build_object('userId',v.user_id,'name',vp.display_name,'decision',v.decision,'reason',v.reason,'round',v.round,'createdAt',v.created_at)order by v.created_at),'[]') from public.evidence_votes v join public.profiles vp on vp.id=v.user_id where v.proof_id=s.id),
 'events',(select coalesce(jsonb_agg(jsonb_build_object('kind',e.kind,'actorId',e.actor_id,'reason',e.reason,'createdAt',e.created_at)order by e.created_at),'[]')from public.evidence_events e where e.proof_id=s.id))
 from public.evidence_submissions s join public.daily_obligations o on o.id=s.obligation_id join public.profiles p on p.id=s.user_id where s.id=pid and private.can_read_proof(s.id)
$$;
revoke all on function private.proof_json(uuid) from public,anon,authenticated;
create function private.stakeup_evidence(p_action text,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); hid uuid:=(p_payload->>'challengeId')::uuid; h public.challenges; o public.daily_obligations; s public.evidence_submissions; pid uuid; yes integer; no integer; eligible integer; reason text:=btrim(p_payload->>'reason');
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501';end if;
 select * into h from public.challenges where id=hid;
 if h.id is null or not private.is_circle_member(h.circle_id) then raise exception 'Challenge not found' using errcode='42501';end if;
 if p_action='list' then return jsonb_build_object('proofs',(select coalesce(jsonb_agg(private.proof_json(e.id)order by e.created_at desc),'[]')from public.evidence_submissions e where e.challenge_id=hid),'eligibleReviewers',(select count(*)from public.challenge_participants where challenge_id=hid and status='accepted' and user_id<>uid));end if;
 if p_action='reserve' then
  select * into o from public.daily_obligations where id=(p_payload->>'obligationId')::uuid and challenge_id=hid and user_id=uid for update;
  if o.id is null or h.status<>'active' then raise exception 'Only enrolled participants can submit their own proof' using errcode='42501';end if;
  if clock_timestamp()>o.deadline_at or o.local_date<>(clock_timestamp()at time zone(h.rules->>'timezone'))::date then raise exception 'This submission window is closed or has not opened.';end if;
  if h.rules->>'capturePolicy'='camera_only' and p_payload->>'source'<>'camera' then raise exception 'This challenge requests camera capture.';end if;
  select * into s from public.evidence_submissions where obligation_id=o.id;
  if s.id is not null then
   if s.status<>'pending' then raise exception 'Proof has already been submitted.';end if;
   return private.proof_json(s.id);
  end if;
  pid:=gen_random_uuid();
  insert into public.evidence_submissions(id,obligation_id,challenge_id,user_id,note,source,path)values(pid,o.id,hid,uid,coalesce(p_payload->>'note',''),p_payload->>'source',uid::text||'/'||pid::text||'.jpg');
  insert into public.evidence_events(proof_id,actor_id,kind)values(pid,uid,'upload_reserved');return private.proof_json(pid);
 end if;
 select * into s from public.evidence_submissions where id=(p_payload->>'proofId')::uuid and challenge_id=hid for update;
 if s.id is null then raise exception 'Proof not found.';end if;
 if p_action='photo' then return private.proof_json(s.id);end if;
 if p_action='finish' then
  if s.user_id<>uid then raise exception 'Only the owner can submit this proof.' using errcode='42501';end if;
  if s.status<>'pending' then return private.proof_json(s.id);end if;
  select * into o from public.daily_obligations where id=s.obligation_id;
  if clock_timestamp()>o.deadline_at then raise exception 'The deadline has passed.';end if;
  if not exists(select 1 from storage.objects where bucket_id='evidence' and name=s.path) then raise exception 'Upload the photo first.';end if;
  update public.evidence_submissions set received_at=clock_timestamp(),status='ai_reviewed',review='{"provider":"development-mock-v1","observations":["A photo object was received. This mock does not analyze its visual contents."],"unverified":["Relevance and completion have not been verified.","A photo cannot establish capture time or who performed an action."],"recommendation":"peer_review"}' where id=s.id;
  insert into public.evidence_events(proof_id,actor_id,kind,reason)values(s.id,uid,'ai_reviewed','Development mock: human review required.');return private.proof_json(s.id);
 end if;
 if not exists(select 1 from public.challenge_participants where challenge_id=hid and user_id=uid and status='accepted')then raise exception 'Only enrolled participants can review.' using errcode='42501';end if;
 if p_action='dispute' then
  if s.status not in('accepted','rejected')then raise exception 'Only a decided proof can be disputed.';end if;
  if s.round=1 then raise exception 'This proof has already had its dispute round.';end if;
  if s.user_id=uid and s.status<>'rejected' then raise exception 'You can appeal only your rejected proof.' using errcode='42501';end if;
  if coalesce(length(reason),0)not between 10 and 500 then raise exception 'Explain the dispute in 10 to 500 characters.';end if;
  update public.evidence_submissions set status='disputed',round=1 where id=s.id;
  insert into public.evidence_events(proof_id,actor_id,kind,reason)values(s.id,uid,'disputed',reason);return private.proof_json(s.id);
 end if;
 if p_action='vote' then
  if s.user_id=uid then raise exception 'You cannot review your own proof.' using errcode='42501';end if;
  if s.status not in('ai_reviewed','disputed')then raise exception 'This proof is not open for review.';end if;
  insert into public.evidence_votes(proof_id,user_id,round,decision,reason)values(s.id,uid,s.round,p_payload->>'decision',reason);
  insert into public.evidence_events(proof_id,actor_id,kind,reason)values(s.id,uid,'peer_vote',(p_payload->>'decision')||': '||reason);
  select count(*)into eligible from public.challenge_participants where challenge_id=hid and status='accepted' and user_id<>s.user_id;
  select count(*)filter(where decision='accept'),count(*)filter(where decision='reject')into yes,no from public.evidence_votes where proof_id=s.id and round=s.round;
  if yes*2>eligible and yes>=(case when s.round=1 then 2 else 1 end) then update public.evidence_submissions set status='accepted'where id=s.id;
  elsif no*2>eligible and no>=2 then update public.evidence_submissions set status='rejected'where id=s.id;end if;
  if exists(select 1 from public.evidence_submissions where id=s.id and status in('accepted','rejected'))then insert into public.evidence_events(proof_id,actor_id,kind,reason)select s.id,uid,status,'Peer quorum reached.'from public.evidence_submissions where id=s.id;end if;
  return private.proof_json(s.id);
 end if;
 raise exception 'Unknown evidence action.';
end;$$;
revoke all on function private.stakeup_evidence(text,jsonb)from public,anon;
grant execute on function private.stakeup_evidence(text,jsonb)to authenticated;
create function public.stakeup_evidence(p_action text,p_payload jsonb)returns jsonb language sql security invoker set search_path=''as $$select private.stakeup_evidence(p_action,p_payload)$$;
revoke all on function public.stakeup_evidence(text,jsonb)from public,anon;
grant execute on function public.stakeup_evidence(text,jsonb)to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('evidence','evidence',false,2500000,array['image/jpeg']);
create function private.can_upload_evidence(object_path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.evidence_submissions s join public.daily_obligations o on o.id=s.obligation_id join public.challenges h on h.id=s.challenge_id where s.path=object_path and s.user_id=auth.uid()and s.status='pending'and clock_timestamp()<=o.deadline_at and o.local_date=(clock_timestamp()at time zone(h.rules->>'timezone'))::date and private.is_circle_member(h.circle_id))
$$;
create function private.can_read_evidence(object_path text)returns boolean language sql stable security definer set search_path=''as $$select exists(select 1 from public.evidence_submissions s where s.path=object_path and private.can_read_proof(s.id))$$;
revoke all on function private.can_upload_evidence(text),private.can_read_evidence(text)from public,anon;
grant execute on function private.can_upload_evidence(text),private.can_read_evidence(text)to authenticated;
create policy evidence_upload on storage.objects for insert to authenticated with check(bucket_id='evidence'and private.can_upload_evidence(name));
create policy evidence_download on storage.objects for select to authenticated using(bucket_id='evidence'and private.can_read_evidence(name));
-- No UPDATE/DELETE policy: submitted objects, votes and audit history are immutable to clients.
commit;

