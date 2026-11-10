begin;
alter table public.profiles add column language text not null default 'en'check(language in('en','ru'));
grant update(language)on public.profiles to authenticated;
create table public.grace_choices(obligation_id uuid primary key references public.daily_obligations(id),challenge_id uuid not null references public.challenges(id),user_id uuid not null references public.profiles(id),chosen_at timestamptz not null default clock_timestamp());
create index grace_choices_participant on public.grace_choices(challenge_id,user_id);
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),event_key text not null,kind text not null,challenge_id uuid references public.challenges(id),circle_id uuid references public.circles(id),payload jsonb not null default '{}',created_at timestamptz not null default clock_timestamp(),read_at timestamptz,unique(user_id,event_key));
create index notifications_user_time on public.notifications(user_id,created_at desc);
create table public.proof_comments(id uuid primary key default gen_random_uuid(),proof_id uuid not null references public.evidence_submissions(id),user_id uuid not null references public.profiles(id),body text not null check(length(body)<=1000),created_at timestamptz not null default clock_timestamp(),deleted boolean not null default false);
create index comments_proof on public.proof_comments(proof_id,created_at);
create table public.proof_reactions(proof_id uuid not null references public.evidence_submissions(id),user_id uuid not null references public.profiles(id),emoji text not null check(emoji in('clap','fire','heart')),primary key(proof_id,user_id,emoji));
alter table public.grace_choices enable row level security;
alter table public.notifications enable row level security;
alter table public.proof_comments enable row level security;
alter table public.proof_reactions enable row level security;
revoke all on public.grace_choices,public.notifications,public.proof_comments,public.proof_reactions from anon,authenticated;
grant select on public.grace_choices,public.notifications,public.proof_comments,public.proof_reactions to authenticated;
create policy grace_self_read on public.grace_choices for select to authenticated using(user_id=(select auth.uid()));
create policy notifications_self on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy comments_member on public.proof_comments for select to authenticated using(private.can_read_proof(proof_id));
create policy reactions_member on public.proof_reactions for select to authenticated using(private.can_read_proof(proof_id));
create function private.notify(uid uuid,event_key text,kind text,hid uuid,cid uuid,payload jsonb default '{}')returns void language sql security definer set search_path=''as $$insert into public.notifications(user_id,event_key,kind,challenge_id,circle_id,payload)values(uid,event_key,kind,hid,cid,payload)on conflict(user_id,event_key)do nothing$$;
revoke all on function private.notify(uuid,text,text,uuid,uuid,jsonb)from public,anon,authenticated;
-- Patch the existing immutable-version dispatcher. New v2 rules explicitly choose grace dates;
-- existing v1 snapshots keep their accepted automatic allocation.
do $$declare def text;begin
 def:=pg_get_functiondef('private.stakeup_social_v2(text,jsonb)'::regprocedure);
 def:=replace(def,$q$rules->>'rewardPolicy' is distinct from 'discipline_v1'$q$,$q$coalesce(rules->>'rewardPolicy','discipline_v1')not in('discipline_v1','discipline_v2')$q$);
 def:=replace(def,$q$rules:=rules||jsonb_build_object('rewardPolicy','discipline_v1');$q$,$q$rules:=rules||jsonb_build_object('rewardPolicy',coalesce(rules->>'rewardPolicy','discipline_v1'),'gracePolicy',coalesce(rules->>'gracePolicy',case when rules->>'rewardPolicy'='discipline_v2'then'chosen_v1'else'automatic_v1'end));
 if (rules->>'rewardPolicy'='discipline_v1')is distinct from(rules->>'gracePolicy'='automatic_v1')or rules->>'gracePolicy'not in('automatic_v1','chosen_v1')then raise exception 'Reward and grace policies must match.';end if;$q$);
 if position('chosen_v1'in def)=0 then raise exception 'Unexpected social function version';end if;execute def;
 def:=pg_get_functiondef('private.competition(uuid,boolean,boolean)'::regprocedure);
 def:=replace(def,$q$select d.*,es.status proof_status$q$,$q$select d.*,exists(select 1 from public.grace_choices gc where gc.obligation_id=d.id)chosen,es.status proof_status$q$);
 def:=replace(def,'scheduled:=scheduled+1;','scheduled:=scheduled+1;if o.chosen then grace:=grace+1;continue;end if;');
 def:=replace(def,$q$if grace<(h.rules->>'graceDays')::integer then$q$,$q$if coalesce(h.rules->>'gracePolicy','automatic_v1')='automatic_v1'and grace<(h.rules->>'graceDays')::integer then$q$);
 if position('o.chosen'in def)=0 then raise exception 'Unexpected competition function version';end if;execute def;
 def:=pg_get_functiondef('private.stakeup_evidence(text,jsonb)'::regprocedure);
 def:=replace(def,$q$return private.stakeup_evidence_v3(p_action,p_payload);$q$,$q$if p_action in('reserve','finish')and exists(select 1 from public.grace_choices g where g.user_id=auth.uid()and g.obligation_id=case when p_action='reserve'then(p_payload->>'obligationId')::uuid else(select obligation_id from public.evidence_submissions where id=(p_payload->>'proofId')::uuid)end)then raise exception 'This day is excused. Cancel the grace day before submitting proof.';end if;return private.stakeup_evidence_v3(p_action,p_payload);$q$);
 if position('public.grace_choices'in def)=0 then raise exception 'Unexpected evidence function version';end if;execute def;
