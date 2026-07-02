/**
 * Create test staff accounts in Supabase Auth and set roles on profiles.
 *
 * Usage:
 *   1. Copy apps/web/.env.example → apps/web/.env.development
 *   2. Fill in VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   3. npm run seed:users
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', 'apps/web/.env.development')

function loadEnv() {
  const env = {}
  try {
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i === -1) continue
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
  } catch {
    console.error('Missing apps/web/.env.development — copy from apps/web/.env.example')
    process.exit(1)
  }
  return env
}

const env = loadEnv()

const USERS = [
  { email: 'admin@onimhealth.com', password: 'Test1234!', role: 'admin', full_name: 'Dr. Admin', specialty: 'General / Internal Medicine', phone: '+233 55 714 5452' },
  { email: 'doctor@onimhealth.com', password: 'Test1234!', role: 'doctor', full_name: 'Dr. Kofi Mensah', specialty: 'General Medicine' },
  { email: 'nurse@onimhealth.com', password: 'Test1234!', role: 'nurse', full_name: 'Nurse Grace', specialty: 'All' },
  { email: 'pharmacist@onimhealth.com', password: 'Test1234!', role: 'pharmacist', full_name: 'Kofi Pharmacy', specialty: 'Pharmacy' },
  { email: 'nutritionist@onimhealth.com', password: 'Test1234!', role: 'nutritionist', full_name: 'Ama Nutrition', specialty: 'Weight Loss / Nutrition' },
  { email: 'staff@onimhealth.com', password: 'Test1234!', role: 'staff', full_name: 'Abena Mensah', specialty: 'Administration' },
  { email: 'accountant@onimhealth.com', password: 'Test1234!', role: 'accountant', full_name: 'Esi Finance', specialty: 'Finance' },
  { email: 'lab@onimhealth.com', password: 'Test1234!', role: 'lab_partner', full_name: 'External Labs Demo', specialty: 'Laboratory' },
]

const url = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.development')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

function initials(name) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')
}

const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
const existing = new Map((list?.users ?? []).map((u) => [u.email, u.id]))

for (const user of USERS) {
  let userId = existing.get(user.email)

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
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: user.password,
      email_confirm: true,
    })
    if (updateError) console.error(`Confirm ${user.email}:`, updateError.message)
    else console.log(`Confirmed ${user.email}`)
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      specialty: user.specialty ?? null,
      phone: user.phone ?? null,
      avatar_initials: initials(user.full_name).toUpperCase(),
    },
    { onConflict: 'id' },
  )

  if (profileError) console.error(`Profile ${user.email}:`, profileError.message)
  else console.log(`  → role: ${user.role}`)
}

const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
for (const u of allUsers?.users ?? []) {
  if (!u.email_confirmed_at) {
    const { error } = await supabase.auth.admin.updateUserById(u.id, { email_confirm: true })
    if (error) console.error(`Confirm ${u.email}:`, error.message)
    else console.log(`Confirmed email: ${u.email}`)
  }
}

console.log('Done.')
