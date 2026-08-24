-- Audit trail, admin-only deletes, doctor inventory read, HEFRA clinic settings

-- HEFRA accreditation fields
alter table public.clinic_settings
  add column if not exists hefra_approved boolean not null default true,
  add column if not exists hefra_license_number text not null default '';

-- Audit log (Ghana Data Protection / healthcare access tracking)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  user_name text not null default '',
  user_role text not null default '',
  action text not null,
  entity_type text not null default '',
  entity_id text not null default '',
  patient_id text references public.patients (id) on delete set null,
  details jsonb not null default '{}'::jsonb
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_patient_id_idx on public.audit_log (patient_id);
create index if not exists audit_log_user_id_idx on public.audit_log (user_id);

alter table public.audit_log enable row level security;

create policy "audit_log_insert"
  on public.audit_log for insert to authenticated
  with check (auth.uid() = user_id or user_id is null);

create policy "audit_log_admin_select"
  on public.audit_log for select to authenticated
  using (public.get_my_role() = 'admin');

-- Doctors can read inventory when prescribing (SELECT only)
create or replace function public.role_can_inventory_read ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() in ('admin', 'pharmacist', 'nurse', 'accountant', 'doctor');
$$;

drop policy if exists "inventory_select" on public.inventory;
create policy "inventory_select"
  on public.inventory for select to authenticated
  using (public.role_can_inventory_read());

-- Admin-only delete for clinical entries
create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() = 'admin';
$$;

drop policy if exists "records_write" on public.medical_records;
create policy "records_insert"
  on public.medical_records for insert to authenticated
  with check (public.role_can('records'));
create policy "records_update"
  on public.medical_records for update to authenticated
  using (public.role_can('records') or public.is_admin())
  with check (public.role_can('records') or public.is_admin());
create policy "records_delete"
  on public.medical_records for delete to authenticated
  using (public.is_admin());

drop policy if exists "labs_write" on public.lab_results;
create policy "labs_insert"
  on public.lab_results for insert to authenticated
  with check (public.role_can('labs'));
create policy "labs_update"
  on public.lab_results for update to authenticated
  using (public.role_can('labs') or public.is_admin())
  with check (public.role_can('labs') or public.is_admin());
create policy "labs_delete"
  on public.lab_results for delete to authenticated
  using (public.is_admin());

drop policy if exists "prescriptions_write" on public.prescriptions;
create policy "prescriptions_insert"
  on public.prescriptions for insert to authenticated
  with check (public.role_can_prescriptions_write());
create policy "prescriptions_update"
  on public.prescriptions for update to authenticated
  using (public.role_can_prescriptions_write() or public.is_admin())
  with check (public.role_can_prescriptions_write() or public.is_admin());
create policy "prescriptions_delete"
  on public.prescriptions for delete to authenticated
  using (public.is_admin());

-- RPC: staff append audit events (security definer for reliable insert)
create or replace function public.log_audit_event (
  p_action text,
  p_entity_type text default '',
  p_entity_id text default '',
  p_patient_id text default null,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_profile record;
begin
  select id, full_name, role into v_profile
  from public.profiles
  where id = auth.uid();

  insert into public.audit_log (user_id, user_name, user_role, action, entity_type, entity_id, patient_id, details)
  values (
    auth.uid(),
    coalesce(v_profile.full_name, ''),
    coalesce(v_profile.role, ''),
    p_action,
    coalesce(p_entity_type, ''),
    coalesce(p_entity_id, ''),
    nullif(trim(p_patient_id), ''),
    coalesce(p_details, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.log_audit_event(text, text, text, text, jsonb) to authenticated;
