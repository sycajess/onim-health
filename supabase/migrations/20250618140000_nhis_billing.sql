-- NHIS e-claims billing fields

alter table public.billing
  add column if not exists payment_tier text not null default 'cash'
    check (payment_tier in ('cash', 'private_insurance', 'nhis')),
  add column if not exists primary_icd10 text,
  add column if not exists primary_icd10_name text,
  add column if not exists nhis_cleared boolean not null default false,
  add column if not exists nhis_exported_at timestamptz;

create table if not exists public.clinic_settings (
  id text primary key default 'default',
  provider_accreditation text not null default '',
  eclaim_authorization text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.clinic_settings (id) values ('default') on conflict (id) do nothing;

alter table public.clinic_settings enable row level security;

drop policy if exists "Admins manage clinic settings" on public.clinic_settings;
create policy "Admins manage clinic settings"
  on public.clinic_settings for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

drop policy if exists "Staff read clinic settings" on public.clinic_settings;
create policy "Staff read clinic settings"
  on public.clinic_settings for select to authenticated
  using (public.role_can('billing') or public.get_my_role() = 'admin');
