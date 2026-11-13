begin;

alter table public.profiles drop constraint profiles_theme_accent_check;
alter table public.profiles add constraint profiles_theme_accent_check check (theme_accent in ('orange','lime','blue','violet'));
alter table public.profiles add column currency text not null default 'USD' check (currency in ('USD','KGS','EUR','RUB','GBP','KZT'));
grant update(currency) on public.profiles to authenticated;
alter table public.circles drop constraint circles_icon_check;
alter table public.circles add constraint circles_icon_check check (icon in ('flame','sun','book','dumbbell','sprout','rocket','mountain','heart','coffee','brain','bike','music','target'));

-- Make legacy automatic grace visible in the calendar. Explicit reservations
-- consume the same fixed allowance; no accepted rules or settled rows change.
create function private.effective_grace(p_challenge uuid, p_user uuid)
returns table(obligation_id uuid, challenge_id uuid, user_id uuid, chosen_at timestamptz)
language sql stable security definer set search_path='' as $$
  with chosen as (
    select g.obligation_id, g.challenge_id, g.user_id, g.chosen_at
    from public.grace_choices g where g.challenge_id=p_challenge and g.user_id=p_user
  ), automatic as (
    select o.id, o.challenge_id, o.user_id, o.deadline_at
    from public.daily_obligations o join public.challenges h on h.id=o.challenge_id
    where o.challenge_id=p_challenge and o.user_id=p_user
      and coalesce(h.rules->>'gracePolicy','automatic_v1')='automatic_v1'
      and o.deadline_at<=clock_timestamp()
      and not exists(select 1 from chosen g where g.obligation_id=o.id)
      and not exists(select 1 from public.evidence_submissions s where s.obligation_id=o.id and s.received_at is not null and s.status<>'rejected')
    order by o.local_date
    limit greatest(0,(select (rules->>'graceDays')::integer from public.challenges where id=p_challenge)-(select count(*)::integer from chosen))
  ) select * from chosen union all select * from automatic
$$;
revoke all on function private.effective_grace(uuid,uuid) from public,anon,authenticated;

do $$declare def text;old text;begin
  def:=pg_get_functiondef('public.stakeup_community(text,jsonb)'::regprocedure);
  old:=$q$if coalesce(h.rules->>'gracePolicy','automatic_v1')<>'chosen_v1'then raise exception 'This challenge uses its original automatic grace policy.';end if;$q$;
  if position(old in def)=0 then raise exception 'Unexpected grace function version';end if;
  def:=replace(def,old,'');
  def:=replace(def,'from public.grace_choices where challenge_id=h.id and user_id=uid','from private.effective_grace(h.id,uid)');
  def:=replace(def,'if exists(select 1 from public.grace_choices where obligation_id=o.id)then', 'if exists(select 1 from private.effective_grace(h.id,uid) g where g.obligation_id=o.id)then');
  execute def;
  def:=pg_get_functiondef('private.competition(uuid,boolean,boolean)'::regprocedure);
  old:='exists(select 1 from public.grace_choices gc where gc.obligation_id=d.id)chosen';
  if position(old in def)=0 then raise exception 'Unexpected competition function version';end if;
  def:=replace(def,old,'exists(select 1 from private.effective_grace(h.id,p.user_id) gc where gc.obligation_id=d.id)chosen');
  def:=replace(def,$q$if coalesce(h.rules->>'gracePolicy','automatic_v1')='automatic_v1'and grace<(h.rules->>'graceDays')::integer then grace:=grace+1;continue;end if;$q$,'');
  -- Expose current contributions before settlement, with stable identifiers.
  def:=replace(def,$q$'ledger','[]'::jsonb$q$,$q$'ledger',(select coalesce(jsonb_agg(e||jsonb_build_object('id',e->>'obligationId','createdAt',(select deadline_at from public.daily_obligations where id=(e->>'obligationId')::uuid))),'[]'::jsonb)from jsonb_array_elements(entries)e)$q$);
  execute def;
end;$$;

create table public.wallet_top_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  request_id uuid not null,
  amount_minor bigint not null check(amount_minor between 100 and 10000000),
  created_at timestamptz not null default clock_timestamp(),
  unique(user_id,request_id)
);
alter table public.wallet_top_ups enable row level security;
revoke all on public.wallet_top_ups from anon,authenticated;
grant select on public.wallet_top_ups to authenticated;
create policy top_ups_owner_read on public.wallet_top_ups for select to authenticated using(user_id=(select auth.uid()));

create function public.stakeup_wallet(p_amount bigint default null,p_request uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); previous bigint; h record; result jsonb; pending bigint:=0; balance bigint; entries jsonb;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501';end if;
  if p_amount is not null then
    if p_request is null or p_amount not between 100 and 10000000 then raise exception 'Choose an amount from 1 to 100000.';end if;
    -- Serialize retries and concurrent submissions for this account.
    perform 1 from public.profiles where id=uid for update;
    select amount_minor into previous from public.wallet_top_ups where user_id=uid and request_id=p_request;
    if found and previous<>p_amount then raise exception 'This top-up request was already used for a different amount.';end if;
    insert into public.wallet_top_ups(user_id,request_id,amount_minor)values(uid,p_request,p_amount)on conflict(user_id,request_id)do nothing;
  elsif p_request is not null then raise exception 'An amount is required.';
  end if;
  select coalesce((select sum(amount_minor)from public.wallet_top_ups where user_id=uid),0)
    +coalesce((select sum(case when kind='penalty'then -amount_minor else amount_minor end)from public.virtual_ledger where user_id=uid),0) into balance;
  for h in select c.id from public.challenges c join public.challenge_participants cp on cp.challenge_id=c.id where cp.user_id=uid and cp.status='accepted'and c.status='active'and private.is_circle_member(c.circle_id) loop
    result:=private.competition(h.id,false,false);
    pending:=pending+coalesce((select (r->>'penaltyMinor')::bigint from jsonb_array_elements(result->'rows')r where r->>'userId'=uid::text),0);
  end loop;
  select coalesce(jsonb_agg(x.entry order by x.created_at desc),'[]')into entries from (
    select * from (
      select created_at,jsonb_build_object('id',id,'kind','top_up','amountMinor',amount_minor,'createdAt',created_at,'reason','Balance top-up')entry from public.wallet_top_ups where user_id=uid
      union all
      select created_at,jsonb_build_object('id',id,'kind',kind,'amountMinor',amount_minor,'createdAt',created_at,'reason',reason)from public.virtual_ledger where user_id=uid
    ) history order by created_at desc limit 30
  ) x;
  return jsonb_build_object('balanceMinor',balance,'pendingPenaltyMinor',pending,'entries',entries);
end;$$;
revoke all on function public.stakeup_wallet(bigint,uuid) from public,anon;
grant execute on function public.stakeup_wallet(bigint,uuid) to authenticated;
commit;
