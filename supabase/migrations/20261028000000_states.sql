-- Lets the passport cover more than one state. Every existing post office is Karnataka.
-- Add a state by inserting its post offices with the right state_code (see docs/SETUP.md).

alter table public.post_offices
  add column if not exists state_code text not null default 'KA';

comment on column public.post_offices.state_code is
  'Two-letter code of the state or union territory the post office is in, e.g. KA, TN. See src/lib/states.ts.';

create index if not exists post_offices_state_code_idx on public.post_offices (state_code);
