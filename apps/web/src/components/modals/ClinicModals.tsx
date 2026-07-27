import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@onim/auth'
import {
  useData,
  SPECIALTIES,
  today,
  patientFullName,
  evaluateLabResult,
  labStatusHint,
  BILLING_SERVICE_TYPES,
  BILLING_TARIFF_TIERS,
  BILLING_TARIFF_LABELS,
  billingLinesTotal,
  serializeBillingServices,
  searchGdrgCodes,
  validateInvoiceForSave,
  type BillingLineItem,
  type BillingTariffTier,
  type DrugAllergyAlert,
} from '@onim/data'
import type { InventoryItem } from '@onim/data'
import { Button, Modal, PdfAttachZone } from '@onim/ui'
import type { PdfAttachment } from '@onim/ui'
import { FormField, FormGrid } from '../FormField'
import { MedicationSearch } from '../MedicationSearch'
import { SigCodeInput } from '../SigCodeInput'
import { SearchInput } from '../SearchInput'
import { searchIcd10, searchLoinc } from '../../lib/clinicalTables'
import { checkDrugAllergyWithRxNorm, resolveRxcuiForSave } from '../../lib/drugAllergy'
import { createGoogleMeetLink, ensureGoogleConnected } from '../../lib/googleCalendar'
import '../SearchInput.css'

type PatientSelectProps = {
  value: string
  onChange: (id: string) => void
}

function PatientSelect({ value, onChange }: PatientSelectProps) {
  const { db } = useData()
  return (
    <select className="form-input" value={value} onChange={(e) => onChange(e.target.value)} required>
      <option value="">Select patient…</option>
      {db.patients.map((p) => (
        <option key={p.id} value={p.id}>{patientFullName(p)} ({p.id})</option>
      ))}
    </select>
  )
}

type ModalShellProps = {
  open: boolean
  title: string
  onClose: () => void
  onSave: () => void
  saveLabel?: string
  saveDisabled?: boolean
  children: React.ReactNode
}

function ModalShell({ open, title, onClose, onSave, saveLabel = 'Save', saveDisabled, children }: ModalShellProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSave} disabled={saveDisabled}>{saveLabel}</Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}

