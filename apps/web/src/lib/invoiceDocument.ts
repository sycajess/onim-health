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

export type InvoiceDocInput = {
  invoice: BillingInvoice
  patient?: Patient
  clinicName?: string
  clinicContact?: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildInvoiceHtml(input: InvoiceDocInput): string {
  const { invoice, patient } = input
  const clinic = input.clinicName || 'Onim Health'
  const contact = input.clinicContact || 'platform.onimhealth.com'
  const lines = parseBillingServices(invoice.services)
  const tier = (invoice.payment_tier ?? 'cash') as BillingTariffTier
  const total = lines.length ? billingLinesTotal(lines, tier) : invoice.amount
  const patientName = patient ? patientFullName(patient) : '—'
  const diagnosis = [invoice.primary_icd10_name, invoice.primary_icd10]
    .filter(Boolean)
    .join(invoice.primary_icd10_name && invoice.primary_icd10 ? ' · ' : '') || '—'

  const lineRows = lines.length
    ? lines
        .map(
          (line) => `
      <tr>
        <td>${escapeHtml(String(line.type || 'Service'))}</td>
        <td>${escapeHtml(line.description || '—')}</td>
        <td class="num">GHS ${billingLineAmount(line, tier).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
      </tr>`,
        )
        .join('')
    : `<tr><td colspan="2">${escapeHtml(invoice.services || 'Services rendered')}</td><td class="num">GHS ${invoice.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(clinic)} Invoice ${escapeHtml(invoice.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, "Times New Roman", serif; color: #1a2e22; margin: 0; padding: 28px; background: #fff; }
    .brand { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1b5e3b; padding-bottom: 14px; margin-bottom: 18px; }
    .brand h1 { margin: 0; font-size: 22px; letter-spacing: 0.4px; color: #1b5e3b; }
    .brand .sub { margin-top: 4px; font-size: 12px; color: #5a6b60; font-family: system-ui, sans-serif; }
    .meta { font-family: system-ui, sans-serif; font-size: 12px; text-align: right; color: #334; }
    .badge { display: inline-block; margin-top: 6px; padding: 3px 8px; border-radius: 999px; background: #e8f5ee; color: #1b5e3b; font-size: 11px; font-weight: 600; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px; color: #1b5e3b; margin: 0 0 10px; font-family: system-ui, sans-serif; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; font-family: system-ui, sans-serif; font-size: 13px; }
    .card { border: 1px solid #c5d5c8; border-radius: 6px; padding: 12px 14px; background: #f8fbf9; }
    .card div { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; font-family: system-ui, sans-serif; font-size: 13px; margin-bottom: 16px; }
    th { text-align: left; background: #1b5e3b; color: #fff; padding: 8px 10px; font-weight: 600; }
    td { border-bottom: 1px solid #dde5df; padding: 8px 10px; vertical-align: top; }
    td.num, th.num { text-align: right; }
    .totals { font-family: system-ui, sans-serif; margin-left: auto; width: 280px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totals .grand { border-top: 2px solid #1b5e3b; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; }
    .notes { font-family: system-ui, sans-serif; font-size: 12px; color: #555; margin-top: 16px; }
    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #c5d5c8; font-family: system-ui, sans-serif; font-size: 11px; color: #667; line-height: 1.5; }
    .actions { margin: 16px 0 8px; font-family: system-ui, sans-serif; }
    .actions button { background: #1b5e3b; color: #fff; border: 0; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
    @media print {
      .actions { display: none; }
      body { padding: 12px; }
    }
  </style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">Save as PDF / Print</button></div>
  <div class="brand">
    <div>
      <h1>${escapeHtml(clinic)}</h1>
      <div class="sub">Electronic Health Record · Patient Invoice</div>
      <div class="sub">${escapeHtml(contact)}</div>
    </div>
    <div class="meta">
      <div><strong>Invoice</strong> ${escapeHtml(invoice.id)}</div>
      <div>Date: ${escapeHtml(fmtDate(invoice.date))}</div>
      <div class="badge">${escapeHtml(invoice.status)}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Bill to</h2>
      <div><strong>${escapeHtml(patientName)}</strong></div>
      <div>Patient ID: ${escapeHtml(patient?.id || '—')}</div>
      <div>DOB / Sex: ${escapeHtml([patient?.dob, patient?.sex].filter(Boolean).join(' · ') || '—')}</div>
      <div>Phone: ${escapeHtml(patient?.phone || '—')}</div>
      <div>Email: ${escapeHtml(patient?.email || '—')}</div>
      ${patient?.nhis ? `<div>NHIS: ${escapeHtml(patient.nhis)}</div>` : ''}
    </div>
    <div class="card">
      <h2>Clinical summary</h2>
      <div>Primary diagnosis (ICD-10): ${escapeHtml(diagnosis)}</div>
      <div>Tariff: ${escapeHtml(tier.replace(/_/g, ' '))}</div>
      <div>Payment: ${escapeHtml(billingPaymentMethod(invoice.status))}</div>
    </div>
  </div>

  <h2>Services rendered</h2>
  <table>
    <thead>
      <tr><th>Service</th><th>Description</th><th class="num">Amount</th></tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <div class="totals">
    <div class="row grand"><span>Total due</span><span>GHS ${total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span></div>
  </div>

  ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(invoice.notes)}</div>` : ''}

  <div class="footer">
    This document was generated from the ${escapeHtml(clinic)} electronic health record system for billing and patient communication.
    Please retain a copy for your records. For questions about this invoice, contact the clinic.
  </div>
</body>
</html>`
}

export function openInvoicePrint(input: InvoiceDocInput) {
  const html = buildInvoiceHtml(input)
  const win = window.open('', '_blank', 'noopener,noreferrer,width=860,height=1000')
  if (!win) {
    window.alert('Please allow pop-ups to save or print the invoice PDF.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

export function emailInvoiceToPatient(input: InvoiceDocInput) {
  const { invoice, patient } = input
  if (!patient?.email?.trim()) {
    window.alert('This patient has no email on file. Add an email on the patient profile, or use Save as PDF and share manually.')
    return
  }
  const clinic = input.clinicName || 'Onim Health'
  const name = patientFullName(patient)
  const lines = parseBillingServices(invoice.services)
  const tier = (invoice.payment_tier ?? 'cash') as BillingTariffTier
  const total = lines.length ? billingLinesTotal(lines, tier) : invoice.amount
  const subject = encodeURIComponent(`${clinic} Invoice ${invoice.id} — ${name}`)
  const body = encodeURIComponent(
    [
      `${clinic} — Patient Invoice`,
      '',
      `Dear ${name},`,
      '',
      `Please find your invoice summary below. You can also request a PDF copy from the clinic.`,
      '',
      `Invoice: ${invoice.id}`,
      `Date: ${fmtDate(invoice.date)}`,
      `Status: ${invoice.status}`,
      `Total: GHS ${total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`,
      '',
      'Services:',
      ...(lines.length
        ? lines.map((l) => `- ${l.type}${l.description ? `: ${l.description}` : ''} — GHS ${billingLineAmount(l, tier).toFixed(2)}`)
        : [`- ${invoice.services || 'Services rendered'}`]),
      '',
      invoice.notes ? `Notes: ${invoice.notes}` : '',
      '',
      'Thank you for choosing Onim Health.',
    ]
      .filter((line) => line !== undefined)
      .join('\n'),
  )
  window.location.href = `mailto:${encodeURIComponent(patient.email.trim())}?subject=${subject}&body=${body}`
}
