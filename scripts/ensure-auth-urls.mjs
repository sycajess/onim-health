/**
 * Prints / optionally patches Supabase Auth redirect URLs needed for password reset.
 *
 * Optional: SUPABASE_ACCESS_TOKEN (Personal Access Token from supabase.com/dashboard/account/tokens)
 * Without it, this only prints what you must set in the dashboard.
 *
 * Usage: node scripts/ensure-auth-urls.mjs
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', 'apps/web/.env.development')

function loadEnv() {
  const env = { ...process.env }
  try {
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i === -1) continue
      const k = t.slice(0, i).trim()
      if (env[k] == null || env[k] === '') env[k] = t.slice(i + 1).trim()
    }
  } catch {
    /* optional file */
  }
  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL
const projectRef = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const configuredApp = (env.VITE_APP_URL || '').replace(/\/$/, '')
const productionApp = (env.PRODUCTION_APP_URL || '').replace(/\/$/, '')
const siteUrl = (!configuredApp || /localhost/.test(configuredApp))
  ? (productionApp || 'https://YOUR-CLINIC-DOMAIN')
  : configuredApp
const token = env.SUPABASE_ACCESS_TOKEN

const required = new Set([
  siteUrl,
  `${siteUrl}/**`,
  `${siteUrl}/reset-password`,
  'http://localhost:5173',
  'http://localhost:5173/**',
  'http://localhost:5173/reset-password',
  'http://localhost:3000',
  'http://localhost:3000/**',
  'http://localhost:3000/reset-password',
])
if (configuredApp) {
  required.add(configuredApp)
  required.add(`${configuredApp}/**`)
  required.add(`${configuredApp}/reset-password`)
}
if (productionApp) {
  required.add(productionApp)
  required.add(`${productionApp}/**`)
  required.add(`${productionApp}/reset-password`)
}

console.log('Supabase Auth → URL Configuration')
console.log('Site URL (production):', siteUrl)
console.log('Redirect URLs to allow:')
for (const u of required) console.log('  -', u)

if (!projectRef) {
  console.error('Missing VITE_SUPABASE_URL')
  process.exit(1)
}

if (!token) {
  console.log('\nNo SUPABASE_ACCESS_TOKEN — set the URLs above manually in:')
  console.log('  Supabase → Authentication → URL Configuration')
  console.log('Password reset uses Auth (auth.users), not a profiles table column.')
  process.exit(0)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    site_url: siteUrl.startsWith('http') && !siteUrl.includes('YOUR-CLINIC') ? siteUrl : configuredApp || siteUrl,
    uri_allow_list: [...required].join(','),
  }),
})

if (!res.ok) {
  console.error('Failed to patch Auth config:', res.status, await res.text())
  process.exit(1)
}

console.log('\nAuth URL config updated via Management API.')
