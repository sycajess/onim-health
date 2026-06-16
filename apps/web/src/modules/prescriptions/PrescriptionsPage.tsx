import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, patientFullName } from '@onim/data'
import { Badge, Button, Card, EmptyState } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import { StatusIconMenu } from '../../components/StatusIconMenu'
import { NewPrescriptionModal } from '../../components/modals/ClinicModals'
import '@onim/ui/Card.css'

const STATUSES = ['Active', 'Completed', 'Cancelled']

export function PrescriptionsPage() {
  const { db, updatePrescriptionStatus } = useData()
  const { canWriteModule } = usePermissions()
  const canWrite = canWriteModule('prescriptions')
  const [modalOpen, setModalOpen] = useState(false)

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
              <tr><th>Patient</th><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Date</th><th>Status</th>{canWrite && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {db.prescriptions.map((r) => {
                const p = db.patients.find((x) => x.id === r.patient_id)
                return (
                  <tr key={r.id}>
                    <td>{p ? <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link> : '–'}</td>
                    <td><strong>{r.medication}</strong></td>
                    <td>{r.dosage}</td>
                    <td>{r.frequency}</td>
                    <td>{fmtDate(r.date)}</td>
                    <td><Badge>{r.status}</Badge></td>
                    {canWrite && (
                      <td>
                        <RowActions>
                          {r.status !== 'Completed' && (
                            <IconAction icon="complete" label="Mark completed" variant="success" onClick={() => void updatePrescriptionStatus(r.id, 'Completed')} />
                          )}
                          {r.status !== 'Cancelled' && (
                            <IconAction icon="cancel" label="Cancel prescription" variant="danger" onClick={() => void updatePrescriptionStatus(r.id, 'Cancelled')} />
                          )}
                          <StatusIconMenu value={r.status} options={STATUSES} onChange={(s) => void updatePrescriptionStatus(r.id, s)} />
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
    </div>
  )
}