end;$$;
create or replace function private.can_upload_evidence(object_path text)returns boolean language sql stable security definer set search_path=''as $$select exists(select 1 from public.evidence_submissions s join public.daily_obligations o on o.id=s.obligation_id join public.challenges h on h.id=s.challenge_id where s.path=object_path and s.user_id=auth.uid()and s.status='pending'and clock_timestamp()between o.opens_at and o.deadline_at and private.is_circle_member(h.circle_id)and not exists(select 1 from public.grace_choices g where g.obligation_id=o.id))$$;
create function private.community_notifications_trigger()returns trigger language plpgsql security definer set search_path=''as $$declare h public.challenges;s public.evidence_submissions;p record;begin
 if tg_table_name='evidence_events'then
  select * into s from public.evidence_submissions where id=new.proof_id;select * into h from public.challenges where id=s.challenge_id;
  if new.kind in('accepted','rejected','disputed')then perform private.notify(s.user_id,new.id::text,new.kind,h.id,h.circle_id,jsonb_build_object('title',h.rules->>'title','reason',new.reason));end if;
  if new.kind in('ai_reviewed','disputed')then for p in select cp.user_id from public.challenge_participants cp where cp.challenge_id=h.id and cp.status='accepted'and cp.user_id<>s.user_id loop perform private.notify(p.user_id,new.id::text,'review',h.id,h.circle_id,jsonb_build_object('title',h.rules->>'title'));end loop;end if;
 elsif tg_table_name='challenges'then
  h:=new;
  if tg_op='INSERT'then for p in select user_id from public.memberships where circle_id=h.circle_id and left_at is null and user_id<>h.created_by loop perform private.notify(p.user_id,'proposal:'||h.id,'proposal',h.id,h.circle_id,jsonb_build_object('title',h.rules->>'title'));end loop;
  elsif old.status is distinct from new.status and new.status in('active','completed')then for p in select user_id from public.challenge_participants where challenge_id=h.id and status='accepted'loop perform private.notify(p.user_id,new.status||':'||h.id,case when new.status='active'then'activated'else'completed'end,h.id,h.circle_id,jsonb_build_object('title',h.rules->>'title'));end loop;end if;
 elsif tg_table_name='proof_comments'then
  select * into s from public.evidence_submissions where id=new.proof_id;select * into h from public.challenges where id=s.challenge_id;
  if s.user_id<>new.user_id then perform private.notify(s.user_id,'comment:'||new.id,'comment',h.id,h.circle_id,jsonb_build_object('title',h.rules->>'title'));end if;
 end if;return new;
