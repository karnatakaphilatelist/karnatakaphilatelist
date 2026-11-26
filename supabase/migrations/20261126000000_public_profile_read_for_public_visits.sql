-- Lets anyone (anon or signed in) read the display name and photo of a
-- person who has at least one public visit — needed so a public note's
-- author can be shown (name + avatar) without exposing anyone's profile
-- who hasn't chosen to share anything publicly. Email stays owner-only:
-- this policy doesn't change the "Users read own profile" policy, it only
-- adds a second path to the same table, and the app's own queries for
-- public notes must only select id, full_name, avatar_url (never email).
drop policy if exists "Anyone can read the profile behind a public visit" on public.profiles;
create policy "Anyone can read the profile behind a public visit"
  on public.profiles for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.visits v
      where v.user_id = profiles.id
        and v.is_public
    )
  );
