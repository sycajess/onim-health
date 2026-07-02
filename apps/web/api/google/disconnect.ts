import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearGoogleTokens, getUserFromAuthHeader } from '../lib/supabaseAdmin.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const user = await getUserFromAuthHeader(req.headers.authorization)
    if (!user) {
      res.status(401).json({ error: 'Not signed in.' })
      return
    }

    await clearGoogleTokens(user.id)
    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Disconnect failed.' })
  }
}
