import { useEffect, useState } from 'react'
import { useAuth } from '@onim/auth'
import { useData, SPECIALTIES, today, patientFullName } from '@onim/data'
import type { InventoryItem } from '@onim/data'
import { Button, Modal, PdfAttachZone } from '@onim/ui'
import type { PdfAttachment } from '@onim/ui'
import { FormField, FormGrid } from '../FormField'

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
  const [medId, setMedId] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('Once daily')
  const [duration, setDuration] = useState('30 days')
  const [qty, setQty] = useState('1')
  const [dispense, setDispense] = useState(false)

  const med = db.inventory.find((m) => m.id === medId)
  const patient = db.patients.find((p) => p.id === patientId)

  function reset() {
    setPatientId('')
    setMedId('')
    setDosage('')
    setFrequency('Once daily')
    setDuration('30 days')
    setQty('1')
    setDispense(false)
  }

  async function handleSave() {
    if (!patientId || !medId || !med) return
    const ok = await addPrescription({
      patient_id: patientId,
      med_id: medId,
      medication: med.name,
      dosage,
      frequency,
      duration,
      qty: Number(qty) || 1,
      dispense,
      provider: profile?.full_name ?? '',
      patient_name: patient ? patientFullName(patient) : '',
    })
    if (!ok) return
    reset()
    onClose()
  }

  return (
    <ModalShell open={open} title="New Prescription" onClose={() => { reset(); onClose() }} onSave={handleSave} saveDisabled={!patientId || !medId}>
      <FormGrid>
        <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        <FormField label="Medication" span={2}>
          <select className="form-input" value={medId} onChange={(e) => setMedId(e.target.value)}>
            <option value="">Select medication…</option>
            {db.inventory.map((m) => <option key={m.id} value={m.id}>{m.name} (stock: {m.qty})</option>)}
          </select>
        </FormField>
        <FormField label="Dosage"><input className="form-input" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 500mg" /></FormField>
        <FormField label="Frequency"><input className="form-input" value={frequency} onChange={(e) => setFrequency(e.target.value)} /></FormField>
        <FormField label="Duration"><input className="form-input" value={duration} onChange={(e) => setDuration(e.target.value)} /></FormField>
        <FormField label="Qty to dispense"><input className="form-input" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} /></FormField>
        <FormField label="Dispense now" span={2}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={dispense} onChange={(e) => setDispense(e.target.checked)} />
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
  const [notes, setNotes] = useState('')
  const [attachment, setAttachment] = useState<PdfAttachment | null>(null)

  function reset() {
    setPatientId('')
    setTest('')
    setDate(today())
    setFacility('')
    setResult('')
    setRef('')
    setStatus('Normal')
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
        <FormField label="Result"><input className="form-input" value={result} onChange={(e) => setResult(e.target.value)} /></FormField>
        <FormField label="Reference range"><input className="form-input" value={ref} onChange={(e) => setRef(e.target.value)} /></FormField>
        <FormField label="Status" span={2}>
          <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {['Normal', 'Abnormal – High', 'Abnormal – Low', 'Critical'].map((s) => <option key={s}>{s}</option>)}
          </select>
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
  const [services, setServices] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('Pending')

  function reset() {
    setPatientId('')
    setDate(today())
    setServices('')
    setAmount('')
    setStatus('Pending')
  }

  async function handleSave() {
    if (!patientId || !amount) return
    const ok = await addInvoice({
      patient_id: patientId,
      date,
      services,
      amount: Number(amount),
      status,
    })
    if (!ok) return
    reset()
    onClose()
  }

  return (
    <ModalShell open={open} title="New Invoice" onClose={() => { reset(); onClose() }} onSave={handleSave} saveDisabled={!patientId || !amount}>
      <FormGrid>
        <FormField label="Patient" span={2}><PatientSelect value={patientId} onChange={setPatientId} /></FormField>
        <FormField label="Date"><input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Amount (GHS)"><input className="form-input" type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} /></FormField>
        <FormField label="Services" span={2}><textarea className="form-input" rows={3} value={services} onChange={(e) => setServices(e.target.value)} /></FormField>
        <FormField label="Status" span={2}>
          <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {['Pending', 'Paid – Cash', 'Paid – MoMo', 'Paid – Insurance', 'Partial'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FormField>
      </FormGrid>
    </ModalShell>
  )
}
