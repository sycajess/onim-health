-- Track optional Google Calendar sync separately from Meet link
alter table public.appointments
  add column if not exists calendar_event_id text,
  add column if not exists calendar_synced boolean not null default false;

update public.appointments
set calendar_synced = true
where meet_link is not null and meet_link <> '';
