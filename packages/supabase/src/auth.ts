import type { Profile, Role } from '@onim/types'
import { getSupabase } from './client'
import { logAuditEvent } from './audit'

type DbProfile = {
  id: string
  email: string
  full_name: string
  role: Role
  specialty: string | null
  phone: string | null
  avatar_initials: string
  google_calendar_connected: boolean | null
  google_calendar_email: string | null
  approved: boolean | null
}

function mapProfile(row: DbProfile): Profile {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    specialty: row.specialty ?? undefined,
    phone: row.phone ?? undefined,
    avatar_initials: row.avatar_initials,
    google_calendar_connected: row.google_calendar_connected ?? false,
    google_calendar_email: row.google_calendar_email ?? undefined,
    approved: row.approved !== false,
  }
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const baseSelect =
    'id, email, full_name, role, specialty, phone, avatar_initials'
  const fullSelect = `${baseSelect}, google_calendar_connected, google_calendar_email, approved`

  let { data, error } = await supabase
    .from('profiles')
    .select(fullSelect)
    .eq('id', userId)
    .single()

  if (error && /google_calendar|approved/i.test(error.message)) {
    const fallback = await supabase.from('profiles').select(baseSelect).eq('id', userId).single()
    if (fallback.error || !fallback.data) return null
    return mapProfile({
      ...(fallback.data as Omit<DbProfile, 'google_calendar_connected' | 'google_calendar_email' | 'approved'>),
      google_calendar_connected: false,
      google_calendar_email: null,
      approved: true,
    })
  }

  if (error || !data) return null
  return mapProfile(data as DbProfile)
}

export async function supabaseGetSession(): Promise<Profile | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data } = await supabase.auth.getSession()
  if (!data.session?.user) return null

  return fetchProfile(data.session.user.id)
}

export async function supabaseSignIn(
  email: string,
  password: string,
): Promise<{ profile: Profile } | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    if (/email not confirmed/i.test(error.message)) {
      return { error: 'Your email is not confirmed yet. Ask your admin to confirm your account, or run npm run seed:users if you use a test login.' }
    }
    return { error: error.message }
  }

  const profile = await fetchProfile(data.user.id)
  if (!profile) return { error: 'Profile not found for this account.' }

  void logAuditEvent({ action: 'login', entity_type: 'auth', entity_id: profile.id })

  return { profile }
}

export async function supabaseSignUp(
  email: string,
  password: string,
): Promise<{ profile: Profile } | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  const normalized = email.trim().toLowerCase()
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
  })

  if (error) return { error: error.message }
  if (!data.user) return { error: 'Sign up failed. Please try again.' }

  if (!data.session) {
    return { error: 'Account created. Your admin must confirm your email before you can sign in (or turn off email confirmation in Supabase Auth settings).' }
  }

  const profile = await fetchProfile(data.user.id)
  if (!profile) return { error: 'Account created but profile is not ready yet.' }

  return { profile }
}

export async function supabaseSignOut(): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function supabaseRefreshProfile(): Promise<Profile | null> {
  return supabaseGetSession()
}

export async function supabaseRequestPasswordReset(
  email: string,
  redirectTo: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  })

  if (error) return { error: error.message }
  return { ok: true }
}

export async function supabaseUpdatePassword(
  password: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { ok: true }
}
