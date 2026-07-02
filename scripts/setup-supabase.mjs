/**
 * Run migrations + seed test users on remote Supabase.
 * Requires in apps/web/.env.development:
 *   VITE_SUPABASE_URL
 *   SUPABASE_DB_PASSWORD
 *   SUPABASE_SERVICE_ROLE_KEY
 * Optional (if direct host fails on IPv4-only networks):
 *   DATABASE_URL — full Postgres URI from Supabase → Connect
 *   SUPABASE_DB_HOST — pooler host, e.g. aws-0-eu-west-1.pooler.supabase.com
 */

async function resolveHost(hostname) {
  try {
    const v6 = await dns.resolve6(hostname)
    if (v6.length) return v6[0]
  } catch {
    /* try IPv4 */
  }
  try {
    const v4 = await dns.resolve4(hostname)
    if (v4.length) return v4[0]
  } catch {
    /* try nslookup fallback (Windows / restricted Node DNS) */
  }

  try {
    const out = execSync(`nslookup ${hostname}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    const lines = out.split(/\r?\n/)
    const nameIdx = lines.findIndex((line) => line.trim().startsWith('Name:'))
    if (nameIdx !== -1) {
      for (let i = nameIdx + 1; i < lines.length; i++) {
        const match = lines[i].match(/Address:\s*([^\s\r\n]+)/)
        if (match) return match[1]
      }
    }
  } catch {
    /* fall back to hostname */
  }

  return hostname
}

async function connectPg({ projectRef, dbPassword, env }) {
  if (env.DATABASE_URL) {
    const client = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
    await client.connect()
    console.log('Connected via DATABASE_URL')
    return client
  }

  const attempts = []

  if (env.SUPABASE_DB_HOST) {
    attempts.push({
      label: `pooler ${env.SUPABASE_DB_HOST}`,
      config: {
        host: env.SUPABASE_DB_HOST,
        port: Number(env.SUPABASE_DB_PORT || 5432),
        user: `postgres.${projectRef}`,
        password: dbPassword,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
      },
    })
  }

  const poolerRegions = [
    'us-east-1', 'us-west-1', 'eu-west-1', 'eu-central-1', 'eu-west-2', 'eu-north-1',
    'ap-southeast-1', 'ap-northeast-1', 'ap-south-1', 'ca-central-1', 'sa-east-1',
  ]
  for (const prefix of ['aws-0', 'aws-1']) {
    for (const region of poolerRegions) {
      attempts.push({
        label: `pooler ${prefix}-${region}.pooler.supabase.com`,
        config: {
          host: `${prefix}-${region}.pooler.supabase.com`,
          port: 5432,
          user: `postgres.${projectRef}`,
          password: dbPassword,
          database: 'postgres',
          ssl: { rejectUnauthorized: false },
        },
      })
    }
  }

  const directHost = `db.${projectRef}.supabase.co`
  attempts.push({
    label: `direct ${directHost}`,
    config: {
      host: await resolveHost(directHost),
      port: 5432,
      user: 'postgres',
      password: dbPassword,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
    },
  })

  let lastError
  for (const { label, config } of attempts) {
    const client = new pg.Client(config)
    try {
      await client.connect()
      console.log(`Connected via ${label}`)
      return client
    } catch (err) {
      lastError = err
      const wrongTenant = err.code === 'XX000' && String(err.message).includes('not found')
      const retryable = wrongTenant || ['ENOTFOUND', 'ENETUNREACH', 'ETIMEDOUT', 'ECONNREFUSED', '28P01'].includes(err.code)
      if (!retryable) throw err
    }
  }

  console.error('\nCould not connect to Supabase Postgres.')
  console.error('Add DATABASE_URL from Supabase → Connect → Session pooler to apps/web/.env.development')
  throw lastError ?? new Error('Could not connect to Supabase Postgres')
}

import { readFileSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dns from 'node:dns/promises'
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

  const client = await connectPg({ projectRef, dbPassword, env })

  await client.query(`
    create table if not exists public._onim_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `)

  const migDir = join(root, 'supabase/migrations')
  const files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()
  const skipCodes = new Set(['42710', '42P07', '42723', '42P06', '42701'])

  for (const file of files) {
    const { rows } = await client.query(
      'select 1 from public._onim_migrations where filename = $1',
      [file],
    )
    if (rows.length) {
      console.log(`Skip: ${file}`)
      continue
    }

    const sql = readFileSync(join(migDir, file), 'utf8')
    console.log(`Migration: ${file}`)
    try {
      await client.query(sql)
    } catch (err) {
      if (!skipCodes.has(err.code)) throw err
      console.warn(`  Already applied (${err.code}): ${err.message}`)
    }
    await client.query('insert into public._onim_migrations (filename) values ($1)', [file])
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
    { email: 'lab@onimhealth.com', password: 'Test1234!', role: 'lab_partner', full_name: 'External Labs Demo', specialty: 'Laboratory' },
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

  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  for (const u of allUsers?.users ?? []) {
    if (!u.email_confirmed_at) {
      await supabase.auth.admin.updateUserById(u.id, { email_confirm: true })
    }
  }

  console.log('Test users ready (password: Test1234!).')
}

await runMigrations()
await seedUsers()
console.log('Setup complete.')
console.log('Tip: In Supabase → Authentication → Providers → Email, turn OFF "Confirm email" for internal staff logins.')
