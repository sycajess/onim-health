import { motion } from 'framer-motion'
import { useData, fmtDate, daysUntil } from '@onim/data'
import { Card, EmptyState, PageHero } from '@onim/ui'
import '@onim/ui/Card.css'

export function InventoryPage() {
  const { db } = useData()
  const alerts = db.inventory.filter((m) => m.qty <= m.threshold || daysUntil(m.expiry) <= 30)

  return (
    <div className="page--inventory">
      <PageHero title="Medication Inventory" subtitle={`${db.inventory.length} items tracked · ${alerts.length} alerts`} variant="teal" />
      {alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {alerts.map((m) => (
            <div key={m.id} className={`alert-bar ${daysUntil(m.expiry) <= 7 ? 'alert-bar--danger' : 'alert-bar--amber'}`}>
              ⚠️ <strong>{m.name}</strong>: {m.qty <= m.threshold ? `Low stock (${m.qty})` : `Expires in ${daysUntil(m.expiry)} days`}
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
    </div>
  )
}
