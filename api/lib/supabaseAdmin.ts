import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let admin: SupabaseClient | null = null

function readSupabaseAdminEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return { url: url?.trim(), key: key?.trim() }
}

export function getSupabaseAdmin() {
  if (admin) return admin
  const { url, key } = readSupabaseAdminEnv()
  if (!url || !key) {
    const missing: string[] = []
    if (!url) missing.push('SUPABASE_URL')
    if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    throw new Error(
      `Missing on Vercel: ${missing.join(', ')}. Add under Project → Settings → Environment Variables (check Production), then Redeploy. Use the service_role key from Supabase → Settings → API — not the anon key.`,
    )
  }
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return admin
}

export async function getUserFromAuthHeader(authHeader?: string) {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

type GoogleTokens = {
  google_refresh_token: string | null
  google_access_token: string | null
  google_token_expiry: string | null
  google_calendar_connected: boolean
}

export async function loadGoogleTokens(userId: string): Promise<GoogleTokens | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select('google_refresh_token, google_access_token, google_token_expiry, google_calendar_connected')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data as GoogleTokens
}

export async function saveGoogleTokens(
  userId: string,
  tokens: {
    refreshToken?: string | null
    accessToken: string
    expiresIn: number
    email?: string
    connected: boolean
  },
) {
  const supabase = getSupabaseAdmin()
  const expiry = new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
  const row: Record<string, unknown> = {
    google_access_token: tokens.accessToken,
    google_token_expiry: expiry,
    google_calendar_connected: tokens.connected,
  }
  if (tokens.refreshToken !== undefined && tokens.refreshToken !== null) {
    row.google_refresh_token = tokens.refreshToken
  }
  if (tokens.email) row.google_calendar_email = tokens.email
  const { error } = await supabase.from('profiles').update(row).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function clearGoogleTokens(userId: string) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('profiles')
    .update({
      google_refresh_token: null,
      google_access_token: null,
      google_token_expiry: null,
      google_calendar_email: null,
      google_calendar_connected: false,
    })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const tokens = await loadGoogleTokens(userId)
  if (!tokens?.google_refresh_token || !tokens.google_calendar_connected) {
    throw new Error('Connect Google Calendar in Settings first.')
  }

  const expiryMs = tokens.google_token_expiry ? Date.parse(tokens.google_token_expiry) : 0
  if (tokens.google_access_token && expiryMs > Date.now() + 60_000) {
    return tokens.google_access_token
  }

  const { refreshGoogleAccessToken } = await import('./google.js')
  const refreshed = await refreshGoogleAccessToken(tokens.google_refresh_token)
  await saveGoogleTokens(userId, {
    accessToken: refreshed.access_token!,
    expiresIn: refreshed.expires_in ?? 3600,
    connected: true,
  })
  return refreshed.access_token!
}
