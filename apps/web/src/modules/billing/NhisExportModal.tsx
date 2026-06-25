import { useState } from 'react'
import {
  useData,
  buildNhisClaimBatchXml,
  downloadNhisClaimXml,
  isNhisClaimInvoice,
  today,
} from '@onim/data'
import { Button, Modal } from '@onim/ui'
import { FormField, FormGrid } from '../../components/FormField'

type NhisExportModalProps = {
  open: boolean
  onClose: () => void
}

export function NhisExportModal({ open, onClose }: NhisExportModalProps) {
  const { db, markBillingNhisExported } = useData()
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())
  const [error, setError] = useState('')

  const eligible = db.billing.filter((b) => {
    if (b.date < from || b.date > to) return false
    if (!isNhisClaimInvoice(b)) return false
    const patient = db.patients.find((p) => p.id === b.patient_id)
    return !!patient?.nhis?.trim()
  })

  async function handleExport() {
    setError('')
    if (!eligible.length) {
      setError('No cleared NHIS invoices in this date range.')
      return
    }
    if (!db.clinicSettings.provider_accreditation.trim()) {
      setError('Set provider accreditation in Settings first.')
      return
    }
    const patients = db.patients.filter((p) => eligible.some((b) => b.patient_id === p.id))
    const xml = buildNhisClaimBatchXml(eligible, patients, {
      providerAccreditation: db.clinicSettings.provider_accreditation,
      eclaimAuthorization: db.clinicSettings.eclaim_authorization,
    })
    downloadNhisClaimXml(`nhis-claims-${from}-to-${to}.xml`, xml)
    await markBillingNhisExported(eligible.map((b) => b.id))
    onClose()
  }

  return (
    <Modal
      open={open}
      title="Export NHIS Claims XML"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void handleExport()} disabled={!eligible.length}>
            Download XML ({eligible.length})
          </Button>
        </>
      }
    >
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <FormGrid>
        <FormField label="From">
          <input className="form-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label="To">
          <input className="form-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>
      </FormGrid>
      <p style={{ fontSize: 12, color: 'var(--gray4)', marginTop: 12 }}>
        Exports cleared NHIS-tier invoices. Upload the file to CLAIM-it.
      </p>
    </Modal>
  )
}
