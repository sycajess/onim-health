# Onim Health

A modern patient records and clinic management system for Onim Health — built for day-to-day clinical and operational workflows in one place.

## What it does

Onim Health helps staff manage patients, appointments, clinical documentation, prescriptions, lab results, inventory, billing, secure messaging, and analytics — with role-based access so each team member only sees what they need.

### Modules

- **Dashboard** — overview stats, today’s appointments, inventory alerts, patient breakdown
- **Patients** — search, register, and view full patient profiles with timeline
- **Appointments** — schedule and track visits (including telemedicine links)
- **Medical records** — consultation notes and clinical documentation
- **Prescriptions** — active medications and dispense tracking
- **Lab results** — test values, abnormal flags, PDF report attachments
- **Inventory** — stock levels, expiry alerts, dispense log
- **Billing** — invoices, payments, outstanding balances
- **Messaging** — secure provider–patient threads
- **Reports & analytics** — 8 report types with charts and summaries
- **Settings** — team roster, roles, and clinic specialties

### Roles

Access is controlled by role: admin, doctor, nurse, pharmacist, nutritionist, staff, and accountant. Each role gets a tailored sidebar and route permissions.

## Project structure

```
onim/
├── apps/web/           # Main React app
├── packages/
│   ├── auth/           # Auth context, mock auth, route guards
│   ├── data/           # Mock database, seed data, localStorage store
│   ├── types/          # Roles, permissions, shared types
│   ├── ui/             # Theme, components, design system
│   └── supabase/       # Supabase client helpers
└── supabase/           # Migrations & seed SQL (for production setup)
```

## Status

The frontend is complete on mock data. Remaining work is wiring a live Supabase project (schema, RLS, seed, and swapping mock data for real API calls). See `steps.md` for backend setup notes.
