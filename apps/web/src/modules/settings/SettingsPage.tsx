import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth, usePermissions } from '@onim/auth'
import { fetchAuditLog, type AuditLogEntry } from '@onim/supabase'
import { useData, SPECIALTIES, SPECIALTY_COLORS } from '@onim/data'
import type { StaffMember } from '@onim/data'
import { ROLE_LABELS, type Role } from '@onim/types'
import { Badge, Button, Card } from '@onim/ui'
import { disconnectGoogleCalendar, startGoogleCalendarConnect } from '../../lib/googleCalendar'
import { StaffFormModal } from './StaffFormModal'
import '@onim/ui/Card.css'

const ROLE_BADGE: Record<string, 'teal' | 'blue' | 'amber' | 'success' | 'gray' | 'danger'> = {
  admin: 'blue', doctor: 'teal', nurse: 'blue', pharmacist: 'amber', nutritionist: 'success',
  staff: 'gray', accountant: 'danger', lab_partner: 'teal',
}

export function SettingsPage() {
  const { db, adminDeleteStaff, adminUpdateStaff, saveClinicSettings, refresh } = useData()
  const { profile, refreshProfile } = useAuth()
  const { role, canWriteModule } = usePermissions()
  const isAdmin = role === 'admin'
  const canSchedule = canWriteModule('appointments')
  const [searchParams, setSearchParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null)
  const [providerAccreditation, setProviderAccreditation] = useState('')
  const [eclaimAuthorization, setEclaimAuthorization] = useState('')
  const [hefraApproved, setHefraApproved] = useState(true)
  const [hefraLicenseNumber, setHefraLicenseNumber] = useState('')
  const [googleMsg, setGoogleMsg] = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  const pendingStaff = useMemo(() => db.staff.filter((s) => !s.approved), [db.staff])
  const activeStaff = useMemo(() => db.staff.filter((s) => s.approved), [db.staff])

  useEffect(() => {
    setProviderAccreditation(db.clinicSettings.provider_accreditation)
    setEclaimAuthorization(db.clinicSettings.eclaim_authorization)
    setHefraApproved(db.clinicSettings.hefra_approved)
    setHefraLicenseNumber(db.clinicSettings.hefra_license_number)
  }, [db.clinicSettings])

  useEffect(() => {
    if (!isAdmin) return
    setAuditLoading(true)
    void fetchAuditLog(150).then((result) => {
      if (!('error' in result)) setAuditLog(result)
      setAuditLoading(false)
    })
  }, [isAdmin, db.patients.length])

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

  async function handleApprove(s: StaffMember) {
    setApprovingId(s.id)
    const ok = await adminUpdateStaff({
      id: s.id,
      role: (s.role as Role) || 'staff',
      full_name: s.name,
      specialty: s.specialty,
      phone: s.phone,
      license_number: s.license_number,
      license_expiry: s.license_expiry || undefined,
    })
    setApprovingId(null)
    if (!ok) {
      window.alert('Could not approve account.')
      return
    }
    await refresh()
  }

  return (
    <div>
      {canSchedule && (
        <Card title="Google Meet & Calendar" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--gray4)', marginTop: 0, marginBottom: 12 }}>
            Connect your Google account once in Settings. Telemedicine appointments automatically create a Google Meet link and calendar event. Other appointment types can opt in with the checkbox when scheduling.
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

      {isAdmin && pendingStaff.length > 0 && (
        <Card
          title={`Pending approvals (${pendingStaff.length})`}
          style={{ marginBottom: 20, borderColor: '#f0d78c' }}
        >
          <p style={{ fontSize: 13, color: 'var(--gray4)', marginTop: 0 }}>
            New sign-ups waiting for you to approve and assign a role.
          </p>
          <div className="team-grid">
            {pendingStaff.map((s) => (
              <div key={s.id} className="team-card" style={{ borderColor: '#f0d78c', background: '#fffdf5' }}>
                <div className="team-card__avatar">{s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--gray4)', margin: '4px 0 8px' }}>{s.email}</div>
                <Badge variant="amber">Pending</Badge>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    onClick={() => void handleApprove(s)}
                    disabled={approvingId === s.id}
                  >
                    {approvingId === s.id ? 'Approving…' : 'Approve as Staff'}
                  </Button>
                  <Button variant="secondary" onClick={() => openEdit(s)}>Assign role</Button>
                  <Button variant="danger" onClick={() => void handleDelete(s)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        title={
          isAdmin && pendingStaff.length
            ? `Team & Access (${pendingStaff.length} pending)`
            : 'Team & Access'
        }
        action={isAdmin ? <Button variant="primary" onClick={openCreate}>+ Staff</Button> : undefined}
      >
        <div className="team-grid">
          {activeStaff.map((s) => (
            <div key={s.id} className="team-card">
              <div className="team-card__avatar">{s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--gray4)', margin: '4px 0 8px' }}>{s.specialty || '—'}</div>
              <Badge variant={ROLE_BADGE[s.role] ?? 'gray'}>{ROLE_LABELS[s.role as Role] ?? s.role}</Badge>
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
        <Card title="HEFRA accreditation" style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={hefraApproved} onChange={(e) => setHefraApproved(e.target.checked)} />
              Display HEFRA-approved facility badge on the platform
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>HEFRA license / registration #</span>
              <input className="form-input" value={hefraLicenseNumber} onChange={(e) => setHefraLicenseNumber(e.target.value)} placeholder="Optional — shown on landing page if set" />
            </label>
          </div>
        </Card>
      )}

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
              onClick={() => void saveClinicSettings({
                provider_accreditation: providerAccreditation,
                eclaim_authorization: eclaimAuthorization,
                hefra_approved: hefraApproved,
                hefra_license_number: hefraLicenseNumber,
              })}
            >
              Save clinic settings
            </Button>
          </div>
        </Card>
      )}

      {isAdmin && (
        <Card title="Data protection & security" style={{ marginTop: 20 }}>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--gray4)', lineHeight: 1.6 }}>
            <li>All traffic uses HTTPS (TLS encryption in transit).</li>
            <li>Patient data is stored in Supabase (PostgreSQL) with row-level security per staff role.</li>
            <li>Staff passwords are hashed by Supabase Auth; clinical data is not stored on email/web hosting.</li>
            <li>Audit trail below records logins and patient record access (Ghana Data Protection Act compliance).</li>
            <li>Admin-only delete for clinical entries prevents accidental data loss by non-admin staff.</li>
          </ul>
        </Card>
      )}

      {isAdmin && (
        <Card title="Audit trail" style={{ marginTop: 20 }} noPadding>
          <p style={{ fontSize: 13, color: 'var(--gray4)', margin: '0 0 12px', padding: '0 16px' }}>
            Who accessed or changed patient data — last 150 events.
          </p>
          {auditLoading ? (
            <p style={{ padding: 16, fontSize: 13, color: 'var(--gray4)' }}>Loading audit log…</p>
          ) : auditLog.length ? (
            <table className="data-table">
              <thead>
                <tr><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>Patient</th></tr>
              </thead>
              <tbody>
                {auditLog.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.created_at).toLocaleString('en-GH')}</td>
                    <td>{row.user_name || '–'} <span style={{ color: 'var(--gray4)', fontSize: 11 }}>({row.user_role})</span></td>
                    <td>{row.action}</td>
                    <td>{row.entity_type}{row.entity_id ? ` ${row.entity_id}` : ''}</td>
                    <td>{row.patient_id || '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: 16, fontSize: 13, color: 'var(--gray4)' }}>No audit events yet. Apply the latest database migration if this section is empty after use.</p>
          )}
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
