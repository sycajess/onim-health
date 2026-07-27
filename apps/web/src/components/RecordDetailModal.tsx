import { fmtDate, displayField, type MedicalRecord } from '@onim/data'
import { Modal } from '@onim/ui'

type RecordDetailModalProps = {
  record: MedicalRecord | null
  open: boolean
  onClose: () => void
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

export function RecordDetailModal({ record, open, onClose }: RecordDetailModalProps) {
  if (!record) return null

  const vitals = [
    record.bp?.trim() ? `BP ${record.bp}` : '',
    record.temp?.trim() ? `Temp ${record.temp}` : '',
    record.weight ? `Weight ${record.weight} kg` : '',
  ].filter(Boolean).join(' · ')

  return (
    <Modal
      open={open}
      title={`${record.type} — ${fmtDate(record.date)}`}
      onClose={onClose}
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
        <DetailBlock label="Labs to be ordered" value={record.labs_ordered} />
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
