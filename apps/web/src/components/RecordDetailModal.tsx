import { useAuth } from '@onim/auth'
import { useData, fmtDate, displayField, type MedicalRecord, type Patient } from '@onim/data'
import { Button, Modal } from '@onim/ui'
import { emailLabOrder, openLabOrderPrint } from '../lib/labOrderDocument'
import './RecordDetailModal.css'

type RecordDetailModalProps = {
  record: MedicalRecord | null
  patient?: Patient
  open: boolean
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null
  return (
    <div className="record-detail__block">
      <div className="record-detail__label">{label}</div>
      <div className="record-detail__value">{value}</div>
    </div>
  )
}

export function RecordDetailModal({ record, patient, open, onClose, onEdit, onDelete }: RecordDetailModalProps) {
  const { profile } = useAuth()
  const { db } = useData()

  if (!record) return null

  const staff = db.staff.find((s) => s.id === profile?.id || s.name === record.provider)
  const clinician = {
    name: record.provider || profile?.full_name,
    phone: staff?.phone || profile?.phone,
    email: staff?.email || profile?.email,
    licenseNumber: staff?.license_number,
  }

  const vitals = [
    record.bp?.trim() ? `BP ${record.bp}` : '',
    record.temp?.trim() ? `Temp ${record.temp}` : '',
    record.weight ? `Weight ${record.weight} kg` : '',
  ].filter(Boolean).join(' · ')

  const hasLabs = !!record.labs_ordered.trim()

  return (
    <Modal
      open={open}
      title={`${record.type} — ${fmtDate(record.date)}`}
      onClose={onClose}
      footer={
        hasLabs || onEdit || onDelete ? (
          <>
            <Button variant="secondary" onClick={onClose}>Close</Button>
            {onEdit && <Button variant="secondary" onClick={onEdit}>Edit</Button>}
            {onDelete && <Button variant="danger" onClick={onDelete}>Delete</Button>}
            {hasLabs && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => emailLabOrder({ patient, record, clinician })}
                >
                  Email lab order
                </Button>
                <Button
                  variant="primary"
                  onClick={() => openLabOrderPrint({ patient, record, clinician })}
                >
                  Print / PDF lab order
                </Button>
              </>
            )}
          </>
        ) : undefined
      }
    >
      <div className="record-detail">
        <div className="record-detail__meta">
          <span>{displayField(record.specialty)}</span>
          {record.provider ? <span> · {record.provider}</span> : null}
        </div>
        {vitals ? (
          <div className="record-detail__vitals">{vitals}</div>
        ) : null}
        <DetailBlock label="Chief complaint" value={record.complaint} />
        <DetailBlock label="Examination" value={record.exam} />
        <DetailBlock label="Assessment" value={record.assessment} />
        <DetailBlock label="Labs" value={record.labs_ordered} />
        <DetailBlock label="Plan" value={record.plan} />
        {!record.complaint.trim() &&
        !record.exam.trim() &&
        !record.assessment.trim() &&
        !record.labs_ordered.trim() &&
        !record.plan.trim() ? (
          <p className="record-detail__empty">No note content recorded.</p>
        ) : null}
      </div>
    </Modal>
  )
}
