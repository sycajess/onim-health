import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData, SPECIALTIES } from '@onim/data'
import { Button, Modal } from '@onim/ui'
import { PhoneInput, formatPhone } from './PhoneInput'

const OTHER_SPECIALTY = 'Other'

type NewPatientModalProps = {
  open: boolean
  onClose: () => void
}

export function NewPatientModal({ open, onClose }: NewPatientModalProps) {
  const { addPatient } = useData()
  const navigate = useNavigate()
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [countryCode, setCountryCode] = useState('+233')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [specialtyChoice, setSpecialtyChoice] = useState('')
  const [otherSpecialty, setOtherSpecialty] = useState('')

  const resolvedSpecialty = specialtyChoice === OTHER_SPECIALTY ? otherSpecialty.trim() : specialtyChoice

  function reset() {
    setFname('')
    setLname('')
    setCountryCode('+233')
    setPhoneNumber('')
    setEmail('')
    setSpecialtyChoice('')
    setOtherSpecialty('')
  }

  async function handleSave() {
    if (!fname.trim() || !lname.trim() || !resolvedSpecialty) return
    const patient = await addPatient({
      fname: fname.trim(),
      lname: lname.trim(),
      phone: formatPhone(countryCode, phoneNumber),
      email: email.trim(),
      specialty: resolvedSpecialty,
    })
    if ('error' in patient) return
    reset()
    onClose()
    navigate(`/patients/${patient.id}`)
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      title="Register New Patient"
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!fname.trim() || !lname.trim() || !resolvedSpecialty}
          >
            Save Patient
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
