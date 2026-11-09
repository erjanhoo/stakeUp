-- Run against a migrated disposable Supabase project: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/foundation.sql
-- Everything rolls back, including test auth users.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','foundation-a@example.test','{"username":"foundation_a"}'),
 ('10000000-0000-4000-8000-000000000002','foundation-b@example.test','{"username":"foundation_b"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$
declare affected integer;
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'RLS leaked profiles'; end if;
  if exists(select 1 from public.audit_events where actor_id <> auth.uid()) then raise exception 'RLS leaked audit events'; end if;
  update public.profiles set bio='not allowed' where id='10000000-0000-4000-8000-000000000002';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'RLS allowed another user update'; end if;
  update public.profiles set display_name='Foundation Tester',timezone='Asia/Bishkek',onboarding_completed_at=now() where id=auth.uid();
  if not exists(select 1 from public.audit_events where kind='onboarding_completed') then raise exception 'Missing audit'; end if;
  begin
    update public.profiles set timezone='Invalid/Timezone' where id=auth.uid();
    raise exception 'Invalid timezone accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.audit_events(actor_id,kind,resource_id) values (auth.uid(),'profile_updated',auth.uid());
    raise exception 'Client forged audit event';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set created_at='2000-01-01' where id=auth.uid();
    raise exception 'Client changed protected timestamp';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
set local role anon;
do $$
begin
  begin perform * from public.profiles; raise exception 'Anonymous profile read allowed';
  exception when insufficient_privilege then null; end;
end;
$$;
rollback;
