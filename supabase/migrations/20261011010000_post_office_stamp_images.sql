-- Official stamp artwork for each post office, shown as its icon in the app.
-- Files live in a public bucket (they are the project's own assets, not user
-- uploads) and are named by post office id, e.g. "123.webp".

alter table public.post_offices
  add column if not exists stamp_image_path text;

comment on column public.post_offices.stamp_image_path is
  'Path inside the public office-stamps storage bucket, e.g. 123.webp. Null until a stamp photo is uploaded.';

insert into storage.buckets (id, name, public)
values ('office-stamps', 'office-stamps', true)
on conflict (id) do nothing;

-- Anyone can view the stamps. Uploads are done by the project owner from the
-- Supabase dashboard (or service role), so no insert/update policy is added.
drop policy if exists "Office stamps are publicly readable" on storage.objects;
create policy "Office stamps are publicly readable"
  on storage.objects for select
  using (bucket_id = 'office-stamps');
