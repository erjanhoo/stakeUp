begin;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter table public.profiles add column theme_mode text not null default 'dark' check(theme_mode in ('dark','light'));
alter table public.profiles add column theme_accent text not null default 'orange' check(theme_accent in ('orange','lime'));
grant update(theme_mode,theme_accent) on public.profiles to authenticated;

create table public.circles (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.profiles(id),
 name text not null check(char_length(btrim(name)) between 3 and 60),
 description text not null default '' check(char_length(description)<=300),
 icon text not null default 'flame' check(icon in ('flame','sun','book','dumbbell','sprout')),
 archived boolean not null default false, created_at timestamptz not null default now()
);
create table public.memberships (
 circle_id uuid not null references public.circles(id), user_id uuid not null references public.profiles(id),
 joined_at timestamptz not null default now(), left_at timestamptz, primary key(circle_id,user_id)
);
create index memberships_user_active_idx on public.memberships(user_id,circle_id) where left_at is null;
create table public.invitations (
 id uuid primary key default gen_random_uuid(), circle_id uuid not null references public.circles(id),
 token_hash text not null unique, created_by uuid not null references public.profiles(id),
 expires_at timestamptz not null, uses integer not null default 0 check(uses>=0),
 max_uses integer not null default 25 check(max_uses between 1 and 50), created_at timestamptz not null default now(), check(uses<=max_uses)
);
create index invitations_circle_idx on public.invitations(circle_id);
create table public.challenges (
 id uuid primary key default gen_random_uuid(), circle_id uuid not null references public.circles(id),
 created_by uuid not null references public.profiles(id), rules jsonb not null,
 rules_hash text not null, status text not null default 'proposed' check(status in ('proposed','active','cancelled')),
 created_at timestamptz not null default now(), activated_at timestamptz
);
create index challenges_circle_status_idx on public.challenges(circle_id,status);
create table public.challenge_participants (
 challenge_id uuid not null references public.challenges(id), user_id uuid not null references public.profiles(id),
 status text not null check(status in ('accepted','withdrawn')), rules_hash text not null,
 accepted_at timestamptz not null default now(), primary key(challenge_id,user_id)
);
create index participants_user_idx on public.challenge_participants(user_id,challenge_id);
create table public.rule_acceptances (
 challenge_id uuid not null, user_id uuid not null, rules_hash text not null, rules_snapshot jsonb not null,
 accepted_at timestamptz not null default now(), primary key(challenge_id,user_id,rules_hash),
 foreign key(challenge_id,user_id) references public.challenge_participants(challenge_id,user_id)
);
create table public.daily_obligations (
 id uuid primary key default gen_random_uuid(), challenge_id uuid not null, user_id uuid not null,
 local_date date not null, deadline_at timestamptz not null, status text not null default 'pending' check(status='pending'),
 unique(challenge_id,user_id,local_date), foreign key(challenge_id,user_id) references public.challenge_participants(challenge_id,user_id)
);
create index obligations_user_deadline_idx on public.daily_obligations(user_id,deadline_at);
create table public.activity_events (
 id uuid primary key default gen_random_uuid(), circle_id uuid not null references public.circles(id),
 actor_id uuid not null references public.profiles(id), kind text not null, title text not null,
 created_at timestamptz not null default now()
);
create index activity_circle_time_idx on public.activity_events(circle_id,created_at desc);

create function private.is_circle_member(p_circle uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.memberships where circle_id=p_circle and user_id=auth.uid() and left_at is null)
$$;
revoke all on function private.is_circle_member(uuid) from public,anon;
grant execute on function private.is_circle_member(uuid) to authenticated;

alter table public.circles enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.rule_acceptances enable row level security;
alter table public.daily_obligations enable row level security;
alter table public.activity_events enable row level security;
revoke all on public.circles,public.memberships,public.invitations,public.challenges,public.challenge_participants,public.rule_acceptances,public.daily_obligations,public.activity_events from anon,authenticated;
grant select on public.circles,public.memberships,public.challenges,public.challenge_participants,public.rule_acceptances,public.daily_obligations,public.activity_events to authenticated;
create policy circles_member_read on public.circles for select to authenticated using(private.is_circle_member(id));
create policy memberships_member_read on public.memberships for select to authenticated using(private.is_circle_member(circle_id));
create policy challenges_member_read on public.challenges for select to authenticated using(private.is_circle_member(circle_id));
create policy participants_member_read on public.challenge_participants for select to authenticated using(exists(select 1 from public.challenges c where c.id=challenge_id and private.is_circle_member(c.circle_id)));
create policy acceptances_member_read on public.rule_acceptances for select to authenticated using(exists(select 1 from public.challenges c where c.id=challenge_id and private.is_circle_member(c.circle_id)));
create policy obligations_self_read on public.daily_obligations for select to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.challenges c where c.id=challenge_id and private.is_circle_member(c.circle_id)));
create policy activity_member_read on public.activity_events for select to authenticated using(private.is_circle_member(circle_id));

