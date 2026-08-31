import { useMemo, useState } from 'react'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, daysUntil } from '@onim/data'
import type { InventoryItem } from '@onim/data'
import { Button, Card, EmptyState } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import '@onim/ui/Card.css'
import { DispenseModal, MedicationModal } from '../../components/modals/ClinicModals'

type ListTab = 'active' | 'archive'

export function InventoryPage() {
  const { db, archiveInventoryLot, restoreInventoryLot } = useData()
  const { canManageInventory, canDispenseInventory } = usePermissions()
  const [medModalOpen, setMedModalOpen] = useState(false)
  const [dispenseOpen, setDispenseOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | undefined>()
  const [dispenseItem, setDispenseItem] = useState<InventoryItem | undefined>()
  const [tab, setTab] = useState<ListTab>('active')
  const [seedFrom, setSeedFrom] = useState<InventoryItem | undefined>()

  const { active, archived } = useMemo(() => {
    const activeList = db.inventory.filter((m) => !m.archived)
    const archivedList = db.inventory.filter((m) => m.archived)
    return { active: activeList, archived: archivedList }
  }, [db.inventory])

  const rows = tab === 'active' ? active : archived
  const alerts = active.filter((m) => m.qty <= m.threshold || daysUntil(m.expiry) <= 30)

  function openEdit(item?: InventoryItem) {
    setSeedFrom(undefined)
    setEditItem(item)
    setMedModalOpen(true)
  }

  function openNewLot(item: InventoryItem) {
    // Archive old lot first is optional — user can archive then add. Here: prefill for new lot entry.
    setEditItem(undefined)
    setSeedFrom(item)
    setMedModalOpen(true)
  }

  function openDispense(item: InventoryItem) {
    setDispenseItem(item)
    setDispenseOpen(true)
  }

  return (
    <div>
      {tab === 'active' && alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {alerts.map((m) => (
            <div key={m.id} className={`alert-bar ${daysUntil(m.expiry) <= 7 ? 'alert-bar--danger' : 'alert-bar--amber'}`}>
              <strong>{m.name}</strong> (lot {m.lot}): {m.qty <= m.threshold ? `Low stock (${m.qty})` : `Expires in ${daysUntil(m.expiry)} days`}
            </div>
          ))}
        </div>
      )}

      <Card
        title="Medication Inventory"
        action={canManageInventory ? <Button variant="primary" onClick={() => openEdit()}>+ Add Medication</Button> : undefined}
        noPadding
      >
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--gray2)' }}>
          <Button variant={tab === 'active' ? 'primary' : 'secondary'} onClick={() => setTab('active')}>
            Active lots ({active.length})
          </Button>
          <Button variant={tab === 'archive' ? 'primary' : 'secondary'} onClick={() => setTab('archive')}>
            Archived lots ({archived.length})
          </Button>
        </div>
        {rows.length ? (
          <table className="data-table">
            <thead>
              <tr><th>Medication</th><th>Lot</th><th>Category</th><th>Qty</th><th>Threshold</th><th>Expiry</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.lot || '—'}</td>
                  <td>{m.category}</td>
                  <td>{m.qty}</td>
                  <td>{m.threshold}</td>
                  <td>{fmtDate(m.expiry)}</td>
                  <td>
                    <RowActions>
                      {tab === 'active' && canDispenseInventory && (
                        <IconAction icon="dispense" label={`Dispense ${m.name}`} variant="primary" onClick={() => openDispense(m)} />
                      )}
                      {tab === 'active' && canManageInventory && (
                        <>
                          <IconAction icon="edit" label={`Edit ${m.name}`} onClick={() => openEdit(m)} />
                          <IconAction
                            icon="more"
                            label={`Archive lot ${m.lot} and add new lot`}
                            onClick={() => {
                              void (async () => {
                                const ok = await archiveInventoryLot(m.id)
                                if (ok) openNewLot(m)
                              })()
                            }}
                          />
                          <IconAction
                            icon="cancel"
                            label={`Archive lot ${m.lot}`}
                            variant="danger"
                            onClick={() => {
                              if (window.confirm(`Archive lot ${m.lot} for ${m.name}? You can still view it under Archived lots.`)) {
                                void archiveInventoryLot(m.id)
                              }
                            }}
                          />
                        </>
                      )}
                      {tab === 'archive' && canManageInventory && (
                        <IconAction icon="complete" label={`Restore lot ${m.lot}`} onClick={() => void restoreInventoryLot(m.id)} />
                      )}
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon="📦"
            title={tab === 'active' ? 'No active medications' : 'No archived lots'}
            description={tab === 'active' ? 'Add stock, or restore a lot from Archive.' : 'When a lot is finished, archive it and re-add the drug with a new lot number.'}
          />
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

      <MedicationModal
        open={medModalOpen}
        onClose={() => { setMedModalOpen(false); setEditItem(undefined); setSeedFrom(undefined) }}
        item={editItem}
        seedFrom={seedFrom}
      />
      <DispenseModal open={dispenseOpen} onClose={() => { setDispenseOpen(false); setDispenseItem(undefined) }} med={dispenseItem} />
    </div>
  )
}
