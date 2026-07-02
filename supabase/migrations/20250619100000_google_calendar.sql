-- Google Calendar / Meet per staff user (tokens only used server-side via service role)

alter table public.profiles
  add column if not exists google_refresh_token text,
  add column if not exists google_access_token text,
  add column if not exists google_token_expiry timestamptz,
  add column if not exists google_calendar_email text,
  add column if not exists google_calendar_connected boolean not null default false;