export function NewAppointmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addAppointment } = useData()
  const { profile } = useAuth()
  const [patientId, setPatientId] = useState('')
  const [date, setDate] = useState(today())
  const [time, setTime] = useState('09:00 AM')
  const [type, setType] = useState('Consultation')
  const [specialty, setSpecialty] = useState<string>(SPECIALTIES[0])
  const [notes, setNotes] = useState('')
  const [addGoogleMeet, setAddGoogleMeet] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setPatientId('')
    setDate(today())
    setTime('09:00 AM')
    setType('Consultation')
    setSpecialty(SPECIALTIES[0])
    setNotes('')
    setAddGoogleMeet(false)
    setError('')
  }

  async function handleSave() {
    if (!patientId || saving) return
    setError('')

    setSaving(true)
    let meetLink = ''
    if (addGoogleMeet) {
      if (!(await ensureGoogleConnected(profile?.google_calendar_connected))) {
        setSaving(false)
        return
      }
      const meet = await createGoogleMeetLink()
      if ('error' in meet) {
        setError(meet.error)
        setSaving(false)
        return
      }
      meetLink = meet.meetLink
    }

    const ok = await addAppointment({
      patient_id: patientId,
      date,
      time,
      type,
      specialty,
      provider: profile?.full_name ?? '',
      notes,
      meet_link: meetLink,
    })
    setSaving(false)
    if (!ok) return
    reset()
    onClose()
  }

  return (
    <ModalShell
      open={open}
      title="Schedule Appointment"
      onClose={() => { reset(); onClose() }}
      onSave={handleSave}
      saveDisabled={!patientId || saving}
      saveLabel={saving ? 'Saving…' : 'Save'}
    >
      <FormGrid>
        {error && (
          <FormField label=" " span={2}>
            <div className="alert-banner alert-banner--warning">{error}</div>
          </FormField>
        )}
        {addGoogleMeet && !profile?.google_calendar_connected && (
          <FormField label=" " span={2}>
            <div className="alert-banner alert-banner--info">
              Creates a Meet link only. After saving, use “Add to Calendar” on the appointment if you want it on Google Calendar.
            </div>
          </FormField>
        )}
        <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        <FormField label="Date"><input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Time"><input className="form-input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="09:00 AM" /></FormField>
        <FormField label="Type">
          <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
            {['Consultation', 'Follow-up', 'Telemedicine', 'Lab Review'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Specialty">
          <select className="form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Notes" span={2}><textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
        <FormField label="Google Meet" span={2}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={addGoogleMeet}
              onChange={(e) => setAddGoogleMeet(e.target.checked)}
            />
            Create Meet link now (optional — add to calendar after)
          </label>
        </FormField>
      </FormGrid>
    </ModalShell>
  )
}

export function NewRecordModal({
  open,
  onClose,
  patientId: lockedPatientId,
}: {
  open: boolean
  onClose: () => void
  patientId?: string
}) {
  const { addRecord } = useData()
  const { profile } = useAuth()
  const [patientId, setPatientId] = useState(lockedPatientId ?? '')
  const [date, setDate] = useState(today())
  const [type, setType] = useState('Consultation Note')
  const [specialty, setSpecialty] = useState<string>(SPECIALTIES[0])
  const [complaint, setComplaint] = useState('')
  const [assessment, setAssessment] = useState('')
  const [labsOrdered, setLabsOrdered] = useState('')
  const [plan, setPlan] = useState('')

  useEffect(() => {
    if (!open) return
    if (lockedPatientId) setPatientId(lockedPatientId)
  }, [open, lockedPatientId])

  function reset() {
    setPatientId(lockedPatientId ?? '')
    setDate(today())
    setType('Consultation Note')
    setSpecialty(SPECIALTIES[0])
    setComplaint('')
    setAssessment('')
    setLabsOrdered('')
    setPlan('')
  }

  async function handleSave() {
    if (!patientId) return
    const ok = await addRecord({
      patient_id: patientId,
      date,
      type,
      specialty,
      complaint,
      assessment,
      labs_ordered: labsOrdered,
      plan,
      provider: profile?.full_name ?? '',
    })
    if (!ok) return
    reset()
    onClose()
  }

  return (
    <ModalShell open={open} title="New Medical Record" onClose={() => { reset(); onClose() }} onSave={handleSave} saveDisabled={!patientId}>
      <FormGrid>
        {!lockedPatientId && (
          <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        )}
        <FormField label="Date"><input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Type"><input className="form-input" value={type} onChange={(e) => setType(e.target.value)} /></FormField>
        <FormField label="Specialty" span={2}>
          <select className="form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Chief complaint" span={2}><textarea className="form-input" rows={2} value={complaint} onChange={(e) => setComplaint(e.target.value)} /></FormField>
        <FormField label="Assessment" span={2}><textarea className="form-input" rows={2} value={assessment} onChange={(e) => setAssessment(e.target.value)} /></FormField>
        <FormField label="Labs to be ordered" span={2}>
          <textarea
            className="form-input"
            rows={2}
            value={labsOrdered}
            onChange={(e) => setLabsOrdered(e.target.value)}
            placeholder="e.g. CBC, HbA1c, Lipid panel"
          />
        </FormField>
        <FormField label="Plan" span={2}><textarea className="form-input" rows={2} value={plan} onChange={(e) => setPlan(e.target.value)} /></FormField>
      </FormGrid>
    </ModalShell>
  )
}

export function NewPrescriptionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, addPrescription } = useData()
  const { profile } = useAuth()
  const [patientId, setPatientId] = useState('')
  const [medication, setMedication] = useState('')
  const [medRxcui, setMedRxcui] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [route, setRoute] = useState('By mouth (oral)')
  const [duration, setDuration] = useState('30 days')
  const [qty, setQty] = useState('1')
  const [dispense, setDispense] = useState(false)
  const [inventoryMedId, setInventoryMedId] = useState('')
  const [allergyAlert, setAllergyAlert] = useState<DrugAllergyAlert | null>(null)

  const patient = db.patients.find((p) => p.id === patientId)
  const canSave = !!patientId && medication.trim().length > 0

  useEffect(() => {
    if (!patient || !medication.trim()) {
      setAllergyAlert(null)
      return
    }
    let cancelled = false
    void (async () => {
      const alert = await checkDrugAllergyWithRxNorm(patient, medication, medRxcui)
      if (cancelled) return
      setAllergyAlert(alert)
    })()
    return () => { cancelled = true }
  }, [patient, medication, medRxcui])

  function reset() {
    setPatientId('')
    setMedication('')
    setMedRxcui('')
    setDosage('')
    setFrequency('')
    setRoute('By mouth (oral)')
    setDuration('30 days')
    setQty('1')
    setDispense(false)
    setInventoryMedId('')
    setAllergyAlert(null)
  }

  async function handleSave() {
    if (!canSave) return
    const rxcui = await resolveRxcuiForSave(medication, medRxcui)
    const ok = await addPrescription({
      patient_id: patientId,
      med_id: dispense ? inventoryMedId : '',
      medication: medication.trim(),
      med_rxcui: rxcui || undefined,
      dosage,
      frequency,
      route,
      duration,
      qty: Number(qty) || 1,
      dispense: dispense && !!inventoryMedId,
      provider: profile?.full_name ?? '',
      patient_name: patient ? patientFullName(patient) : '',
    })
    if (!ok) return
    reset()
    onClose()
  }

  return (
    <ModalShell open={open} title="New Prescription" onClose={() => { reset(); onClose() }} onSave={handleSave} saveDisabled={!canSave}>
      <FormGrid>
        <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        {allergyAlert && (
          <FormField label=" " span={2}>
            <div className="alert-banner alert-banner--warning">{allergyAlert.message}</div>
          </FormField>
        )}
        <FormField label="Medication" span={2}>
          <MedicationSearch
            value={medication}
            onChange={(name) => {
              setMedication(name)
              if (!name.trim()) setMedRxcui('')
            }}
            onSelectDrug={(drug) => {
              setMedRxcui(drug.rxcui)
            }}
          />
        </FormField>
        <FormField label="Strength / Dosage">
          <input className="form-input" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 500mg" />
        </FormField>
        <FormField label="Directions (frequency)">
          <SigCodeInput value={frequency} onChange={setFrequency} />
        </FormField>
        <FormField label="Route of use">
          <input className="form-input" value={route} onChange={(e) => setRoute(e.target.value)} />
        </FormField>
        <FormField label="Duration"><input className="form-input" value={duration} onChange={(e) => setDuration(e.target.value)} /></FormField>
        <FormField label="Qty to dispense"><input className="form-input" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} /></FormField>
        <FormField label="Dispense from clinic inventory" span={2}>
          <select className="form-input" value={inventoryMedId} onChange={(e) => setInventoryMedId(e.target.value)}>
            <option value="">Not dispensing from inventory</option>
            {db.inventory.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.strength} (stock: {m.qty})</option>)}
          </select>
        </FormField>
        <FormField label="Dispense now" span={2}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={dispense}
              disabled={!inventoryMedId}
              onChange={(e) => setDispense(e.target.checked)}
            />
            Deduct from inventory immediately
          </label>
        </FormField>
      </FormGrid>
    </ModalShell>
  )
}

