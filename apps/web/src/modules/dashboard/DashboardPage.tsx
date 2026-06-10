import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useData, fmtDate, today, daysUntil, patientInitials, patientFullName, SPECIALTY_COLORS } from '@onim/data'
import { Badge, Card, PageHero, SpecialtyTag, StatCard } from '@onim/ui'
import '@onim/ui/Card.css'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export function DashboardPage() {
  const { db } = useData()
  const lowStock = db.inventory.filter((m) => m.qty <= m.threshold || daysUntil(m.expiry) <= 30)
  const recentPts = [...db.patients].sort((a, b) => (b.created > a.created ? 1 : -1)).slice(0, 5)
  const todayAppts = db.appointments.filter((a) => a.date === today())
  const specCount: Record<string, number> = {}
  db.patients.forEach((p) => { specCount[p.specialty] = (specCount[p.specialty] ?? 0) + 1 })

  return (
    <div className="page--dashboard">
      <PageHero title="Good morning" subtitle={`${db.patients.length} active patients · ${todayAppts.length} appointments today`} />
      <motion.div className="stats-grid" variants={stagger} initial="hidden" animate="show">
        {[
          { icon: '👥', bg: 'var(--teal-light)', color: 'var(--teal)', label: 'Total Patients', value: db.patients.length, sub: 'Active records' },
          { icon: '📅', bg: 'var(--blue-light)', color: 'var(--blue)', label: "Today's Appointments", value: todayAppts.length, sub: 'Scheduled today' },
          { icon: '💊', bg: 'var(--amber-light)', color: 'var(--amber)', label: 'Active Prescriptions', value: db.prescriptions.filter((r) => r.status === 'Active').length, sub: 'Across all patients' },
          { icon: '⚠️', bg: 'var(--danger-light)', color: 'var(--danger)', label: 'Low Stock Alerts', value: lowStock.length, sub: 'Below threshold' },
        ].map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <StatCard icon={s.icon} iconBg={s.bg} iconColor={s.color} label={s.label} value={s.value} sub={s.sub} />
          </motion.div>
        ))}
      </motion.div>
      <div className="two-col">
        <Card title="Recent Patients" action={<Link to="/patients" className="link-cell">View All</Link>} noPadding>
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Specialty</th><th>Registered</th></tr></thead>
            <tbody>
              {recentPts.map((p) => (
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
                  <td><SpecialtyTag specialty={p.specialty} /></td>
                  <td>{fmtDate(p.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Today's Appointments" action={<Link to="/appointments" className="link-cell">View All</Link>} noPadding>
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Time</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {todayAppts.length ? todayAppts.map((a) => {
                const p = db.patients.find((x) => x.id === a.patient_id)
                return (
                  <tr key={a.id}>
                    <td>{p ? patientFullName(p) : '–'}</td>
                    <td>{a.time}</td>
                    <td>{a.type}</td>
                    <td><Badge>{a.status}</Badge></td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray4)', padding: 20 }}>No appointments today</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="two-col">
        <Card title="Inventory Alerts">
          {lowStock.length ? lowStock.map((m) => {
            const exp = daysUntil(m.expiry)
            const cls = exp <= 7 ? 'alert-bar--danger' : 'alert-bar--amber'
            const msg = m.qty <= m.threshold ? `Low stock (${m.qty})` : `Expires in ${exp} days`
            return <div key={m.id} className={`alert-bar ${cls}`}>⚠️ <strong>{m.name}</strong>: {msg}</div>
          }) : <div className="alert-bar alert-bar--success">✅ All medications well-stocked.</div>}
        </Card>
        <Card title="Patients by Specialty">
          {Object.entries(specCount).map(([s, c]) => {
            const pct = Math.round((c / db.patients.length) * 100)
            return (
              <div key={s} style={{ marginBottom: 10 }}>
                <div className="flex-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{s}</span>
                  <span style={{ fontSize: 12, color: 'var(--gray4)' }}>{c} patients</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: SPECIALTY_COLORS[s] ?? 'var(--teal)' }} />
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}
