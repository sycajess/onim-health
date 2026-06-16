-- Restore full clinic demo data from onim-health-records-v2 HTML prototype

-- Clear prior demo rows (idempotent re-seed)
delete from public.messages where thread_id in ('P001', 'P002', 'P003', 'P004', 'P005');
delete from public.dispense_log where patient_id in ('P001', 'P002', 'P003', 'P004', 'P005')
  or med_id in ('M001', 'M002', 'M003', 'M004', 'M005', 'M006');
delete from public.billing where id in ('B001', 'B002', 'B003');
delete from public.lab_results where id in ('L001', 'L002', 'L003');
delete from public.prescriptions where id in ('RX001', 'RX002', 'RX003');
delete from public.medical_records where id in ('R001', 'R002', 'R003');
delete from public.appointments where id in ('A001', 'A002', 'A003', 'A004', 'A005');
delete from public.inventory where id in ('M001', 'M002', 'M003', 'M004', 'M005', 'M006');
delete from public.patients where id in ('P001', 'P002', 'P003', 'P004', 'P005');

insert into public.patients (
  id, fname, lname, dob, sex, phone, email, address, id_num, nhis, specialty,
  blood, weight, height, allergies, conditions, current_meds, ec_name, ec_rel, ec_phone, status, created
) values
  ('P001', 'Abena', 'Sarpong', '1988-04-15', 'Female', '+233 244 123 456', 'abena@gmail.com', 'Labone, Accra', 'GHA-123456789-0', 'NHIS-88221', 'Weight Loss', 'O+', 92, 165, 'None', 'Hypertension', 'Amlodipine 5mg', 'Kofi Sarpong', 'Husband', '+233 244 987 654', 'Active', current_date - 30),
  ('P002', 'Laryea', 'Tetteh', '1975-11-22', 'Male', '+233 277 555 001', 'laryea@gmail.com', 'Tema, Greater Accra', 'GHA-987654321-1', 'NHIS-75443', 'Sexual Health', 'A+', 78, 178, 'Penicillin', 'Diabetes Type 2', 'Metformin 500mg', 'Mrs Tetteh', 'Wife', '+233 277 555 002', 'Active', current_date - 45),
  ('P003', 'Akosua', 'Owusu', '1995-07-08', 'Female', '+233 200 333 777', 'akosua@yahoo.com', 'East Legon, Accra', 'GHA-111222333-2', 'NHIS-95001', 'Fertility', 'B+', 64, 162, 'Sulfa drugs', 'PCOS', 'None', 'Kwame Owusu', 'Father', '+233 200 333 888', 'Active', current_date - 20),
  ('P004', 'Kweku', 'Mensah', '1982-03-30', 'Male', '+233 233 445 566', 'kweku@gmail.com', 'Adabraka, Accra', 'GHA-444555666-3', '', 'Mental Health', 'AB+', 80, 175, 'None', 'Anxiety, Depression', 'Sertraline 50mg', 'Ama Mensah', 'Sister', '+233 233 445 567', 'Active', current_date - 60),
  ('P005', 'Esi', 'Asante', '2000-12-01', 'Female', '+233 266 778 899', 'esi@gmail.com', 'Dansoman, Accra', 'GHA-777888999-4', 'NHIS-2000X', 'Skin', 'O-', 58, 158, 'None', 'Acne Vulgaris', 'None', 'Mrs Asante', 'Mother', '+233 266 778 000', 'Active', current_date - 10);