export function NewLabModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addLabResult } = useData()
  const { profile } = useAuth()
  const isExternalLab = profile?.role === 'lab_partner'
  const [patientId, setPatientId] = useState('')
  const [test, setTest] = useState('')
  const [date, setDate] = useState(today())
  const [facility, setFacility] = useState('')
  const [uploaderName, setUploaderName] = useState('')
  const [uploaderContact, setUploaderContact] = useState('')
  const [result, setResult] = useState('')
  const [ref, setRef] = useState('')
  const [status, setStatus] = useState('Normal')
  const [statusAuto, setStatusAuto] = useState(true)
  const [notes, setNotes] = useState('')
  const [attachment, setAttachment] = useState<PdfAttachment | null>(null)
  const [parsingPdf, setParsingPdf] = useState(false)
  const [parseMessage, setParseMessage] = useState('')

  useEffect(() => {
    if (!open || isExternalLab) return
    setUploaderName(profile?.full_name ?? '')
    setUploaderContact(profile?.phone ?? '')
  }, [open, isExternalLab, profile?.full_name, profile?.phone])

  useEffect(() => {
    if (!statusAuto || !result.trim() || !ref.trim()) return
    const evaluated = evaluateLabResult(result, ref)
    if (evaluated) setStatus(evaluated)
  }, [result, ref, statusAuto])

  function applyParsed(parsed: {
    test?: string
    result?: string
    ref?: string
    date?: string
    facility?: string
    notes?: string
    filled: string[]
  }) {
    if (parsed.test) setTest(parsed.test)
    if (parsed.result) setResult(parsed.result)
    if (parsed.ref) setRef(parsed.ref)
    if (parsed.date) setDate(parsed.date)
    if (parsed.facility) setFacility(parsed.facility)
    if (parsed.notes) setNotes(parsed.notes)
    if (parsed.filled.length) setStatusAuto(true)
  }

  async function handleLabAttach(file: PdfAttachment) {
    setAttachment(file)
    setParsingPdf(true)
    setParseMessage('')
    try {
      const { parseLabReportFromDataUrl } = await import('../../lib/labReportParser')
      const parsed = await parseLabReportFromDataUrl(file.dataUrl, file.name)
      applyParsed(parsed)
      if (parsed.filled.length) {
        setParseMessage(`Filled from report: ${parsed.filled.join(', ')}. Review and edit before saving.`)
      } else if (parsed.notes) {
        setParseMessage(parsed.notes)
      }
    } finally {
      setParsingPdf(false)
    }
  }

  function reset() {
    setPatientId('')
    setTest('')
    setDate(today())
    setFacility('')
    setUploaderName('')
    setUploaderContact('')
    setResult('')
    setRef('')
    setStatus('Normal')
    setStatusAuto(true)
    setNotes('')
    setAttachment(null)
    setParsingPdf(false)
    setParseMessage('')
  }

  const canSave =
    !!patientId &&
    !!test.trim() &&
    (!isExternalLab || (!!facility.trim() && !!uploaderName.trim() && !!uploaderContact.trim()))

  async function handleSave() {
    if (!canSave) return
    const ok = await addLabResult({
      patient_id: patientId,
      test: test.trim(),
      date,
      facility: facility.trim(),
      result,
      ref,
      status,
      provider: uploaderName.trim() || profile?.full_name || '',
      uploader_name: uploaderName.trim(),
      uploader_contact: uploaderContact.trim(),
      notes,
      attachment: attachment ? { name: attachment.name, data_url: attachment.dataUrl } : null,
    })
    if (!ok) return
    reset()
    onClose()
  }

  return (
    <ModalShell
      open={open}
      title={isExternalLab ? 'Upload External Lab Result' : 'Add Lab Result'}
      onClose={() => { reset(); onClose() }}
      onSave={handleSave}
      saveDisabled={!canSave}
    >
      <FormGrid>
        <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        <FormField label="Attach Lab Report PDF" span={2}>
          <PdfAttachZone
            attachment={attachment}
            onAttach={(file) => void handleLabAttach(file)}
            onRemove={() => {
              setAttachment(null)
              setParseMessage('')
            }}
            label={parsingPdf ? 'Reading report…' : 'Attach PDF'}
          />
          {parsingPdf && (
            <div style={{ fontSize: 12, color: 'var(--gray4)', marginTop: 8 }}>Extracting lab details from PDF…</div>
          )}
          {parseMessage && !parsingPdf && (
            <div className="alert-banner alert-banner--info" style={{ marginTop: 10 }}>{parseMessage}</div>
          )}
        </FormField>
        <FormField label="Test">
          <SearchInput
            value={test}
            onChange={setTest}
            search={searchLoinc}
            placeholder="Search lab test…"
          />
        </FormField>
        <FormField label="Date"><input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label={isExternalLab ? 'Lab / Hospital name *' : 'Lab / Hospital name'}>
          <input
            className="form-input"
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
            placeholder="e.g. City Hospital Laboratory"
          />
        </FormField>
        <FormField label={isExternalLab ? 'Uploaded by *' : 'Uploaded by'}>
          <input
            className="form-input"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            placeholder="Name of person uploading"
          />
        </FormField>
        <FormField label={isExternalLab ? 'Uploader contact *' : 'Uploader contact'} span={2}>
          <input
            className="form-input"
            value={uploaderContact}
            onChange={(e) => setUploaderContact(e.target.value)}
            placeholder="Phone or email"
          />
        </FormField>
        <FormField label="Result"><input className="form-input" value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. 6.2%" /></FormField>
        <FormField label="Reference range"><input className="form-input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 4.0–5.6%" /></FormField>
        {result && ref && (
          <FormField label="Range check" span={2}>
            <div style={{ fontSize: 13, color: 'var(--gray4)' }}>{labStatusHint(result, ref)}</div>
          </FormField>
        )}
        <FormField label="Status" span={2}>
          <select
            className="form-input"
            value={status}
            onChange={(e) => {
              setStatusAuto(false)
              setStatus(e.target.value)
            }}
          >
            {['Normal', 'Abnormal – High', 'Abnormal – Low', 'Critical'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginTop: 8 }}>
            <input type="checkbox" checked={statusAuto} onChange={(e) => setStatusAuto(e.target.checked)} />
            Auto-set status from reference range
          </label>
        </FormField>
        <FormField label="Notes / Interpretation" span={2}>
          <textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
      </FormGrid>
    </ModalShell>
  )
}

