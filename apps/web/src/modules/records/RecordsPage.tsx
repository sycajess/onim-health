import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, patientFullName, type MedicalRecord } from '@onim/data'
import { Button, Card, EmptyState } from '@onim/ui'
import { NewRecordModal } from '../../components/modals/ClinicModals'
import { RecordDetailModal } from '../../components/RecordDetailModal'
import '../../components/RecordDetailModal.css'
import '@onim/ui/Card.css'

export function RecordsPage() {
  const { db } = useData()
  const { canWriteModule } = usePermissions()
  const canWrite = canWriteModule('records')
  const [modalOpen, setModalOpen] = useState(false)
  const [recordDetail, setRecordDetail] = useState<MedicalRecord | null>(null)

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
              <tr><th>Patient</th><th>Date</th><th>Type</th><th>Specialty</th><th>Provider</th></tr>
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
      <RecordDetailModal
        record={recordDetail}
        patient={recordDetail ? db.patients.find((p) => p.id === recordDetail.patient_id) : undefined}
        open={!!recordDetail}
        onClose={() => setRecordDetail(null)}
      />
    </div>
  )
}
