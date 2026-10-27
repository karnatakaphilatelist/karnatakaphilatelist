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

-- Files in a public bucket are served by their public URL without any policy.
-- A select policy would only add the ability to LIST every file through the API,
-- so none is created (and an earlier one is removed). Uploads are done by the
-- project owner from the Supabase dashboard (or service role).
drop policy if exists "Office stamps are publicly readable" on storage.objects;