type MedicationModalProps = {
  open: boolean
  onClose: () => void
  item?: InventoryItem
}

export function MedicationModal({ open, onClose, item }: MedicationModalProps) {
  const { saveMedication } = useData()
  const [name, setName] = useState('')
  const [generic, setGeneric] = useState('')
  const [category, setCategory] = useState('General')
  const [lot, setLot] = useState('')
  const [expiry, setExpiry] = useState('')
  const [qty, setQty] = useState('0')
  const [threshold, setThreshold] = useState('10')

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setGeneric(item?.generic ?? '')
    setCategory(item?.category ?? 'General')
    setLot(item?.lot ?? '')
    setExpiry(item?.expiry ?? '')
    setQty(String(item?.qty ?? 0))
    setThreshold(String(item?.threshold ?? 10))
  }, [open, item])

  async function handleSave() {
    if (!name.trim() || !lot.trim() || !expiry) return
    const ok = await saveMedication(
      {
        name: name.trim(),
        generic,
        category,
        lot: lot.trim(),
        expiry,
        qty: Number(qty) || 0,
        threshold: Number(threshold) || 10,
      },
      item?.id,
    )
    if (!ok) return
    onClose()
  }

  return (
    <ModalShell
      open={open}
      title={item ? 'Edit Medication' : 'Add Medication'}
      onClose={onClose}
      onSave={handleSave}
      saveDisabled={!name.trim() || !lot.trim() || !expiry}
    >
      <FormGrid>
        <FormField label="Name" span={2}><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} /></FormField>
        <FormField label="Generic"><input className="form-input" value={generic} onChange={(e) => setGeneric(e.target.value)} /></FormField>
        <FormField label="Category"><input className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} /></FormField>
        <FormField label="Lot number"><input className="form-input" value={lot} onChange={(e) => setLot(e.target.value)} /></FormField>
        <FormField label="Expiry"><input className="form-input" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></FormField>
        <FormField label="Quantity"><input className="form-input" type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} /></FormField>
        <FormField label="Reorder threshold"><input className="form-input" type="number" min={0} value={threshold} onChange={(e) => setThreshold(e.target.value)} /></FormField>
      </FormGrid>
    </ModalShell>
  )
}

