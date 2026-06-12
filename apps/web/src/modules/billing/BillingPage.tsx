import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useData, fmtDate, patientFullName } from '@onim/data'
import { Badge, Button, EmptyState, PageHero } from '@onim/ui'
import { NewInvoiceModal } from '../../components/modals/ClinicModals'

const STATUSES = ['Pending', 'Paid – Cash', 'Paid – MoMo', 'Paid – Insurance', 'Partial']

export function BillingPage() {
  const { db, updateBillingStatus } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const totalPaid = db.billing.filter((b) => b.status.startsWith('Paid')).reduce((s, b) => s + b.amount, 0)
  const totalPending = db.billing.filter((b) => b.status === 'Pending').reduce((s, b) => s + b.amount, 0)

  return (
    <div className="page--billing">
      <PageHero
        title="Billing"
        subtitle={`GHS ${totalPaid.toLocaleString()} collected · GHS ${totalPending.toLocaleString()} outstanding`}
        variant="slate"
        action={<Button variant="primary" onClick={() => setModalOpen(true)}>+ New Invoice</Button>}
      />
      {db.billing.length ? (
        <div className="bill-grid">
          {db.billing.map((b, i) => {
            const p = db.patients.find((x) => x.id === b.patient_id)
            return (
              <motion.div
                key={b.id}
                className="bill-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div style={{ fontSize: 12, color: 'var(--gray4)' }}>{b.id} · {fmtDate(b.date)}</div>
                <div className="bill-card__amount">GHS {b.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</div>
                {p && <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link>}
                <div style={{ marginTop: 10, marginBottom: 8 }}><Badge>{b.status}</Badge></div>
                <select
                  className="form-input"
                  style={{ fontSize: 11, padding: '4px 6px', width: '100%' }}
                  value={b.status}
                  onChange={(e) => void updateBillingStatus(b.id, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="🧾" title="No invoices" />
      )}
      <NewInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
