/**
 * Seed clinic demo data from HTML prototype
 * Usage: npm run seed:clinic-data
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', 'apps/web/.env.development')

function loadEnv() {
  const env = {}
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.development')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

function d(offset) {
  const x = new Date()
  x.setDate(x.getDate() + offset)
  return x.toISOString().slice(0, 10)
}

const today = d(0)
const patientIds = ['P001', 'P002', 'P003', 'P004', 'P005']

await supabase.from('messages').delete().in('thread_id', patientIds)
await supabase.from('dispense_log').delete().in('patient_id', patientIds)
await supabase.from('billing').delete().in('id', ['B001', 'B002', 'B003'])
await supabase.from('lab_results').delete().in('id', ['L001', 'L002', 'L003'])
await supabase.from('prescriptions').delete().in('id', ['RX001', 'RX002', 'RX003'])
await supabase.from('medical_records').delete().in('id', ['R001', 'R002', 'R003'])
await supabase.from('appointments').delete().in('id', ['A001', 'A002', 'A003', 'A004', 'A005'])
await supabase.from('inventory').delete().in('id', ['M001', 'M002', 'M003', 'M004', 'M005', 'M006'])
await supabase.from('patients').delete().in('id', patientIds)

const { error: pErr } = await supabase.from('patients').insert([
  { id: 'P001', fname: 'Abena', lname: 'Sarpong', dob: '1988-04-15', sex: 'Female', phone: '+233 244 123 456', email: 'abena@gmail.com', address: 'Labone, Accra', id_num: 'GHA-123456789-0', nhis: 'NHIS-88221', specialty: 'Weight Loss', blood: 'O+', weight: 92, height: 165, allergies: 'None', conditions: 'Hypertension', current_meds: 'Amlodipine 5mg', ec_name: 'Kofi Sarpong', ec_rel: 'Husband', ec_phone: '+233 244 987 654', status: 'Active', created: d(-30) },
  { id: 'P002', fname: 'Laryea', lname: 'Tetteh', dob: '1975-11-22', sex: 'Male', phone: '+233 277 555 001', email: 'laryea@gmail.com', address: 'Tema, Greater Accra', id_num: 'GHA-987654321-1', nhis: 'NHIS-75443', specialty: 'Sexual Health', blood: 'A+', weight: 78, height: 178, allergies: 'Penicillin', conditions: 'Diabetes Type 2', current_meds: 'Metformin 500mg', ec_name: 'Mrs Tetteh', ec_rel: 'Wife', ec_phone: '+233 277 555 002', status: 'Active', created: d(-45) },
  { id: 'P003', fname: 'Akosua', lname: 'Owusu', dob: '1995-07-08', sex: 'Female', phone: '+233 200 333 777', email: 'akosua@yahoo.com', address: 'East Legon, Accra', id_num: 'GHA-111222333-2', nhis: 'NHIS-95001', specialty: 'Fertility', blood: 'B+', weight: 64, height: 162, allergies: 'Sulfa drugs', conditions: 'PCOS', current_meds: 'None', ec_name: 'Kwame Owusu', ec_rel: 'Father', ec_phone: '+233 200 333 888', status: 'Active', created: d(-20) },
  { id: 'P004', fname: 'Kweku', lname: 'Mensah', dob: '1982-03-30', sex: 'Male', phone: '+233 233 445 566', email: 'kweku@gmail.com', address: 'Adabraka, Accra', id_num: 'GHA-444555666-3', nhis: '', specialty: 'Mental Health', blood: 'AB+', weight: 80, height: 175, allergies: 'None', conditions: 'Anxiety, Depression', current_meds: 'Sertraline 50mg', ec_name: 'Ama Mensah', ec_rel: 'Sister', ec_phone: '+233 233 445 567', status: 'Active', created: d(-60) },
  { id: 'P005', fname: 'Esi', lname: 'Asante', dob: '2000-12-01', sex: 'Female', phone: '+233 266 778 899', email: 'esi@gmail.com', address: 'Dansoman, Accra', id_num: 'GHA-777888999-4', nhis: 'NHIS-2000X', specialty: 'Skin', blood: 'O-', weight: 58, height: 158, allergies: 'None', conditions: 'Acne Vulgaris', current_meds: 'None', ec_name: 'Mrs Asante', ec_rel: 'Mother', ec_phone: '+233 266 778 000', status: 'Active', created: d(-10) },
])
if (pErr) { console.error('patients:', pErr.message); process.exit(1) }

const batches = [
  ['appointments', [
    { id: 'A001', patient_id: 'P001', date: today, time: '09:00 AM', type: 'Follow-up', specialty: 'Weight Loss', provider: 'Dr. Admin', notes: 'Check weight progress on semaglutide', status: 'Confirmed', meet_link: 'https://meet.google.com/aab-cdef-ghi' },
    { id: 'A002', patient_id: 'P002', date: today, time: '10:30 AM', type: 'Consultation', specialty: 'Sexual Health', provider: 'Dr. Admin', notes: 'ED evaluation', status: 'Confirmed', meet_link: 'https://meet.google.com/bcd-efgh-ijk' },
    { id: 'A003', patient_id: 'P003', date: today, time: '02:00 PM', type: 'Review', specialty: 'Fertility', provider: 'Dr. Admin', notes: 'Hormone panel review', status: 'Pending', meet_link: 'https://meet.google.com/cde-fghi-jkl' },
    { id: 'A004', patient_id: 'P004', date: d(2), time: '11:00 AM', type: 'Follow-up', specialty: 'Mental Health', provider: 'Dr. Admin', notes: 'Monthly mental health check-in', status: 'Scheduled', meet_link: 'https://meet.google.com/def-ghij-klm' },
    { id: 'A005', patient_id: 'P005', date: d(3), time: '03:30 PM', type: 'Consultation', specialty: 'Skin', provider: 'Dr. Admin', notes: 'Skin treatment review', status: 'Scheduled', meet_link: 'https://meet.google.com/efg-hijk-lmn' },
  ]],
  ['medical_records', [
    { id: 'R001', patient_id: 'P001', date: d(-14), type: 'Consultation Note', specialty: 'Weight Loss', complaint: 'Weight loss support, starting GLP-1', exam: 'BMI 33.8. BP 130/82. Abdomen soft. No lymphadenopathy.', assessment: 'Obesity (BMI >30) with hypertension. Candidate for semaglutide.', plan: 'Start Ozempic 0.25mg/week. Dietary counselling. Follow up in 4 weeks.', bp: '130/82', temp: '36.6°C', weight: 92, provider: 'Dr. Admin' },
    { id: 'R002', patient_id: 'P002', date: d(-20), type: 'Consultation Note', specialty: 'Sexual Health', complaint: 'Erectile dysfunction x 6 months', exam: 'Normal genitalia. No obvious structural abnormality.', assessment: 'Erectile dysfunction, likely vasculogenic. Diabetes-related component possible.', plan: 'Sildenafil 50mg PRN. Lifestyle modification. Glucose control optimization.', bp: '128/80', temp: '36.4°C', weight: 78, provider: 'Dr. Admin' },
    { id: 'R003', patient_id: 'P003', date: d(-8), type: 'Progress Note', specialty: 'Fertility', complaint: 'Irregular cycles, trying to conceive', exam: 'USG – polycystic ovaries. Hormone panel ordered.', assessment: 'PCOS. Sub-fertility.', plan: 'Clomiphene 50mg cycle days 2-6. Repeat USG in 2 weeks.', bp: '115/75', temp: '36.5°C', weight: 64, provider: 'Dr. Admin' },
  ]],
  ['prescriptions', [
    { id: 'RX001', patient_id: 'P001', medication: 'Ozempic (Semaglutide)', med_id: 'M001', dosage: '0.25mg', frequency: 'Once weekly', duration: '3 months', refills: 2, date: d(-14), provider: 'Dr. Admin', notes: 'Inject subcutaneously. Increase dose after 4 weeks if tolerated.', status: 'Active', qty_dispensed: 1 },
    { id: 'RX002', patient_id: 'P002', medication: 'Sildenafil 50mg', med_id: 'M002', dosage: '50mg', frequency: 'As needed (PRN)', duration: 'Ongoing', refills: 3, date: d(-20), provider: 'Dr. Admin', notes: 'Take 30-60 min before activity. Not with nitrates.', status: 'Active', qty_dispensed: 4 },
    { id: 'RX003', patient_id: 'P004', medication: 'Sertraline 50mg', med_id: 'M003', dosage: '50mg', frequency: 'Once daily', duration: '6 months', refills: 5, date: d(-60), provider: 'Dr. Admin', notes: 'Take in morning. Do not abruptly stop.', status: 'Active', qty_dispensed: 30 },
  ]],
  ['lab_results', [
    { id: 'L001', patient_id: 'P001', test: 'HbA1c', date: d(-14), facility: 'Korle-Bu Labs', result: '5.8%', ref: '4.0–5.6%', status: 'Abnormal – High', provider: 'Dr. Admin', notes: 'Slightly elevated. Monitor diet and repeat in 3 months.' },
    { id: 'L002', patient_id: 'P002', test: 'Fasting Blood Glucose', date: d(-20), facility: 'Trust Hospital Lab', result: '7.2 mmol/L', ref: '3.9–5.5 mmol/L', status: 'Abnormal – High', provider: 'Dr. Admin', notes: 'Consistent with poorly controlled T2DM.' },
    { id: 'L003', patient_id: 'P003', test: 'FSH', date: d(-8), facility: 'Korle-Bu Labs', result: '6.1 IU/L', ref: '3.1–17.7 IU/L', status: 'Normal', provider: 'Dr. Admin', notes: 'Normal FSH. LH and AMH pending.' },
  ]],
  ['inventory', [
    { id: 'M001', name: 'Ozempic (Semaglutide)', generic: 'Semaglutide', category: 'Weight Loss', form: 'Injection', strength: '1mg/mL', supplier: 'Novo Nordisk GH', lot: 'LOT-2024-OZ01', expiry: d(240), qty: 24, threshold: 5, cost: 850, storage: 'Refrigerate 2–8°C' },
    { id: 'M002', name: 'Sildenafil 50mg', generic: 'Sildenafil Citrate', category: 'Sexual Health', form: 'Tablet', strength: '50mg', supplier: 'Pharma Plus GH', lot: 'LOT-2024-SIL02', expiry: d(380), qty: 120, threshold: 20, cost: 12, storage: 'Room temperature' },
    { id: 'M003', name: 'Sertraline 50mg', generic: 'Sertraline HCl', category: 'Mental Health', form: 'Tablet', strength: '50mg', supplier: 'MedSource Africa', lot: 'LOT-2024-SER03', expiry: d(420), qty: 90, threshold: 15, cost: 8, storage: 'Room temperature' },
    { id: 'M004', name: 'Clomiphene 50mg', generic: 'Clomiphene Citrate', category: 'Fertility', form: 'Tablet', strength: '50mg', supplier: 'Pharma Plus GH', lot: 'LOT-2024-CLO04', expiry: d(310), qty: 4, threshold: 10, cost: 25, storage: 'Room temperature' },
    { id: 'M005', name: 'Minoxidil 5% Solution', generic: 'Minoxidil', category: 'Hair', form: 'Cream / Topical', strength: '5%', supplier: 'DermCare GH', lot: 'LOT-2024-MIN05', expiry: d(180), qty: 8, threshold: 5, cost: 95, storage: 'Room temperature' },
    { id: 'M006', name: 'Tretinoin 0.025% Cream', generic: 'Tretinoin', category: 'Skin', form: 'Cream / Topical', strength: '0.025%', supplier: 'DermCare GH', lot: 'LOT-2024-TRE06', expiry: d(16), qty: 15, threshold: 5, cost: 60, storage: 'Cool, dry place' },
  ]],
  ['dispense_log', [
    { date: d(-14), med_id: 'M001', med_name: 'Ozempic (Semaglutide)', patient_id: 'P001', patient_name: 'Abena Sarpong', qty: 1, lot: 'LOT-2024-OZ01', provider: 'Dr. Admin' },
    { date: d(-20), med_id: 'M002', med_name: 'Sildenafil 50mg', patient_id: 'P002', patient_name: 'Laryea Tetteh', qty: 4, lot: 'LOT-2024-SIL02', provider: 'Dr. Admin' },
  ]],
  ['billing', [
    { id: 'B001', patient_id: 'P001', date: d(-14), services: 'Consultation (Weight Loss) – GHS 200\nOzempic injection (1 vial) – GHS 850', amount: 1050, status: 'Paid – MoMo', notes: '' },
    { id: 'B002', patient_id: 'P002', date: d(-20), services: 'Consultation (Sexual Health) – GHS 200\nSildenafil 50mg x4 – GHS 48', amount: 248, status: 'Paid – Cash', notes: '' },
    { id: 'B003', patient_id: 'P003', date: d(-8), services: 'Consultation (Fertility) – GHS 250\nLab tests – GHS 180', amount: 430, status: 'Pending', notes: '' },
  ]],
]

for (const [table, rows] of batches) {
  const { error } = await supabase.from(table).insert(rows)
  if (error) { console.error(`${table}:`, error.message); process.exit(1) }
}

const now = new Date()
const msgs = [
  { thread_id: 'P001', from_role: 'provider', body: 'Hello Abena! How are you feeling on the Ozempic?', created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 2).toISOString() },
  { thread_id: 'P001', from_role: 'patient', body: 'Much better! I have reduced appetite and have lost 3kg already.', created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 15).toISOString() },
  { thread_id: 'P001', from_role: 'provider', body: 'Excellent! Keep it up. Any nausea or side effects?', created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 18).toISOString() },
  { thread_id: 'P002', from_role: 'provider', body: 'Laryea, please remember to avoid alcohol with the sildenafil.', created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0).toISOString() },
  { thread_id: 'P002', from_role: 'patient', body: 'Understood, doctor. Thank you.', created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 30).toISOString() },
  { thread_id: 'P004', from_role: 'patient', body: 'Dr, I am feeling much better this week. Sleep has improved.', created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 14, 0).toISOString() },
  { thread_id: 'P004', from_role: 'provider', body: 'That is great to hear Kweku! Let us keep your next appointment as scheduled.', created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 14, 20).toISOString() },
]
const { error: mErr } = await supabase.from('messages').insert(msgs)
if (mErr) { console.error('messages:', mErr.message); process.exit(1) }

console.log('Clinic demo data seeded (5 patients + full HTML dataset).')
