import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import {
  useData,
  fmtDate,
  patientFullName,
  formatBillingServicesSummary,
  isPaidBillingStatus,
  BILLING_TARIFF_LABELS,
  type BillingInvoice,
  type BillingTariffTier,
} from '@onim/data'
import { Badge, Button, Card, EmptyState } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import { StatusIconMenu } from '../../components/StatusIconMenu'
import { BillingReceiptModal } from '../../components/BillingReceiptModal'
import { NewInvoiceModal } from '../../components/modals/ClinicModals'
import { NhisExportModal } from './NhisExportModal'
import '@onim/ui/Card.css'

const STATUSES = ['Pending', 'Paid – Cash', 'Paid – MoMo', 'Paid – Insurance', 'Partial']

export function BillingPage() {
  const { db, updateBillingStatus, updateBillingNhisCleared } = useData()
  const { canWriteModule } = usePermissions()
  const canWrite = canWriteModule('billing')
  const [modalOpen, setModalOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [receiptInvoice, setReceiptInvoice] = useState<BillingInvoice | null>(null)

  return (
    <div>
      <Card
        title="Billing & Invoices"
        action={
          canWrite ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setExportOpen(true)}>Export NHIS XML</Button>
              <Button variant="primary" onClick={() => setModalOpen(true)}>+ New Invoice</Button>
            </div>
          ) : undefined
        }
        noPadding
      >
        {db.billing.length ? (
          <table className="data-table">
            <thead>
              <tr><th>Invoice</th><th>Date</th><th>Patient</th><th>Tier</th><th>ICD-10</th><th>Services</th><th>Amount</th><th>NHIS</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {db.billing.map((b) => {
                const p = db.patients.find((x) => x.id === b.patient_id)
                const tier = BILLING_TARIFF_LABELS[(b.payment_tier as BillingTariffTier) ?? 'cash'] ?? b.payment_tier
                return (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{fmtDate(b.date)}</td>
                    <td>{p ? <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link> : '–'}</td>
                    <td>{tier}</td>
                    <td style={{ fontSize: 12 }}>{b.primary_icd10 || '–'}</td>
                    <td style={{ maxWidth: 220, fontSize: 12 }}>{formatBillingServicesSummary(b.services)}</td>
                    <td><strong>GHS {b.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</strong></td>
                    <td>
                      {b.payment_tier === 'nhis' && canWrite ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <input
                            type="checkbox"
                            checked={b.nhis_cleared}
                            onChange={(e) => void updateBillingNhisCleared(b.id, e.target.checked)}
                          />
                          Cleared
                        </label>
                      ) : b.nhis_cleared ? 'Cleared' : '–'}
                    </td>
                    <td><Badge>{b.status}</Badge></td>
                    <td>
                      <RowActions>
                        {isPaidBillingStatus(b.status) && (
                          <IconAction icon="paid" label="View receipt" onClick={() => setReceiptInvoice(b)} />
                        )}
                        {canWrite && (
                          <StatusIconMenu value={b.status} options={STATUSES} onChange={(s) => void updateBillingStatus(b.id, s)} />
                        )}
                      </RowActions>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState icon="🧾" title="No invoices" />
        )}
      </Card>
      <NewInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <NhisExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <BillingReceiptModal
        open={!!receiptInvoice}
        onClose={() => setReceiptInvoice(null)}
        invoice={receiptInvoice}
        patient={receiptInvoice ? db.patients.find((p) => p.id === receiptInvoice.patient_id) : undefined}
      />
    </div>
  )
}
