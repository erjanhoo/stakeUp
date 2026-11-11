begin;
insert into auth.users(id,email,raw_user_meta_data)
select ('92000000-0000-4000-8000-00000000000'||n)::uuid, 'inbox'||n||'@example.test', jsonb_build_object('username','inbox_'||n) from generate_series(1,6)n;
insert into public.circles(id,creator_id,name) values
('92000000-0000-4000-8000-000000000010','92000000-0000-4000-8000-000000000001','Inbox crew'),
('92000000-0000-4000-8000-000000000020','92000000-0000-4000-8000-000000000004','Private outsiders');
insert into public.memberships(circle_id,user_id)
select '92000000-0000-4000-8000-000000000010', id from public.profiles where username in ('inbox_1','inbox_2','inbox_3','inbox_5','inbox_6');
insert into public.memberships(circle_id,user_id) values('92000000-0000-4000-8000-000000000020','92000000-0000-4000-8000-000000000004');
update public.memberships set left_at=clock_timestamp() where user_id='92000000-0000-4000-8000-000000000006';
insert into public.challenges(id,circle_id,created_by,rules,rules_hash,status) values
('92000000-0000-4000-8000-000000000011','92000000-0000-4000-8000-000000000010','92000000-0000-4000-8000-000000000001','{"title":"Read","timezone":"UTC"}','hash','active'),
('92000000-0000-4000-8000-000000000021','92000000-0000-4000-8000-000000000020','92000000-0000-4000-8000-000000000004','{"title":"Secret","timezone":"UTC"}','hash','active');
insert into public.challenge_participants(challenge_id,user_id,status,rules_hash)
select '92000000-0000-4000-8000-000000000011',id,'accepted','hash' from public.profiles where username in('inbox_1','inbox_2','inbox_3','inbox_6');
insert into public.daily_obligations(id,challenge_id,user_id,local_date,deadline_at)
select ('92000000-0000-4000-8000-'||lpad((100+n)::text,12,'0'))::uuid,
 '92000000-0000-4000-8000-000000000011',
 case when n=3 then '92000000-0000-4000-8000-000000000002'::uuid else '92000000-0000-4000-8000-000000000001'::uuid end,
 current_date+n, clock_timestamp()+interval'10 days' from generate_series(1,6)n;
insert into public.evidence_submissions(id,obligation_id,challenge_id,user_id,status,note,source,path,received_at,round)
select ('92000000-0000-4000-8000-'||lpad((200+n)::text,12,'0'))::uuid,id,challenge_id,user_id,
 case when n=2 then 'disputed' when n=4 then 'accepted' when n=5 then 'pending' else 'ai_reviewed' end,
 'Reading notes','upload',user_id::text||'/'||n||'.jpg',case when n=5 then null else '2026-11-11T08:00:00Z'::timestamptz end,
 case when n=2 then 1 else 0 end
from public.daily_obligations cross join lateral (select right(id::text,3)::int-100 n) x
where challenge_id='92000000-0000-4000-8000-000000000011';
insert into public.evidence_votes(proof_id,user_id,round,decision,reason) values
('92000000-0000-4000-8000-000000000202','92000000-0000-4000-8000-000000000002',0,'reject','Previous round'),
('92000000-0000-4000-8000-000000000206','92000000-0000-4000-8000-000000000002',0,'accept','Already reviewed');
create function pg_temp.assert_ok(value boolean,msg text)returns void language plpgsql as $$begin if value is not true then raise exception '%',msg;end if;end;$$;
create function pg_temp.must_fail(q text)returns void language plpgsql as $$declare failed boolean:=false;begin begin execute q;exception when others then failed:=true;end;if not failed then raise exception 'Expected failure: %',q;end if;end;$$;
grant execute on function pg_temp.assert_ok(boolean,text),pg_temp.must_fail(text)to authenticated,anon;
set local role authenticated;
select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000002',true);
do $$declare r jsonb; p jsonb;begin
 r:=public.stakeup_review_inbox('{"limit":1}');
 perform pg_temp.assert_ok(r->'counts'='{"pending":1,"disputed":1}'::jsonb,'Incorrect eligible counts');
 perform pg_temp.assert_ok(r->'items'->0->'proof'->>'id'='92000000-0000-4000-8000-000000000201','Oldest first ordering');
 p:=jsonb_build_object('afterId',r->'nextCursor'->>'id','afterTime',r->'nextCursor'->>'receivedAt');
 r:=public.stakeup_review_inbox(p);
 perform pg_temp.assert_ok(jsonb_array_length(r->'items')=1 and r->'items'->0->'proof'->>'status'='disputed' and r->'nextCursor'='null'::jsonb,'Cursor tie/dispute round failed');
 perform pg_temp.assert_ok(jsonb_array_length(public.stakeup_review_inbox('{"filter":"disputed"}')->'items')=1,'Dispute filter failed');
 perform pg_temp.must_fail($q$select public.stakeup_review_inbox('{"limit":21}')$q$);
 perform pg_temp.must_fail($q$select public.stakeup_review_inbox('{"filter":"invalid"}')$q$);
 perform public.stakeup_evidence('vote','{"challengeId":"92000000-0000-4000-8000-000000000011","proofId":"92000000-0000-4000-8000-000000000201","decision":"accept","reason":"Clear reading notes"}');
 perform pg_temp.assert_ok(public.stakeup_review_inbox('{}')->'counts'->>'pending'='0','Vote did not leave queue');
 perform pg_temp.assert_ok((select status from public.evidence_submissions where id='92000000-0000-4000-8000-000000000201')='ai_reviewed','One of two peers incorrectly finalized proof');
end;$$;
select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000005',true);
select pg_temp.assert_ok(jsonb_array_length(public.stakeup_review_inbox('{}')->'items')=0,'Non-enrolled member got tasks');
select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000006',true);
select pg_temp.assert_ok(jsonb_array_length(public.stakeup_review_inbox('{}')->'items')=0,'Former member got tasks');
select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000004',true);
select pg_temp.assert_ok(jsonb_array_length(public.stakeup_review_inbox('{}')->'items')=0,'Outsider got private tasks');
reset role;
insert into public.virtual_settlements(challenge_id,pool_minor,rows_snapshot) values('92000000-0000-4000-8000-000000000011',0,'[]');
update public.challenges set status='completed' where id='92000000-0000-4000-8000-000000000011';
set local role authenticated;
select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000002',true);
select pg_temp.assert_ok(jsonb_array_length(public.stakeup_review_inbox('{}')->'items')=0,'Completed challenge got tasks');
reset role; set local role anon;
select pg_temp.must_fail($q$select public.stakeup_review_inbox('{}')$q$);
rollback;
