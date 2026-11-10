begin;
insert into auth.users(id,email,raw_user_meta_data)select ('80000000-0000-4000-8000-00000000000'||n)::uuid,'community'||n||'@example.test',jsonb_build_object('username','community_'||n)from generate_series(1,4)n;
insert into public.circles(id,creator_id,name)values('80000000-0000-4000-8000-000000000010','80000000-0000-4000-8000-000000000001','Community crew');
insert into public.memberships(circle_id,user_id)select '80000000-0000-4000-8000-000000000010',id from public.profiles where username in('community_1','community_2','community_3');
insert into public.challenges(id,circle_id,created_by,rules,rules_hash,status)values('80000000-0000-4000-8000-000000000011','80000000-0000-4000-8000-000000000010','80000000-0000-4000-8000-000000000001','{"title":"Chosen rest","timezone":"UTC","opening":"08:00","cutoff":"09:00","graceDays":1,"penaltyMinor":100,"maxPenaltyMinor":300,"capturePolicy":"camera_or_upload","rewardPolicy":"discipline_v2","gracePolicy":"chosen_v1"}','hash','active');
insert into public.challenge_participants(challenge_id,user_id,status,rules_hash)select '80000000-0000-4000-8000-000000000011',id,'accepted','hash'from public.profiles where username in('community_1','community_2','community_3');
insert into public.daily_obligations(id,challenge_id,user_id,local_date,deadline_at)select ('80000000-0000-4000-8000-0000000001'||n||d)::uuid,'80000000-0000-4000-8000-000000000011',('80000000-0000-4000-8000-00000000000'||n)::uuid,(clock_timestamp()at time zone'UTC')::date+d-1,clock_timestamp()+interval'1 day'*(d-1)+interval'12 hours' from generate_series(1,3)n cross join generate_series(1,3)d;
update public.daily_obligations set opens_at=clock_timestamp()-interval'1 hour';
create function pg_temp.assert_ok(value boolean,msg text)returns void language plpgsql as $$begin if value is not true then raise exception '%',msg;end if;end;$$;
create function pg_temp.must_fail(q text)returns void language plpgsql as $$declare failed boolean:=false;begin begin execute q;exception when others then failed:=true;end;if not failed then raise exception 'Expected failure: %',q;end if;end;$$;
grant execute on function pg_temp.assert_ok(boolean,text),pg_temp.must_fail(text)to authenticated,anon;
set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000001',true);
do $$declare p jsonb:='{"challengeId":"80000000-0000-4000-8000-000000000011","obligationId":"80000000-0000-4000-8000-000000000111"}';r jsonb;begin
 perform public.stakeup_community('grace_choose',p);perform public.stakeup_community('grace_choose',p);
 perform pg_temp.assert_ok(jsonb_array_length(public.stakeup_community('grace_list',p))=1,'Grace retry duplicated choice');
 perform pg_temp.must_fail(format('select public.stakeup_community(''grace_choose'',%L)',p||'{"obligationId":"80000000-0000-4000-8000-000000000112"}'));
 perform pg_temp.must_fail(format('select public.stakeup_community(''grace_choose'',%L)',p||'{"obligationId":"80000000-0000-4000-8000-000000000121"}'));
 perform pg_temp.must_fail(format('select public.stakeup_evidence(''reserve'',%L)',p||'{"source":"camera","note":"Rest"}'));
 perform public.stakeup_community('grace_cancel',p);
 r:=public.stakeup_evidence('reserve',p||'{"source":"camera","note":"Notes"}');
 perform pg_temp.assert_ok(private.can_upload_evidence(r->>'path'),'Cancelled grace still blocks upload');
 perform public.stakeup_community('grace_choose',p);
 perform pg_temp.assert_ok(not private.can_upload_evidence(r->>'path'),'Grace allows Storage upload');
 perform pg_temp.must_fail(format('select public.stakeup_evidence(''finish'',%L)',p||jsonb_build_object('proofId',r->>'id')));
 perform pg_temp.must_fail('insert into public.grace_choices select * from public.grace_choices');
 update public.profiles set language='ru'where id=auth.uid();
 perform pg_temp.must_fail('update public.profiles set language=''xx''where id=auth.uid()');
