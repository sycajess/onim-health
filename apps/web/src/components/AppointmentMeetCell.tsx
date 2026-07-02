import { useState } from 'react'
import { useAuth } from '@onim/auth'
import { useData, patientFullName, type Appointment, type Patient } from '@onim/data'
import { createGoogleMeetLink } from '../lib/googleCalendar'

type AppointmentMeetCellProps = {
  appointment: Appointment
  patient?: Patient
  canAdd: boolean
}

export function AppointmentMeetCell({ appointment, patient, canAdd }: AppointmentMeetCellProps) {
  const { profile } = useAuth()
  const { updateAppointmentMeetLink } = useData()
  const [adding, setAdding] = useState(false)

  if (appointment.meet_link) {
    return (
      <a href={appointment.meet_link} className="link-cell" target="_blank" rel="noreferrer">
        Join
      </a>
    )
  }

  if (!canAdd) return <>–</>

  async function handleAdd() {
    if (!profile?.google_calendar_connected) {
      window.alert('Connect Google Calendar in Settings first.')
      return
    }
    setAdding(true)
    const meet = await createGoogleMeetLink({
      date: appointment.date,
      time: appointment.time,
      title: `${appointment.type} — ${patient ? patientFullName(patient) : appointment.patient_id}`,
      notes: appointment.notes,
    })
    if ('error' in meet) {
      window.alert(meet.error)
      setAdding(false)
      return
    }
    await updateAppointmentMeetLink(appointment.id, meet.meetLink)
    setAdding(false)
  }

  return (
    <button
      type="button"
      className="link-cell"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      onClick={() => void handleAdd()}
      disabled={adding}
    >
      {adding ? 'Adding…' : 'Add Meet'}
    </button>
  )
}