create function private.challenge_json(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',c.id,'circleId',c.circle_id,'circleName',g.name,'createdBy',c.created_by,'rules',c.rules,'rulesHash',c.rules_hash,'status',c.status,
  'acceptedCount',(select count(*) from public.challenge_participants p where p.challenge_id=c.id and p.status='accepted'),
  'ownStatus',(select p.status from public.challenge_participants p where p.challenge_id=c.id and p.user_id=auth.uid()))
 from public.challenges c join public.circles g on g.id=c.circle_id where c.id=p_id and private.is_circle_member(c.circle_id)
$$;
create function private.circle_json(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',c.id,'name',c.name,'description',c.description,'icon',c.icon,'creatorId',c.creator_id,'archived',c.archived,
  'role',case when c.creator_id=auth.uid() then 'owner' else 'member' end,
  'memberCount',(select count(*) from public.memberships m where m.circle_id=c.id and m.left_at is null),
  'challengeCount',(select count(*) from public.challenges h where h.circle_id=c.id and h.status<>'cancelled'))
 from public.circles c where c.id=p_id and private.is_circle_member(c.id)
$$;
create function private.social_event(p_circle uuid,p_kind text,p_title text) returns void language sql security definer set search_path='' as $$
 insert into public.activity_events(circle_id,actor_id,kind,title) values(p_circle,auth.uid(),p_kind,p_title)
$$;
-- These helpers are internal, never callable through the Data API.
revoke all on function private.challenge_json(uuid),private.circle_json(uuid),private.social_event(uuid,text,text) from public,anon,authenticated;

