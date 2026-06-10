-- Full schema + RLS (profiles created in auth migration)

create or replace function public.get_my_role ()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

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
    when 'patients' then r in ('doctor','nurse','pharmacist','nutritionist','staff')
    when 'appointments' then r in ('doctor','nurse','nutritionist','staff')
    when 'records' then r in ('doctor','nurse','nutritionist')
    when 'prescriptions' then r in ('doctor','pharmacist')
    when 'labs' then r in ('doctor','nurse','nutritionist')
    when 'inventory' then r in ('pharmacist','nurse','accountant')
    when 'billing' then r = 'accountant'
    when 'messaging' then r in ('doctor','pharmacist','nutritionist','nurse','staff')
    when 'reports' then r in ('doctor','pharmacist','accountant')
    when 'settings' then false
    else false
  end;
end;
$$;

-- patients
create table if not exists public.patients (
  id text primary key,
  fname text not null,
  lname text not null,
  dob date not null,
  sex text not null,
  phone text,
  email text,
  address text,
  id_num text,
  nhis text,
  specialty text not null,
  blood text,
  weight numeric,
  height numeric,
  allergies text,
  conditions text,
  current_meds text,
  ec_name text,
  ec_rel text,
  ec_phone text,
  status text not null default 'Active',
  created date not null default current_date
);

-- appointments
create table if not exists public.appointments (
  id text primary key,
  patient_id text not null references public.patients (id) on delete cascade,
  date date not null,
  time text not null,
  type text not null,
  specialty text,
  provider text,
  notes text,
  status text not null,
  meet_link text
);

-- medical_records
create table if not exists public.medical_records (
  id text primary key,
  patient_id text not null references public.patients (id) on delete cascade,
  date date not null,
  type text not null,
  specialty text,
  complaint text,
  exam text,
  assessment text,
  plan text,
  bp text,
  temp text,
  weight numeric,
  provider text
);

-- prescriptions
create table if not exists public.prescriptions (
  id text primary key,
  patient_id text not null references public.patients (id) on delete cascade,
  medication text not null,
  med_id text,
  dosage text,
  frequency text,
  duration text,
  refills int,
  date date not null,
  provider text,
  notes text,
  status text not null,
  qty_dispensed int default 0
);

-- lab_results
create table if not exists public.lab_results (
  id text primary key,
  patient_id text not null references public.patients (id) on delete cascade,
  test text not null,
  date date not null,
  facility text,
  result text,
  ref text,
  status text,
  provider text,
  notes text,
  attachment_path text
);

-- inventory
create table if not exists public.inventory (
  id text primary key,
  name text not null,
  generic text,
  category text,
  form text,
  strength text,
  supplier text,
  lot text,
  expiry date,
  qty int not null default 0,
  threshold int not null default 0,
  cost numeric,
  storage text
);

-- dispense_log
create table if not exists public.dispense_log (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  med_id text references public.inventory (id),
  med_name text not null,
  patient_id text references public.patients (id),
  patient_name text,
  qty int not null,
  lot text,
  provider text
);

-- billing
create table if not exists public.billing (
  id text primary key,
  patient_id text not null references public.patients (id) on delete cascade,
  date date not null,
  services text,
  amount numeric not null,
  status text not null,
  notes text
);

-- messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null,
  sender_id uuid references public.profiles (id),
  from_role text not null check (from_role in ('provider', 'patient')),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.medical_records enable row level security;
alter table public.prescriptions enable row level security;
alter table public.lab_results enable row level security;
alter table public.inventory enable row level security;
alter table public.dispense_log enable row level security;
alter table public.billing enable row level security;
alter table public.messages enable row level security;

-- profiles RLS
alter table public.profiles enable row level security;

create policy "Users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Users update own profile" on public.profiles for update to authenticated using (id = auth.uid());

create policy "patients_select" on public.patients for select to authenticated using (public.role_can('patients'));
create policy "patients_insert" on public.patients for insert to authenticated with check (public.role_can('patients'));
create policy "patients_update" on public.patients for update to authenticated using (public.role_can('patients'));

create policy "appointments_select" on public.appointments for select to authenticated using (public.role_can('appointments'));
create policy "appointments_write" on public.appointments for all to authenticated using (public.role_can('appointments'));

create policy "records_select" on public.medical_records for select to authenticated using (public.role_can('records'));
create policy "records_write" on public.medical_records for all to authenticated using (public.role_can('records'));

create policy "prescriptions_select" on public.prescriptions for select to authenticated using (public.role_can('prescriptions'));
create policy "prescriptions_write" on public.prescriptions for all to authenticated using (public.role_can('prescriptions'));

create policy "labs_select" on public.lab_results for select to authenticated using (public.role_can('labs'));
create policy "labs_write" on public.lab_results for all to authenticated using (public.role_can('labs'));

create policy "inventory_select" on public.inventory for select to authenticated using (public.role_can('inventory'));
create policy "inventory_write" on public.inventory for all to authenticated using (public.role_can('inventory'));

create policy "dispense_select" on public.dispense_log for select to authenticated using (public.role_can('inventory'));
create policy "dispense_write" on public.dispense_log for insert to authenticated with check (public.role_can('inventory'));

create policy "billing_select" on public.billing for select to authenticated using (public.role_can('billing') or public.role_can('patients'));
create policy "billing_write" on public.billing for all to authenticated using (public.role_can('billing'));

create policy "messages_select" on public.messages for select to authenticated using (public.role_can('messaging'));
create policy "messages_insert" on public.messages for insert to authenticated with check (public.role_can('messaging'));
