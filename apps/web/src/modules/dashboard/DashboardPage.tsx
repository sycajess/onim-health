import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@onim/auth'
import { useData, fmtDate, patientInitials, patientFullName, SPECIALTY_COLORS, today, daysUntil } from '@onim/data'
import { fetchAuditLog, type AuditLogEntry } from '@onim/supabase'
import { Badge, Card, EmptyState, StatCard } from '@onim/ui'
import { formatAuditActivity } from '../../lib/auditLabels'
import '@onim/ui/Card.css'

export function DashboardPage() {
  const { profile } = useAuth()
  const { db } = useData()
  const t = today()
  const isAdmin = profile?.role === 'admin'
  const [activity, setActivity] = useState<AuditLogEntry[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    setActivityLoading(true)
    void fetchAuditLog(80).then((result) => {
      if (cancelled) return
      if (!('error' in result)) setActivity(result)
      setActivityLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [isAdmin, db.patients.length, db.appointments.length, db.billing.length, db.inventory.length, db.prescriptions.length, db.labs.length])

  const data = useMemo(() => {
    const todayAppointments = db.appointments.filter((a) => a.date === t && a.status !== 'Cancelled' && a.status !== 'Completed')
    const activeRxCount = db.prescriptions.filter((p) => p.status === 'Active').length
    const lowStockCount = db.inventory.filter((m) => m.qty <= m.threshold).length
    const recentPatients = db.patients.slice(0, 5)
    const inventoryAlerts = db.inventory
      .filter((m) => m.qty <= m.threshold || daysUntil(m.expiry) <= 30)
      .map((m) => ({ ...m, low: m.qty <= m.threshold }))
    const specialtyMap = new Map<string, number>()
    for (const p of db.patients) {
      specialtyMap.set(p.specialty, (specialtyMap.get(p.specialty) ?? 0) + 1)
    }
    const specialtyBreakdown = [...specialtyMap.entries()].map(([specialty, count]) => ({ specialty, count }))

    return {
      patientCount: db.patients.length,
      todayAppointmentCount: todayAppointments.length,
      activeRxCount,
      lowStockCount,
      recentPatients,
      todayAppointments,
      inventoryAlerts,
      specialtyBreakdown,
    }
  }, [db, t])

  const totalPatients = data.patientCount || 1

  return (
    <div>
      <div className="stats-grid">
        {[
          { icon: '👥', bg: 'var(--teal-light)', color: 'var(--teal)', label: 'Total Patients', value: data.patientCount, sub: '↑ Active records' },
          { icon: '📅', bg: 'var(--blue-light)', color: 'var(--blue)', label: "Today's Appointments", value: data.todayAppointmentCount, sub: 'Scheduled today' },
          { icon: '💊', bg: 'var(--amber-light)', color: 'var(--amber)', label: 'Active Prescriptions', value: data.activeRxCount, sub: 'Across all patients' },
          { icon: '⚠️', bg: 'var(--danger-light)', color: 'var(--danger)', label: 'Low Stock Alerts', value: data.lowStockCount, sub: 'Medications below threshold' },
        ].map((s) => (
          <StatCard key={s.label} icon={s.icon} iconBg={s.bg} iconColor={s.color} label={s.label} value={s.value} sub={s.sub} />
        ))}
      </div>

      {isAdmin && (
        <Card title="Notifications (last 24 hours)" action={<Link to="/activity" className="link-cell">Open activity log</Link>} noPadding>
          {activityLoading && !activity.length ? (
            <p style={{ padding: 16, fontSize: 13, color: 'var(--gray4)' }}>Loading…</p>
          ) : activity.filter((row) => {
            const tMs = Date.parse(row.created_at)
            return !Number.isNaN(tMs) && Date.now() - tMs <= 24 * 60 * 60 * 1000 && row.user_id !== profile?.id
          }).length ? (
            <table className="data-table">
              <thead>
                <tr><th>When</th><th>Activity</th><th>Role</th></tr>
              </thead>
              <tbody>
                {activity
                  .filter((row) => {
                    const tMs = Date.parse(row.created_at)
                    return !Number.isNaN(tMs) && Date.now() - tMs <= 24 * 60 * 60 * 1000 && row.user_id !== profile?.id
                  })
                  .slice(0, 15)
                  .map((row) => (
                    <tr key={row.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(row.created_at).toLocaleString()}</td>
                      <td style={{ fontSize: 13 }}>{formatAuditActivity(row)}</td>
                      <td><Badge>{row.user_role || '—'}</Badge></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="🔔" title="No team notifications" description="Other staff activity from the last 24 hours shows here. Your own actions are listed in the full activity log." />
          )}
        </Card>
      )}

      {isAdmin && (
        <Card title="Activity log" action={<Link to="/activity" className="link-cell">View all</Link>} noPadding>
          {activityLoading && !activity.length ? (
            <p style={{ padding: 16, fontSize: 13, color: 'var(--gray4)' }}>Loading activity…</p>
          ) : activity.length ? (
            <table className="data-table">
              <thead>
                <tr><th>When</th><th>Activity</th><th>Role</th></tr>
              </thead>
              <tbody>
                {activity.slice(0, 12).map((row) => (
                  <tr key={row.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(row.created_at).toLocaleString()}</td>
                    <td style={{ fontSize: 13 }}>{formatAuditActivity(row)}</td>
                    <td><Badge>{row.user_role || '—'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="📋" title="No activity yet" description="Creates, updates, and views across the clinic will appear here." />
          )}
        </Card>
      )}

      <div className="two-col">
        <Card title="Recent Patients" action={<Link to="/patients" className="link-cell">View All</Link>} noPadding>
          {data.recentPatients.length ? (
            <table className="data-table">
              <thead><tr><th>Patient</th><th>Specialty</th><th>Registered</th></tr></thead>
              <tbody>
                {data.recentPatients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="avatar-cell">
                        <div className="avatar">{patientInitials(p)}</div>
                        <div>
                          <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link>
                          <div className="avatar-sub">{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.specialty}</td>
                    <td>{fmtDate(p.created)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="👥" title="No patients yet" description="Add patients to see them here." />
          )}
        </Card>
        <Card title="Today's Appointments" action={<Link to="/appointments" className="link-cell">View All</Link>} noPadding>
          {data.todayAppointments.length ? (
            <table className="data-table">
              <thead><tr><th>Patient</th><th>Time</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {data.todayAppointments.map((a) => {
                  const patient = db.patients.find((p) => p.id === a.patient_id)
                  return (
                    <tr key={a.id}>
                      <td>{patient ? patientFullName(patient) : a.patient_id}</td>
                      <td>{a.time}</td>
                      <td>{a.type}</td>
                      <td><Badge>{a.status}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="📅" title="No appointments today" />
          )}
        </Card>
      </div>
      <div className="two-col">
        <Card title="Inventory Alerts">
          {data.inventoryAlerts.length ? data.inventoryAlerts.map((m) => {
            const cls = m.low ? 'alert-bar--danger' : 'alert-bar--amber'
            const msg = m.low ? `Low stock (${m.qty})` : `Expires soon (${fmtDate(m.expiry)})`
            return <div key={m.id} className={`alert-bar ${cls}`}>⚠️ <strong>{m.name}</strong>: {msg}</div>
          }) : <div className="alert-bar alert-bar--success">✅ All medications well-stocked.</div>}
        </Card>
        <Card title="Patients by Specialty">
          {data.specialtyBreakdown.length ? data.specialtyBreakdown.map(({ specialty, count }) => {
            const pct = Math.round((count / totalPatients) * 100)
            return (
              <div key={specialty} style={{ marginBottom: 10 }}>
                <div className="flex-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{specialty}</span>
                  <span style={{ fontSize: 12, color: 'var(--gray4)' }}>{count} patients</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: SPECIALTY_COLORS[specialty] ?? 'var(--teal)' }} />
                </div>
              </div>
            )
          }) : <EmptyState icon="📊" title="No specialty data yet" />}
        </Card>
      </div>
    </div>
  )
}
