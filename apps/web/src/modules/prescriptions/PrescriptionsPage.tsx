import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useData, fmtDate, patientFullName } from '@onim/data'
import { Badge, EmptyState, PageHero } from '@onim/ui'

export function PrescriptionsPage() {
  const { db } = useData()

  return (
    <div className="page--prescriptions">
      <PageHero title="Prescriptions" subtitle="Active medications and dispense tracking" variant="amber" />
      {db.prescriptions.length ? (
        <div className="rx-list">
          {db.prescriptions.map((r, i) => {
            const p = db.patients.find((x) => x.id === r.patient_id)
            return (
              <motion.div
                key={r.id}
                className="rx-row"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="rx-row__icon">💊</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{r.medication}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray4)', marginTop: 2 }}>
                    {r.dosage} · {r.frequency} · {fmtDate(r.date)}
                  </div>
                  {p && <Link to={`/patients/${p.id}`} className="link-cell" style={{ fontSize: 12 }}>{patientFullName(p)}</Link>}
                </div>
                <Badge>{r.status}</Badge>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="💊" title="No prescriptions" />
      )}
    </div>
  )
}
