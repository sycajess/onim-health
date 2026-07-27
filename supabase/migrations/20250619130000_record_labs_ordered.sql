-- Labs to be ordered on medical records (between assessment and plan in clinical notes)
alter table public.medical_records
  add column if not exists labs_ordered text;
