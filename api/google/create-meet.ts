import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createMeetSpace } from '../lib/google.js'
import { getUserFromAuthHeader, getValidGoogleAccessToken } from '../lib/supabaseAdmin.js'

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

    const accessToken = await getValidGoogleAccessToken(user.id)
    const meetLink = await createMeetSpace(accessToken)
    res.status(200).json({ meetLink })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Could not create Meet link.' })
  }
}
