import { useState } from 'react'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, daysUntil } from '@onim/data'
import type { InventoryItem } from '@onim/data'
import { Button, Card, EmptyState } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import '@onim/ui/Card.css'
import { DispenseModal, MedicationModal } from '../../components/modals/ClinicModals'

export function InventoryPage() {
  const { db } = useData()
  const { canManageInventory, canDispenseInventory } = usePermissions()
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
    <div>
      {alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {alerts.map((m) => (
            <div key={m.id} className={`alert-bar ${daysUntil(m.expiry) <= 7 ? 'alert-bar--danger' : 'alert-bar--amber'}`}>
              <strong>{m.name}</strong>: {m.qty <= m.threshold ? `Low stock (${m.qty})` : `Expires in ${daysUntil(m.expiry)} days`}
            </div>
          ))}
        </div>
      )}

      <Card
        title="Medication Inventory"
        action={canManageInventory ? <Button variant="primary" onClick={() => openEdit()}>+ Add Medication</Button> : undefined}
        noPadding
      >
        {db.inventory.length ? (
          <table className="data-table">
            <thead>
              <tr><th>Medication</th><th>Category</th><th>Qty</th><th>Threshold</th><th>Expiry</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {db.inventory.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.category}</td>
                  <td>{m.qty}</td>
                  <td>{m.threshold}</td>
                  <td>{fmtDate(m.expiry)}</td>
                  <td>
                    {(canManageInventory || canDispenseInventory) && (
                      <RowActions>
                        {canDispenseInventory && (
                          <IconAction icon="dispense" label={`Dispense ${m.name}`} variant="primary" onClick={() => openDispense(m)} />
                        )}
                        {canManageInventory && (
                          <IconAction icon="edit" label={`Edit ${m.name}`} onClick={() => openEdit(m)} />
                        )}
                      </RowActions>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState icon="📦" title="No medications found" />
        )}
      </Card>

      <Card title="Dispense Log" noPadding style={{ marginTop: 16 }}>
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
