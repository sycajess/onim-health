-- Run migrations first, then: npm run seed:users (with service role key)
-- Or create users in Supabase Auth dashboard, then run the role updates below.

-- Test accounts (password: Test1234!)
-- admin@onimhealth.com, doctor@onimhealth.com, nurse@onimhealth.com,
-- pharmacist@onimhealth.com, nutritionist@onimhealth.com, staff@onimhealth.com,
-- accountant@onimhealth.com

update public.profiles set role = 'admin', full_name = 'Dr. Admin', specialty = 'General / Internal Medicine', phone = '+233 55 714 5452', avatar_initials = 'DA' where email = 'admin@onimhealth.com';
update public.profiles set role = 'doctor', full_name = 'Dr. Kofi Mensah', specialty = 'General Medicine', avatar_initials = 'KM' where email = 'doctor@onimhealth.com';
update public.profiles set role = 'nurse', full_name = 'Nurse Grace', specialty = 'All', avatar_initials = 'NG' where email = 'nurse@onimhealth.com';
update public.profiles set role = 'pharmacist', full_name = 'Kofi Pharmacy', specialty = 'Pharmacy', avatar_initials = 'KP' where email = 'pharmacist@onimhealth.com';
update public.profiles set role = 'nutritionist', full_name = 'Ama Nutrition', specialty = 'Weight Loss / Nutrition', avatar_initials = 'AN' where email = 'nutritionist@onimhealth.com';
update public.profiles set role = 'staff', full_name = 'Abena Mensah', specialty = 'Administration', avatar_initials = 'AM' where email = 'staff@onimhealth.com';
update public.profiles set role = 'accountant', full_name = 'Esi Finance', specialty = 'Finance', avatar_initials = 'EF' where email = 'accountant@onimhealth.com';
