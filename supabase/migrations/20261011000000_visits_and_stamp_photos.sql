-- Visits and stamp photos for the Karnataka Philatelic Passport.
--
-- Assumes the existing public.post_offices table has a numeric primary key `id`
-- (integer or bigint). Apply this file in the Supabase SQL editor, or with
-- `supabase db push` if you use the Supabase CLI.

-- ---------------------------------------------------------------------------
-- visits: one row per user per post office they have stamped
-- ---------------------------------------------------------------------------
create table if not exists public.visits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,
  post_office_id bigint not null
                   references public.post_offices (id) on delete cascade,
  visited_at     date not null default current_date,
  note           text not null default '' check (char_length(note) <= 1000),
  -- Path inside the private `stamp-photos` bucket, e.g. "<user id>/<office id>-<timestamp>.jpg"
  photo_path     text,
  is_public      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, post_office_id)
);

create index if not exists visits_user_id_idx on public.visits (user_id);
create index if not exists visits_post_office_id_idx on public.visits (post_office_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists visits_set_updated_at on public.visits;
create trigger visits_set_updated_at
  before update on public.visits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security: users manage their own visits; public visits are readable
-- ---------------------------------------------------------------------------
alter table public.visits enable row level security;

drop policy if exists "Users read own or public visits" on public.visits;
create policy "Users read own or public visits"
  on public.visits for select
  using (auth.uid() = user_id or is_public);

drop policy if exists "Users insert own visits" on public.visits;
create policy "Users insert own visits"
  on public.visits for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own visits" on public.visits;
create policy "Users update own visits"
  on public.visits for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own visits" on public.visits;
create policy "Users delete own visits"
  on public.visits for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket for passport stamp photos, one folder per user
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('stamp-photos', 'stamp-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "Users read own stamp photos" on storage.objects;
create policy "Users read own stamp photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'stamp-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users upload own stamp photos" on storage.objects;
create policy "Users upload own stamp photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'stamp-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own stamp photos" on storage.objects;
create policy "Users delete own stamp photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'stamp-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
