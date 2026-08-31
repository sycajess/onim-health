-- Soft-archive inventory lots so used lot numbers stay for reference
alter table public.inventory
  add column if not exists archived boolean not null default false;

create index if not exists inventory_archived_idx on public.inventory (archived);
