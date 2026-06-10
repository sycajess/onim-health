import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useData, fmtDate, patientFullName } from '@onim/data'
import { EmptyState, PageHero } from '@onim/ui'

export function RecordsPage() {
  const { db } = useData()

  return (
    <div className="page--records">
      <PageHero title="Medical Records" subtitle="Clinical notes and visit documentation" variant="slate" />
      {db.records.length ? (
        <div className="record-stack">
          {db.records.map((r, i) => {
            const p = db.patients.find((x) => x.id === r.patient_id)
            return (
              <motion.div
                key={r.id}
                className="record-doc"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="record-doc__meta">{fmtDate(r.date)} · {r.specialty}</div>
                <div className="record-doc__title">
                  {r.type}
                  {p && <> — <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link></>}
                </div>
                <div className="record-doc__body">{r.assessment}</div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="📋" title="No records found" />
      )}
    </div>
  )
}
