alter table public.profiles drop constraint profiles_theme_accent_check;
alter table public.profiles add constraint profiles_theme_accent_check check (theme_accent in ('orange','lime','blue','violet','aurora','sunset'));
