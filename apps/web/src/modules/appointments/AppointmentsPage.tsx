import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, patientFullName } from '@onim/data'
import { Badge, Button, Card, EmptyState } from '@onim/ui'
import { RowActions } from '../../components/IconAction'
import { StatusIconMenu } from '../../components/StatusIconMenu'
import { NewAppointmentModal } from '../../components/modals/ClinicModals'
import '@onim/ui/Card.css'

const STATUSES = ['Confirmed', 'Pending', 'Scheduled', 'Completed', 'Cancelled']

export function AppointmentsPage() {
  const { db, updateAppointmentStatus } = useData()
  const { canWriteModule } = usePermissions()
  const canWrite = canWriteModule('appointments')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div>
      <Card
        title="Appointments"
        action={canWrite ? <Button variant="primary" onClick={() => setModalOpen(true)}>+ Schedule Appointment</Button> : undefined}
        noPadding
      >
        {db.appointments.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Specialty</th>
                <th>Provider</th>
                <th>Google Meet</th>
                <th>Status</th>
                {canWrite && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {db.appointments.map((a) => {
                const p = db.patients.find((x) => x.id === a.patient_id)
                return (
                  <tr key={a.id}>
                    <td>{p ? <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link> : '–'}</td>
                    <td>{fmtDate(a.date)} · {a.time}</td>
                    <td>{a.type}</td>
                    <td>{a.specialty}</td>
                    <td>{a.provider || '–'}</td>
                    <td>
                      {a.meet_link ? (
                        <a href={a.meet_link} className="link-cell" target="_blank" rel="noreferrer">Join</a>
                      ) : '–'}
                    </td>
                    <td><Badge>{a.status}</Badge></td>
                    {canWrite && (
                      <td>
                        <RowActions>
                          <StatusIconMenu value={a.status} options={STATUSES} onChange={(s) => void updateAppointmentStatus(a.id, s)} />
                        </RowActions>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState icon="📅" title="No appointments scheduled" />
        )}
      </Card>
      <NewAppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