type DispenseModalProps = {
  open: boolean
  onClose: () => void
  med?: InventoryItem
}

export function DispenseModal({ open, onClose, med }: DispenseModalProps) {
  const { db, dispenseMedication } = useData()
  const [patientId, setPatientId] = useState('')
  const [qty, setQty] = useState('1')
  const [error, setError] = useState('')

  async function handleSave() {
    if (!med || !patientId) return
    const patient = db.patients.find((p) => p.id === patientId)
    const n = Number(qty)
    if (!n || n <= 0) return
    const result = await dispenseMedication(med.id, patientId, n, patient ? patientFullName(patient) : '')
    if (result !== true) {
      setError(typeof result === 'object' ? result.error : 'Dispense failed')
      return
    }
    setPatientId('')
    setQty('1')
    setError('')
    onClose()
  }

  return (
    <ModalShell open={open} title={`Dispense — ${med?.name ?? ''}`} onClose={onClose} onSave={handleSave} saveLabel="Dispense" saveDisabled={!patientId || !med}>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <FormGrid>
        <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        <FormField label="Quantity"><input className="form-input" type="number" min={1} max={med?.qty} value={qty} onChange={(e) => setQty(e.target.value)} /></FormField>
        <FormField label="Available"><input className="form-input" value={med?.qty ?? 0} readOnly /></FormField>
      </FormGrid>
    </ModalShell>
  )
}

