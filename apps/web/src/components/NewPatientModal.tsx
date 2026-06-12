import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData, SPECIALTIES, type Patient } from '@onim/data'
import { Button, Modal } from '@onim/ui'
import { PhoneInput, formatPhone } from './PhoneInput'

const OTHER_SPECIALTY = 'Other'

type NewPatientModalProps = {
  open: boolean
  onClose: () => void
  patient?: Patient | null
}

function parsePhone(phone: string) {
  const trimmed = phone.trim()
  if (!trimmed) return { countryCode: '+233', number: '' }
  const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/)
  if (match) return { countryCode: match[1], number: match[2] }
  return { countryCode: '+233', number: trimmed }
}

function resolveSpecialtyFields(specialty: string) {
  if ((SPECIALTIES as readonly string[]).includes(specialty)) {
    return { choice: specialty, other: '' }
  }
  if (!specialty) return { choice: '', other: '' }
  return { choice: OTHER_SPECIALTY, other: specialty }
}

export function NewPatientModal({ open, onClose, patient }: NewPatientModalProps) {
  const { addPatient, updatePatient } = useData()
  const navigate = useNavigate()
  const isEdit = !!patient
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [countryCode, setCountryCode] = useState('+233')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [specialtyChoice, setSpecialtyChoice] = useState('')
  const [otherSpecialty, setOtherSpecialty] = useState('')

  const resolvedSpecialty = specialtyChoice === OTHER_SPECIALTY ? otherSpecialty.trim() : specialtyChoice

  useEffect(() => {
    if (!open) return
    if (patient) {
      setFname(patient.fname)
      setLname(patient.lname)
      const parsed = parsePhone(patient.phone)
      setCountryCode(parsed.countryCode)
      setPhoneNumber(parsed.number)
      setEmail(patient.email)
      const specialtyFields = resolveSpecialtyFields(patient.specialty)
      setSpecialtyChoice(specialtyFields.choice)
      setOtherSpecialty(specialtyFields.other)
      return
    }
    setFname('')
    setLname('')
    setCountryCode('+233')
    setPhoneNumber('')
    setEmail('')
    setSpecialtyChoice('')
    setOtherSpecialty('')
  }, [open, patient])

  async function handleSave() {
    if (!fname.trim() || !lname.trim() || !resolvedSpecialty) return

    const payload = {
      fname: fname.trim(),
      lname: lname.trim(),
      phone: formatPhone(countryCode, phoneNumber),
      email: email.trim(),
      specialty: resolvedSpecialty,
    }

    if (isEdit && patient) {
      const result = await updatePatient(patient.id, payload)
      if ('error' in result) return
      onClose()
      return
    }

    const created = await addPatient(payload)
    if ('error' in created) return
    onClose()
    navigate(`/patients/${created.id}`)
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Patient' : 'Register New Patient'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            disabled={!fname.trim() || !lname.trim() || !resolvedSpecialty}
          >
            {isEdit ? 'Save Changes' : 'Save Patient'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>First name</span>
          <input className="form-input" value={fname} onChange={(e) => setFname(e.target.value)} placeholder="First name" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Last name</span>
          <input className="form-input" value={lname} onChange={(e) => setLname(e.target.value)} placeholder="Last name" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Phone</span>
          <PhoneInput
            countryCode={countryCode}
            number={phoneNumber}
            onCountryCodeChange={setCountryCode}
            onNumberChange={setPhoneNumber}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Email</span>
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@..." />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Specialty</span>
          <select
            className="form-input"
            value={specialtyChoice}
            onChange={(e) => setSpecialtyChoice(e.target.value)}
          >
            <option value="">Select specialty</option>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value={OTHER_SPECIALTY}>Other</option>
          </select>
        </label>
        {specialtyChoice === OTHER_SPECIALTY && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Other specialty</span>
            <input
              className="form-input"
              value={otherSpecialty}
              onChange={(e) => setOtherSpecialty(e.target.value)}
              placeholder="Type specialty"
            />
          </label>
        )}
      </div>
    </Modal>
  )
}
