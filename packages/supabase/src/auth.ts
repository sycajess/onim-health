import type { Profile, Role } from '@onim/types'
import { getSupabase } from './client'

type DbProfile = {
  id: string
  email: string
  full_name: string
  role: Role
  specialty: string | null
  phone: string | null
  avatar_initials: string
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
  }
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, specialty, phone, avatar_initials')
    .eq('id', userId)
    .single()

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
