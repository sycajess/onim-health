-- Allow every staff role to register new patients
create or replace function public.role_can_patients_write ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() in (
    'admin',
    'doctor',
    'nurse',
    'nutritionist',
    'staff',
    'pharmacist',
    'accountant',
    'lab_partner'
  );
$$;
