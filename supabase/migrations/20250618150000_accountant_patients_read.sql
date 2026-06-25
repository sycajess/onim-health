-- Accountants need read-only patient access for billing (invoice patient picker, NHIS claims)

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