insert into public.appointments (id, patient_id, date, time, type, specialty, provider, notes, status, meet_link) values
  ('A001', 'P001', current_date, '09:00 AM', 'Follow-up', 'Weight Loss', 'Dr. Admin', 'Check weight progress on semaglutide', 'Confirmed', 'https://meet.google.com/aab-cdef-ghi'),
  ('A002', 'P002', current_date, '10:30 AM', 'Consultation', 'Sexual Health', 'Dr. Admin', 'ED evaluation', 'Confirmed', 'https://meet.google.com/bcd-efgh-ijk'),
  ('A003', 'P003', current_date, '02:00 PM', 'Review', 'Fertility', 'Dr. Admin', 'Hormone panel review', 'Pending', 'https://meet.google.com/cde-fghi-jkl'),
  ('A004', 'P004', current_date + 2, '11:00 AM', 'Follow-up', 'Mental Health', 'Dr. Admin', 'Monthly mental health check-in', 'Scheduled', 'https://meet.google.com/def-ghij-klm'),
  ('A005', 'P005', current_date + 3, '03:30 PM', 'Consultation', 'Skin', 'Dr. Admin', 'Skin treatment review', 'Scheduled', 'https://meet.google.com/efg-hijk-lmn');

insert into public.medical_records (id, patient_id, date, type, specialty, complaint, exam, assessment, plan, bp, temp, weight, provider) values
  ('R001', 'P001', current_date - 14, 'Consultation Note', 'Weight Loss', 'Weight loss support, starting GLP-1', 'BMI 33.8. BP 130/82. Abdomen soft. No lymphadenopathy.', 'Obesity (BMI >30) with hypertension. Candidate for semaglutide.', 'Start Ozempic 0.25mg/week. Dietary counselling. Follow up in 4 weeks.', '130/82', '36.6°C', 92, 'Dr. Admin'),
  ('R002', 'P002', current_date - 20, 'Consultation Note', 'Sexual Health', 'Erectile dysfunction x 6 months', 'Normal genitalia. No obvious structural abnormality.', 'Erectile dysfunction, likely vasculogenic. Diabetes-related component possible.', 'Sildenafil 50mg PRN. Lifestyle modification. Glucose control optimization.', '128/80', '36.4°C', 78, 'Dr. Admin'),
  ('R003', 'P003', current_date - 8, 'Progress Note', 'Fertility', 'Irregular cycles, trying to conceive', 'USG – polycystic ovaries. Hormone panel ordered.', 'PCOS. Sub-fertility.', 'Clomiphene 50mg cycle days 2-6. Repeat USG in 2 weeks.', '115/75', '36.5°C', 64, 'Dr. Admin');

insert into public.prescriptions (id, patient_id, medication, med_id, dosage, frequency, duration, refills, date, provider, notes, status, qty_dispensed) values
  ('RX001', 'P001', 'Ozempic (Semaglutide)', 'M001', '0.25mg', 'Once weekly', '3 months', 2, current_date - 14, 'Dr. Admin', 'Inject subcutaneously. Increase dose after 4 weeks if tolerated.', 'Active', 1),
  ('RX002', 'P002', 'Sildenafil 50mg', 'M002', '50mg', 'As needed (PRN)', 'Ongoing', 3, current_date - 20, 'Dr. Admin', 'Take 30-60 min before activity. Not with nitrates.', 'Active', 4),
  ('RX003', 'P004', 'Sertraline 50mg', 'M003', '50mg', 'Once daily', '6 months', 5, current_date - 60, 'Dr. Admin', 'Take in morning. Do not abruptly stop.', 'Active', 30);

insert into public.lab_results (id, patient_id, test, date, facility, result, ref, status, provider, notes) values
  ('L001', 'P001', 'HbA1c', current_date - 14, 'Korle-Bu Labs', '5.8%', '4.0–5.6%', 'Abnormal – High', 'Dr. Admin', 'Slightly elevated. Monitor diet and repeat in 3 months.'),
  ('L002', 'P002', 'Fasting Blood Glucose', current_date - 20, 'Trust Hospital Lab', '7.2 mmol/L', '3.9–5.5 mmol/L', 'Abnormal – High', 'Dr. Admin', 'Consistent with poorly controlled T2DM.'),
  ('L003', 'P003', 'FSH', current_date - 8, 'Korle-Bu Labs', '6.1 IU/L', '3.1–17.7 IU/L', 'Normal', 'Dr. Admin', 'Normal FSH. LH and AMH pending.');

