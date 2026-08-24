import { useEffect, useState } from 'react'
import { useData, SPECIALTIES, type LabResult, type MedicalRecord, type Prescription } from '@onim/data'
import { Button, Modal } from '@onim/ui'
import { FormField, FormGrid } from './FormField'
import { MedicationSearch } from './MedicationSearch'
import { SigCodeInput } from './SigCodeInput'
import { LAB_ORDER_OPTIONS, formatLabsOrdered, parseLabsOrdered } from '../lib/labOrderOptions'

type ModalShellProps = {
  open: boolean
  title: string
  onClose: () => void
  onSave: () => void
  saveDisabled?: boolean
  children: React.ReactNode
}

function ModalShell({ open, title, onClose, onSave, saveDisabled, children }: ModalShellProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSave} disabled={saveDisabled}>Save changes</Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}

function splitLabsOrdered(value: string): { selected: string[]; other: string } {
  const parts = parseLabsOrdered(value)
  const selected = parts.filter((p) => (LAB_ORDER_OPTIONS as readonly string[]).includes(p))
  const other = parts.filter((p) => !(LAB_ORDER_OPTIONS as readonly string[]).includes(p)).join('\n')
  return { selected, other }
}

export function EditRecordModal({
  record,
  open,
  onClose,
}: {
  record: MedicalRecord | null
  open: boolean
  onClose: () => void
}) {
  const { updateRecord } = useData()
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [specialty, setSpecialty] = useState<string>(SPECIALTIES[0])
  const [complaint, setComplaint] = useState('')
  const [exam, setExam] = useState('')
  const [assessment, setAssessment] = useState('')
  const [selectedLabs, setSelectedLabs] = useState<string[]>([])
  const [labsOther, setLabsOther] = useState('')
  const [plan, setPlan] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!record || !open) return
    const labs = splitLabsOrdered(record.labs_ordered)
    setDate(record.date)
    setType(record.type)
    setSpecialty(record.specialty || SPECIALTIES[0])
    setComplaint(record.complaint)
    setExam(record.exam)
    setAssessment(record.assessment)
    setSelectedLabs(labs.selected)
    setLabsOther(labs.other)
    setPlan(record.plan)
  }, [record, open])

  if (!record) return null

  async function handleSave() {
    if (!record || saving) return
    setSaving(true)
    const ok = await updateRecord(record.id, record.patient_id, {
      date,
      type,
      specialty,
      complaint,
      exam,
      assessment,
      labs_ordered: formatLabsOrdered(selectedLabs, labsOther),
      plan,
    })
    setSaving(false)
    if (!ok) return
    onClose()
  }

  return (
    <ModalShell open={open} title={`Edit record ${record.id}`} onClose={onClose} onSave={() => void handleSave()} saveDisabled={saving}>
      <FormGrid>
        <FormField label="Date"><input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Type"><input className="form-input" value={type} onChange={(e) => setType(e.target.value)} /></FormField>
        <FormField label="Specialty" span={2}>
          <select className="form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Chief complaint" span={2}><textarea className="form-input" rows={2} value={complaint} onChange={(e) => setComplaint(e.target.value)} /></FormField>
        <FormField label="Examination" span={2}><textarea className="form-input" rows={2} value={exam} onChange={(e) => setExam(e.target.value)} /></FormField>
        <FormField label="Assessment" span={2}><textarea className="form-input" rows={2} value={assessment} onChange={(e) => setAssessment(e.target.value)} /></FormField>
        <FormField label="Labs" span={2}>
          <div className="lab-order-checks">
            {LAB_ORDER_OPTIONS.map((lab) => (
              <label key={lab} className="lab-order-checks__item">
                <input
                  type="checkbox"
                  checked={selectedLabs.includes(lab)}
                  onChange={() => setSelectedLabs((prev) => prev.includes(lab) ? prev.filter((l) => l !== lab) : [...prev, lab])}
                />
                <span>{lab}</span>
              </label>
            ))}
          </div>
          <textarea className="form-input" rows={2} value={labsOther} onChange={(e) => setLabsOther(e.target.value)} placeholder="Other labs" style={{ marginTop: 8 }} />
        </FormField>
        <FormField label="Plan" span={2}><textarea className="form-input" rows={2} value={plan} onChange={(e) => setPlan(e.target.value)} /></FormField>
      </FormGrid>
    </ModalShell>
  )
}

