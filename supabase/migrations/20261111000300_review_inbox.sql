begin;

create index evidence_open_review_idx
  on public.evidence_submissions(received_at, id)
  where received_at is not null and status in ('ai_reviewed', 'disputed');

create function public.stakeup_review_inbox(p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  f text := coalesce(p_payload->>'filter', 'all');
  lim integer := coalesce((p_payload->>'limit')::integer, 20);
  after_id uuid := (p_payload->>'afterId')::uuid;
  after_time timestamptz := (p_payload->>'afterTime')::timestamptz;
  result jsonb;
begin
  if uid is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if f not in ('all', 'pending', 'disputed') or lim not between 1 and 20 or
     (after_id is null) <> (after_time is null) then
    raise exception 'Invalid review inbox query.';
  end if;
  with eligible as materialized (
    select s.id, s.received_at, s.status, c.circle_id, ci.name circle_name,
           c.rules->>'title' challenge_title, c.rules->>'timezone' timezone
    from public.evidence_submissions s
    join public.challenges c on c.id = s.challenge_id and c.status = 'active'
    join public.circles ci on ci.id = c.circle_id
    join public.challenge_participants cp on cp.challenge_id = c.id and cp.user_id = uid and cp.status = 'accepted'
    where s.received_at is not null and s.status in ('ai_reviewed', 'disputed') and s.user_id <> uid
      and private.is_circle_member(c.circle_id)
      and not exists (select 1 from public.evidence_votes v where v.proof_id = s.id and v.user_id = uid and v.round = s.round)
  ), candidates as (
    select * from eligible e
    where (f = 'all' or e.status = case when f = 'pending' then 'ai_reviewed' else 'disputed' end)
      and (after_id is null or (e.received_at, e.id) > (after_time, after_id))
    order by e.received_at, e.id limit lim + 1
  ), page as (select * from candidates order by received_at, id limit lim)
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'proof', private.proof_json(p.id), 'circleId', p.circle_id, 'circleName', p.circle_name,
      'challengeTitle', p.challenge_title, 'timezone', p.timezone) order by p.received_at, p.id) from page p), '[]'::jsonb),
    'counts', jsonb_build_object('pending', (select count(*) from eligible where status = 'ai_reviewed'),
                                 'disputed', (select count(*) from eligible where status = 'disputed')),
    'nextCursor', case when (select count(*) from candidates) > lim then
      (select jsonb_build_object('receivedAt', received_at, 'id', id) from page order by received_at desc, id desc limit 1)
      else null end
  ) into result;
  return result;
end;
$$;
revoke all on function public.stakeup_review_inbox(jsonb) from public, anon;
grant execute on function public.stakeup_review_inbox(jsonb) to authenticated;
commit;