end;$$;
revoke all on function private.community_notifications_trigger()from public,anon,authenticated;
create trigger notify_evidence_event after insert on public.evidence_events for each row execute function private.community_notifications_trigger();
create trigger notify_challenge after insert or update on public.challenges for each row execute function private.community_notifications_trigger();
create trigger notify_comment after insert on public.proof_comments for each row execute function private.community_notifications_trigger();
create function private.emit_community_notifications()returns void language plpgsql security definer set search_path=''as $$begin
 insert into public.notifications(user_id,event_key,kind,challenge_id,circle_id,payload)
 select o.user_id,case when o.deadline_at>clock_timestamp()then'deadline:'else'missed:'end||o.id,case when o.deadline_at>clock_timestamp()then'deadline'else'missed'end,o.challenge_id,c.circle_id,jsonb_build_object('title',c.rules->>'title','date',o.local_date)
 from public.daily_obligations o join public.challenges c on c.id=o.challenge_id where c.status='active'and o.deadline_at<clock_timestamp()+interval'1 hour'and exists(select 1 from public.memberships m where m.circle_id=c.circle_id and m.user_id=o.user_id and m.left_at is null)
 and not exists(select 1 from public.evidence_submissions s where s.obligation_id=o.id and s.received_at is not null)and not exists(select 1 from public.grace_choices g where g.obligation_id=o.id)
 on conflict(user_id,event_key)do nothing;
 insert into public.notifications(user_id,event_key,kind,payload)
 select p.id,'recap:'||to_char(date_trunc('month',clock_timestamp()at time zone p.timezone)-interval'1 month','YYYY-MM'),'recap',jsonb_build_object('month',to_char(date_trunc('month',clock_timestamp()at time zone p.timezone)-interval'1 month','YYYY-MM'),'submitted',count(s.id),'accepted',count(s.id)filter(where s.status='accepted'))
 from public.profiles p join public.evidence_submissions s on s.user_id=p.id and s.received_at is not null
 where date_trunc('month',s.received_at at time zone p.timezone)=date_trunc('month',clock_timestamp()at time zone p.timezone)-interval'1 month'
 group by p.id,p.timezone on conflict(user_id,event_key)do nothing;
