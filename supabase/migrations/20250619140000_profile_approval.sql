-- Pending approval for self-signup accounts
alter table public.profiles
  add column if not exists approved boolean not null default false;

-- Existing clinic accounts stay active (only rows still at the column default)
-- New sign-ups insert approved = false via handle_new_user.
update public.profiles set approved = true;

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  initials text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  initials := upper(
    left(split_part(display_name, ' ', 1), 1) ||
    coalesce(nullif(left(split_part(display_name, ' ', 2), 1), ''), left(display_name, 1))
  );

  insert into public.profiles (id, email, full_name, role, avatar_initials, approved)
  values (
    new.id,
    new.email,
    display_name,
    'staff',
    initials,
    false
  );

  return new;
end;
$$;

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
    approved = true,
    updated_at = now()
  where id = target_id;
end;
$$;
