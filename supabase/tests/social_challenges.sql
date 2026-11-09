-- Run after both migrations against a disposable PostgreSQL/Supabase database.
-- Uses real authenticated/anon roles and rolls back all fixtures.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('20000000-0000-4000-8000-000000000001','social-owner@example.test','{"username":"social_owner"}'),
 ('20000000-0000-4000-8000-000000000002','social-friend@example.test','{"username":"social_friend"}'),
 ('20000000-0000-4000-8000-000000000003','social-outsider@example.test','{"username":"social_outsider"}');

create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$
begin if value is not true then raise exception '%',message;end if;end;$$;
create function pg_temp.expect_failure(query text, expected text) returns void language plpgsql as $$
declare failed boolean:=false;
begin
 begin execute query;
 exception when others then
  if position(expected in sqlerrm)=0 then raise exception 'Unexpected failure: %',sqlerrm;end if;
  failed:=true;
 end;
 if not failed then raise exception 'Expected failure: %',expected;end if;
end;$$;
grant execute on function pg_temp.assert_true(boolean,text),pg_temp.expect_failure(text,text) to authenticated,anon;

set local role authenticated;
do $$
declare c jsonb; invitation jsonb; h jsonb; detail jsonb; payload jsonb; cid uuid; hid uuid;
 owner_id uuid:='20000000-0000-4000-8000-000000000001';
 friend_id uuid:='20000000-0000-4000-8000-000000000002';
 outsider_id uuid:='20000000-0000-4000-8000-000000000003';
 -- Keep the fixture in the future even when rerun years later; use the next US March transition.
 schedule_year integer:=extract(year from current_date)::integer+1;
 start_day date; end_day date;
