-- Role access updates:
-- pharmacist: records, labs, billing
-- nurse: prescriptions (view)
-- lab_partner: labs write/upload already covered; keep labs access

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
    when 'patients' then r in ('doctor','nurse','pharmacist','nutritionist','staff','lab_partner','accountant')
    when 'appointments' then r in ('doctor','nurse','nutritionist','staff')
    when 'records' then r in ('doctor','nurse','nutritionist','pharmacist')
    when 'prescriptions' then r in ('doctor','pharmacist','nurse')
    when 'labs' then r in ('doctor','nurse','nutritionist','lab_partner','pharmacist')
    when 'inventory' then r in ('pharmacist','nurse','accountant')
    when 'billing' then r in ('accountant','pharmacist')
    when 'messaging' then r in ('doctor','pharmacist','nutritionist','nurse','staff')
    when 'reports' then r in ('doctor','pharmacist','accountant')
    when 'settings' then false
    else false
  end;
end;
$$;

-- Nurses can read prescriptions but not create/update them
create or replace function public.role_can_prescriptions_write ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() in ('admin', 'doctor', 'pharmacist');
$$;

drop policy if exists "prescriptions_write" on public.prescriptions;
create policy "prescriptions_write"
  on public.prescriptions for all to authenticated
  using (public.role_can_prescriptions_write())
  with check (public.role_can_prescriptions_write());
