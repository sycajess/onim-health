import type { VercelRequest, VercelResponse } from '@vercel/node'

function has(name: string): boolean {
  const v = process.env[name]
  return typeof v === 'string' && v.trim().length > 0
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = has('SUPABASE_URL') || has('VITE_SUPABASE_URL')
  const serviceRole = has('SUPABASE_SERVICE_ROLE_KEY')
  const google = has('GOOGLE_CLIENT_ID') && has('GOOGLE_CLIENT_SECRET')

  res.status(200).json({
    supabaseUrl,
    serviceRole,
    google,
    ready: supabaseUrl && serviceRole && google,
  })
}
