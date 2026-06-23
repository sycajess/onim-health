import { useEffect, useState } from 'react'
import { useAuth } from '@onim/auth'
import { useData } from '@onim/data'
import type { StaffMember } from '@onim/data'
import { ROLE_LABELS, type Role } from '@onim/types'
import { Button, Modal } from '@onim/ui'
import { FormField, FormGrid } from '../../components/FormField'
import { SPECIALTIES } from '@onim/data'

const ROLES = Object.keys(ROLE_LABELS) as Role[]

type StaffFormModalProps = {
  open: boolean
  onClose: () => void
  staff?: StaffMember | null
}

export function StaffFormModal({ open, onClose, staff }: StaffFormModalProps) {
  const { signUp } = useAuth()
  const { adminUpdateStaff, refresh } = useData()
  const isEdit = !!staff
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('staff')
  const [specialty, setSpecialty] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    if (staff) {
      setEmail(staff.email)
      setPassword('')
      setFullName(staff.name)
      setRole(staff.role as Role)
      setSpecialty(staff.specialty)
      setPhone(staff.phone)
      setLicenseNumber(staff.license_number)
      setLicenseExpiry(staff.license_expiry)
      return
    }
    setEmail('')
    setPassword('')
    setFullName('')
    setRole('staff')
    setSpecialty('')
    setPhone('')
    setLicenseNumber('')
    setLicenseExpiry('')
  }, [open, staff])

  async function handleSave() {
    setError('')
    if (!fullName.trim()) return
    setSaving(true)

    if (isEdit && staff) {
      const ok = await adminUpdateStaff({
        id: staff.id,
        role,
        full_name: fullName.trim(),
        specialty: specialty.trim(),
        phone: phone.trim(),
        license_number: licenseNumber.trim(),
        license_expiry: licenseExpiry || undefined,
      })
      setSaving(false)
      if (!ok) {
        setError('Could not update profile.')
        return
      }
      onClose()
      return
    }

    if (!email.trim() || password.length < 8) {
      setSaving(false)
      setError('Email and password (8+ chars) required.')
      return
    }

    const created = await signUp(email.trim(), password)
    if ('error' in created) {
      setSaving(false)
      setError(created.error)
      return
    }

    const ok = await adminUpdateStaff({
      id: created.profile.id,
      role,
      full_name: fullName.trim(),
      specialty: specialty.trim(),
      phone: phone.trim(),
      license_number: licenseNumber.trim(),
      license_expiry: licenseExpiry || undefined,
    })
    await refresh()
    setSaving(false)
    if (!ok) {
      setError('Account created but profile update failed.')
      return
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Staff' : 'New Staff'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <FormGrid>
        <FormField label="Full name" span={2}>
          <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </FormField>
        {!isEdit && (
          <>
            <FormField label="Email">
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
            <FormField label="Password">
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </FormField>
          </>
        )}
        {isEdit && (
          <FormField label="Email" span={2}>
            <input className="form-input" value={email} readOnly />
          </FormField>
        )}
        <FormField label="Role">
          <select className="form-input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </FormField>
        <FormField label="Specialty">
          <select className="form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            <option value="">—</option>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Phone">
          <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <FormField label="License #">
          <input className="form-input" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
        </FormField>
        <FormField label="License expiry" span={2}>
          <input className="form-input" type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
        </FormField>
      </FormGrid>
    </Modal>
  )
}
