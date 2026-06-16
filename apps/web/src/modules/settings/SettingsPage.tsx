import { useData, SPECIALTIES, SPECIALTY_COLORS } from '@onim/data'
import { Badge, Card } from '@onim/ui'
import '@onim/ui/Card.css'

const ROLE_BADGE: Record<string, 'teal' | 'blue' | 'amber' | 'success' | 'gray' | 'danger'> = {
  admin: 'blue', doctor: 'teal', nurse: 'blue', pharmacist: 'amber', nutritionist: 'success', staff: 'gray', accountant: 'danger',
}

export function SettingsPage() {
  const { db } = useData()
  const specCount: Record<string, number> = {}
  db.patients.forEach((p) => { specCount[p.specialty] = (specCount[p.specialty] ?? 0) + 1 })

  return (
    <div>
      <Card title="Team & Access">
        <div className="team-grid">
          {db.staff.map((s) => (
            <div key={s.email} className="team-card">
              <div className="team-card__avatar">{s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--gray4)', margin: '4px 0 8px' }}>{s.specialty}</div>
              <Badge variant={ROLE_BADGE[s.role] ?? 'gray'}>{s.role}</Badge>
              <div style={{ fontSize: 11, color: 'var(--gray4)', marginTop: 10 }}>{s.email}</div>
            </div>
          ))}
        </div>
      </Card>

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
    </div>
  )
}
