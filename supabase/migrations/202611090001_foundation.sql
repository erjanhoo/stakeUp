-- Phase 1 only. Future circle/evidence/ledger schemas are proposed in docs/ARCHITECTURE.md.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z][a-z0-9_]{2,23}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  timezone text not null default 'UTC',
  bio text not null default '' check (char_length(bio) <= 240),
  avatar_path text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('account_created','profile_updated','onboarding_completed')),
  resource_id uuid not null,
  created_at timestamptz not null default now()
);
create index audit_events_actor_time_idx on public.audit_events(actor_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.audit_events enable row level security;
revoke all on public.profiles, public.audit_events from anon, authenticated;
grant select on public.profiles, public.audit_events to authenticated;
grant update (username, display_name, timezone, bio, onboarding_completed_at) on public.profiles to authenticated;
create policy profiles_read_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy audit_read_self on public.audit_events for select to authenticated using (actor_id = (select auth.uid()));

create function public.validate_profile() returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Invalid timezone' using errcode = '23514';
  end if;
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.id := old.id;
    if old.onboarding_completed_at is not null then
      new.onboarding_completed_at := old.onboarding_completed_at;
    elsif new.onboarding_completed_at is not null then
      new.onboarding_completed_at := now();
    end if;
  end if;
  return new;
end;
$$;
create trigger validate_profile before insert or update on public.profiles for each row execute function public.validate_profile();

create function public.bootstrap_profile() returns trigger language plpgsql security definer set search_path = '' as $$
declare requested_username text;
begin
  requested_username := lower(new.raw_user_meta_data ->> 'username');
  if requested_username is null or requested_username !~ '^[a-z][a-z0-9_]{2,23}$' then
    requested_username := 'u_' || left(replace(new.id::text, '-', ''), 20);
  end if;
  insert into public.profiles(id, username, display_name) values (new.id, requested_username, requested_username);
  insert into public.audit_events(actor_id, kind, resource_id) values (new.id, 'account_created', new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.bootstrap_profile();

create function public.audit_profile_update() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (old.username,old.display_name,old.timezone,old.bio,old.onboarding_completed_at)
    is distinct from (new.username,new.display_name,new.timezone,new.bio,new.onboarding_completed_at) then
    insert into public.audit_events(actor_id,kind,resource_id) values (
      new.id,
      case when old.onboarding_completed_at is null and new.onboarding_completed_at is not null then 'onboarding_completed' else 'profile_updated' end,
      new.id
    );
  end if;
  return new;
end;
$$;
create trigger on_profile_updated after update on public.profiles for each row execute function public.audit_profile_update();
revoke all on function public.validate_profile(), public.bootstrap_profile(), public.audit_profile_update() from public, anon, authenticated;

-- No public storage bucket, upload permission, ledger, or service-role client is introduced in phase 1.
commit;
