import { getSupabase } from '@onim/supabase'

async function authHeaders(): Promise<HeadersInit> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not signed in.')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function adminSetStaffPassword(
  userId: string,
  password: string,
): Promise<{ error?: string }> {
  try {
    const res = await fetch('/api/admin/set-password', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ userId, password }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) return { error: data.error || 'Could not set password.' }
    return {}
  } catch {
    return { error: 'Could not set password.' }
  }
}
