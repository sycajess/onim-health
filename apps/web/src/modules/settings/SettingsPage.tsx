import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth, usePermissions } from '@onim/auth'
import { useData, SPECIALTIES, SPECIALTY_COLORS } from '@onim/data'
import type { StaffMember } from '@onim/data'
import { Badge, Button, Card } from '@onim/ui'
import { disconnectGoogleCalendar, startGoogleCalendarConnect } from '../../lib/googleCalendar'
import { StaffFormModal } from './StaffFormModal'
import '@onim/ui/Card.css'

const ROLE_BADGE: Record<string, 'teal' | 'blue' | 'amber' | 'success' | 'gray' | 'danger'> = {
  admin: 'blue', doctor: 'teal', nurse: 'blue', pharmacist: 'amber', nutritionist: 'success',
  staff: 'gray', accountant: 'danger', lab_partner: 'teal',
}

export function SettingsPage() {
  const { db, adminDeleteStaff, saveClinicSettings } = useData()
  const { profile, refreshProfile } = useAuth()
  const { role, canWriteModule } = usePermissions()
  const isAdmin = role === 'admin'
  const canSchedule = canWriteModule('appointments')
  const [searchParams, setSearchParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null)
  const [providerAccreditation, setProviderAccreditation] = useState('')
  const [eclaimAuthorization, setEclaimAuthorization] = useState('')
  const [googleMsg, setGoogleMsg] = useState('')

  useEffect(() => {
    setProviderAccreditation(db.clinicSettings.provider_accreditation)
    setEclaimAuthorization(db.clinicSettings.eclaim_authorization)
  }, [db.clinicSettings])

  useEffect(() => {
    const status = searchParams.get('google')
    if (!status) return
    void refreshProfile().then(() => {
      if (status === 'connected') setGoogleMsg('Google connected.')
      if (status === 'error') setGoogleMsg('Google connection failed. Try again.')
      setSearchParams({}, { replace: true })
    })
  }, [searchParams, setSearchParams, refreshProfile])

  const specCount: Record<string, number> = {}
  db.patients.forEach((p) => { specCount[p.specialty] = (specCount[p.specialty] ?? 0) + 1 })

  function openCreate() {
    setEditStaff(null)
    setFormOpen(true)
  }

  function openEdit(s: StaffMember) {
    setEditStaff(s)
    setFormOpen(true)
  }

  async function handleDelete(s: StaffMember) {
    if (!window.confirm(`Delete ${s.name}?`)) return
    const ok = await adminDeleteStaff(s.id)
    if (!ok) window.alert('Could not delete staff.')
  }

  return (
    <div>
      {canSchedule && (
        <Card title="Google Meet & Calendar" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--gray4)', marginTop: 0, marginBottom: 12 }}>
            Connect Google once. Then: create a Meet link first, and optionally add the appointment to your calendar afterward.
          </p>
          {googleMsg && (
            <div className="alert-banner alert-banner--warning" style={{ marginBottom: 12 }}>{googleMsg}</div>
          )}
          {profile?.google_calendar_connected ? (
            <>
              <div style={{ fontSize: 13, marginBottom: 12 }}>
                Connected{profile.google_calendar_email ? ` as ${profile.google_calendar_email}` : ''}.
              </div>
              <Button
                variant="secondary"
                onClick={() => void disconnectGoogleCalendar().then((r) => {
                  if (r.error) window.alert(r.error)
                  else void refreshProfile()
                })}
              >
                Disconnect Google
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => void startGoogleCalendarConnect()}>
              Connect Google
            </Button>
          )}
        </Card>
      )}

      <Card
        title="Team & Access"
        action={isAdmin ? <Button variant="primary" onClick={openCreate}>+ Staff</Button> : undefined}
      >
        <div className="team-grid">
          {db.staff.map((s) => (
            <div key={s.id} className="team-card">
              <div className="team-card__avatar">{s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--gray4)', margin: '4px 0 8px' }}>{s.specialty || '—'}</div>
              <Badge variant={ROLE_BADGE[s.role] ?? 'gray'}>{s.role}</Badge>
              <div style={{ fontSize: 11, color: 'var(--gray4)', marginTop: 10 }}>{s.email}</div>
              {s.license_number && (
                <div style={{ fontSize: 11, color: 'var(--gray4)', marginTop: 4 }}>
                  Lic: {s.license_number}
                  {s.license_expiry ? ` · exp ${s.license_expiry}` : ''}
                </div>
              )}
              {isAdmin && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Button variant="secondary" onClick={() => openEdit(s)}>Edit</Button>
                  <Button variant="danger" onClick={() => void handleDelete(s)}>Delete</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {isAdmin && (
        <Card title="NHIA Provider" style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>Provider accreditation #</span>
              <input className="form-input" value={providerAccreditation} onChange={(e) => setProviderAccreditation(e.target.value)} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>eClaim authorization #</span>
              <input className="form-input" value={eclaimAuthorization} onChange={(e) => setEclaimAuthorization(e.target.value)} />
            </label>
            <Button
              variant="primary"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => void saveClinicSettings({ provider_accreditation: providerAccreditation, eclaim_authorization: eclaimAuthorization })}
            >
              Save
            </Button>
          </div>
        </Card>
      )}

      <Card title="Clinic Specialties" style={{ marginTop: 20 }}>
        <div className="settings-spec-grid">
          {SPECIALTIES.map((s) => (
            <div key={s} className="settings-spec-item">
              <span className="settings-spec-item__dot" style={{ background: SPECIALTY_COLORS[s] ?? 'var(--teal)' }} />
              <span style={{ fontWeight: 500 }}>{s}</span>
              <span style={{ fontSize: 12, color: 'var(--gray4)', marginLeft: 'auto' }}>{specCount[s] ?? 0} patients</span>
            </div>
          ))}
        </div>
      </Card>

      <StaffFormModal open={formOpen} onClose={() => setFormOpen(false)} staff={editStaff} />
    </div>
  )
}