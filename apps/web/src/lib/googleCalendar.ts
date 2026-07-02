import { getSupabase } from '@onim/supabase'

function appOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return import.meta.env.VITE_APP_URL?.replace(/\/$/, '') ?? ''
}

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getAccessToken()
  if (!token) throw new Error('Not signed in.')
  return { Authorization: `Bearer ${token}` }
}

export async function startGoogleCalendarConnect(): Promise<void> {
  const token = await getAccessToken()
  if (!token) throw new Error('Not signed in.')
  window.location.href = `${appOrigin()}/api/google/auth?access_token=${encodeURIComponent(token)}`
}

export async function disconnectGoogleCalendar(): Promise<{ error?: string }> {
  try {
    const res = await fetch(`${appOrigin()}/api/google/disconnect`, {
      method: 'POST',
      headers: await authHeaders(),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) return { error: data.error || 'Disconnect failed.' }
    return {}
  } catch {
    return { error: 'Disconnect failed.' }
  }
}

export async function createGoogleMeetLink(input: {
  date: string
  time: string
  title: string
  notes?: string
}): Promise<{ meetLink: string } | { error: string }> {
  try {
    const res = await fetch(`${appOrigin()}/api/google/create-meet`, {
      method: 'POST',
      headers: {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })
    const data = (await res.json()) as { meetLink?: string; error?: string }
    if (!res.ok || !data.meetLink) {
      return { error: data.error || 'Could not create Meet link.' }
    }
    return { meetLink: data.meetLink }
  } catch {
    return { error: 'Could not create Meet link.' }
  }
}