export function NewInvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, addInvoice } = useData()
  const [patientId, setPatientId] = useState('')
  const [date, setDate] = useState(today())
  const [paymentTier, setPaymentTier] = useState<BillingTariffTier>('cash')
  const [primaryIcd10, setPrimaryIcd10] = useState('')
  const [primaryIcd10Name, setPrimaryIcd10Name] = useState('')
  const [lines, setLines] = useState<BillingLineItem[]>([
    { type: BILLING_SERVICE_TYPES[0], description: '', cashPrice: 0, privateInsurancePrice: 0, nhisTariff: 0 },
  ])
  const [status, setStatus] = useState('Pending')
  const [notes, setNotes] = useState('')
  const [saveError, setSaveError] = useState('')

  const patient = db.patients.find((p) => p.id === patientId)
  const total = billingLinesTotal(lines, paymentTier)

  const searchGdrg = useCallback(
    async (q: string) =>
      searchGdrgCodes(q).map((g) => ({
        code: g.code,
        name: g.name,
        hint: g.tariff != null ? `GH₵ ${g.tariff}` : undefined,
      })),
    [],
  )

  function reset() {
    setPatientId('')
    setDate(today())
    setPaymentTier('cash')
    setPrimaryIcd10('')
    setPrimaryIcd10Name('')
    setLines([{ type: BILLING_SERVICE_TYPES[0], description: '', cashPrice: 0, privateInsurancePrice: 0, nhisTariff: 0 }])
    setStatus('Pending')
    setNotes('')
    setSaveError('')
  }

  function updateLine(index: number, patch: Partial<BillingLineItem>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function addLine() {
    setLines((prev) => [...prev, { type: BILLING_SERVICE_TYPES[0], description: '', cashPrice: 0, privateInsurancePrice: 0, nhisTariff: 0 }])
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  async function handleSave() {
    setSaveError('')
    const validation = validateInvoiceForSave({
      primaryIcd10,
      paymentTier,
      lines,
      patientNhis: patient?.nhis ?? '',
    })
    if (validation) {
      setSaveError(validation)
      return
    }
    const ok = await addInvoice({
      patient_id: patientId,
      date,
      services: serializeBillingServices(lines),
      amount: total,
      status,
      notes,
      payment_tier: paymentTier,
      primary_icd10: primaryIcd10,
      primary_icd10_name: primaryIcd10Name,
    })
    if (!ok) {
      setSaveError('Could not save invoice.')
      return
    }
    reset()
    onClose()
  }

  return (
    <ModalShell open={open} title="New Invoice" onClose={() => { reset(); onClose() }} onSave={handleSave} saveDisabled={!patientId}>
      {saveError && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{saveError}</p>}
      <FormGrid>
        <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        <FormField label="Date"><input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Tariff tier">
          <select className="form-input" value={paymentTier} onChange={(e) => setPaymentTier(e.target.value as BillingTariffTier)}>
            {BILLING_TARIFF_TIERS.map((t) => <option key={t} value={t}>{BILLING_TARIFF_LABELS[t]}</option>)}
          </select>
        </FormField>
        <FormField label="Primary ICD-10 diagnosis" span={2}>
          <SearchInput
            value={primaryIcd10Name ? `${primaryIcd10Name} (${primaryIcd10})` : ''}
            onChange={() => {}}
            onSelect={(opt) => {
              setPrimaryIcd10(opt.code)
              setPrimaryIcd10Name(opt.name)
            }}
            search={searchIcd10}
            placeholder="Required ICD-10…"
          />
        </FormField>
        <FormField label="Total (GHS)"><input className="form-input" value={total.toFixed(2)} readOnly /></FormField>
        <FormField label="Services rendered" span={2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lines.map((line, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10, border: '1px solid var(--gray2)', borderRadius: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
                  <select className="form-input" value={line.type} onChange={(e) => updateLine(index, { type: e.target.value })}>
                    {BILLING_SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeLine(index)} disabled={lines.length <= 1}>✕</button>
                </div>
                <input className="form-input" value={line.description} onChange={(e) => updateLine(index, { description: e.target.value })} placeholder="Description" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <input className="form-input" type="number" min={0} step={0.01} value={line.cashPrice || ''} onChange={(e) => updateLine(index, { cashPrice: Number(e.target.value) || 0 })} placeholder="Cash (GHS)" />
                  <input className="form-input" type="number" min={0} step={0.01} value={line.privateInsurancePrice || ''} onChange={(e) => updateLine(index, { privateInsurancePrice: Number(e.target.value) || 0 })} placeholder="Private ins. (GHS)" />
                  <input className="form-input" type="number" min={0} step={0.01} value={line.nhisTariff || ''} onChange={(e) => updateLine(index, { nhisTariff: Number(e.target.value) || 0 })} placeholder="NHIS (GHS)" />
                </div>
                <SearchInput
                  value={line.gdrgName ? `${line.gdrgName} (${line.gdrg})` : ''}
                  onChange={() => {}}
                  onSelect={(opt) => {
                    const gdrg = searchGdrgCodes(opt.code).find((g) => g.code === opt.code)
                    updateLine(index, {
                      gdrg: opt.code,
                      gdrgName: opt.name,
                      nhisTariff: gdrg?.tariff ?? line.nhisTariff,
                    })
                  }}
                  search={searchGdrg}
                  placeholder="G-DRG code…"
                />
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={addLine}>+ Add service line</button>
          </div>
        </FormField>
        <FormField label="Payment status" span={2}>
          <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {['Pending', 'Paid – Cash', 'Paid – MoMo', 'Paid – Insurance', 'Partial'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Notes" span={2}>
          <input className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional invoice notes" />
        </FormField>
      </FormGrid>
    </ModalShell>
  )
}
