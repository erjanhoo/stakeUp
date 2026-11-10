begin;
alter table public.challenges drop constraint challenges_status_check;
alter table public.challenges add constraint challenges_status_check check(status in('proposed','active','cancelled','completed'));
create table public.virtual_settlements(id uuid primary key default gen_random_uuid(),challenge_id uuid not null unique references public.challenges(id),pool_minor bigint not null check(pool_minor>=0),rows_snapshot jsonb not null,created_at timestamptz not null default clock_timestamp());
create table public.virtual_ledger(id uuid primary key default gen_random_uuid(),settlement_id uuid not null references public.virtual_settlements(id),user_id uuid not null references public.profiles(id),kind text not null check(kind in('penalty','reward','refund')),amount_minor bigint not null check(amount_minor>0),obligation_id uuid references public.daily_obligations(id),reason text not null,created_at timestamptz not null default clock_timestamp());
create unique index ledger_penalty_once on public.virtual_ledger(obligation_id)where kind='penalty';
create unique index ledger_distribution_once on public.virtual_ledger(settlement_id,user_id)where kind in('reward','refund');
alter table public.virtual_settlements enable row level security;
alter table public.virtual_ledger enable row level security;
revoke all on public.virtual_settlements,public.virtual_ledger from anon,authenticated;
grant select on public.virtual_settlements,public.virtual_ledger to authenticated;
create policy settlement_circle_read on public.virtual_settlements for select to authenticated using(exists(select 1 from public.challenges c where c.id=challenge_id and private.is_circle_member(c.circle_id)));
create policy ledger_circle_read on public.virtual_ledger for select to authenticated using(exists(select 1 from public.virtual_settlements s join public.challenges c on c.id=s.challenge_id where s.id=settlement_id and private.is_circle_member(c.circle_id)));
create or replace function private.lock_challenge_rules()returns trigger language plpgsql set search_path=''as $$begin
 if new.rules is distinct from old.rules or new.rules_hash is distinct from old.rules_hash or new.circle_id is distinct from old.circle_id or new.created_by is distinct from old.created_by then raise exception 'Published challenge rules are immutable.';end if;
 if old.status<>'proposed'and new.status is distinct from old.status and not(old.status='active'and new.status='completed'and exists(select 1 from public.virtual_settlements where challenge_id=old.id))then raise exception 'Active challenge state is locked until settlement.';end if;return new;
