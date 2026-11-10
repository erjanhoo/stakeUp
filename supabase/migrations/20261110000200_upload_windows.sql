begin;
alter table public.daily_obligations add column opens_at timestamptz;
update public.daily_obligations o set opens_at=(o.local_date+coalesce(c.rules->>'opening','00:00')::time)at time zone(c.rules->>'timezone')from public.challenges c where c.id=o.challenge_id;
alter table public.daily_obligations alter column opens_at set not null;
create function private.freeze_opening()returns trigger language plpgsql set search_path=''as $$declare h public.challenges;begin select * into h from public.challenges where id=new.challenge_id;new.opens_at:=(new.local_date+coalesce(h.rules->>'opening','00:00')::time)at time zone(h.rules->>'timezone');if new.opens_at>=new.deadline_at then raise exception 'The upload window collapses across a clock change.';end if;return new;end;$$;
revoke all on function private.freeze_opening()from public,anon,authenticated;
create trigger freeze_opening before insert on public.daily_obligations for each row execute function private.freeze_opening();
create or replace function private.challenge_json(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',c.id,'circleId',c.circle_id,'circleName',g.name,'createdBy',c.created_by,'rules',c.rules,'rulesHash',c.rules_hash,'status',c.status,
  'acceptances',(select coalesce(jsonb_agg(jsonb_build_object('userId',m.user_id,'displayName',u.display_name,'status',coalesce(p.status,'not_accepted'))order by m.joined_at),'[]')from public.memberships m join public.profiles u on u.id=m.user_id left join public.challenge_participants p on p.challenge_id=c.id and p.user_id=m.user_id where m.circle_id=c.circle_id and m.left_at is null),
 'acceptedCount',(select count(*) from public.challenge_participants p where p.challenge_id=c.id and p.status='accepted'),
  'ownStatus',(select p.status from public.challenge_participants p where p.challenge_id=c.id and p.user_id=auth.uid()))
 from public.challenges c join public.circles g on g.id=c.circle_id where c.id=p_id and private.is_circle_member(c.circle_id)
$$;

alter function private.stakeup_social(text,jsonb)rename to stakeup_social_v2;
create function private.stakeup_social(p_action text,p_payload jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare result jsonb;opening text;deadline text;
begin
 if p_action='create_challenge'then
  opening:=coalesce(p_payload->'rules'->>'opening','00:00');deadline:=p_payload->'rules'->>'cutoff';
  if opening!~'^([01][0-9]|2[0-3]):[0-5][0-9]$'or opening>=deadline then raise exception 'Opening time must be before the deadline on the same day.';end if;
  p_payload:=jsonb_set(p_payload,'{rules,opening}',to_jsonb(opening));
 end if;
 result:=private.stakeup_social_v2(p_action,p_payload);
 if p_action='challenge'then
  result:=jsonb_set(result,'{obligations}',coalesce((select jsonb_agg(item||jsonb_build_object('opensAt',o.opens_at)order by o.deadline_at)from jsonb_array_elements(result->'obligations')item join public.daily_obligations o on o.id=(item->>'id')::uuid),'[]'));
 end if;return result;
end;$$;
revoke all on function private.stakeup_social_v2(text,jsonb)from public,anon,authenticated;
revoke all on function private.stakeup_social(text,jsonb)from public,anon;
grant execute on function private.stakeup_social(text,jsonb)to authenticated;
-- Rebind public SQL wrapper: its old dependency follows the renamed function's OID.
create or replace function public.stakeup_social(p_action text,p_payload jsonb default '{}')returns jsonb language sql security invoker set search_path=''as $$select private.stakeup_social(p_action,p_payload)$$;
alter function private.stakeup_evidence(text,jsonb)rename to stakeup_evidence_v3;
create function private.stakeup_evidence(p_action text,p_payload jsonb)returns jsonb language plpgsql security definer set search_path=''as $$begin
 if auth.uid()is null then raise exception 'Authentication required'using errcode='42501';end if;
 if p_action='reserve'and exists(select 1 from public.daily_obligations where id=(p_payload->>'obligationId')::uuid and user_id=auth.uid()and opens_at>clock_timestamp())then raise exception 'This submission window has not opened.';end if;
 return private.stakeup_evidence_v3(p_action,p_payload);
end;$$;
revoke all on function private.stakeup_evidence_v3(text,jsonb)from public,anon,authenticated;
revoke all on function private.stakeup_evidence(text,jsonb)from public,anon;
grant execute on function private.stakeup_evidence(text,jsonb)to authenticated;
create or replace function public.stakeup_evidence(p_action text,p_payload jsonb)returns jsonb language sql security invoker set search_path=''as $$select private.stakeup_evidence(p_action,p_payload)$$;
create or replace function private.can_upload_evidence(object_path text)returns boolean language sql stable security definer set search_path=''as $$select exists(select 1 from public.evidence_submissions s join public.daily_obligations o on o.id=s.obligation_id join public.challenges h on h.id=s.challenge_id where s.path=object_path and s.user_id=auth.uid()and s.status='pending'and clock_timestamp()between o.opens_at and o.deadline_at and private.is_circle_member(h.circle_id))$$;
commit;
