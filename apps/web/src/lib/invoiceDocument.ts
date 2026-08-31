import type { BillingInvoice, Patient } from '@onim/data'
import {
  billingLineAmount,
  billingPaymentMethod,
  parseBillingServices,
  patientFullName,
  type BillingLineItem,
  type BillingTariffTier,
} from '@onim/data'

export type InvoiceDocInput = {
  invoice: BillingInvoice
  patient?: Patient
  clinicName?: string
  clinicContact?: string
  /** Absolute logo URL for print window (defaults to /onim-logo.png on current origin) */
  logoUrl?: string
  shipping?: number
}

const CLINIC = {
  name: 'Onim Health',
  email: 'enquiry@onimhealth.com',
  phone: '0557145452',
  addressLines: ['Offin Street, Adabraka', 'Accra, Ghana'],
  momo: '055 714 5452',
  bankName: 'GCB Bank',
  bankBranch: 'Madina',
  accountName: 'Onim Health',
  accountNumber: '1231440000754',
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatGhDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function formatMoney(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return `GH₵ ${v.toLocaleString('en-GH', { minimumFractionDigits: v % 1 ? 1 : 0, maximumFractionDigits: 2 })}`
}

function productLabel(line: BillingLineItem): string {
  const desc = line.description?.trim()
  if (desc) return desc
  return String(line.type || 'Service')
}

function isShippingLine(line: BillingLineItem): boolean {
  const hay = `${line.type} ${line.description}`.toLowerCase()
  return /\bshipping\b|\bdelivery\b/.test(hay)
}

function lineQty(line: BillingLineItem): number {
  const q = Number(line.qty)
  return q > 0 ? q : 1
}

function lineRate(line: BillingLineItem, tier: BillingTariffTier): number {
  const amount = billingLineAmount(line, tier)
  const qty = lineQty(line)
  // Prefer stored unit price when amount looks like a line total
  if (qty > 1 && amount > 0) return amount / qty
  return amount
}

function lineAmount(line: BillingLineItem, tier: BillingTariffTier): number {
  return billingLineAmount(line, tier)
}

export function buildInvoiceHtml(input: InvoiceDocInput): string {
  const { invoice, patient } = input
  const clinic = input.clinicName || CLINIC.name
  const logo =
    input.logoUrl ||
    (typeof window !== 'undefined' ? `${window.location.origin}/onim-logo.png` : '/onim-logo.png')
  const lines = parseBillingServices(invoice.services)
  const tier = (invoice.payment_tier ?? 'cash') as BillingTariffTier

  const productLines = lines.filter((l) => !isShippingLine(l))
  const shippingFromLines = lines.filter(isShippingLine).reduce((sum, l) => sum + lineAmount(l, tier), 0)
  const shipping = input.shipping != null ? Number(input.shipping) : shippingFromLines
  const subtotal = productLines.length
    ? productLines.reduce((sum, l) => sum + lineAmount(l, tier), 0)
    : Number(invoice.amount) || 0
  const total = productLines.length || shippingFromLines ? subtotal + shipping : Number(invoice.amount) || subtotal + shipping

  const patientName = patient ? patientFullName(patient) : '—'
  const billedToOrg = patient?.specialty?.trim() || ''
  const billedToLocation = [patient?.address?.trim(), 'Ghana'].filter(Boolean).join(', ') || 'Ghana'

  const invoiceNo = String(invoice.id).replace(/^B0*/, '') || invoice.id
  const invoiceDate = formatGhDate(invoice.date)
  const dueDate = invoiceDate

  const displayLines = productLines.length
    ? productLines
    : lines.length
      ? lines
      : [{ type: 'Other', description: invoice.services || 'Services rendered', cashPrice: invoice.amount, privateInsurancePrice: invoice.amount, nhisTariff: invoice.amount, qty: 1 }]

  const lineRows = displayLines
    .map((line) => {
      const qty = lineQty(line)
      const rate = lineRate(line, tier)
      const amount = lineAmount(line, tier)
      return `
      <tr>
        <td class="product">${escapeHtml(productLabel(line))}</td>
        <td class="num">${qty}</td>
        <td class="num">${escapeHtml(formatMoney(rate))}</td>
        <td class="num">${escapeHtml(formatMoney(amount))}</td>
      </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(clinic)} Invoice ${escapeHtml(invoice.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 36px 40px;
      background: #fff;
      color: #111;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      line-height: 1.35;
    }
    .actions { margin-bottom: 16px; }
    .actions button {
      background: #1b7a45;
      color: #fff;
      border: 0;
      padding: 9px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
    .header {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: start;
      gap: 12px;
      margin-bottom: 28px;
    }
    .logo-wrap { display: flex; flex-direction: column; align-items: flex-start; }
    .logo-wrap img { height: 54px; width: auto; object-fit: contain; }
    .logo-fallback {
      font-size: 18px;
      font-weight: 700;
      color: #1b7a45;
      letter-spacing: 0.4px;
    }
    .title-wrap { text-align: center; padding-top: 8px; }
    .title-wrap h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #111;
      border-bottom: 2px dashed #222;
      display: inline-block;
      padding: 0 8px 4px;
    }
    .meta {
      text-align: right;
      font-size: 13px;
      line-height: 1.55;
      padding-top: 4px;
    }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 36px;
    }
    .party {
      border: 1.5px solid #6fbf86;
      border-radius: 2px;
      padding: 12px 14px;
      min-height: 110px;
    }
    .party h2 {
      margin: 0 0 8px;
      font-size: 14px;
      font-weight: 700;
    }
    .party p { margin: 0 0 3px; }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    table.items thead th {
      color: #fff;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      background: linear-gradient(90deg, #7ed09a 0%, #1b7a45 100%);
    }
    table.items thead th.num { text-align: right; }
    table.items tbody td {
      padding: 12px;
      border-bottom: 1px solid #e5e5e5;
      vertical-align: top;
    }
    table.items tbody td.num { text-align: right; white-space: nowrap; }
    table.items tbody td.product { width: 48%; }
    .rule {
      border: 0;
      border-top: 1px solid #cfcfcf;
      margin: 10px 0 14px;
    }
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
      margin-bottom: 28px;
    }
    .totals {
      width: 260px;
      font-size: 13px;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .totals .row.total {
      font-weight: 700;
      font-size: 14px;
      border-top: 1px solid #bbb;
      border-bottom: 3px double #222;
      margin-top: 6px;
      padding-top: 8px;
      padding-bottom: 6px;
    }
    .pay {
      text-align: center;
      margin-top: 28px;
      padding-top: 18px;
      border-top: 1px solid #ddd;
      font-size: 13px;
      line-height: 1.55;
    }
    .pay h3 {
      margin: 0 0 8px;
      font-size: 14px;
      font-weight: 700;
    }
    .notes {
      margin-top: 18px;
      font-size: 12px;
      color: #444;
    }
    @media print {
      .actions { display: none !important; }
      body { padding: 18px 22px; }
    }
  </style>
</head>
<body>
  <div class="actions"><button type="button" onclick="window.print()">Save as PDF / Print</button></div>

  <div class="header">
    <div class="logo-wrap">
      <img src="${escapeHtml(logo)}" alt="${escapeHtml(clinic)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
      <div class="logo-fallback" style="display:none">${escapeHtml(clinic).toUpperCase()}</div>
    </div>
    <div class="title-wrap"><h1>Invoice</h1></div>
    <div class="meta">
      <div><strong>Invoice Number:</strong> ${escapeHtml(invoiceNo)}</div>
      <div><strong>Invoice Date:</strong> ${escapeHtml(invoiceDate)}</div>
      <div><strong>Due Date:</strong> ${escapeHtml(dueDate)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h2>Billed By</h2>
      <p>${escapeHtml(clinic)}</p>
      <p>${escapeHtml(CLINIC.email)}</p>
      <p>${escapeHtml(CLINIC.phone)}</p>
      ${CLINIC.addressLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')}
    </div>
    <div class="party">
      <h2>Billed To</h2>
      <p>${escapeHtml(patientName)}</p>
      ${billedToOrg ? `<p>${escapeHtml(billedToOrg)}</p>` : ''}
      ${patient?.phone ? `<p>${escapeHtml(patient.phone)}</p>` : ''}
      ${patient?.email ? `<p>${escapeHtml(patient.email)}</p>` : ''}
      <p>${escapeHtml(billedToLocation)}</p>
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th>Product</th>
        <th class="num">Qty</th>
        <th class="num">Rate</th>
        <th class="num">Amount (GHS)</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>
  <hr class="rule" />

  <div class="totals-wrap">
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${escapeHtml(formatMoney(subtotal))}</span></div>
      <div class="row"><span>Shipping</span><span>${escapeHtml(formatMoney(shipping))}</span></div>
      <div class="row total"><span>Total</span><span>${escapeHtml(formatMoney(total))}</span></div>
    </div>
  </div>

  ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(invoice.notes)}</div>` : ''}

  <div class="pay">
    <h3>Payment Options</h3>
    <div>Momo Number: ${escapeHtml(CLINIC.momo)}</div>
    <div style="margin-top:10px"><strong>Bank Details:</strong></div>
    <div>${escapeHtml(CLINIC.bankName)}</div>
    <div>${escapeHtml(CLINIC.bankBranch)}</div>
    <div>${escapeHtml(CLINIC.accountName)}</div>
    <div>${escapeHtml(CLINIC.accountNumber)}</div>
  </div>
</body>
</html>`
}

export function openInvoicePrint(input: InvoiceDocInput) {
  const html = buildInvoiceHtml(input)
  const win = window.open('', '_blank', 'noopener,noreferrer,width=860,height=1100')
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
  const clinic = input.clinicName || CLINIC.name
  const name = patientFullName(patient)
  const lines = parseBillingServices(invoice.services)
  const tier = (invoice.payment_tier ?? 'cash') as BillingTariffTier
  const amount = lines.reduce((sum, l) => sum + lineAmount(l, tier), 0) || invoice.amount
  const subject = encodeURIComponent(`${clinic} Invoice ${invoice.id} — ${name}`)
  const body = encodeURIComponent(
    [
      `${clinic} — Invoice`,
      '',
      `Dear ${name},`,
      '',
      `Please find your invoice summary below. Open the attached/printed PDF for the full invoice.`,
      '',
      `Invoice: ${invoice.id}`,
      `Date: ${formatGhDate(invoice.date)}`,
      `Amount owed: ${formatMoney(amount)}`,
      '',
      'Payment Options',
      `Momo Number: ${CLINIC.momo}`,
      `Bank: ${CLINIC.bankName} (${CLINIC.bankBranch})`,
      `Account Name: ${CLINIC.accountName}`,
      `Account Number: ${CLINIC.accountNumber}`,
      '',
      'Thank you for choosing Onim Health.',
    ].join('\n'),
  )
  window.location.href = `mailto:${encodeURIComponent(patient.email.trim())}?subject=${subject}&body=${body}`
}

export function openReceiptPrint(input: InvoiceDocInput) {
  const { invoice, patient } = input
  const clinic = input.clinicName || CLINIC.name
  const logo =
    input.logoUrl ||
    (typeof window !== 'undefined' ? `${window.location.origin}/onim-logo.png` : '/onim-logo.png')
  const lines = parseBillingServices(invoice.services)
  const tier = (invoice.payment_tier ?? 'cash') as BillingTariffTier
  const productLines = lines.filter((l) => !isShippingLine(l))
  const shippingFromLines = lines.filter(isShippingLine).reduce((sum, l) => sum + lineAmount(l, tier), 0)
  const shipping = input.shipping != null ? Number(input.shipping) : shippingFromLines
  const subtotal = productLines.length
    ? productLines.reduce((sum, l) => sum + lineAmount(l, tier), 0)
    : Number(invoice.amount) || 0
  const total = productLines.length || shippingFromLines ? subtotal + shipping : Number(invoice.amount) || subtotal + shipping
  const patientName = patient ? patientFullName(patient) : '—'
  const invoiceNo = String(invoice.id).replace(/^B0*/, '') || invoice.id
  const displayLines = productLines.length
    ? productLines
    : lines.length
      ? lines
      : [{ type: 'Other', description: invoice.services || 'Services', cashPrice: invoice.amount, privateInsurancePrice: invoice.amount, nhisTariff: invoice.amount, qty: 1 }]
  const lineRows = displayLines
    .map((line) => `
      <tr>
        <td class="product">${escapeHtml(productLabel(line))}</td>
        <td class="num">${lineQty(line)}</td>
        <td class="num">${escapeHtml(formatMoney(lineRate(line, tier)))}</td>
        <td class="num">${escapeHtml(formatMoney(lineAmount(line, tier)))}</td>
      </tr>`)
    .join('')

  const receiptHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>${escapeHtml(clinic)} Receipt ${escapeHtml(invoice.id)}</title>
<style>
  *{box-sizing:border-box} body{margin:0;padding:36px 40px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111}
  .actions{margin-bottom:16px}.actions button{background:#1b7a45;color:#fff;border:0;padding:9px 14px;border-radius:6px;cursor:pointer}
  .header{display:grid;grid-template-columns:1fr auto 1fr;align-items:start;gap:12px;margin-bottom:28px}
  .logo-wrap img{height:54px;width:auto}.title-wrap{text-align:center;padding-top:8px}
  .title-wrap h1{margin:0;font-size:28px;font-weight:700;border-bottom:2px dashed #222;display:inline-block;padding:0 8px 4px}
  .meta{text-align:right;line-height:1.55}.badge{display:inline-block;margin-top:6px;padding:3px 8px;background:#e8f5ee;color:#1b7a45;font-weight:700;border-radius:999px;font-size:11px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:28px}
  .party{border:1.5px solid #6fbf86;padding:12px 14px}.party h2{margin:0 0 8px;font-size:14px}.party p{margin:0 0 3px}
  table.items{width:100%;border-collapse:collapse} table.items th{color:#fff;padding:10px 12px;background:linear-gradient(90deg,#7ed09a,#1b7a45);text-align:left}
  table.items th.num,table.items td.num{text-align:right} table.items td{padding:12px;border-bottom:1px solid #e5e5e5}
  .totals-wrap{display:flex;justify-content:flex-end;margin-top:12px}.totals{width:260px}
  .totals .row{display:flex;justify-content:space-between;padding:4px 0}.totals .row.total{font-weight:700;border-top:1px solid #bbb;border-bottom:3px double #222;margin-top:6px;padding-top:8px;padding-bottom:6px}
  .pay{text-align:center;margin-top:28px;padding-top:18px;border-top:1px solid #ddd}
  @media print{.actions{display:none!important}}
</style></head><body>
  <div class="actions"><button type="button" onclick="window.print()">Save as PDF / Print</button></div>
  <div class="header">
    <div class="logo-wrap"><img src="${escapeHtml(logo)}" alt="${escapeHtml(clinic)}" /></div>
    <div class="title-wrap"><h1>Receipt</h1></div>
    <div class="meta">
      <div><strong>Receipt Number:</strong> ${escapeHtml(invoiceNo)}</div>
      <div><strong>Date:</strong> ${escapeHtml(formatGhDate(invoice.date))}</div>
      <div class="badge">PAID · ${escapeHtml(billingPaymentMethod(invoice.status))}</div>
    </div>
  </div>
  <div class="parties">
    <div class="party"><h2>From</h2><p>${escapeHtml(clinic)}</p><p>${escapeHtml(CLINIC.email)}</p><p>${escapeHtml(CLINIC.phone)}</p></div>
    <div class="party"><h2>Received From</h2><p>${escapeHtml(patientName)}</p>${patient?.phone ? `<p>${escapeHtml(patient.phone)}</p>` : ''}</div>
  </div>
  <table class="items"><thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount (GHS)</th></tr></thead><tbody>${lineRows}</tbody></table>
  <div class="totals-wrap"><div class="totals">
    <div class="row"><span>Subtotal</span><span>${escapeHtml(formatMoney(subtotal))}</span></div>
    <div class="row"><span>Shipping</span><span>${escapeHtml(formatMoney(shipping))}</span></div>
    <div class="row total"><span>Total Paid</span><span>${escapeHtml(formatMoney(total))}</span></div>
  </div></div>
  <div class="pay"><strong>Thank you for your payment.</strong></div>
</body></html>`

  const win = window.open('', '_blank', 'noopener,noreferrer,width=860,height=1100')
  if (!win) {
    window.alert('Please allow pop-ups to save or print the receipt PDF.')
    return
  }
  win.document.open()
  win.document.write(receiptHtml)
  win.document.close()
}

export function emailReceiptToPatient(input: InvoiceDocInput) {
  const { invoice, patient } = input
  if (!patient?.email?.trim()) {
    window.alert('This patient has no email on file. Add an email on the patient profile, or use Save as PDF.')
    return
  }
  const clinic = input.clinicName || CLINIC.name
  const name = patientFullName(patient)
  const lines = parseBillingServices(invoice.services)
  const tier = (invoice.payment_tier ?? 'cash') as BillingTariffTier
  const amount = lines.reduce((sum, l) => sum + lineAmount(l, tier), 0) || invoice.amount
  const subject = encodeURIComponent(`${clinic} Payment Receipt ${invoice.id} — ${name}`)
  const body = encodeURIComponent(
    [
      `${clinic} — Payment Receipt`,
      '',
      `Dear ${name},`,
      '',
      `Thank you for your payment.`,
      '',
      `Receipt: ${invoice.id}`,
      `Date: ${formatGhDate(invoice.date)}`,
      `Paid by: ${billingPaymentMethod(invoice.status)}`,
      `Amount paid: ${formatMoney(amount)}`,
      '',
      'Thank you for choosing Onim Health.',
    ].join('\n'),
  )
  window.location.href = `mailto:${encodeURIComponent(patient.email.trim())}?subject=${subject}&body=${body}`
}
