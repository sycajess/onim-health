/**
 * Run migrations + seed test users on remote Supabase.
 * Requires in apps/web/.env.development:
 *   VITE_SUPABASE_URL
 *   SUPABASE_DB_PASSWORD
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const envPath = join(root, 'apps/web/.env.development')

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
    console.error('Missing apps/web/.env.development')
    process.exit(1)
  }
  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const dbPassword = env.SUPABASE_DB_PASSWORD
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const projectRef = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!url || !projectRef) {
  console.error('Set VITE_SUPABASE_URL in apps/web/.env.development')
  process.exit(1)
}

async function runMigrations() {
  if (!dbPassword) {
    console.error('Missing SUPABASE_DB_PASSWORD in apps/web/.env.development')
    console.error('  Supabase → Settings → Database → Database password')
    process.exit(1)
  }

  const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const migDir = join(root, 'supabase/migrations')
  const files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()

  for (const file of files) {
    const sql = readFileSync(join(migDir, file), 'utf8')
    console.log(`Migration: ${file}`)
    await client.query(sql)
  }

  const seedSql = readFileSync(join(root, 'supabase/seed.sql'), 'utf8')
  const statements = seedSql.split(';').map((s) => s.trim()).filter((s) => s && !s.startsWith('--'))
  for (const stmt of statements) {
    if (stmt.toLowerCase().startsWith('update')) {
      await client.query(stmt)
    }
  }

  await client.end()
  console.log('Migrations applied.')
}

async function seedUsers() {
  if (!serviceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.development')
    console.error('  Supabase → Settings → API → service_role (secret)')
    process.exit(1)
  }

  const USERS = [
    { email: 'admin@onimhealth.com', password: 'Test1234!', role: 'admin', full_name: 'Dr. Admin', specialty: 'General / Internal Medicine', phone: '+233 55 714 5452' },
    { email: 'doctor@onimhealth.com', password: 'Test1234!', role: 'doctor', full_name: 'Dr. Kofi Mensah', specialty: 'General Medicine' },
    { email: 'nurse@onimhealth.com', password: 'Test1234!', role: 'nurse', full_name: 'Nurse Grace', specialty: 'All' },
    { email: 'pharmacist@onimhealth.com', password: 'Test1234!', role: 'pharmacist', full_name: 'Kofi Pharmacy', specialty: 'Pharmacy' },
    { email: 'nutritionist@onimhealth.com', password: 'Test1234!', role: 'nutritionist', full_name: 'Ama Nutrition', specialty: 'Weight Loss / Nutrition' },
    { email: 'staff@onimhealth.com', password: 'Test1234!', role: 'staff', full_name: 'Abena Mensah', specialty: 'Administration' },
    { email: 'accountant@onimhealth.com', password: 'Test1234!', role: 'accountant', full_name: 'Esi Finance', specialty: 'Finance' },
  ]

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  function initials(name) {
    const parts = name.trim().split(/\s+/)
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase()
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
        console.error(`Create ${user.email}:`, error.message)
        continue
      }
      userId = data.user.id
      console.log(`Created ${user.email}`)
    } else {
      await supabase.auth.admin.updateUserById(userId, { password: user.password, email_confirm: true })
      console.log(`Updated ${user.email}`)
    }

    const { error: profileError } = await supabase.from('profiles').update({
      role: user.role,
      full_name: user.full_name,
      specialty: user.specialty ?? null,
      phone: user.phone ?? null,
      avatar_initials: initials(user.full_name),
    }).eq('id', userId)

    if (profileError) console.error(`Profile ${user.email}:`, profileError.message)
    else console.log(`  → ${user.role}`)
  }

  console.log('Test users ready (password: Test1234!).')
}

await runMigrations()
await seedUsers()
console.log('Setup complete.')