end;$$;
reset role;
-- A finished proof is used for comments. A different, unsubmitted day stays chosen.
update public.evidence_submissions set received_at=clock_timestamp()-interval'1 minute',status='ai_reviewed';
delete from public.grace_choices;
set local role authenticated;
select public.stakeup_community('grace_choose','{"challengeId":"80000000-0000-4000-8000-000000000011","obligationId":"80000000-0000-4000-8000-000000000112"}');
do $$declare p jsonb;r jsonb;comment_id text;begin
 p:=jsonb_build_object('challengeId','80000000-0000-4000-8000-000000000011','proofId',(select id from public.evidence_submissions));
 perform pg_temp.must_fail(format('select public.stakeup_community(''grace_choose'',%L)',p||'{"obligationId":"80000000-0000-4000-8000-000000000111"}'));
 perform set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000002',true);
 r:=public.stakeup_community('comment',p||'{"body":"<script>plain text only</script>"}');comment_id:=r->'comments'->0->>'id';
 perform public.stakeup_community('react',p||'{"emoji":"clap"}');
 perform pg_temp.assert_ok((select count(*)=0 from public.evidence_votes),'Reaction counted as a vote');
 perform pg_temp.assert_ok((public.stakeup_community('social',p)->'reactions'->0->>'count')::integer=1,'Reaction missing');
 perform set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000001',true);
 perform pg_temp.must_fail(format('select public.stakeup_community(''delete_comment'',%L)',p||jsonb_build_object('id',comment_id)));
 perform pg_temp.assert_ok((select count(*)>0 from public.notifications where kind='comment'),'Comment notification missing');
 perform set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000002',true);
 r:=public.stakeup_community('delete_comment',p||jsonb_build_object('id',comment_id));
 perform pg_temp.assert_ok(r->'comments'->0->>'body'=''and(r->'comments'->0->>'deleted')::boolean,'Comment removal failed');
 perform public.stakeup_community('react',p||'{"emoji":"clap"}');
 perform pg_temp.assert_ok((select count(*)=0 from public.proof_reactions),'Reaction toggle duplicated');
 perform set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000004',true);
 perform pg_temp.must_fail(format('select public.stakeup_community(''social'',%L)',p));
 perform pg_temp.assert_ok((select count(*)=0 from public.proof_comments),'Outsider read comments');
 perform pg_temp.assert_ok((select count(*)=0 from public.grace_choices),'Outsider read grace');
 perform pg_temp.assert_ok((select count(*)=0 from public.notifications),'Outsider read notifications');
 perform pg_temp.must_fail('select private.emit_community_notifications()');
end;$$;
reset role;
-- Trigger decisions, scheduled reminders/recaps and read-state ownership.
insert into public.evidence_events(proof_id,actor_id,kind,reason)select id,user_id,'accepted','Peer majority'from public.evidence_submissions;
update public.evidence_submissions set status='accepted',received_at=date_trunc('month',clock_timestamp())-interval'1 day';
update public.daily_obligations set deadline_at=clock_timestamp()-interval'3 days';
select private.emit_community_notifications();select private.emit_community_notifications();
select pg_temp.assert_ok((select count(*)=1 from public.notifications where kind='recap'),'Monthly recap missing or duplicated');
select pg_temp.assert_ok((select count(*)=7 from public.notifications where kind='missed'),'Grace or submitted day received missed notification');
set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000004',true);
select public.stakeup_community('read','{}');
reset role;
select pg_temp.assert_ok((select count(*)=0 from public.notifications where read_at is not null),'Read-all changed another user notifications');
set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000001',true);
do $$declare r jsonb;begin
 r:=public.stakeup_competition('80000000-0000-4000-8000-000000000011');
 perform pg_temp.assert_ok((r->>'poolMinor')::integer=700,'Chosen grace or unused allowance changed pool');
 perform pg_temp.assert_ok(exists(select 1 from jsonb_array_elements(r->'rows')x where x->>'userId'=auth.uid()::text and(x->>'grace')::integer=1 and(x->>'penaltyMinor')::integer=100),'Chosen grace not reflected in scores');
end;$$;
reset role;
set local role anon;
select pg_temp.must_fail('select public.stakeup_community(''notifications'')');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000001',true);
do $$declare p jsonb;r jsonb;begin
 p:=jsonb_build_object('circleId','80000000-0000-4000-8000-000000000010','rules',jsonb_build_object('title','New chosen policy','description','Private','startDate',current_date+2,'endDate',current_date+3,'timezone','UTC','weekdays','[0,1,2,3,4,5,6]'::jsonb,'opening','08:00','cutoff','09:00','evidenceRequirements','Reading notes','capturePolicy','camera_or_upload','penaltyMinor',100,'maxPenaltyMinor',200,'graceDays',1,'rewardPolicy','discipline_v2','gracePolicy','chosen_v1'));
 r:=public.stakeup_social('create_challenge',p);
 perform pg_temp.assert_ok(r->'rules'->>'rewardPolicy'='discipline_v2'and r->'rules'->>'gracePolicy'='chosen_v1','New policy not locked in snapshot');
 perform pg_temp.must_fail(format('select public.stakeup_social(''create_challenge'',%L)',jsonb_set(p,'{rules,gracePolicy}','"automatic_v1"')));
end;$$;
reset role;
rollback;



