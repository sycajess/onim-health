-- Fine-grained patient write/delete and inventory write policies

create or replace function public.role_can_patients_write ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() in ('admin', 'doctor', 'nurse', 'nutritionist', 'staff');
$$;

create or replace function public.role_can_inventory_manage ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() in ('admin', 'pharmacist');
$$;

drop policy if exists "patients_insert" on public.patients;
create policy "patients_insert"
  on public.patients for insert to authenticated
  with check (public.role_can_patients_write());

drop policy if exists "patients_update" on public.patients;
create policy "patients_update"
  on public.patients for update to authenticated
  using (public.role_can_patients_write());

drop policy if exists "patients_delete" on public.patients;
create policy "patients_delete"
  on public.patients for delete to authenticated
  using (public.get_my_role() = 'admin');

drop policy if exists "inventory_write" on public.inventory;
create policy "inventory_write"
  on public.inventory for all to authenticated
  using (public.role_can_inventory_manage())
  with check (public.role_can_inventory_manage());
