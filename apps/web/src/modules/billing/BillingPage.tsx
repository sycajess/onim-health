import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import {
  useData,
  fmtDate,
  patientFullName,
  formatBillingServicesSummary,
  isPaidBillingStatus,
  type BillingInvoice,
} from '@onim/data'
import { Badge, Button, Card, EmptyState } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import { StatusIconMenu } from '../../components/StatusIconMenu'
import { BillingReceiptModal } from '../../components/BillingReceiptModal'
import { NewInvoiceModal } from '../../components/modals/ClinicModals'
import '@onim/ui/Card.css'

const STATUSES = ['Pending', 'Paid – Cash', 'Paid – MoMo', 'Paid – Insurance', 'Partial']

export function BillingPage() {
  const { db, updateBillingStatus } = useData()
  const { canWriteModule } = usePermissions()
  const canWrite = canWriteModule('billing')
  const [modalOpen, setModalOpen] = useState(false)
  const [receiptInvoice, setReceiptInvoice] = useState<BillingInvoice | null>(null)

  return (
    <div>
      <Card
        title="Billing & Invoices"
        action={canWrite ? <Button variant="primary" onClick={() => setModalOpen(true)}>+ New Invoice</Button> : undefined}
        noPadding
      >
        {db.billing.length ? (
          <table className="data-table">
            <thead>
              <tr><th>Invoice</th><th>Date</th><th>Patient</th><th>Services</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {db.billing.map((b) => {
                const p = db.patients.find((x) => x.id === b.patient_id)
                return (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{fmtDate(b.date)}</td>
                    <td>{p ? <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link> : '–'}</td>
                    <td style={{ maxWidth: 280, fontSize: 12 }}>{formatBillingServicesSummary(b.services)}</td>
                    <td><strong>GHS {b.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</strong></td>
                    <td><Badge>{b.status}</Badge></td>
                    <td>
                      <RowActions>
                        {isPaidBillingStatus(b.status) && (
                          <IconAction icon="paid" label="View receipt" onClick={() => setReceiptInvoice(b)} />
                        )}
                        {canWrite && (
                          <>
                            {!b.status.startsWith('Paid') && (
                              <IconAction icon="paid" label="Mark paid (MoMo)" variant="success" onClick={() => void updateBillingStatus(b.id, 'Paid – MoMo')} />
                            )}
                            <StatusIconMenu value={b.status} options={STATUSES} onChange={(s) => void updateBillingStatus(b.id, s)} />
                          </>
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
      <BillingReceiptModal
        open={!!receiptInvoice}
        onClose={() => setReceiptInvoice(null)}
        invoice={receiptInvoice}
        patient={receiptInvoice ? db.patients.find((p) => p.id === receiptInvoice.patient_id) : undefined}
      />
    </div>
  )
}