insert into public.inventory (id, name, generic, category, form, strength, supplier, lot, expiry, qty, threshold, cost, storage) values
  ('M001', 'Ozempic (Semaglutide)', 'Semaglutide', 'Weight Loss', 'Injection', '1mg/mL', 'Novo Nordisk GH', 'LOT-2024-OZ01', current_date + 240, 24, 5, 850, 'Refrigerate 2–8°C'),
  ('M002', 'Sildenafil 50mg', 'Sildenafil Citrate', 'Sexual Health', 'Tablet', '50mg', 'Pharma Plus GH', 'LOT-2024-SIL02', current_date + 380, 120, 20, 12, 'Room temperature'),
  ('M003', 'Sertraline 50mg', 'Sertraline HCl', 'Mental Health', 'Tablet', '50mg', 'MedSource Africa', 'LOT-2024-SER03', current_date + 420, 90, 15, 8, 'Room temperature'),
  ('M004', 'Clomiphene 50mg', 'Clomiphene Citrate', 'Fertility', 'Tablet', '50mg', 'Pharma Plus GH', 'LOT-2024-CLO04', current_date + 310, 4, 10, 25, 'Room temperature'),
  ('M005', 'Minoxidil 5% Solution', 'Minoxidil', 'Hair', 'Cream / Topical', '5%', 'DermCare GH', 'LOT-2024-MIN05', current_date + 180, 8, 5, 95, 'Room temperature'),
  ('M006', 'Tretinoin 0.025% Cream', 'Tretinoin', 'Skin', 'Cream / Topical', '0.025%', 'DermCare GH', 'LOT-2024-TRE06', current_date + 16, 15, 5, 60, 'Cool, dry place');

insert into public.dispense_log (date, med_id, med_name, patient_id, patient_name, qty, lot, provider) values
  (current_date - 14, 'M001', 'Ozempic (Semaglutide)', 'P001', 'Abena Sarpong', 1, 'LOT-2024-OZ01', 'Dr. Admin'),
  (current_date - 20, 'M002', 'Sildenafil 50mg', 'P002', 'Laryea Tetteh', 4, 'LOT-2024-SIL02', 'Dr. Admin');

insert into public.billing (id, patient_id, date, services, amount, status, notes) values
  ('B001', 'P001', current_date - 14, E'Consultation (Weight Loss) – GHS 200\nOzempic injection (1 vial) – GHS 850', 1050, 'Paid – MoMo', ''),
  ('B002', 'P002', current_date - 20, E'Consultation (Sexual Health) – GHS 200\nSildenafil 50mg x4 – GHS 48', 248, 'Paid – Cash', ''),
  ('B003', 'P003', current_date - 8, E'Consultation (Fertility) – GHS 250\nLab tests – GHS 180', 430, 'Pending', '');

insert into public.messages (thread_id, from_role, body, created_at) values
  ('P001', 'provider', 'Hello Abena! How are you feeling on the Ozempic?', (current_date + time '10:02') at time zone 'UTC'),
  ('P001', 'patient', 'Much better! I have reduced appetite and have lost 3kg already.', (current_date + time '10:15') at time zone 'UTC'),
  ('P001', 'provider', 'Excellent! Keep it up. Any nausea or side effects?', (current_date + time '10:18') at time zone 'UTC'),
  ('P002', 'provider', 'Laryea, please remember to avoid alcohol with the sildenafil.', (current_date - 1 + time '09:00') at time zone 'UTC'),
  ('P002', 'patient', 'Understood, doctor. Thank you.', (current_date - 1 + time '09:30') at time zone 'UTC'),
  ('P004', 'patient', 'Dr, I am feeling much better this week. Sleep has improved.', (current_date - 2 + time '14:00') at time zone 'UTC'),
  ('P004', 'provider', 'That is great to hear Kweku! Let us keep your next appointment as scheduled.', (current_date - 2 + time '14:20') at time zone 'UTC');
