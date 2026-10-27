-- One profile row per person who signs up, created automatically.
--
-- Why: Supabase keeps sign-in accounts in the private auth.users table. This
-- public.profiles table gives the app (and the project owner, in the dashboard)
-- a record of every user: name, email and photo from Google or the email code.
--
-- The trigger below must never block a signup, so it swallows its own errors.
-- A missing profile can be repaired later; a failed signup cannot.
--
-- Name and photo come from sign-up metadata, which the person (or anyone calling
-- the API) controls. They are trimmed, length-limited and the photo must be an
-- https URL, so nothing unexpected is ever stored.

create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text,
  full_name      text check (char_length(full_name) <= 200),
  avatar_url     text check (char_length(avatar_url) <= 2048 and avatar_url ~* '^https://'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- People can read and edit only their own profile.
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Rows are created by the trigger only, so there is no insert policy.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
  photo_url    text;
begin
  display_name := nullif(left(btrim(coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name'
  )), 200), '');
  photo_url := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );
  if photo_url is null or photo_url !~* '^https://' or char_length(photo_url) > 2048 then
    photo_url := null;
  end if;

  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, display_name, photo_url)
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Never block a signup because the profile could not be written.
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

-- The function is for the trigger only, not callable through the public API.
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the profile's email and name in step if they change at sign-in.
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
  photo_url    text;
begin
  display_name := nullif(left(btrim(coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name'
  )), 200), '');
  photo_url := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );
  if photo_url is null or photo_url !~* '^https://' or char_length(photo_url) > 2048 then
    photo_url := null;
  end if;

  -- Also covers accounts whose profile row is missing (for example a signup
  -- that happened before this migration, or one the insert trigger skipped).
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, display_name, photo_url)
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();
  return new;
exception when others then
  raise warning 'handle_user_updated failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke all on function public.handle_user_updated() from public, anon, authenticated;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_user_updated();

-- Fill in anyone who signed up before this migration existed.
insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  nullif(left(btrim(coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name'
  )), 200), ''),
  case
    when coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture') ~* '^https://'
     and char_length(coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')) <= 2048
    then coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
  end
from auth.users u
on conflict (id) do nothing;
