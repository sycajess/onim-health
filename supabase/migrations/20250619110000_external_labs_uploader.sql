-- External lab uploads: lab/hospital name + uploader contact on lab_results
alter table public.lab_results
  add column if not exists uploader_name text,
  add column if not exists uploader_contact text;
