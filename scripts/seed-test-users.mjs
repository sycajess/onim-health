/**
 * Create test staff accounts in Supabase Auth and set roles on profiles.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *   node scripts/seed-test-users.mjs
 */

import { createClient } from '@supabase/supabase-js'

const USERS = [
  { email: 'admin@onimhealth.com', password: 'Test1234!', role: 'admin', full_name: 'Dr. Admin', specialty: 'General / Internal Medicine', phone: '+233 55 714 5452' },
  { email: 'doctor@onimhealth.com', password: 'Test1234!', role: 'doctor', full_name: 'Dr. Kofi Mensah', specialty: 'General Medicine' },
  { email: 'nurse@onimhealth.com', password: 'Test1234!', role: 'nurse', full_name: 'Nurse Grace', specialty: 'All' },
  { email: 'pharmacist@onimhealth.com', password: 'Test1234!', role: 'pharmacist', full_name: 'Kofi Pharmacy', specialty: 'Pharmacy' },
  { email: 'nutritionist@onimhealth.com', password: 'Test1234!', role: 'nutritionist', full_name: 'Ama Nutrition', specialty: 'Weight Loss / Nutrition' },
  { email: 'staff@onimhealth.com', password: 'Test1234!', role: 'staff', full_name: 'Abena Mensah', specialty: 'Administration' },
  { email: 'accountant@onimhealth.com', password: 'Test1234!', role: 'accountant', full_name: 'Esi Finance', specialty: 'Finance' },
]

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

function initials(name) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')
}

for (const user of USERS) {
  const { data: existing } = await supabase.auth.admin.listUsers()
  const found = existing?.users?.find((u) => u.email === user.email)

  let userId = found?.id

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
    })
    if (error) {
      console.error(`Failed ${user.email}:`, error.message)
      continue
    }
    userId = data.user.id
    console.log(`Created ${user.email}`)
  } else {
    console.log(`Exists ${user.email}`)
  }

  const { error: profileError } = await supabase.from('profiles').update({
    role: user.role,
    full_name: user.full_name,
    specialty: user.specialty ?? null,
    phone: user.phone ?? null,
    avatar_initials: initials(user.full_name).toUpperCase(),
  }).eq('id', userId)

  if (profileError) console.error(`Profile update ${user.email}:`, profileError.message)
  else console.log(`  → role: ${user.role}`)
}

console.log('Done.')
