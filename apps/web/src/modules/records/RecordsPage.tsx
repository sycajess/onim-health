import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, patientFullName, type MedicalRecord } from '@onim/data'
import { Button, Card, EmptyState } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import { NewRecordModal } from '../../components/modals/ClinicModals'
import { EditRecordModal } from '../../components/AdminEditModals'
import { RecordDetailModal } from '../../components/RecordDetailModal'
import '../../components/RecordDetailModal.css'
import '@onim/ui/Card.css'

export function RecordsPage() {
  const { db, deleteRecord } = useData()
  const { canWriteModule, canEditEntry, canDeleteEntry } = usePermissions()
  const canWrite = canWriteModule('records')
  const [modalOpen, setModalOpen] = useState(false)
  const [recordDetail, setRecordDetail] = useState<MedicalRecord | null>(null)
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null)

  async function handleDelete(record: MedicalRecord) {
    if (!window.confirm(`Delete record ${record.id}? This cannot be undone.`)) return
    const ok = await deleteRecord(record.id, record.patient_id)
    if (!ok) window.alert('Could not delete record.')
  }

  return (
    <div>
      <Card
        title="Medical Records"
        action={canWrite ? <Button variant="primary" onClick={() => setModalOpen(true)}>+ Add Record</Button> : undefined}
        noPadding
      >
        {db.records.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th><th>Date</th><th>Type</th><th>Specialty</th><th>Provider</th>
                {(canEditEntry || canDeleteEntry) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {db.records.map((r) => {
                const p = db.patients.find((x) => x.id === r.patient_id)
                return (
                  <tr
                    key={r.id}
                    className="record-row-clickable"
                    onClick={() => setRecordDetail(r)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      {p ? <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link> : '–'}
                    </td>
                    <td>{fmtDate(r.date)}</td>
                    <td><span className="link-cell">{r.type}</span></td>
                    <td>{r.specialty}</td>
                    <td>{r.provider || '–'}</td>
                    {(canEditEntry || canDeleteEntry) && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <RowActions>
                          {canEditEntry && (
                            <IconAction icon="edit" label="Edit record" onClick={() => setEditRecord(r)} />
                          )}
                          {canDeleteEntry && (
                            <IconAction icon="delete" label="Delete record" variant="danger" onClick={() => void handleDelete(r)} />
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
          <EmptyState icon="📋" title="No records found" />
        )}
      </Card>
      <NewRecordModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <EditRecordModal record={editRecord} open={!!editRecord} onClose={() => setEditRecord(null)} />
      <RecordDetailModal
        record={recordDetail}
        patient={recordDetail ? db.patients.find((p) => p.id === recordDetail.patient_id) : undefined}
        open={!!recordDetail}
        onClose={() => setRecordDetail(null)}
        onEdit={canEditEntry ? () => {
          if (recordDetail) setEditRecord(recordDetail)
        } : undefined}
        onDelete={canDeleteEntry && recordDetail ? () => void handleDelete(recordDetail) : undefined}
      />
    </div>
  )
}
