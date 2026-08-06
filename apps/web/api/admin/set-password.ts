import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, getUserFromAuthHeader } from '../lib/supabaseAdmin.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const caller = await getUserFromAuthHeader(req.headers.authorization)
    if (!caller) {
      res.status(401).json({ error: 'Not signed in.' })
      return
    }

    const supabase = getSupabaseAdmin()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can change staff passwords.' })
      return
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const targetId = String(body?.userId ?? '').trim()
    const password = String(body?.password ?? '')

    if (!targetId) {
      res.status(400).json({ error: 'Missing user.' })
      return
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' })
      return
    }

    const { error } = await supabase.auth.admin.updateUserById(targetId, { password })
    if (error) {
      res.status(400).json({ error: error.message })
      return
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Could not set password.' })
  }
}
