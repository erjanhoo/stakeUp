-- ONLY for a fresh disposable plain PostgreSQL database, never a managed Supabase project.
-- Minimal Auth roles/tables let CI test grants, RLS and RPCs using real PostgreSQL.
-- This does not emulate Supabase Auth/email/PostgREST and cannot verify those integrations.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema extensions;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant usage on schema auth,public to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
-- Minimal Storage metadata fixture for PostgreSQL CI only (not the Storage service).
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated,anon;
grant select,insert,update,delete on storage.objects to authenticated;