end;$$;
create function private.competition(p_challenge uuid,p_settle boolean default false,p_worker boolean default false)returns jsonb language plpgsql security definer set search_path=''as $$
declare h public.challenges;s public.virtual_settlements;p record;o record;r jsonb;rs jsonb:='[]';entries jsonb:='[]';entry jsonb;result jsonb;pool bigint:=0;success integer;missed integer;pending integer;grace integer;scheduled integer;streak integer;penalty bigint;amount bigint;eligible boolean;any_eligible boolean;closes timestamptz;lc numeric:=1;weight numeric;weight_sum numeric:=0;remainder numeric;leftover bigint;award bigint;sid uuid;current_status text;finished boolean;
begin
 if p_settle then select * into h from public.challenges where id=p_challenge for update;else select * into h from public.challenges where id=p_challenge;end if;
 if h.id is null then raise exception 'Challenge not found.';end if;
 if not p_worker and not private.is_circle_member(h.circle_id)then raise exception 'Challenge not found.'using errcode='42501';end if;
 select * into s from public.virtual_settlements where challenge_id=h.id;
 if s.id is not null then
  return jsonb_build_object('status','settled','rows',s.rows_snapshot,'poolMinor',s.pool_minor,'distributedMinor',s.pool_minor,'settlementId',s.id,'appealClosesAt',s.created_at,
   'ledger',(select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'userId',l.user_id,'kind',l.kind,'amountMinor',l.amount_minor,'reason',l.reason,'obligationId',l.obligation_id,'createdAt',l.created_at)order by l.created_at,l.id),'[]')from public.virtual_ledger l where l.settlement_id=s.id));
 end if;
 select greatest(max(deadline_at),(select max(e.created_at)from public.evidence_events e join public.evidence_submissions es on es.id=e.proof_id where es.challenge_id=h.id))+interval'24 hours'into closes from public.daily_obligations where challenge_id=h.id;
 for p in select cp.user_id,u.display_name from public.challenge_participants cp join public.profiles u on u.id=cp.user_id where cp.challenge_id=h.id and cp.status='accepted'order by cp.user_id loop
  success:=0;missed:=0;pending:=0;grace:=0;scheduled:=0;streak:=0;penalty:=0;
  for o in select d.*,es.status proof_status,es.received_at from public.daily_obligations d left join public.evidence_submissions es on es.obligation_id=d.id where d.challenge_id=h.id and d.user_id=p.user_id order by d.local_date loop
   scheduled:=scheduled+1;
   if o.proof_status='accepted'then success:=success+1;streak:=streak+1;continue;end if;
   if o.deadline_at>clock_timestamp()or(o.received_at is not null and o.proof_status not in('accepted','rejected'))then pending:=pending+1;if o.deadline_at<=clock_timestamp()then streak:=0;end if;continue;end if;
   missed:=missed+1;streak:=0;
   if grace<(h.rules->>'graceDays')::integer then grace:=grace+1;continue;end if;
   amount:=least((h.rules->>'penaltyMinor')::bigint,(h.rules->>'maxPenaltyMinor')::bigint-penalty);penalty:=penalty+amount;
   if amount>0 then entries:=entries||jsonb_build_array(jsonb_build_object('userId',p.user_id,'kind','penalty','amountMinor',amount,'obligationId',o.id,'reason','Missed '||o.local_date));end if;
  end loop;
  eligible:=scheduled-grace>0 and success*100>=(scheduled-grace)*80;
  rs:=rs||jsonb_build_array(jsonb_build_object('userId',p.user_id,'name',p.display_name,'successful',success,'missed',missed,'pending',pending,'grace',grace,'scheduled',scheduled,'streak',streak,'penaltyMinor',penalty,'rewardMinor',0,'eligible',eligible,'rank',0));pool:=pool+penalty;
 end loop;
 any_eligible:=exists(select 1 from jsonb_array_elements(rs)x where(x->>'eligible')::boolean);
 if any_eligible then for r in select value from jsonb_array_elements(rs)where(value->>'eligible')::boolean loop lc:=lcm(lc,(r->>'scheduled')::numeric-(r->>'grace')::numeric);end loop;end if;
 result:='[]';
 for r in select value from jsonb_array_elements(rs)loop
  weight:=case when any_eligible then case when(r->>'eligible')::boolean then div((r->>'successful')::numeric*lc,((r->>'scheduled')::numeric-(r->>'grace')::numeric))else 0 end else(r->>'penaltyMinor')::numeric end;
  weight_sum:=weight_sum+weight;result:=result||jsonb_build_array(r||jsonb_build_object('_weight',weight));
 end loop;
 rs:='[]';leftover:=pool;
 for r in select value from jsonb_array_elements(result)loop
  weight:=(r->>'_weight')::numeric;award:=case when weight_sum>0 then div(pool::numeric*weight,weight_sum)::bigint else 0 end;
  remainder:=case when weight_sum>0 then mod(pool::numeric*weight,weight_sum)else 0 end;
  rs:=rs||jsonb_build_array((r-'_weight')||jsonb_build_object('rewardMinor',award,'_remainder',remainder));leftover:=leftover-award;
 end loop;
 result:='[]';
 for r in select value from jsonb_array_elements(rs)order by(value->>'_remainder')::numeric desc,value->>'userId'loop
  if leftover>0 then r:=r||jsonb_build_object('rewardMinor',(r->>'rewardMinor')::bigint+1);leftover:=leftover-1;end if;
  result:=result||jsonb_build_array(r-'_remainder');
 end loop;
 rs:='[]';
 for r in select value from jsonb_array_elements(result)loop
  select count(*)+1 into amount from jsonb_array_elements(result)x where(x->>'successful')::integer*((r->>'scheduled')::integer-(r->>'grace')::integer)>(r->>'successful')::integer*((x->>'scheduled')::integer-(x->>'grace')::integer);
  rs:=rs||jsonb_build_array(r||jsonb_build_object('rank',amount));
 end loop;
 select coalesce(jsonb_agg(value order by(value->>'rank')::integer,value->>'userId'),'[]')into rs from jsonb_array_elements(rs);
 finished:=h.status='active'and closes is not null and closes<=clock_timestamp()and not exists(select 1 from jsonb_array_elements(rs)x where(x->>'pending')::integer>0);
 current_status:=case when finished then'ready'when exists(select 1 from jsonb_array_elements(rs)x where(x->>'pending')::integer>0)then'blocked'else'provisional'end;
 if p_settle and not finished then raise exception 'Settlement waits for every deadline, resolved reviews and the 24-hour appeal period.';end if;
 if p_settle then
  insert into public.virtual_settlements(challenge_id,pool_minor,rows_snapshot)values(h.id,pool,rs)returning id into sid;
  for entry in select value from jsonb_array_elements(entries)loop insert into public.virtual_ledger(settlement_id,user_id,kind,amount_minor,obligation_id,reason)values(sid,(entry->>'userId')::uuid,'penalty',(entry->>'amountMinor')::bigint,(entry->>'obligationId')::uuid,entry->>'reason');end loop;
  for r in select value from jsonb_array_elements(rs)loop if(r->>'rewardMinor')::bigint>0 then insert into public.virtual_ledger(settlement_id,user_id,kind,amount_minor,reason)values(sid,(r->>'userId')::uuid,case when any_eligible then'reward'else'refund'end,(r->>'rewardMinor')::bigint,case when any_eligible then'Discipline reward v1'else'No eligible participant: contribution refund'end);end if;end loop;
  if(select coalesce(sum(case when kind='penalty'then amount_minor else-amount_minor end),0)from public.virtual_ledger where settlement_id=sid)<>0 then raise exception 'Unbalanced virtual settlement';end if;
  update public.challenges set status='completed'where id=h.id;
  insert into public.activity_events(circle_id,actor_id,kind,title)values(h.circle_id,h.created_by,'challenge_completed','Completed '||(h.rules->>'title'));
  return private.competition(h.id,false,p_worker);
 end if;
 return jsonb_build_object('status',current_status,'rows',rs,'poolMinor',pool,'distributedMinor',0,'ledger','[]'::jsonb,'settlementId',null,'appealClosesAt',closes);
