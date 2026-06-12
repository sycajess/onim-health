-- Admins can list all staff profiles (settings page)
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select to authenticated
  using (public.get_my_role() = 'admin');
