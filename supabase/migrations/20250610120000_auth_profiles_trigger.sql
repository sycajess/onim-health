-- 3.5 Auth: email/password signups get a profiles row (role assigned by admin/seed)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'staff' check (
    role in (
      'admin',
      'doctor',
      'pharmacist',
      'nutritionist',
      'nurse',
      'staff',
      'accountant'
    )
  ),
  specialty text,
  phone text,
  avatar_initials text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

  insert into public.profiles (id, email, full_name, role, avatar_initials)
  values (
    new.id,
    new.email,
    display_name,
    'staff',
    initials
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user ();
