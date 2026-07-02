import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildGoogleAuthUrl } from '../lib/google.js'
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'

async function resolveUser(req: VercelRequest) {
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : ''
  const queryToken = typeof req.query.access_token === 'string' ? req.query.access_token : ''
  const token = headerToken || queryToken
  if (!token) return null
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const user = await resolveUser(req)
    if (!user) {
      res.status(401).json({ error: 'Not signed in.' })
      return
    }

    const state = Buffer.from(JSON.stringify({ userId: user.id, ts: Date.now() })).toString('base64url')
    res.redirect(302, buildGoogleAuthUrl(state))
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Auth failed.' })
  }
}
