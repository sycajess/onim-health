alter table public.patients
  add column if not exists gdrg_codes jsonb not null default '[]'::jsonb;
