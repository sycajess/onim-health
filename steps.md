# Onim Health — Build Steps

Reference: `onim-health-records-v2 (2).html`

---

## 3. Supabase setup

### 3.1 Create project
- Create Supabase project at supabase.com
- Copy URL + anon key → `.env.local` (gitignored)

### 3.2 Env vars (placeholder until real project exists)
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3.3 Tables
- `patients` — demographics, specialty tags, status
- `appointments` — patient_id, provider_id, date, type, meet_link, status
- `medical_records` — patient_id, type, notes, attachments
- `prescriptions` — patient_id, prescriber_id, meds, status
- `lab_results` — patient_id, test, value, status, notes
- `inventory` — name, category, qty, expiry, reorder_level
- `dispense_log` — inventory_id, patient_id, qty, date
- `billing` — patient_id, amount, status, due_date
- `messages` — thread_id, sender_id, body, created_at

### 3.4 RLS
- Enable RLS on all tables
- Policies keyed off `profiles.role` matching module permissions

---

## 6. Build order

1. [ ] Supabase schema + RLS + seed SQL
