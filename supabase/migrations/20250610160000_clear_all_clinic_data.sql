-- Remove all clinic demo / seeded rows (keeps staff accounts)

delete from public.messages;
delete from public.dispense_log;
delete from public.patients;
delete from public.inventory;
