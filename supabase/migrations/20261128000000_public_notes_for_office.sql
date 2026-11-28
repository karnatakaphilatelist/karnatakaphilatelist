-- Public notes for one office, readable by anyone (signed in or not).
-- A function instead of a profiles read policy: RLS cannot hide columns, so a policy
-- would let anyone with the public key read the email of every note author.
-- This returns only what the Public tab shows: note, date, photo path, display name, avatar.
create or replace function public.public_notes_for_office(p_office_id bigint)
returns table (
  user_id uuid,
  visited_at date,
  note text,
  photo_path text,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select v.user_id, v.visited_at, v.note, v.photo_path, p.full_name, p.avatar_url
  from public.visits v
  left join public.profiles p on p.id = v.user_id
  where v.post_office_id = p_office_id
    and v.is_public
    and v.note is not null
    and btrim(v.note) <> ''
  order by v.visited_at desc, v.created_at desc
  limit 100;
$$;

revoke all on function public.public_notes_for_office(bigint) from public;
grant execute on function public.public_notes_for_office(bigint) to anon, authenticated;
