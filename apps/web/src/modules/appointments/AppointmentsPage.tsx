import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, patientFullName } from '@onim/data'
import { Badge, Button, EmptyState, PageHero } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import { StatusIconMenu } from '../../components/StatusIconMenu'
import { NewAppointmentModal } from '../../components/modals/ClinicModals'

const STATUSES = ['Confirmed', 'Pending', 'Scheduled', 'Completed', 'Cancelled']

export function AppointmentsPage() {
  const { db, updateAppointmentStatus } = useData()
  const { canWriteModule } = usePermissions()
  const canWrite = canWriteModule('appointments')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="page--appointments">
      <PageHero
        title="Appointments"
        subtitle="Today's schedule and upcoming visits"
        variant="blue"
        action={canWrite ? <Button variant="primary" onClick={() => setModalOpen(true)}>+ Schedule</Button> : undefined}
      />
      {db.appointments.length ? (
        <div className="appt-list">
          {db.appointments.map((a, i) => {
            const p = db.patients.find((x) => x.id === a.patient_id)
            const [time, period] = a.time.split(' ')
            return (
              <motion.div
                key={a.id}
                className="appt-card"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
              >
                <div className="appt-card__time">
                  {time}
                  <small>{period}</small>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{p ? patientFullName(p) : '–'}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray4)' }}>{a.type} · {a.specialty} · {fmtDate(a.date)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <Badge>{a.status}</Badge>
                  {canWrite && (
                    <RowActions>
                      {a.meet_link && <IconAction icon="video" label="Join video call" href={a.meet_link} variant="primary" />}
                      {a.status !== 'Completed' && (
                        <IconAction icon="complete" label="Mark completed" variant="success" onClick={() => void updateAppointmentStatus(a.id, 'Completed')} />
                      )}
                      {a.status !== 'Cancelled' && (
                        <IconAction icon="cancel" label="Cancel appointment" variant="danger" onClick={() => void updateAppointmentStatus(a.id, 'Cancelled')} />
                      )}
                      <StatusIconMenu value={a.status} options={STATUSES} onChange={(s) => void updateAppointmentStatus(a.id, s)} />
                    </RowActions>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="📅" title="No appointments scheduled" />
      )}
      <NewAppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
