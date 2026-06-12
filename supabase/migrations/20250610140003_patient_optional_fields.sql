-- Allow new patients without placeholder demographics until captured later

alter table public.patients alter column dob drop not null;
alter table public.patients alter column sex drop not null;
