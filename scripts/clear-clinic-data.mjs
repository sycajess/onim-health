/**
 * Remove all demo / seeded clinic data from Supabase (keeps staff accounts).
 *
 * Usage: npm run clear:clinic-data
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
    console.error('Missing apps/web/.env.development')
    process.exit(1)
  }
  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.development')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function deleteAll(table, idColumn = 'id') {
  const { data, error: selectError } = await supabase.from(table).select(idColumn)
  if (selectError) {
    console.error(`${table}:`, selectError.message)
    return 0
  }
  const ids = (data ?? []).map((row) => row[idColumn]).filter(Boolean)
  if (!ids.length) return 0

  const { error } = await supabase.from(table).delete().in(idColumn, ids)
  if (error) {
    console.error(`${table}:`, error.message)
    return 0
  }
  return ids.length
}

async function deleteMessages() {
  const { data, error: selectError } = await supabase.from('messages').select('id')
  if (selectError) {
    console.error('messages:', selectError.message)
    return 0
  }
  const ids = (data ?? []).map((row) => row.id)
  if (!ids.length) return 0

  const { error } = await supabase.from('messages').delete().in('id', ids)
  if (error) {
    console.error('messages:', error.message)
    return 0
  }
  return ids.length
}

console.log('Clearing clinic data (patients, appointments, inventory, etc.)…')

const messages = await deleteMessages()
const dispense = await deleteAll('dispense_log')
const inventory = await deleteAll('inventory')
const patients = await deleteAll('patients')

console.log(`Removed ${messages} messages, ${dispense} dispense logs, ${inventory} inventory items, ${patients} patients (and related records via cascade).`)
console.log('Done. Staff accounts are unchanged.')
