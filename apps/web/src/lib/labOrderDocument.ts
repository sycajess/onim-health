import { patientFullName, type MedicalRecord, type Patient } from '@onim/data'
import { parseLabsOrdered } from './labOrderOptions'

type LabOrderDocInput = {
  patient?: Patient
  record: Pick<MedicalRecord, 'date' | 'provider' | 'specialty' | 'labs_ordered' | 'complaint' | 'assessment'>
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildLabOrderHtml(input: LabOrderDocInput): string {
  const labs = parseLabsOrdered(input.record.labs_ordered)
  const name = input.patient ? patientFullName(input.patient) : '—'
  const rows = labs
    .map(
      (lab) =>
        `<tr><td style="padding:8px 10px;border-bottom:1px solid #ddd;">☐</td><td style="padding:8px 10px;border-bottom:1px solid #ddd;">${escapeHtml(lab)}</td></tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Lab Order — ${escapeHtml(name)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a2e1a; margin: 32px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .sub { color: #5a6b5a; font-size: 13px; margin-bottom: 24px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .notes { margin-top: 20px; font-size: 13px; }
    .footer { margin-top: 36px; font-size: 12px; color: #5a6b5a; }
    @media print { body { margin: 16px; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;">
    <button onclick="window.print()" style="padding:8px 14px;margin-right:8px;">Print / Save PDF</button>
    <button onclick="window.close()" style="padding:8px 14px;">Close</button>
  </div>
  <h1>Onim Health — Lab Order</h1>
  <div class="sub">Please perform the checked investigations and return results to the clinic.</div>
  <div class="meta">
    <div><strong>Patient:</strong> ${escapeHtml(name)}</div>
    <div><strong>Patient ID:</strong> ${escapeHtml(input.patient?.id ?? '—')}</div>
    <div><strong>Date:</strong> ${escapeHtml(input.record.date)}</div>
    <div><strong>Ordered by:</strong> ${escapeHtml(input.record.provider || '—')}</div>
    <div><strong>Specialty:</strong> ${escapeHtml(input.record.specialty || '—')}</div>
    <div><strong>DOB / Sex:</strong> ${escapeHtml([input.patient?.dob, input.patient?.sex].filter(Boolean).join(' · ') || '—')}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:8px 10px;border-bottom:2px solid #1a2e1a;width:40px;"></th>
        <th style="text-align:left;padding:8px 10px;border-bottom:2px solid #1a2e1a;">Investigation</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="2" style="padding:8px 10px;">No labs selected.</td></tr>'}</tbody>
  </table>
  ${
    input.record.complaint || input.record.assessment
      ? `<div class="notes"><strong>Clinical notes</strong><br/>${escapeHtml(
          [input.record.complaint && `Complaint: ${input.record.complaint}`, input.record.assessment && `Assessment: ${input.record.assessment}`]
            .filter(Boolean)
            .join('\n'),
        ).replace(/\n/g, '<br/>')}</div>`
      : ''
  }
  <div class="footer">
    Onim Health · platform.onimhealth.com<br/>
    Sign / stamp: ____________________________ &nbsp;&nbsp; Date: ______________
  </div>
</body>
</html>`
}

export function openLabOrderPrint(input: LabOrderDocInput) {
  const html = buildLabOrderHtml(input)
  const win = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900')
  if (!win) {
    window.alert('Please allow pop-ups to print or save the lab order PDF.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

export function emailLabOrder(input: LabOrderDocInput) {
  const labs = parseLabsOrdered(input.record.labs_ordered)
  const name = input.patient ? patientFullName(input.patient) : 'Patient'
  const subject = encodeURIComponent(`Lab order — ${name} (${input.record.date})`)
  const body = encodeURIComponent(
    [
      'Onim Health — Lab Order',
      '',
      `Patient: ${name}`,
      `Patient ID: ${input.patient?.id ?? '—'}`,
      `Date: ${input.record.date}`,
      `Ordered by: ${input.record.provider || '—'}`,
      '',
      'Investigations requested:',
      ...labs.map((l) => `• ${l}`),
      '',
      'Please attach or reply with results.',
    ].join('\n'),
  )
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}
