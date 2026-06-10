-- 3.6 Storage: attachments bucket for PDFs and lab files

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Authenticated users can upload attachments"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'attachments');

create policy "Authenticated users can read attachments"
on storage.objects
for select
to authenticated
using (bucket_id = 'attachments');

create policy "Authenticated users can update own attachments"
on storage.objects
for update
to authenticated
using (bucket_id = 'attachments' and owner = auth.uid ())
with check (bucket_id = 'attachments' and owner = auth.uid ());

create policy "Authenticated users can delete own attachments"
on storage.objects
for delete
to authenticated
using (bucket_id = 'attachments' and owner = auth.uid ());
