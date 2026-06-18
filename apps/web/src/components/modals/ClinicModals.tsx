import { useEffect, useState } from 'react'
import { useAuth } from '@onim/auth'
import {
  useData,
  SPECIALTIES,
  today,
  patientFullName,
  evaluateLabResult,
  labStatusHint,
  BILLING_SERVICE_TYPES,
  billingLinesTotal,
  serializeBillingServices,
  RX_FREQUENCIES,
  RX_ROUTES,
  type BillingLineItem,
} from '@onim/data'
import type { InventoryItem } from '@onim/data'
import { Button, Modal, PdfAttachZone } from '@onim/ui'
import type { PdfAttachment } from '@onim/ui'
import { FormField, FormGrid } from '../FormField'
import { MedicationSearch } from '../MedicationSearch'

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

  function reset() {
    setPatientId('')
    setDate(today())
    setTime('09:00 AM')
    setType('Consultation')
    setSpecialty(SPECIALTIES[0])
    setNotes('')
  }

  async function handleSave() {
    if (!patientId) return
    const ok = await addAppointment({
      patient_id: patientId,
      date,
      time,
      type,
      specialty,
      provider: profile?.full_name ?? '',
      notes,
    })
    if (!ok) return
    reset()
    onClose()
  }

  return (
    <ModalShell open={open} title="Schedule Appointment" onClose={() => { reset(); onClose() }} onSave={handleSave} saveDisabled={!patientId}>
      <FormGrid>
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
      </FormGrid>
    </ModalShell>
  )
}