end;$$;
revoke all on function private.competition(uuid,boolean,boolean)from public,anon,authenticated;
create function public.stakeup_competition(p_challenge uuid,p_settle boolean default false)returns jsonb language plpgsql security definer set search_path=''as $$begin if auth.uid()is null then raise exception 'Authentication required'using errcode='42501';end if;return private.competition(p_challenge,p_settle,false);end;$$;
revoke all on function public.stakeup_competition(uuid,boolean)from public,anon;
grant execute on function public.stakeup_competition(uuid,boolean)to authenticated;
create function public.stakeup_competition_totals()returns bigint language plpgsql security definer set search_path=''as $$declare h record;total bigint:=0;r jsonb;begin
 if auth.uid()is null then raise exception 'Authentication required'using errcode='42501';end if;
 for h in select c.id from public.challenges c join public.challenge_participants p on p.challenge_id=c.id where c.status='active'and p.user_id=auth.uid()and p.status='accepted'and private.is_circle_member(c.circle_id)order by c.id loop r:=private.competition(h.id,false,false);total:=total+(r->>'poolMinor')::bigint;end loop;return total;
end;$$;
revoke all on function public.stakeup_competition_totals()from public,anon;
grant execute on function public.stakeup_competition_totals()to authenticated;
-- Review mutations and settlement serialize on the same challenge lock.
create or replace function private.stakeup_evidence(p_action text,p_payload jsonb)returns jsonb language plpgsql security definer set search_path=''as $$declare h public.challenges;begin
 if auth.uid()is null then raise exception 'Authentication required'using errcode='42501';end if;
 if p_action not in('list','photo')then select * into h from public.challenges where id=(p_payload->>'challengeId')::uuid and private.is_circle_member(circle_id)for update;if h.id is null then raise exception 'Challenge not found'using errcode='42501';end if;if h.status<>'active'then raise exception 'This challenge is completed; review is closed.';end if;end if;
 if p_action='reserve'and exists(select 1 from public.daily_obligations where id=(p_payload->>'obligationId')::uuid and user_id=auth.uid()and opens_at>clock_timestamp())then raise exception 'This submission window has not opened.';end if;
 return private.stakeup_evidence_v3(p_action,p_payload);
end;$$;
create function private.process_competition_due()returns integer language plpgsql security definer set search_path=''as $$declare h record;n integer:=0;result jsonb;begin
 for h in select c.id from public.challenges c where c.status='active'and not exists(select 1 from public.daily_obligations d where d.challenge_id=c.id and d.deadline_at>clock_timestamp()-interval'24 hours')and not exists(select 1 from public.evidence_submissions es where es.challenge_id=c.id and es.received_at is not null and es.status not in('accepted','rejected'))and not exists(select 1 from public.evidence_events e join public.evidence_submissions es on es.id=e.proof_id where es.challenge_id=c.id and e.created_at>clock_timestamp()-interval'24 hours') order by c.created_at limit 20 loop
  result:=private.competition(h.id,false,true);if result->>'status'='ready'then perform private.competition(h.id,true,true);n:=n+1;end if;
 end loop;return n;
end;$$;
revoke all on function private.process_competition_due()from public,anon,authenticated;
-- Supabase offers pg_cron; plain PostgreSQL CI checks the same worker manually.
do $$begin if exists(select 1 from pg_available_extensions where name='pg_cron')then
 create extension if not exists pg_cron with schema pg_catalog;
 grant usage on schema cron to postgres;
 grant all privileges on all tables in schema cron to postgres;
 perform cron.schedule('stakeup-virtual-settlement','*/5 * * * *','select private.process_competition_due()');
end if;end;$$;
commit;

