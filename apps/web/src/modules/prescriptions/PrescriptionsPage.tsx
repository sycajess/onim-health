import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, patientFullName, type Prescription } from '@onim/data'
import { Badge, Button, Card, EmptyState } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import { StatusIconMenu } from '../../components/StatusIconMenu'
import { EditPrescriptionModal } from '../../components/AdminEditModals'
import { NewPrescriptionModal } from '../../components/modals/ClinicModals'
import '@onim/ui/Card.css'

const STATUSES = ['Active', 'Completed', 'Cancelled']

export function PrescriptionsPage() {
  const { db, updatePrescriptionStatus, deletePrescription } = useData()
  const { canWriteModule, canEditEntry, canDeleteEntry } = usePermissions()
  const canWrite = canWriteModule('prescriptions')
  const [modalOpen, setModalOpen] = useState(false)
  const [editRx, setEditRx] = useState<Prescription | null>(null)

  async function handleDelete(rx: Prescription) {
    if (!window.confirm(`Delete prescription ${rx.id}? This cannot be undone.`)) return
    const ok = await deletePrescription(rx.id, rx.patient_id)
    if (!ok) window.alert('Could not delete prescription.')
  }

  return (
    <div>
      <Card
        title="Prescriptions"
        action={canWrite ? <Button variant="primary" onClick={() => setModalOpen(true)}>+ New Prescription</Button> : undefined}
        noPadding
      >
        {db.prescriptions.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th><th>Medication</th><th>Strength</th><th>Directions</th><th>Route</th><th>Date</th><th>Status</th>
                {(canWrite || canEditEntry || canDeleteEntry) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {db.prescriptions.map((r) => {
                const p = db.patients.find((x) => x.id === r.patient_id)
                return (
                  <tr key={r.id}>
                    <td>{p ? <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link> : '–'}</td>
                    <td><strong>{r.medication}</strong></td>
                    <td>{r.dosage || '–'}</td>
                    <td>{r.frequency || '–'}</td>
                    <td>{r.route || '–'}</td>
                    <td>{fmtDate(r.date)}</td>
                    <td><Badge>{r.status}</Badge></td>
                    {(canWrite || canEditEntry || canDeleteEntry) && (
                      <td>
                        <RowActions>
                          {canWrite && (
                            <StatusIconMenu value={r.status} options={STATUSES} onChange={(s) => void updatePrescriptionStatus(r.id, s)} />
                          )}
                          {canEditEntry && (
                            <IconAction icon="edit" label="Edit prescription" onClick={() => setEditRx(r)} />
                          )}
                          {canDeleteEntry && (
                            <IconAction icon="delete" label="Delete prescription" variant="danger" onClick={() => void handleDelete(r)} />
                          )}
                        </RowActions>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState icon="💊" title="No prescriptions" />
        )}
      </Card>
      <NewPrescriptionModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <EditPrescriptionModal prescription={editRx} open={!!editRx} onClose={() => setEditRx(null)} />
    </div>
  )
}
