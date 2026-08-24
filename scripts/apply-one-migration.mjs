import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const line of readFileSync(join(root, 'apps/web/.env.development'), 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}

const file = '20250807120000_all_roles_create_patients.sql'
const sql = readFileSync(join(root, 'supabase/migrations', file), 'utf8')

if (!env.DATABASE_URL) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

const client = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
await client.connect()
await client.query(sql)
await client.query(
  'insert into public._onim_migrations (filename) values ($1) on conflict do nothing',
  [file],
)
console.log('Migration applied:', file)
await client.end()