create function private.stakeup_social(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); cid uuid; hid uuid; g public.circles; h public.challenges; inv public.invitations;
 rules jsonb; token text; rhash text; result jsonb; start_day date; end_day date; tz text;
 scheduled integer; accepted integer; already_member boolean;
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_action not in ('list','create_circle','circle','update_circle','invite','join','leave','archive','create_challenge','challenge','accept','withdraw','activate','cancel','dashboard') then raise exception 'Unknown action'; end if;
 -- Serialize writes by this actor; circle/challenge row locks below protect shared limits and activation.
 if p_action not in ('list','circle','challenge','dashboard') then perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,0)); end if;
 if p_action='list' then
  select coalesce(jsonb_agg(private.circle_json(c.id) order by c.created_at desc),'[]') into result from public.circles c where private.is_circle_member(c.id); return result;
 end if;
 if p_action='dashboard' then
  return jsonb_build_object(
   'circleCount',(select count(*) from public.circles c where not c.archived and private.is_circle_member(c.id)),
   'activeChallenges',(select count(*) from public.challenges c join public.challenge_participants p on p.challenge_id=c.id and p.user_id=uid and p.status='accepted' where c.status='active' and private.is_circle_member(c.circle_id)),
   'commitments',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'challengeId',c.id,'title',c.rules->>'title','circleName',g2.name,'localDate',o.local_date,'deadlineAt',o.deadline_at,'timezone',c.rules->>'timezone','status',o.status) order by o.deadline_at),'[]') from public.daily_obligations o join public.challenges c on c.id=o.challenge_id join public.circles g2 on g2.id=c.circle_id where o.user_id=uid and o.local_date=(clock_timestamp() at time zone (c.rules->>'timezone'))::date and c.status='active' and private.is_circle_member(c.circle_id)));
 end if;
 if p_action='create_circle' then
  if (select count(*) from public.memberships where user_id=uid and left_at is null)>=20 then raise exception 'You can join up to 20 circles.'; end if;
  insert into public.circles(creator_id,name,description,icon) values(uid,btrim(p_payload->>'name'),coalesce(p_payload->>'description',''),coalesce(p_payload->>'icon','flame')) returning id into cid;
  insert into public.memberships(circle_id,user_id) values(cid,uid); perform private.social_event(cid,'circle_created','Created the circle');
  return private.circle_json(cid)||jsonb_build_object('members','[]'::jsonb,'challenges','[]'::jsonb,'events','[]'::jsonb);
 end if;
 if p_action='join' then
  if coalesce(p_payload->>'token','')!~'^[a-f0-9]{64}$' then raise exception 'Invalid invitation.'; end if;
  select * into inv from public.invitations where token_hash=encode(extensions.digest(p_payload->>'token','sha256'),'hex');
  if inv.id is null then raise exception 'This invitation is invalid, expired, or full.'; end if;
  select * into g from public.circles where id=inv.circle_id for update;
  select * into inv from public.invitations where id=inv.id for update;
  if g.archived or inv.expires_at<=clock_timestamp() or inv.uses>=inv.max_uses then raise exception 'This invitation is invalid, expired, or full.'; end if;
  if private.is_circle_member(g.id) then return jsonb_build_object('circleId',g.id); end if;
  if (select count(*) from public.memberships where user_id=uid and left_at is null)>=20 or (select count(*) from public.memberships where circle_id=g.id and left_at is null)>=50 then raise exception 'The circle or membership limit has been reached.'; end if;
  insert into public.memberships(circle_id,user_id) values(g.id,uid) on conflict(circle_id,user_id) do update set left_at=null,joined_at=clock_timestamp();
  update public.invitations set uses=uses+1 where id=inv.id; perform private.social_event(g.id,'member_joined','Joined the circle'); return jsonb_build_object('circleId',g.id);
 end if;
 if p_payload ? 'challengeId' then
  hid:=(p_payload->>'challengeId')::uuid; select circle_id into cid from public.challenges where id=hid;
 else cid:=(p_payload->>'circleId')::uuid; end if;
 if cid is null or not private.is_circle_member(cid) then raise exception 'Circle or challenge not found.' using errcode='42501'; end if;
 if p_action in ('circle','challenge') then select * into g from public.circles where id=cid; else select * into g from public.circles where id=cid for update; end if;
 if p_action='circle' then
  return private.circle_json(cid)||jsonb_build_object(
   'members',(select coalesce(jsonb_agg(jsonb_build_object('userId',m.user_id,'username',p.username,'displayName',p.display_name,'role',case when m.user_id=g.creator_id then 'owner' else 'member' end,'joinedAt',m.joined_at) order by m.joined_at),'[]') from public.memberships m join public.profiles p on p.id=m.user_id where m.circle_id=cid and m.left_at is null),
   'challenges',(select coalesce(jsonb_agg(private.challenge_json(c.id) order by c.created_at desc),'[]') from public.challenges c where c.circle_id=cid),
   'events',(select coalesce(jsonb_agg(e.event order by e.created_at desc),'[]') from (select jsonb_build_object('id',a.id,'kind',a.kind,'title',a.title,'actorName',p.display_name,'createdAt',a.created_at) event,a.created_at from public.activity_events a join public.profiles p on p.id=a.actor_id where a.circle_id=cid order by a.created_at desc limit 30)e));
 end if;
 if p_action='challenge' then
  return private.challenge_json(hid)||jsonb_build_object('canManage',(select created_by=uid or g.creator_id=uid from public.challenges where id=hid),
   'participants',(select coalesce(jsonb_agg(jsonb_build_object('userId',p.user_id,'displayName',u.display_name,'username',u.username,'status',p.status,'acceptedAt',p.accepted_at) order by p.accepted_at),'[]') from public.challenge_participants p join public.profiles u on u.id=p.user_id where p.challenge_id=hid),
   'obligations',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'challengeId',c.id,'title',c.rules->>'title','circleName',g.name,'localDate',o.local_date,'deadlineAt',o.deadline_at,'timezone',c.rules->>'timezone','status',o.status) order by o.deadline_at),'[]') from public.daily_obligations o join public.challenges c on c.id=o.challenge_id where o.challenge_id=hid and o.user_id=uid));
 end if;
 if g.archived then raise exception 'This circle is archived.'; end if;
 if p_action in ('update_circle','invite','archive') and g.creator_id<>uid then raise exception 'Only the circle owner can do this.' using errcode='42501'; end if;
 if p_action='update_circle' then update public.circles set name=btrim(p_payload->'input'->>'name'),description=p_payload->'input'->>'description',icon=p_payload->'input'->>'icon' where id=cid; perform private.social_event(cid,'circle_updated','Updated the circle'); return private.stakeup_social('circle',jsonb_build_object('circleId',cid)); end if;
 if p_action='invite' then
  token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.invitations(circle_id,token_hash,created_by,expires_at) values(cid,encode(extensions.digest(token,'sha256'),'hex'),uid,clock_timestamp()+interval '7 days') returning * into inv;
  return jsonb_build_object('token',token,'expiresAt',inv.expires_at,'maxUses',inv.max_uses);
 end if;
 if p_action='archive' then
  if exists(select 1 from public.challenges where circle_id=cid and status='active') then raise exception 'Resolve active challenges before archiving.'; end if;
  update public.circles set archived=true where id=cid; update public.challenges set status='cancelled' where circle_id=cid and status='proposed'; perform private.social_event(cid,'circle_archived','Archived the circle'); return private.stakeup_social('circle',jsonb_build_object('circleId',cid));
 end if;
 if p_action='leave' then
  if g.creator_id=uid then raise exception 'The owner must stay with the circle. You can archive it when no challenges are active.'; end if;
  if exists(select 1 from public.challenge_participants p join public.challenges c on c.id=p.challenge_id where p.user_id=uid and p.status='accepted' and c.circle_id=cid and c.status in ('active','proposed')) then raise exception 'Withdraw from proposed challenges first. Active participants cannot leave.'; end if;
  update public.memberships set left_at=clock_timestamp() where circle_id=cid and user_id=uid; perform private.social_event(cid,'member_left','Left the circle'); return '{"ok":true}';
 end if;
 if p_action='create_challenge' then
  rules:=p_payload->'rules';
  if rules ? 'rewardPolicy' and rules->>'rewardPolicy' is distinct from 'discipline_v1' then raise exception 'Unsupported reward policy.';end if;
  rules:=rules||jsonb_build_object('rewardPolicy','discipline_v1');
  start_day:=(rules->>'startDate')::date;end_day:=(rules->>'endDate')::date;tz:=rules->>'timezone';
  if not exists(select 1 from pg_catalog.pg_timezone_names where name=tz) then raise exception 'Invalid timezone.';end if;
  if start_day<=(clock_timestamp() at time zone tz)::date or end_day<start_day or end_day-start_day>89 then raise exception 'Choose a future start and a duration of 1 to 90 days.';end if;
  if coalesce(char_length(btrim(rules->>'title')),0) not between 3 and 80 or coalesce(char_length(rules->>'description'),0)>1000 or coalesce(char_length(btrim(rules->>'evidenceRequirements')),0) not between 10 and 500 then raise exception 'Invalid challenge text.';end if;
  if coalesce(rules->>'cutoff','')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(rules->>'capturePolicy','') not in ('camera_only','camera_or_upload') then raise exception 'Invalid evidence or deadline policy.';end if;
  if jsonb_typeof(rules->'weekdays')<>'array' or jsonb_array_length(rules->'weekdays') not between 1 and 7 then raise exception 'Choose weekdays.';end if;
  if exists(select 1 from jsonb_array_elements_text(rules->'weekdays') x where x::integer not between 0 and 6) or (select count(distinct x) from jsonb_array_elements_text(rules->'weekdays') x)<>jsonb_array_length(rules->'weekdays') then raise exception 'Invalid weekdays.';end if;
  if coalesce(rules->>'penaltyMinor','')!~'^[0-9]+$' or coalesce(rules->>'maxPenaltyMinor','')!~'^[0-9]+$' or coalesce(rules->>'graceDays','')!~'^[0-9]+$' then raise exception 'Use integer virtual minor units and grace days.';end if;
  if (rules->>'penaltyMinor')::bigint not between 0 and 100000 or (rules->>'maxPenaltyMinor')::bigint not between (rules->>'penaltyMinor')::bigint and 1000000 or (rules->>'graceDays')::integer not between 0 and 7 then raise exception 'Invalid penalty cap or grace days.';end if;
  select count(*) into scheduled from generate_series(start_day::timestamp,end_day::timestamp,interval '1 day') d where extract(dow from d)::integer in(select x::integer from jsonb_array_elements_text(rules->'weekdays') x);
  if scheduled=0 or (rules->>'graceDays')::integer>=scheduled then raise exception 'Choose scheduled days and fewer grace days.';end if;
  if (select count(*) from public.challenges where circle_id=cid and status<>'cancelled')>=25 then raise exception 'A circle can have up to 25 open challenges.';end if;
  rhash:=encode(extensions.digest(rules::text,'sha256'),'hex');
  insert into public.challenges(circle_id,created_by,rules,rules_hash) values(cid,uid,rules,rhash) returning id into hid;
  perform private.social_event(cid,'challenge_created','Proposed '||(rules->>'title')); return private.challenge_json(hid);
 end if;
 select * into h from public.challenges where id=hid for update;
 if h.status<>'proposed' then raise exception 'The challenge rules and roster are locked.';end if;
 if (h.rules->>'startDate')::date<=(clock_timestamp() at time zone (h.rules->>'timezone'))::date then raise exception 'The challenge has already reached its start date.';end if;
 if p_action='accept' then
  if p_payload->>'rulesHash' is distinct from h.rules_hash then raise exception 'The rules version has changed. Review it again.';end if;
  if exists(select 1 from public.challenge_participants where challenge_id=hid and user_id=uid and status='accepted')then return '{"ok":true}';end if;
  insert into public.challenge_participants(challenge_id,user_id,status,rules_hash)values(hid,uid,'accepted',h.rules_hash) on conflict(challenge_id,user_id)do update set status='accepted',accepted_at=clock_timestamp();
  insert into public.rule_acceptances(challenge_id,user_id,rules_hash,rules_snapshot)values(hid,uid,h.rules_hash,h.rules)on conflict do nothing;
  perform private.social_event(cid,'rules_accepted','Accepted the rules for '||(h.rules->>'title')); return '{"ok":true}';
 end if;
 if p_action='withdraw' then update public.challenge_participants set status='withdrawn' where challenge_id=hid and user_id=uid; perform private.social_event(cid,'enrollment_withdrawn','Withdrew from '||(h.rules->>'title'));return '{"ok":true}';end if;
 if h.created_by<>uid and g.creator_id<>uid then raise exception 'Only the proposer or circle owner can manage this challenge.' using errcode='42501';end if;
 if p_action='cancel'then update public.challenges set status='cancelled'where id=hid;perform private.social_event(cid,'challenge_cancelled','Cancelled '||(h.rules->>'title'));return '{"ok":true}';end if;
 if p_action='activate'then
  select count(*)into accepted from public.challenge_participants where challenge_id=hid and status='accepted';
  if accepted<2 then raise exception 'At least two members must accept before activation.';end if;
  insert into public.daily_obligations(challenge_id,user_id,local_date,deadline_at)
   select hid,p.user_id,d::date,(d::date+(h.rules->>'cutoff')::time) at time zone (h.rules->>'timezone')
   from public.challenge_participants p cross join generate_series((h.rules->>'startDate')::timestamp,(h.rules->>'endDate')::timestamp,interval '1 day')d
   where p.challenge_id=hid and p.status='accepted'and extract(dow from d)::integer in(select x::integer from jsonb_array_elements_text(h.rules->'weekdays')x);
  update public.challenges set status='active',activated_at=clock_timestamp()where id=hid;perform private.social_event(cid,'challenge_activated','Activated '||(h.rules->>'title'));return '{"ok":true}';
 end if;
 raise exception 'Unknown action';
end;
$$;
revoke all on function private.stakeup_social(text,jsonb) from public,anon;
grant execute on function private.stakeup_social(text,jsonb) to authenticated;
create function public.stakeup_social(p_action text,p_payload jsonb default '{}')returns jsonb language sql security invoker set search_path=''as $$select private.stakeup_social(p_action,p_payload)$$;
revoke all on function public.stakeup_social(text,jsonb) from public,anon;
grant execute on function public.stakeup_social(text,jsonb) to authenticated;

create function private.lock_challenge_rules()returns trigger language plpgsql set search_path=''as $$
begin
 if new.rules is distinct from old.rules or new.rules_hash is distinct from old.rules_hash or new.circle_id is distinct from old.circle_id or new.created_by is distinct from old.created_by then raise exception 'Published challenge rules are immutable.';end if;
 if old.status<>'proposed'and new.status is distinct from old.status then raise exception 'Active challenge state is locked until settlement.';end if;
 return new;
end;$$;
revoke all on function private.lock_challenge_rules() from public,anon,authenticated;
create trigger lock_challenge_rules before update on public.challenges for each row execute function private.lock_challenge_rules();
commit;
