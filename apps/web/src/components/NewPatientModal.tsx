import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData, SPECIALTIES } from '@onim/data'
import { Button, Modal } from '@onim/ui'

type NewPatientModalProps = {
  open: boolean
  onClose: () => void
}

export function NewPatientModal({ open, onClose }: NewPatientModalProps) {
  const { addPatient } = useData()
  const navigate = useNavigate()
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [specialty, setSpecialty] = useState<string>(SPECIALTIES[0])

  function reset() {
    setFname('')
    setLname('')
    setPhone('')
    setEmail('')
    setSpecialty(SPECIALTIES[0])
  }

  async function handleSave() {
    if (!fname.trim() || !lname.trim()) return
    const patient = await addPatient({
      fname: fname.trim(),
      lname: lname.trim(),
      phone: phone.trim(),
      email: email.trim(),
      specialty,
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
          <Button variant="primary" onClick={handleSave} disabled={!fname.trim() || !lname.trim()}>
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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Phone</span>
          <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233..." />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Email</span>
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@..." />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Specialty</span>
          <select className="form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
    </Modal>
  )
}
