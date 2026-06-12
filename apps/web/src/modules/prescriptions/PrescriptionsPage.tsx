import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useData, fmtDate, patientFullName } from '@onim/data'
import { Badge, Button, EmptyState, PageHero } from '@onim/ui'
import { NewPrescriptionModal } from '../../components/modals/ClinicModals'

const STATUSES = ['Active', 'Completed', 'Cancelled']

export function PrescriptionsPage() {
  const { db, updatePrescriptionStatus } = useData()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="page--prescriptions">
      <PageHero
        title="Prescriptions"
        subtitle="Active medications and dispense tracking"
        variant="amber"
        action={<Button variant="primary" onClick={() => setModalOpen(true)}>+ Prescribe</Button>}
      />
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <Badge>{r.status}</Badge>
                  <select
                    className="form-input"
                    style={{ fontSize: 11, padding: '4px 6px', width: 120 }}
                    value={r.status}
                    onChange={(e) => void updatePrescriptionStatus(r.id, e.target.value)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="💊" title="No prescriptions" />
      )}
      <NewPrescriptionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
