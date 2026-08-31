import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, patientFullName, isArchivedAppointmentStatus } from '@onim/data'
import { Badge, Button, Card, EmptyState } from '@onim/ui'
import { RowActions } from '../../components/IconAction'
import { AppointmentMeetCell } from '../../components/AppointmentMeetCell'
import { StatusIconMenu } from '../../components/StatusIconMenu'
import { NewAppointmentModal } from '../../components/modals/ClinicModals'
import '@onim/ui/Card.css'

const STATUSES = ['Confirmed', 'Pending', 'Scheduled', 'Completed', 'Cancelled']

type ListTab = 'active' | 'archive'

export function AppointmentsPage() {
  const { db, updateAppointmentStatus } = useData()
  const { canWriteModule } = usePermissions()
  const canWrite = canWriteModule('appointments')
  const [modalOpen, setModalOpen] = useState(false)
  const [tab, setTab] = useState<ListTab>('active')

  const { active, archived } = useMemo(() => {
    const activeList = db.appointments.filter((a) => !isArchivedAppointmentStatus(a.status))
    const archivedList = db.appointments.filter((a) => isArchivedAppointmentStatus(a.status))
    return { active: activeList, archived: archivedList }
  }, [db.appointments])

  const rows = tab === 'active' ? active : archived

  return (
    <div>
      <Card
        title="Appointments"
        action={canWrite ? <Button variant="primary" onClick={() => setModalOpen(true)}>+ Schedule Appointment</Button> : undefined}
        noPadding
      >
        <div className="list-tabs" style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--gray2)' }}>
          <Button variant={tab === 'active' ? 'primary' : 'secondary'} onClick={() => setTab('active')}>
            Active ({active.length})
          </Button>
          <Button variant={tab === 'archive' ? 'primary' : 'secondary'} onClick={() => setTab('archive')}>
            Archive ({archived.length})
          </Button>
        </div>
        {rows.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Specialty</th>
                <th>Provider</th>
                <th>Meet / Calendar</th>
                <th>Status</th>
                {canWrite && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const p = db.patients.find((x) => x.id === a.patient_id)
                return (
                  <tr key={a.id}>
                    <td>{p ? <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link> : '–'}</td>
                    <td>{fmtDate(a.date)} · {a.time}</td>
                    <td>{a.type}</td>
                    <td>{a.specialty}</td>
                    <td>{a.provider || '–'}</td>
                    <td>
                      <AppointmentMeetCell appointment={a} patient={p} canAdd={canWrite} />
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
          <EmptyState
            icon="📅"
            title={tab === 'active' ? 'No active appointments' : 'Archive is empty'}
            description={tab === 'active' ? 'Completed and cancelled visits move here when status is updated.' : 'Completed and cancelled appointments appear here so you can revisit them.'}
          />
        )}
      </Card>
      <NewAppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