export function EditLabModal({
  lab,
  open,
  onClose,
}: {
  lab: LabResult | null
  open: boolean
  onClose: () => void
}) {
  const { updateLabResultFields } = useData()
  const [test, setTest] = useState('')
  const [date, setDate] = useState('')
  const [facility, setFacility] = useState('')
  const [result, setResult] = useState('')
  const [ref, setRef] = useState('')
  const [status, setStatus] = useState('Normal')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!lab || !open) return
    setTest(lab.test)
    setDate(lab.date)
    setFacility(lab.facility)
    setResult(lab.result)
    setRef(lab.ref)
    setStatus(lab.status)
    setNotes(lab.notes)
  }, [lab, open])

  if (!lab) return null

  async function handleSave() {
    if (!lab || saving) return
    setSaving(true)
    const ok = await updateLabResultFields(lab.id, lab.patient_id, {
      test,
      date,
      facility,
      result,
      ref,
      status,
      notes,
    })
    setSaving(false)
    if (!ok) return
    onClose()
  }

  return (
    <ModalShell open={open} title={`Edit lab ${lab.id}`} onClose={onClose} onSave={() => void handleSave()} saveDisabled={saving || !test.trim()}>
      <FormGrid>
        <FormField label="Test" span={2}><input className="form-input" value={test} onChange={(e) => setTest(e.target.value)} /></FormField>
        <FormField label="Date"><input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Status">
          <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {['Normal', 'Abnormal – Low', 'Abnormal – High', 'Critical', 'Pending'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Result"><input className="form-input" value={result} onChange={(e) => setResult(e.target.value)} /></FormField>
        <FormField label="Reference"><input className="form-input" value={ref} onChange={(e) => setRef(e.target.value)} /></FormField>
        <FormField label="Facility" span={2}><input className="form-input" value={facility} onChange={(e) => setFacility(e.target.value)} /></FormField>
        <FormField label="Notes" span={2}><textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
      </FormGrid>
    </ModalShell>
  )
}

export function EditPrescriptionModal({
  prescription,
  open,
  onClose,
}: {
  prescription: Prescription | null
  open: boolean
  onClose: () => void
}) {
  const { db, updatePrescriptionFields } = useData()
  const [medication, setMedication] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [route, setRoute] = useState('')
  const [duration, setDuration] = useState('')
  const [refills, setRefills] = useState('0')
  const [status, setStatus] = useState('Active')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!prescription || !open) return
    setMedication(prescription.medication)
    setDosage(prescription.dosage)
    setFrequency(prescription.frequency)
    setRoute(prescription.route)
    setDuration(prescription.duration)
    setRefills(String(prescription.refills))
    setStatus(prescription.status)
    setNotes(prescription.notes)
  }, [prescription, open])

  if (!prescription) return null

  async function handleSave() {
    if (!prescription || saving || !medication.trim()) return
    setSaving(true)
    const ok = await updatePrescriptionFields(prescription.id, prescription.patient_id, {
      medication: medication.trim(),
      dosage,
      frequency,
      route,
      duration,
      refills: Number(refills) || 0,
      status,
      notes,
    })
    setSaving(false)
    if (!ok) return
    onClose()
  }

  return (
    <ModalShell open={open} title={`Edit prescription ${prescription.id}`} onClose={onClose} onSave={() => void handleSave()} saveDisabled={saving || !medication.trim()}>
      <FormGrid>
        <FormField label="Medication" span={2}>
          <MedicationSearch
            value={medication}
            onChange={setMedication}
            inventoryItems={db.inventory}
          />
        </FormField>
        <FormField label="Strength / Dosage"><input className="form-input" value={dosage} onChange={(e) => setDosage(e.target.value)} /></FormField>
        <FormField label="Directions"><SigCodeInput value={frequency} onChange={setFrequency} /></FormField>
        <FormField label="Route"><input className="form-input" value={route} onChange={(e) => setRoute(e.target.value)} /></FormField>
        <FormField label="Duration"><input className="form-input" value={duration} onChange={(e) => setDuration(e.target.value)} /></FormField>
        <FormField label="Refills"><input className="form-input" type="number" min={0} value={refills} onChange={(e) => setRefills(e.target.value)} /></FormField>
        <FormField label="Status" span={2}>
          <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {['Active', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Notes" span={2}><textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
      </FormGrid>
    </ModalShell>
  )
}

export function AdminDeleteButton({
  label,
  onConfirm,
}: {
  label: string
  onConfirm: () => Promise<boolean>
}) {
  return (
    <Button
      variant="danger"
      onClick={() => {
        if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return
        void onConfirm().then((ok) => {
          if (!ok) window.alert('Could not delete. Admin access required.')
        })
      }}
    >
      Delete
    </Button>
  )
}
