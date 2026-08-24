import type { VercelRequest, VercelResponse } from '@vercel/node'
import { addMeetToCalendarEvent, createMeetSpace } from '../lib/google.js'
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

    const body = req.body as {
      date?: string
      time?: string
      title?: string
      notes?: string
    }

    if (!body.date?.trim() || !body.time?.trim() || !body.title?.trim()) {
      res.status(400).json({ error: 'Date, time, and title are required.' })
      return
    }

    const accessToken = await getValidGoogleAccessToken(user.id)
    const meetLink = await createMeetSpace(accessToken)
    const calendarEventId = await addMeetToCalendarEvent({
      accessToken,
      title: body.title.trim(),
      date: body.date.trim(),
      time: body.time.trim(),
      notes: body.notes?.trim(),
      meetLink,
    })

    res.status(200).json({ meetLink, calendarEventId })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Could not schedule virtual appointment.' })
  }
}
