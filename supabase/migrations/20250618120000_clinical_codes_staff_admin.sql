-- Coded allergies/conditions, prescription RxCUI, staff licenses, lab_partner role, admin staff RPCs

alter table public.patients
  add column if not exists allergy_codes jsonb not null default '[]'::jsonb,
  add column if not exists condition_codes jsonb not null default '[]'::jsonb;

alter table public.prescriptions
  add column if not exists med_rxcui text;

alter table public.profiles
  add column if not exists license_number text,
  add column if not exists license_expiry date;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (
  role in (
    'admin',
    'doctor',
    'pharmacist',
    'nutritionist',
    'nurse',
    'staff',
    'accountant',
    'lab_partner'
  )
);

create or replace function public.role_can (module text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r text := public.get_my_role();
begin
  if r is null then return false; end if;
  if r = 'admin' then return true; end if;
  return case module
    when 'patients' then r in ('doctor','nurse','pharmacist','nutritionist','staff','lab_partner')
    when 'appointments' then r in ('doctor','nurse','nutritionist','staff')
    when 'records' then r in ('doctor','nurse','nutritionist')
    when 'prescriptions' then r in ('doctor','pharmacist')
    when 'labs' then r in ('doctor','nurse','nutritionist','lab_partner')
    when 'inventory' then r in ('pharmacist','nurse','accountant')
    when 'billing' then r = 'accountant'
    when 'messaging' then r in ('doctor','pharmacist','nutritionist','nurse','staff')
    when 'reports' then r in ('doctor','pharmacist','accountant')
    when 'settings' then false
    else false
  end;
end;
$$;

drop policy if exists "Admins update all profiles" on public.profiles;
create policy "Admins update all profiles"
  on public.profiles for update to authenticated
  using (public.get_my_role() = 'admin');

create or replace function public.admin_update_staff (
  target_id uuid,
  p_role text,
  p_full_name text,
  p_specialty text default '',
  p_phone text default '',
  p_license_number text default null,
  p_license_expiry date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_my_role() <> 'admin' then
    raise exception 'Not authorized';
  end if;
  update public.profiles
  set
    role = p_role,
    full_name = trim(p_full_name),
    specialty = nullif(trim(coalesce(p_specialty, '')), ''),
    phone = nullif(trim(coalesce(p_phone, '')), ''),
    license_number = nullif(trim(coalesce(p_license_number, '')), ''),
    license_expiry = p_license_expiry,
    updated_at = now()
  where id = target_id;
end;
$$;

create or replace function public.admin_delete_staff (target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_my_role() <> 'admin' then
    raise exception 'Not authorized';
  end if;
  if target_id = auth.uid() then
    raise exception 'Cannot delete your own account';
  end if;
  delete from auth.users where id = target_id;
end;
$$;

grant execute on function public.admin_update_staff (uuid, text, text, text, text, text, date) to authenticated;
grant execute on function public.admin_delete_staff (uuid) to authenticated;
