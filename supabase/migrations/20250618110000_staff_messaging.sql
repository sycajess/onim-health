-- Internal staff 1-on-1 messaging (replaces patient-thread messages)

delete from public.messages;

alter table public.messages
  add column if not exists recipient_id uuid references public.profiles (id);

alter table public.messages
  drop constraint if exists messages_from_role_check;

alter table public.messages
  drop column if exists from_role;

alter table public.messages
  alter column recipient_id set not null;

alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;

create policy "messages_select" on public.messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "messages_insert" on public.messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and public.role_can('messaging')
    and recipient_id is not null
    and recipient_id <> auth.uid()
  );

-- Staff directory for 1-on-1 messaging
drop policy if exists "Messaging users read staff profiles" on public.profiles;
create policy "Messaging users read staff profiles"
  on public.profiles for select to authenticated
  using (public.role_can('messaging'));