end;$$;
revoke all on function private.emit_community_notifications()from public,anon,authenticated;
create function public.stakeup_community(p_action text,p_payload jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=auth.uid();h public.challenges;o public.daily_obligations;s public.evidence_submissions;reason text;cid uuid;accepted integer;submitted integer;completed integer;achievements jsonb:='[]';begin
 if uid is null then raise exception 'Authentication required'using errcode='42501';end if;
 if p_action='notifications'then return(select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'kind',n.kind,'challengeId',n.challenge_id,'circleId',n.circle_id,'payload',n.payload,'createdAt',n.created_at,'readAt',n.read_at)order by n.created_at desc),'[]')from(select * from public.notifications where user_id=uid order by created_at desc limit 100)n);end if;
 if p_action='read'then update public.notifications set read_at=coalesce(read_at,clock_timestamp())where user_id=uid and(not(p_payload?'id')or id=(p_payload->>'id')::uuid);return'{"ok":true}';end if;
 if p_action='recap'then
  select count(*),count(*)filter(where status='accepted')into submitted,accepted from public.evidence_submissions where user_id=uid and received_at is not null;
  select count(*)into completed from public.challenge_participants p join public.challenges c on c.id=p.challenge_id where p.user_id=uid and p.status='accepted'and c.status='completed';
  if accepted>=1 then achievements:=achievements||'"first_proof"'::jsonb;end if;if accepted>=7 then achievements:=achievements||'"seven_proofs"'::jsonb;end if;if accepted>=30 then achievements:=achievements||'"thirty_proofs"'::jsonb;end if;if completed>0 then achievements:=achievements||'"first_finish"'::jsonb;end if;
  return jsonb_build_object('accepted',accepted,'submitted',submitted,'completed',completed,'achievements',achievements);
 end if;
 select * into h from public.challenges where id=(p_payload->>'challengeId')::uuid and private.is_circle_member(circle_id)for update;
 if h.id is null then raise exception 'Challenge not found.'using errcode='42501';end if;
 if p_action='grace_list'then return(select coalesce(jsonb_agg(jsonb_build_object('obligationId',obligation_id,'challengeId',challenge_id,'userId',user_id,'chosenAt',chosen_at)),'[]')from public.grace_choices where challenge_id=h.id and user_id=uid);end if;
 if p_action in('grace_choose','grace_cancel')then
  select * into o from public.daily_obligations where id=(p_payload->>'obligationId')::uuid and challenge_id=h.id and user_id=uid;
  if o.id is null or h.status<>'active'then raise exception 'Only enrolled participants can choose their own grace days.'using errcode='42501';end if;
  if coalesce(h.rules->>'gracePolicy','automatic_v1')<>'chosen_v1'then raise exception 'This challenge uses its original automatic grace policy.';end if;
  if clock_timestamp()>o.deadline_at then raise exception 'Choose or cancel a grace day before its upload deadline.';end if;
  if p_action='grace_cancel'then delete from public.grace_choices where obligation_id=o.id and user_id=uid;return'{"ok":true}';end if;
  if exists(select 1 from public.grace_choices where obligation_id=o.id)then return'{"ok":true}';end if;
  if exists(select 1 from public.evidence_submissions where obligation_id=o.id and received_at is not null)then raise exception 'Proof is already submitted for this day.';end if;
  if(select count(*)from public.grace_choices where challenge_id=h.id and user_id=uid)>=(h.rules->>'graceDays')::integer then raise exception 'Your grace-day allowance is used up.';end if;
  insert into public.grace_choices(obligation_id,challenge_id,user_id)values(o.id,h.id,uid);perform private.notify(uid,'grace:'||o.id,'grace',h.id,h.circle_id,jsonb_build_object('date',o.local_date));return'{"ok":true}';
 end if;
 select * into s from public.evidence_submissions where id=(p_payload->>'proofId')::uuid and challenge_id=h.id and received_at is not null;
 if s.id is null then raise exception 'Submitted proof not found.';end if;
 if p_action='comment'then reason:=btrim(p_payload->>'body');if coalesce(length(reason),0)not between 1 and 1000 then raise exception 'Write a comment of 1 to 1000 characters.';end if;insert into public.proof_comments(proof_id,user_id,body)values(s.id,uid,reason);
 elsif p_action='delete_comment'then update public.proof_comments set body='',deleted=true where id=(p_payload->>'id')::uuid and proof_id=s.id and user_id=uid;if not found then raise exception 'Only your own comments can be removed.'using errcode='42501';end if;
 elsif p_action='react'then if coalesce(p_payload->>'emoji','')not in('clap','fire','heart')then raise exception 'Unsupported reaction';end if;delete from public.proof_reactions where proof_id=s.id and user_id=uid and emoji=p_payload->>'emoji';if not found then insert into public.proof_reactions(proof_id,user_id,emoji)values(s.id,uid,p_payload->>'emoji');end if;
 elsif p_action<>'social'then raise exception 'Unknown community action';end if;
 return jsonb_build_object('comments',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'userId',c.user_id,'name',u.display_name,'body',c.body,'createdAt',c.created_at,'deleted',c.deleted)order by c.created_at),'[]')from public.proof_comments c join public.profiles u on u.id=c.user_id where c.proof_id=s.id),
 'reactions',(select jsonb_agg(jsonb_build_object('emoji',e,'count',(select count(*)from public.proof_reactions r where r.proof_id=s.id and r.emoji=e),'own',exists(select 1 from public.proof_reactions r where r.proof_id=s.id and r.user_id=uid and r.emoji=e)))from unnest(array['clap','fire','heart'])e));
end;$$;
revoke all on function public.stakeup_community(text,jsonb)from public,anon;
grant execute on function public.stakeup_community(text,jsonb)to authenticated;
do $$begin if exists(select 1 from pg_extension where extname='pg_cron')then perform cron.schedule('stakeup-in-app-notifications','*/5 * * * *','select private.emit_community_notifications()');end if;end;$$;
commit;

