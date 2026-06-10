import { motion } from 'framer-motion'
import { useData, fmtDate, patientFullName } from '@onim/data'
import { Badge, EmptyState, PageHero } from '@onim/ui'

export function AppointmentsPage() {
  const { db } = useData()

  return (
    <div className="page--appointments">
      <PageHero title="Appointments" subtitle="Today's schedule and upcoming visits" variant="blue" />
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
                  {a.meet_link && (
                    <a href={a.meet_link} target="_blank" rel="noreferrer" className="link-cell" style={{ fontSize: 12, marginTop: 4, display: 'inline-block' }}>
                      📹 Join Meet
                    </a>
                  )}
                </div>
                <Badge>{a.status}</Badge>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="📅" title="No appointments scheduled" />
      )}
    </div>
  )
}
