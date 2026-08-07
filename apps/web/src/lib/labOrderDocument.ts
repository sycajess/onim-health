import { patientFullName, type MedicalRecord, type Patient } from '@onim/data'
import { LAB_ORDER_OPTIONS, parseLabsOrdered } from './labOrderOptions'

export type LabOrderClinician = {
  name?: string
  phone?: string
  email?: string
  licenseNumber?: string
}

type LabOrderDocInput = {
  patient?: Patient
  record: Pick<MedicalRecord, 'date' | 'provider' | 'specialty' | 'labs_ordered' | 'complaint' | 'assessment' | 'plan'>
  clinician?: LabOrderClinician
  requisitionNo?: string
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sexBoxes(sex: string | undefined) {
  const s = (sex ?? '').toLowerCase()
  const male = s.startsWith('m') ? '☑' : '☐'
  const female = s.startsWith('f') ? '☑' : '☐'
  return `${male} Male &nbsp;&nbsp; ${female} Female`
}

function mark(checked: boolean) {
  return checked ? '☑' : '☐'
}

/** Matches ONIM Health Laboratory Test Requisition Form */
export function buildLabOrderHtml(input: LabOrderDocInput): string {
  const selected = parseLabsOrdered(input.record.labs_ordered)
  const selectedSet = new Set(selected.map((s) => s.toLowerCase()))
  const knownLower = new Set(LAB_ORDER_OPTIONS.map((l) => l.toLowerCase()))
  const otherTests = selected.filter((s) => !knownLower.has(s.toLowerCase()))

  const name = input.patient ? patientFullName(input.patient) : '—'
  const clinicianName = input.clinician?.name || input.record.provider || '—'
  const clinicianContact = [input.clinician?.phone, input.clinician?.email].filter(Boolean).join(' / ') || '—'
  const clinicalIndication = [input.record.complaint, input.record.assessment, input.record.plan]
    .filter((x) => x?.trim())
    .join('\n\n')
  const meds = input.patient?.current_meds?.trim() || '—'

  const routineRows = LAB_ORDER_OPTIONS.map((lab) => {
    const on = selectedSet.has(lab.toLowerCase())
    return `<label class="lab">${mark(on)} ${escapeHtml(lab)}</label>`
  }).join('')

  const otherRows = [0, 1, 2]
    .map((i) => {
      const val = otherTests[i] ?? ''
      return `<div class="other-line">${mark(!!val)} ${val ? escapeHtml(val) : '______________________________'}</div>`
    })
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Laboratory Test Requisition — ${escapeHtml(name)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1a2e1a; margin: 28px; font-size: 12px; line-height: 1.4; }
    .brand { text-align: center; margin-bottom: 6px; }
    .brand h1 { margin: 0; font-size: 20px; letter-spacing: 0.5px; color: #1b5e3b; }
    .brand h2 { margin: 6px 0 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .top-meta { display: flex; justify-content: space-between; gap: 16px; margin: 14px 0 16px; font-size: 12px; }
    .section { border: 1px solid #2d5a3d; border-radius: 4px; padding: 10px 12px; margin-bottom: 12px; }
    .section h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #1b5e3b; border-bottom: 1px solid #c5d5c8; padding-bottom: 4px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; }
    .field { margin: 3px 0; }
    .labs { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 14px; }
    .lab, .other-line { display: block; }
    .notes-box { min-height: 48px; border: 1px dashed #9bb3a3; border-radius: 3px; padding: 8px; white-space: pre-wrap; margin-top: 4px; }
    .footer { margin-top: 16px; font-size: 11px; color: #4a5f4a; text-align: center; }
    .footer strong { color: #1b5e3b; }
    @media print {
      body { margin: 12mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:14px;">
    <button onclick="window.print()" style="padding:8px 14px;margin-right:8px;">Print / Save PDF</button>
    <button onclick="window.close()" style="padding:8px 14px;">Close</button>
  </div>

  <div class="brand">
    <h1>ONIM HEALTH</h1>
    <h2>Laboratory Test Requisition Form</h2>
  </div>

  <div class="top-meta">
    <div><strong>Requisition No.:</strong> ${escapeHtml(input.requisitionNo || '____________')}</div>
    <div><strong>Date:</strong> ${escapeHtml(input.record.date || '__ / __ / ____')}</div>
  </div>

  <div class="section">
    <h3>Patient Information</h3>
    <div class="grid2">
      <div class="field"><strong>Patient Name:</strong> ${escapeHtml(name)}</div>
      <div class="field"><strong>Patient ID:</strong> ${escapeHtml(input.patient?.id ?? '—')}</div>
      <div class="field"><strong>Date of Birth:</strong> ${escapeHtml(input.patient?.dob || '__ / __ / ______')}</div>
      <div class="field"><strong>Sex:</strong> ${sexBoxes(input.patient?.sex)}</div>
      <div class="field"><strong>Phone Number:</strong> ${escapeHtml(input.patient?.phone || '—')}</div>
      <div class="field"><strong>Email:</strong> ${escapeHtml(input.patient?.email || '—')}</div>
    </div>
  </div>

  <div class="section">
    <h3>Laboratory Test(s) Requested</h3>
    <div style="font-weight:600;margin-bottom:6px;">Routine Tests</div>
    <div class="labs">${routineRows}</div>
    <div style="font-weight:600;margin:12px 0 6px;">Other Test(s)</div>
    ${otherRows}
  </div>

  <div class="section">
    <h3>Clinical Information</h3>
    <div><strong>Clinical Indication / Relevant History:</strong></div>
    <div class="notes-box">${escapeHtml(clinicalIndication || '')}</div>
    <div style="margin-top:10px;"><strong>Current Medication(s), if relevant:</strong></div>
    <div class="notes-box">${escapeHtml(meds === '—' ? '' : meds)}</div>
  </div>

  <div class="section">
    <h3>Requesting Clinician</h3>
    <div class="grid2">
      <div class="field"><strong>Clinician Name:</strong> ${escapeHtml(clinicianName)}</div>
      <div class="field"><strong>Professional/Registration No.:</strong> ${escapeHtml(input.clinician?.licenseNumber || '—')}</div>
      <div class="field"><strong>Phone / Email:</strong> ${escapeHtml(clinicianContact)}</div>
      <div class="field"><strong>Specialty:</strong> ${escapeHtml(input.record.specialty || '—')}</div>
    </div>
    <div style="margin-top:14px;" class="grid2">
      <div><strong>Signature:</strong> ____________________________</div>
      <div><strong>Date:</strong> ${escapeHtml(input.record.date || '__ / __ / ____')}</div>
    </div>
  </div>

  <div class="footer">
    <strong>ONIM HEALTH</strong><br/>
    Virtual Healthcare • Patient-Centered Care<br/><br/>
    Laboratory: Please provide the completed laboratory results to the patient and/or requesting clinician as instructed.<br/>
    For clinical use only.
  </div>
</body>
</html>`
}

export function openLabOrderPrint(input: LabOrderDocInput) {
  const html = buildLabOrderHtml(input)
  const win = window.open('', '_blank', 'noopener,noreferrer,width=860,height=1000')
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
  const clinicianName = input.clinician?.name || input.record.provider || '—'
  const subject = encodeURIComponent(`ONIM Health Lab Requisition — ${name} (${input.record.date})`)
  const body = encodeURIComponent(
    [
      'ONIM HEALTH — Laboratory Test Requisition Form',
      '',
      `Patient: ${name}`,
      `Patient ID: ${input.patient?.id ?? '—'}`,
      `DOB / Sex: ${[input.patient?.dob, input.patient?.sex].filter(Boolean).join(' · ') || '—'}`,
      `Phone: ${input.patient?.phone || '—'}`,
      `Email: ${input.patient?.email || '—'}`,
      `Date: ${input.record.date}`,
      `Requesting clinician: ${clinicianName}`,
      '',
      'Investigations requested:',
      ...labs.map((l) => `☑ ${l}`),
      '',
      'Please return completed results to the patient and/or requesting clinician.',
    ].join('\n'),
  )
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}