export function NewRecordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addRecord } = useData()
  const { profile } = useAuth()
  const [patientId, setPatientId] = useState('')
  const [date, setDate] = useState(today())
  const [type, setType] = useState('Consultation Note')
  const [specialty, setSpecialty] = useState<string>(SPECIALTIES[0])
  const [complaint, setComplaint] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')

  function reset() {
    setPatientId('')
    setDate(today())
    setType('Consultation Note')
    setSpecialty(SPECIALTIES[0])
    setComplaint('')
    setAssessment('')
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
        <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        <FormField label="Date"><input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Type"><input className="form-input" value={type} onChange={(e) => setType(e.target.value)} /></FormField>
        <FormField label="Specialty" span={2}>
          <select className="form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Chief complaint" span={2}><textarea className="form-input" rows={2} value={complaint} onChange={(e) => setComplaint(e.target.value)} /></FormField>
        <FormField label="Assessment" span={2}><textarea className="form-input" rows={2} value={assessment} onChange={(e) => setAssessment(e.target.value)} /></FormField>
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
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState<string>(RX_FREQUENCIES[0])
  const [route, setRoute] = useState<string>(RX_ROUTES[0])
  const [duration, setDuration] = useState('30 days')
  const [qty, setQty] = useState('1')
  const [dispense, setDispense] = useState(false)
  const [inventoryMedId, setInventoryMedId] = useState('')

  const patient = db.patients.find((p) => p.id === patientId)
  const canSave = !!patientId && medication.trim().length > 0

  function reset() {
    setPatientId('')
    setMedication('')
    setDosage('')
    setFrequency(RX_FREQUENCIES[0])
    setRoute(RX_ROUTES[0])
    setDuration('30 days')
    setQty('1')
    setDispense(false)
    setInventoryMedId('')
  }

  async function handleSave() {
    if (!canSave) return
    const ok = await addPrescription({
      patient_id: patientId,
      med_id: dispense ? inventoryMedId : '',
      medication: medication.trim(),
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
        <FormField label="Medication" span={2}>
          <MedicationSearch
            value={medication}
            onChange={setMedication}
            onSelectDrug={(drug) => {
              if (drug.strength) setDosage(drug.strength)
            }}
          />
        </FormField>
        <FormField label="Strength / Dosage">
          <input className="form-input" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 500mg" />
        </FormField>
        <FormField label="Directions (frequency)">
          <select className="form-input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {RX_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </FormField>
        <FormField label="Route of use">
          <select className="form-input" value={route} onChange={(e) => setRoute(e.target.value)}>
            {RX_ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
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
  const [patientId, setPatientId] = useState('')
  const [test, setTest] = useState('')
  const [date, setDate] = useState(today())
  const [facility, setFacility] = useState('')
  const [result, setResult] = useState('')
  const [ref, setRef] = useState('')
  const [status, setStatus] = useState('Normal')
  const [statusAuto, setStatusAuto] = useState(true)
  const [notes, setNotes] = useState('')
  const [attachment, setAttachment] = useState<PdfAttachment | null>(null)

  useEffect(() => {
    if (!statusAuto || !result.trim() || !ref.trim()) return
    const evaluated = evaluateLabResult(result, ref)
    if (evaluated) setStatus(evaluated)
  }, [result, ref, statusAuto])

  function reset() {
    setPatientId('')
    setTest('')
    setDate(today())
    setFacility('')
    setResult('')
    setRef('')
    setStatus('Normal')
    setStatusAuto(true)
    setNotes('')
    setAttachment(null)
  }

  async function handleSave() {
    if (!patientId || !test.trim()) return
    const ok = await addLabResult({
      patient_id: patientId,
      test: test.trim(),
      date,
      facility,
      result,
      ref,
      status,
      provider: profile?.full_name ?? '',
      notes,
      attachment: attachment ? { name: attachment.name, data_url: attachment.dataUrl } : null,
    })
    if (!ok) return
    reset()
    onClose()
  }

  return (
    <ModalShell open={open} title="Add Lab Result" onClose={() => { reset(); onClose() }} onSave={handleSave} saveDisabled={!patientId || !test.trim()}>
      <FormGrid>
        <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        <FormField label="Test"><input className="form-input" value={test} onChange={(e) => setTest(e.target.value)} /></FormField>
        <FormField label="Date"><input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Lab / Facility"><input className="form-input" value={facility} onChange={(e) => setFacility(e.target.value)} placeholder="Korle-Bu Labs..." /></FormField>
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
        <FormField label="Attach Lab Report PDF" span={2}>
          <PdfAttachZone
            attachment={attachment}
            onAttach={setAttachment}
            onRemove={() => setAttachment(null)}
            label="Attach PDF"
          />
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
  const { addInvoice } = useData()
  const [patientId, setPatientId] = useState('')
  const [date, setDate] = useState(today())
  const [lines, setLines] = useState<BillingLineItem[]>([
    { type: BILLING_SERVICE_TYPES[0], description: '', amount: 0 },
  ])
  const [status, setStatus] = useState('Pending')
  const [notes, setNotes] = useState('')

  const total = billingLinesTotal(lines)

  function reset() {
    setPatientId('')
    setDate(today())
    setLines([{ type: BILLING_SERVICE_TYPES[0], description: '', amount: 0 }])
    setStatus('Pending')
    setNotes('')
  }

  function updateLine(index: number, patch: Partial<BillingLineItem>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function addLine() {
    setLines((prev) => [...prev, { type: BILLING_SERVICE_TYPES[0], description: '', amount: 0 }])
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  async function handleSave() {
    if (!patientId || total <= 0) return
    const ok = await addInvoice({
      patient_id: patientId,
      date,
      services: serializeBillingServices(lines),
      amount: total,
      status,
      notes,
    })
    if (!ok) return
    reset()
    onClose()
  }

  return (
    <ModalShell open={open} title="New Invoice" onClose={() => { reset(); onClose() }} onSave={handleSave} saveDisabled={!patientId || total <= 0}>
      <FormGrid>
        <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        <FormField label="Date"><input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Total (GHS)"><input className="form-input" value={total.toFixed(2)} readOnly /></FormField>
        <FormField label="Services rendered" span={2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lines.map((line, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 0.8fr auto', gap: 8, alignItems: 'end' }}>
                <select className="form-input" value={line.type} onChange={(e) => updateLine(index, { type: e.target.value })}>
                  {BILLING_SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input className="form-input" value={line.description} onChange={(e) => updateLine(index, { description: e.target.value })} placeholder="Description" />
                <input className="form-input" type="number" min={0} step={0.01} value={line.amount || ''} onChange={(e) => updateLine(index, { amount: Number(e.target.value) || 0 })} placeholder="Amount" />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeLine(index)} disabled={lines.length <= 1}>✕</button>
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
