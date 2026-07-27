import { useState } from 'react'
import { useAuth } from '@onim/auth'
import { useData, patientFullName, type Appointment, type Patient } from '@onim/data'
import {
  addMeetToGoogleCalendar,
  createGoogleMeetLink,
  ensureGoogleConnected,
} from '../lib/googleCalendar'

type AppointmentMeetCellProps = {
  appointment: Appointment
  patient?: Patient
  canAdd: boolean
}

export function AppointmentMeetCell({ appointment, patient, canAdd }: AppointmentMeetCellProps) {
  const { profile } = useAuth()
  const { updateAppointmentMeetLink, updateAppointmentCalendarSync } = useData()
  const [busy, setBusy] = useState<'meet' | 'calendar' | null>(null)

  const title = `${appointment.type} — ${patient ? patientFullName(patient) : appointment.patient_id}`

  async function handleCreateMeet() {
    if (!(await ensureGoogleConnected(profile?.google_calendar_connected))) return
    setBusy('meet')
    const meet = await createGoogleMeetLink()
    if ('error' in meet) {
      window.alert(meet.error)
      setBusy(null)
      return
    }
    await updateAppointmentMeetLink(appointment.id, meet.meetLink)
    setBusy(null)
    const addNow = window.confirm(
      'Meet link created.\n\nAdd this appointment to your Google Calendar now?\n\nYou can also do this later with “Add to Calendar”.',
    )
    if (addNow) {
      await syncCalendar(meet.meetLink)
    }
  }

  async function syncCalendar(meetLink: string) {
    if (!(await ensureGoogleConnected(profile?.google_calendar_connected))) return
    setBusy('calendar')
    const result = await addMeetToGoogleCalendar({
      date: appointment.date,
      time: appointment.time,
      title,
      notes: appointment.notes,
      meetLink,
    })
    if ('error' in result) {
      window.alert(result.error)
      setBusy(null)
      return
    }
    await updateAppointmentCalendarSync(appointment.id, result.calendarEventId)
    setBusy(null)
  }

  async function handleAddToCalendar() {
    if (!appointment.meet_link) return
    await syncCalendar(appointment.meet_link)
  }

  if (!canAdd && !appointment.meet_link) return <>–</>

  return (
    <div className="meet-cell">
      {appointment.meet_link ? (
        <a href={appointment.meet_link} className="link-cell" target="_blank" rel="noreferrer">
          Join Meet
        </a>
      ) : canAdd ? (
        <button type="button" className="link-cell meet-cell__btn" onClick={() => void handleCreateMeet()} disabled={!!busy}>
          {busy === 'meet' ? 'Creating Meet…' : '1. Create Meet'}
        </button>
      ) : (
        <>–</>
      )}
      {canAdd && appointment.meet_link && !appointment.calendar_synced && (
        <button
          type="button"
          className="link-cell meet-cell__btn"
          onClick={() => void handleAddToCalendar()}
          disabled={!!busy}
        >
          {busy === 'calendar' ? 'Adding to calendar…' : '2. Add to Calendar'}
        </button>
      )}
      {appointment.calendar_synced && (
        <span className="meet-cell__synced">Meet + calendar ✓</span>
      )}
    </div>
  )
}
