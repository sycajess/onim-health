import { useState } from 'react'
import { motion } from 'framer-motion'
import { useData, fmtDate, daysUntil } from '@onim/data'
import type { InventoryItem } from '@onim/data'
import { Button, Card, EmptyState, PageHero } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import '@onim/ui/Card.css'
import { DispenseModal, MedicationModal } from '../../components/modals/ClinicModals'

export function InventoryPage() {
  const { db } = useData()
  const [medModalOpen, setMedModalOpen] = useState(false)
  const [dispenseOpen, setDispenseOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | undefined>()
  const [dispenseItem, setDispenseItem] = useState<InventoryItem | undefined>()
  const alerts = db.inventory.filter((m) => m.qty <= m.threshold || daysUntil(m.expiry) <= 30)

  function openEdit(item?: InventoryItem) {
    setEditItem(item)
    setMedModalOpen(true)
  }

  function openDispense(item: InventoryItem) {
    setDispenseItem(item)
    setDispenseOpen(true)
  }

  return (
    <div className="page--inventory">
      <PageHero
        title="Medication Inventory"
        subtitle={`${db.inventory.length} items tracked · ${alerts.length} alerts`}
        variant="teal"
        action={<Button variant="primary" onClick={() => openEdit()}>+ Add Medication</Button>}
      />
      {alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {alerts.map((m) => (
            <div key={m.id} className={`alert-bar ${daysUntil(m.expiry) <= 7 ? 'alert-bar--danger' : 'alert-bar--amber'}`}>
              <strong>{m.name}</strong>: {m.qty <= m.threshold ? `Low stock (${m.qty})` : `Expires in ${daysUntil(m.expiry)} days`}
            </div>
          ))}
        </div>
      )}
      {db.inventory.length ? (
        <div className="inv-grid">
          {db.inventory.map((m, i) => (
            <motion.div
              key={m.id}
              className={`inv-card${m.qty <= m.threshold ? ' inv-card--low' : ''}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
            >
              <div style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{m.category}</div>
              <div style={{ fontWeight: 600, marginTop: 6 }}>{m.name}</div>
              <div className="inv-card__qty">{m.qty}</div>
              <div style={{ fontSize: 12, color: 'var(--gray4)' }}>Threshold: {m.threshold} · Exp: {fmtDate(m.expiry)}</div>
              <div style={{ marginTop: 12 }}>
                <RowActions>
                  <IconAction icon="dispense" label={`Dispense ${m.name}`} variant="primary" onClick={() => openDispense(m)} />
                  <IconAction icon="edit" label={`Edit ${m.name}`} onClick={() => openEdit(m)} />
                </RowActions>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState icon="📦" title="No medications found" />
      )}

      <Card title="Dispense Log" noPadding style={{ marginTop: 20 }}>
        {db.dispense_log.length ? (
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Medication</th><th>Patient</th><th>Qty</th><th>Lot</th><th>Provider</th></tr>
            </thead>
            <tbody>
              {[...db.dispense_log].sort((a, b) => (b.date > a.date ? 1 : -1)).map((entry, i) => (
                <tr key={`${entry.date}-${entry.med_id}-${i}`}>
                  <td>{fmtDate(entry.date)}</td>
                  <td><strong>{entry.med_name}</strong></td>
                  <td>{entry.patient_name}</td>
                  <td>{entry.qty}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{entry.lot}</td>
                  <td>{entry.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState icon="📋" title="No dispense history" />
        )}
      </Card>

      <MedicationModal open={medModalOpen} onClose={() => { setMedModalOpen(false); setEditItem(undefined) }} item={editItem} />
      <DispenseModal open={dispenseOpen} onClose={() => { setDispenseOpen(false); setDispenseItem(undefined) }} med={dispenseItem} />
    </div>
  )
}