begin
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 c:=public.stakeup_social('create_circle','{"name":"Reading crew","description":"Private accountability","icon":"book"}');
 cid:=(c->>'id')::uuid;
 perform pg_temp.assert_true(c->>'role'='owner' and (c->>'memberCount')::integer=1,'Incorrect circle ownership');
 perform set_config('stakeup.test.circle',cid::text,true);
 invitation:=public.stakeup_social('invite',jsonb_build_object('circleId',cid));
 perform pg_temp.assert_true(invitation->>'token' ~ '^[a-f0-9]{64}$','Invitation entropy/format');
 perform set_config('stakeup.test.token',invitation->>'token',true);

 perform set_config('request.jwt.claim.sub',outsider_id::text,true);
 perform pg_temp.assert_true((select count(*)=0 from public.circles),'Outsider RLS leaked circles');
 perform pg_temp.assert_true((select count(*)=0 from public.memberships),'Outsider RLS leaked memberships');
 perform pg_temp.assert_true(public.stakeup_social('list')='[]'::jsonb,'Outsider RPC leaked circles');
 perform pg_temp.expect_failure(format('select public.stakeup_social(''circle'',%L::jsonb)',jsonb_build_object('circleId',cid)),'not found');
 perform pg_temp.expect_failure('select * from public.invitations','permission denied');
 perform pg_temp.expect_failure(format('select private.circle_json(%L::uuid)',cid),'permission denied');
 perform pg_temp.expect_failure('update public.circles set name=''Forged''','permission denied');
 perform pg_temp.expect_failure('update public.daily_obligations set deadline_at=now()','permission denied');
 perform pg_temp.expect_failure('update public.challenge_participants set status=''accepted''','permission denied');

 perform set_config('request.jwt.claim.sub',friend_id::text,true);
 perform public.stakeup_social('join',jsonb_build_object('token',invitation->>'token'));
 perform public.stakeup_social('join',jsonb_build_object('token',invitation->>'token'));
 detail:=public.stakeup_social('circle',jsonb_build_object('circleId',cid));
 perform pg_temp.assert_true((detail->>'memberCount')::integer=2,'Repeated join duplicated membership');
 perform pg_temp.assert_true(jsonb_array_length(detail->'members')=2,'Member profiles unavailable through scoped RPC');
 perform pg_temp.assert_true(not exists(select 1 from jsonb_array_elements(detail->'members') m where m ? 'email'),'Circle exposed private emails');
 perform pg_temp.assert_true((select count(*)=1 from public.profiles),'Profile RLS exposed other members');
 perform pg_temp.expect_failure(format('select public.stakeup_social(''invite'',%L::jsonb)',jsonb_build_object('circleId',cid)),'Only the circle owner');

 -- Second Sunday in March at 02:30 is a DST gap in America/New_York.
 start_day:=make_date(schedule_year,3,8);
 start_day:=start_day+((7-extract(dow from start_day)::integer)%7);
 end_day:=start_day+6;
 payload:=jsonb_build_object('circleId',cid,'rules',jsonb_build_object(
  'title','Daily reading','description','A daily chapter','startDate',start_day,'endDate',end_day,
  'timezone','America/New_York','weekdays','[0,1,2,3,4,5,6]'::jsonb,'cutoff','02:30',
  'evidenceRequirements','Share reading notes. Photos cannot prove pages read.',
  'capturePolicy','camera_or_upload','penaltyMinor',250,'maxPenaltyMinor',1500,'graceDays',1));
 h:=public.stakeup_social('create_challenge',payload);
 hid:=(h->>'id')::uuid;
 perform set_config('stakeup.test.challenge',hid::text,true);
 perform pg_temp.assert_true(h->'rules'->>'rewardPolicy'='discipline_v1','Reward policy missing from locked snapshot');
 perform pg_temp.expect_failure(format('select public.stakeup_social(''activate'',%L::jsonb)',jsonb_build_object('challengeId',hid)),'At least two');
 perform pg_temp.expect_failure(format('select public.stakeup_social(''accept'',%L::jsonb)',jsonb_build_object('challengeId',hid,'rulesHash',repeat('0',64))),'rules version');
 perform public.stakeup_social('accept',jsonb_build_object('challengeId',hid,'rulesHash',h->>'rulesHash'));
 perform public.stakeup_social('accept',jsonb_build_object('challengeId',hid,'rulesHash',h->>'rulesHash'));
 perform pg_temp.expect_failure(format('select public.stakeup_social(''leave'',%L::jsonb)',jsonb_build_object('circleId',cid)),'Withdraw from proposed');

 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.stakeup_social('accept',jsonb_build_object('challengeId',hid,'rulesHash',h->>'rulesHash'));
 -- The friend proposed this challenge; both owner and proposer can manage it.
 perform public.stakeup_social('activate',jsonb_build_object('challengeId',hid));
 detail:=public.stakeup_social('challenge',jsonb_build_object('challengeId',hid));
 perform pg_temp.assert_true(detail->>'status'='active','Activation not persisted');
 perform pg_temp.assert_true(jsonb_array_length(detail->'obligations')=7,'Wrong schedule length');
 perform pg_temp.assert_true((select count(*)=7 from public.daily_obligations),'RLS leaked peer obligations');
 perform pg_temp.assert_true((detail->'obligations'->0->>'deadlineAt')::timestamptz=(start_day+time '07:30') at time zone 'UTC','DST gap policy differs from Temporal later');
 perform pg_temp.assert_true((select count(*)=2 from public.rule_acceptances),'Duplicate/missing rule acceptances');
 perform pg_temp.assert_true((select bool_and(rules_snapshot->>'rewardPolicy'='discipline_v1') from public.rule_acceptances),'Reward policy not accepted');
 perform pg_temp.expect_failure(format('select public.stakeup_social(''activate'',%L::jsonb)',jsonb_build_object('challengeId',hid)),'locked');
 perform pg_temp.expect_failure(format('select public.stakeup_social(''withdraw'',%L::jsonb)',jsonb_build_object('challengeId',hid)),'locked');
 perform pg_temp.expect_failure(format('select public.stakeup_social(''archive'',%L::jsonb)',jsonb_build_object('circleId',cid)),'Resolve active');
 perform pg_temp.assert_true((public.stakeup_social('dashboard')->>'activeChallenges')::integer=1,'Dashboard not derived from enrollment');

 perform set_config('request.jwt.claim.sub',friend_id::text,true);
 perform pg_temp.expect_failure(format('select public.stakeup_social(''leave'',%L::jsonb)',jsonb_build_object('circleId',cid)),'Active participants cannot leave');
 update public.profiles set theme_mode='light',theme_accent='lime' where id=friend_id;
 perform pg_temp.assert_true((select theme_mode='light' and theme_accent='lime' from public.profiles where id=friend_id),'Appearance did not persist');
 perform pg_temp.expect_failure('update public.profiles set theme_mode=''bad'' where id=auth.uid()','theme_mode_check');
 perform set_config('request.jwt.claim.sub',outsider_id::text,true);
 perform pg_temp.assert_true((select count(*)=0 from public.challenges),'Outsider RLS leaked challenges');
 perform pg_temp.assert_true((select count(*)=0 from public.rule_acceptances),'Outsider RLS leaked rules');
 perform pg_temp.assert_true((select count(*)=0 from public.daily_obligations),'Outsider RLS leaked deadlines');
 perform pg_temp.assert_true((select count(*)=0 from public.activity_events),'Outsider RLS leaked events');
 perform set_config('request.jwt.claim.sub','',true);
 perform pg_temp.expect_failure('select public.stakeup_social(''list'')','Authentication required');
end;$$;
reset role;
do $$
begin
 perform pg_temp.assert_true((select uses=1 from public.invitations where circle_id=current_setting('stakeup.test.circle')::uuid),'Repeated join consumed invitation uses');
 perform pg_temp.assert_true((select count(*)=14 from public.daily_obligations),'Repeated activation duplicated obligations');
 perform pg_temp.expect_failure(format('update public.challenges set rules=rules||''{"penaltyMinor":999}'' where id=%L::uuid',current_setting('stakeup.test.challenge')),'immutable');
 -- PostgreSQL agrees with the JS overlap test as well as the gap tested above.
 perform pg_temp.assert_true(timestamp '2027-11-07 01:30' at time zone 'America/New_York'=timestamptz '2027-11-07 06:30Z','DST overlap mismatch');
 update public.invitations set expires_at=now()-interval '1 second' where circle_id=current_setting('stakeup.test.circle')::uuid;
end;$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
select pg_temp.expect_failure(format('select public.stakeup_social(''join'',%L::jsonb)',jsonb_build_object('token',current_setting('stakeup.test.token'))),'invalid, expired, or full');
reset role;
set local role anon;
select pg_temp.expect_failure('select public.stakeup_social(''list'')','permission denied');
select pg_temp.expect_failure('select * from public.circles','permission denied');
rollback;
