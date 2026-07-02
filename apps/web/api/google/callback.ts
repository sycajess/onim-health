import type { VercelRequest, VercelResponse } from '@vercel/node'
import { exchangeGoogleCode, fetchGoogleEmail, getAppUrl } from '../lib/google.js'
import { loadGoogleTokens, saveGoogleTokens } from '../lib/supabaseAdmin.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const code = typeof req.query.code === 'string' ? req.query.code : ''
  const stateRaw = typeof req.query.state === 'string' ? req.query.state : ''

  if (!code || !stateRaw) {
    res.redirect(302, `${getAppUrl()}/settings?google=error`)
    return
  }

  try {
    const state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8')) as { userId?: string }
    if (!state.userId) throw new Error('Invalid OAuth state.')

    const tokenData = await exchangeGoogleCode(code)
    const email = await fetchGoogleEmail(tokenData.access_token!)
    const existing = await loadGoogleTokens(state.userId)

    await saveGoogleTokens(state.userId, {
      refreshToken: tokenData.refresh_token ?? existing?.google_refresh_token ?? null,
      accessToken: tokenData.access_token!,
      expiresIn: tokenData.expires_in ?? 3600,
      email,
      connected: !!(tokenData.refresh_token || existing?.google_refresh_token),
    })

    if (!tokenData.refresh_token && !existing?.google_refresh_token) {
      res.redirect(302, `${getAppUrl()}/settings?google=error`)
      return
    }

    res.redirect(302, `${getAppUrl()}/settings?google=connected`)
  } catch {
    res.redirect(302, `${getAppUrl()}/settings?google=error`)
  }
}
