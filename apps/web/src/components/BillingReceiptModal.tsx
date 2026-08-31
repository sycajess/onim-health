import type { BillingInvoice, Patient } from '@onim/data'
import {
  billingLineAmount,
  billingLinesTotal,
  billingPaymentMethod,
  fmtDate,
  parseBillingServices,
  patientFullName,
  type BillingTariffTier,
} from '@onim/data'
import { Button, Modal } from '@onim/ui'
import { emailInvoiceToPatient, emailReceiptToPatient, openInvoicePrint, openReceiptPrint } from '../lib/invoiceDocument'

type BillingReceiptModalProps = {
  open: boolean
  onClose: () => void
  invoice: BillingInvoice | null
  patient: Patient | undefined
}

export function BillingReceiptModal({ open, onClose, invoice, patient }: BillingReceiptModalProps) {
  if (!invoice) return null

  const lines = parseBillingServices(invoice.services)
  const tier = (invoice.payment_tier ?? 'cash') as BillingTariffTier
  const total = lines.length ? billingLinesTotal(lines, tier) : invoice.amount
  const paid = invoice.status.startsWith('Paid')

  return (
    <Modal
      open={open}
      title="Payment Receipt"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {paid && (
            <>
              <Button variant="secondary" onClick={() => emailReceiptToPatient({ invoice, patient, clinicName: 'Onim Health' })}>
                Email receipt
              </Button>
              <Button variant="primary" onClick={() => openReceiptPrint({ invoice, patient, clinicName: 'Onim Health' })}>
                Save receipt PDF
              </Button>
            </>
          )}
          {!paid && (
            <>
              <Button variant="secondary" onClick={() => emailInvoiceToPatient({ invoice, patient, clinicName: 'Onim Health' })}>
                Email invoice
              </Button>
              <Button variant="primary" onClick={() => openInvoicePrint({ invoice, patient, clinicName: 'Onim Health' })}>
                Save invoice PDF
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="billing-receipt">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600 }}>Onim Health</div>
          <div style={{ fontSize: 12, color: 'var(--gray4)' }}>Official Payment Receipt</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
          <div><strong>Invoice:</strong> {invoice.id}</div>
          <div><strong>Date:</strong> {fmtDate(invoice.date)}</div>
          <div><strong>Patient:</strong> {patient ? patientFullName(patient) : '–'}</div>
          <div><strong>Status:</strong> {invoice.status}</div>
        </div>

        <table className="data-table" style={{ marginBottom: 16 }}>
          <thead>
            <tr><th>Service</th><th>Description</th><th>Amount (GHS)</th></tr>
          </thead>
          <tbody>
            {lines.length ? lines.map((line, i) => (
              <tr key={i}>
                <td>{line.type}</td>
                <td>{line.description || '–'}</td>
                <td>{billingLineAmount(line, tier).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={2}>{invoice.services || 'Services rendered'}</td>
                <td>{invoice.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ borderTop: '1px solid var(--gray2)', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 600 }}>
            <span>Total</span>
            <span>GHS {total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
          </div>
          {paid && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--teal)' }}>
              Paid by: <strong>{billingPaymentMethod(invoice.status)}</strong>
            </div>
          )}
          {invoice.notes && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray4)' }}>Notes: {invoice.notes}</div>
          )}
        </div>
      </div>
    </Modal>
  )
}
