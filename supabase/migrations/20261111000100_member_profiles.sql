begin;
create function private.shares_circle(other_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid()=other_id or exists(select 1 from public.memberships a join public.memberships b using(circle_id) where a.user_id=auth.uid() and b.user_id=other_id and a.left_at is null and b.left_at is null) $$;
revoke all on function private.shares_circle(uuid) from public,anon; grant execute on function private.shares_circle(uuid) to authenticated;
create function public.stakeup_member_profile(p_user uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;begin
 if auth.uid() is null or not private.shares_circle(p_user) then raise exception 'Profile not found.' using errcode='42501';end if;
 select jsonb_build_object('id',p.id,'displayName',p.display_name,'username',p.username,'bio',p.bio,'createdAt',p.created_at,
 'accepted',(select count(*) from public.evidence_submissions s join public.challenges c on c.id=s.challenge_id where s.user_id=p.id and s.status='accepted' and (auth.uid()=p.id or private.is_circle_member(c.circle_id))),
 'completed',(select count(*) from public.challenge_participants cp join public.challenges c on c.id=cp.challenge_id where cp.user_id=p.id and cp.status='accepted' and c.status='completed' and (auth.uid()=p.id or private.is_circle_member(c.circle_id)))) into result from public.profiles p where p.id=p_user;
 if result is null then raise exception 'Profile not found.';end if;return result;end;$$;
revoke all on function public.stakeup_member_profile(uuid) from public,anon;grant execute on function public.stakeup_member_profile(uuid) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('avatars','avatars',false,2500000,array['image/jpeg'])on conflict(id)do nothing;
create policy avatar_read_member on storage.objects for select to authenticated using(bucket_id='avatars' and name~'^[0-9a-f-]{36}/profile[.]jpg$' and private.shares_circle(split_part(name,'/',1)::uuid));
create policy avatar_insert_self on storage.objects for insert to authenticated with check(bucket_id='avatars' and name=auth.uid()::text||'/profile.jpg');
create policy avatar_update_self on storage.objects for update to authenticated using(bucket_id='avatars' and name=auth.uid()::text||'/profile.jpg')with check(bucket_id='avatars' and name=auth.uid()::text||'/profile.jpg');
commit;
