-- Allow staff with patients access to delete patient records

create policy "patients_delete"
  on public.patients for delete to authenticated
  using (public.role_can('patients'));
