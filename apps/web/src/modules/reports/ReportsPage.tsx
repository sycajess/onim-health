import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ROLE_LABELS } from '@onim/types'
import { useData, fmtDate, patientFullName, today, daysUntil } from '@onim/data'
import { Card, PageHero } from '@onim/ui'
import { ReportChartPanel } from './ReportChartPanel'
import '@onim/ui/Card.css'
import './Reports.css'

const REPORTS = [
  { id: 'financial', icon: '💰', title: 'Financial Report', desc: 'Revenue, payments, outstanding balances' },
  { id: 'inventory', icon: '📦', title: 'Inventory Report', desc: 'Stock levels, expiry, dispense history' },
  { id: 'provider', icon: '🩺', title: 'Provider Performance', desc: 'Consultations, prescriptions per provider' },
  { id: 'employee', icon: '👤', title: 'Employee Report', desc: 'Staff activity, roles, access overview' },
  { id: 'patient', icon: '👥', title: 'Patient Summary', desc: 'Demographics and specialty breakdown' },
  { id: 'appointments', icon: '📅', title: 'Appointments Report', desc: 'Attendance and scheduling overview' },
  { id: 'prescriptions', icon: '💊', title: 'Prescriptions Report', desc: 'Most prescribed meds, refills' },
  { id: 'labs', icon: '🧪', title: 'Lab Results Report', desc: 'Abnormal results, attachments' },
] as const

const CHART_COLORS = ['#1D9E75', '#185FA5', '#BA7517', '#D4537E', '#D85A30', '#3B6D11', '#6C757D', '#5DCAA5']

const PIE_COLORS: Record<string, string> = {
  'Weight Loss': '#1D9E75',
  'Sexual Health': '#D85A30',
  'Mental Health': '#185FA5',
  Fertility: '#D4537E',
  Hair: '#BA7517',
  Skin: '#3B6D11',
  Collected: '#1D9E75',
  Outstanding: '#BA7517',
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; payload?: { fill?: string } }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rpt-tooltip">
      <strong>{label ?? payload[0].name}</strong>
      <span>{typeof payload[0].value === 'number' && payload[0].value > 999 ? `GHS ${payload[0].value.toLocaleString('en-GH', { minimumFractionDigits: 2 })}` : payload[0].value}</span>
    </div>
  )
}

export function ReportsPage() {
  const { db } = useData()
  const [active, setActive] = useState<string | null>(null)

  const financialData = useMemo(() => {
    const paid = db.billing.filter((b) => b.status.startsWith('Paid'))
    const pending = db.billing.filter((b) => b.status === 'Pending')
    const totalRev = paid.reduce((s, b) => s + b.amount, 0)
    const totalPending = pending.reduce((s, b) => s + b.amount, 0)
    return {
      paid,
      pending,
      totalRev,
      totalPending,
      pie: [
        { name: 'Collected', value: totalRev },
        { name: 'Outstanding', value: totalPending },
      ].filter((d) => d.value > 0),
    }
  }, [db.billing])

  const inventoryData = useMemo(() =>
    db.inventory.map((m) => ({
      name: m.name.length > 14 ? `${m.name.slice(0, 12)}…` : m.name,
      fullName: m.name,
      qty: m.qty,
      low: m.qty <= m.threshold,
      expiring: daysUntil(m.expiry) <= 30,
    })),
  [db.inventory])

  const patientData = useMemo(() => {
    const specCount: Record<string, number> = {}
    db.patients.forEach((p) => { specCount[p.specialty] = (specCount[p.specialty] ?? 0) + 1 })
    return Object.entries(specCount).map(([name, value]) => ({ name, value }))
  }, [db.patients])

  const appointmentData = useMemo(() => {
    const statusCount: Record<string, number> = {}
    db.appointments.forEach((a) => { statusCount[a.status] = (statusCount[a.status] ?? 0) + 1 })
    return Object.entries(statusCount).map(([name, count]) => ({ name, count }))
  }, [db.appointments])

  const providerData = useMemo(() => {
    const names = [...new Set([
      ...db.records.map((r) => r.provider),
      ...db.appointments.map((a) => a.provider),
      ...db.prescriptions.map((r) => r.provider),
      ...db.labs.map((l) => l.provider),
    ])]
    return names.map((name) => ({
      name: name.length > 12 ? `${name.slice(0, 10)}…` : name,
      fullName: name,
      consultations: db.records.filter((r) => r.provider === name).length,
      prescriptions: db.prescriptions.filter((r) => r.provider === name).length,
      appointments: db.appointments.filter((a) => a.provider === name).length,
      labs: db.labs.filter((l) => l.provider === name).length,
    }))
  }, [db.records, db.appointments, db.prescriptions, db.labs])

  const employeeRoleData = useMemo(() => {
    const counts: Record<string, number> = {}
    db.staff.forEach((s) => { counts[s.role] = (counts[s.role] ?? 0) + 1 })
    return Object.entries(counts).map(([role, value]) => ({ name: ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role, value }))
  }, [db.staff])

  const prescriptionMedData = useMemo(() => {
    const medFreq: Record<string, number> = {}
    db.prescriptions.forEach((r) => { medFreq[r.medication] = (medFreq[r.medication] ?? 0) + 1 })
    return Object.entries(medFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name: name.length > 16 ? `${name.slice(0, 14)}…` : name,
        fullName: name,
        count,
      }))
  }, [db.prescriptions])

  const labStatusData = useMemo(() => {
    const normal = db.labs.filter((l) => l.status === 'Normal').length
    const abnormal = db.labs.length - normal
    return [
      { name: 'Normal', value: normal },
      { name: 'Abnormal', value: abnormal },
    ].filter((d) => d.value > 0)
  }, [db.labs])

  function renderReport(id: string) {
    if (id === 'financial') {
      const { paid, pending, totalRev, totalPending, pie } = financialData
      const collectedPct = totalRev + totalPending > 0 ? Math.round((totalRev / (totalRev + totalPending)) * 100) : 0
      return (
        <>
          <div className="rpt-summary">
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">GHS {totalRev.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</div><div className="rpt-sum-item__lbl">Revenue Collected</div></div>
            <div className="rpt-sum-item"><div className="rpt-sum-item__val" style={{ color: 'var(--amber)' }}>GHS {totalPending.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</div><div className="rpt-sum-item__lbl">Outstanding</div></div>
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">{db.billing.length}</div><div className="rpt-sum-item__lbl">Total Invoices</div></div>
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">{paid.length}</div><div className="rpt-sum-item__lbl">Paid Invoices</div></div>
          </div>
          <ReportChartPanel
            title="Revenue split"
            explanation={`A pie chart shows how billed income is distributed. ${collectedPct}% has been collected (GHS ${totalRev.toLocaleString('en-GH', { minimumFractionDigits: 2 })}), while ${100 - collectedPct}% remains outstanding across ${pending.length} invoice${pending.length === 1 ? '' : 's'}. Use this to spot cash-flow gaps quickly.`}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={92} paddingAngle={3}>
                  {pie.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? CHART_COLORS[0]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartPanel>
        </>
      )
    }

    if (id === 'inventory') {
      const lowCount = db.inventory.filter((m) => m.qty <= m.threshold).length
      return (
        <>
          <ReportChartPanel
            title="Stock levels by medication"
            explanation={`Bar charts work best when comparing quantities across items. ${lowCount} of ${db.inventory.length} medications are at or below their reorder threshold — taller bars are healthier stock; short bars need attention before dispensary runs out.`}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={inventoryData} margin={{ top: 8, right: 8, left: -12, bottom: 48 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-28} textAnchor="end" interval={0} height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0].payload as { fullName: string; qty: number; low: boolean; expiring: boolean }
                    return (
                      <div className="rpt-tooltip">
                        <strong>{row.fullName}</strong>
                        <span>{row.qty} units{row.low ? ' · Low stock' : ''}{row.expiring ? ' · Expiring soon' : ''}</span>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="qty" name="Units in stock" radius={[6, 6, 0, 0]}>
                  {inventoryData.map((entry, i) => (
                    <Cell key={entry.fullName} fill={entry.low ? '#D85A30' : CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ReportChartPanel>
          <table className="data-table" style={{ marginTop: 18 }}>
            <thead><tr><th>Medication</th><th>Qty</th><th>Threshold</th><th>Expiry</th></tr></thead>
            <tbody>
              {db.inventory.map((m) => (
                <tr key={m.id}><td>{m.name}</td><td>{m.qty}</td><td>{m.threshold}</td><td>{fmtDate(m.expiry)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )
    }

    if (id === 'provider') {
      return (
        <>
          <ReportChartPanel
            title="Provider workload comparison"
            explanation="Bar charts compare activity across providers side by side. Taller bars mean more consultations, prescriptions, or appointments — useful for balancing clinic load and spotting who may need support."
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={providerData} margin={{ top: 8, right: 8, left: -12, bottom: 48 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="consultations" name="Consultations" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                <Bar dataKey="prescriptions" name="Prescriptions" fill="#185FA5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="appointments" name="Appointments" fill="#BA7517" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartPanel>
          <table className="data-table" style={{ marginTop: 18 }}>
            <thead><tr><th>Provider</th><th>Consultations</th><th>Prescriptions</th><th>Appointments</th><th>Lab Orders</th></tr></thead>
            <tbody>
              {providerData.map((p) => (
                <tr key={p.fullName}>
                  <td><strong>{p.fullName}</strong></td>
                  <td>{p.consultations}</td>
                  <td>{p.prescriptions}</td>
                  <td>{p.appointments}</td>
                  <td>{p.labs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )
    }

    if (id === 'employee') {
      return (
        <>
          <div className="rpt-summary">
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">{db.staff.length}</div><div className="rpt-sum-item__lbl">Total Staff</div></div>
            {employeeRoleData.map((r) => (
              <div key={r.name} className="rpt-sum-item"><div className="rpt-sum-item__val">{r.value}</div><div className="rpt-sum-item__lbl">{r.name}</div></div>
            ))}
          </div>
          <ReportChartPanel
            title="Staff by role"
            explanation="A pie chart shows how your team is distributed by role. This helps verify coverage — e.g. enough clinical staff vs admin — and plan hiring or access permissions."
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={employeeRoleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {employeeRoleData.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartPanel>
          <table className="data-table" style={{ marginTop: 18 }}>
            <thead><tr><th>Name</th><th>Role</th><th>Specialty</th><th>Email</th><th>Phone</th></tr></thead>
            <tbody>
              {db.staff.map((s) => (
                <tr key={s.email}><td><strong>{s.name}</strong></td><td>{ROLE_LABELS[s.role as keyof typeof ROLE_LABELS] ?? s.role}</td><td>{s.specialty}</td><td>{s.email}</td><td>{s.phone}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )
    }

    if (id === 'patient') {
      const top = [...patientData].sort((a, b) => b.value - a.value)[0]
      return (
        <>
          <ReportChartPanel
            title="Patients by specialty"
            explanation={`Pie charts suit part-to-whole breakdowns. Your clinic serves ${db.patients.length} active patients across ${patientData.length} specialties${top ? ` — ${top.name} is the largest segment (${top.value} patient${top.value === 1 ? '' : 's'}, ${Math.round((top.value / db.patients.length) * 100)}%)` : ''}. This helps plan staffing and resource allocation per department.`}
          >
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={patientData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {patientData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? CHART_COLORS[patientData.indexOf(entry) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartPanel>
        </>
      )
    }

    if (id === 'appointments') {
      const todayCount = db.appointments.filter((a) => a.date === today()).length
      const confirmed = appointmentData.find((s) => s.name === 'Confirmed')?.count ?? 0
      return (
        <>
          <ReportChartPanel
            title="Appointments by status"
            explanation={`A bar chart compares discrete categories side by side. You have ${db.appointments.length} total appointments — ${todayCount} scheduled for today and ${confirmed} confirmed. Gaps between bars highlight bottlenecks (e.g. many Pending vs few Confirmed) so front desk can follow up.`}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={appointmentData} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Appointments" fill="#185FA5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartPanel>
          <table className="data-table" style={{ marginTop: 18 }}>
            <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              {db.appointments.map((a) => {
                const p = db.patients.find((x) => x.id === a.patient_id)
                return <tr key={a.id}><td>{p ? patientFullName(p) : '–'}</td><td>{fmtDate(a.date)}</td><td>{a.time}</td><td>{a.status}</td></tr>
              })}
            </tbody>
          </table>
        </>
      )
    }

    if (id === 'prescriptions') {
      const totalDispensed = db.prescriptions.reduce((s, r) => s + r.qty_dispensed, 0)
      return (
        <>
          <div className="rpt-summary">
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">{db.prescriptions.length}</div><div className="rpt-sum-item__lbl">Total Prescriptions</div></div>
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">{db.prescriptions.filter((r) => r.status === 'Active').length}</div><div className="rpt-sum-item__lbl">Active</div></div>
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">{totalDispensed}</div><div className="rpt-sum-item__lbl">Units Dispensed</div></div>
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">{prescriptionMedData.length}</div><div className="rpt-sum-item__lbl">Unique Medications</div></div>
          </div>
          <ReportChartPanel
            title="Most prescribed medications"
            explanation="Bar charts rank medications by prescription count. The tallest bar is your most common Rx — useful for inventory forecasting and identifying formulary trends."
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={prescriptionMedData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" name="Prescriptions" fill="#1D9E75" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ReportChartPanel>
          <table className="data-table" style={{ marginTop: 18 }}>
            <thead><tr><th>Patient</th><th>Medication</th><th>Dosage</th><th>Date</th><th>Dispensed</th><th>Status</th></tr></thead>
            <tbody>
              {db.prescriptions.map((r) => {
                const p = db.patients.find((x) => x.id === r.patient_id)
                return (
                  <tr key={r.id}>
                    <td>{p ? patientFullName(p) : '–'}</td>
                    <td><strong>{r.medication}</strong></td>
                    <td>{r.dosage}</td>
                    <td>{fmtDate(r.date)}</td>
                    <td>{r.qty_dispensed}</td>
                    <td>{r.status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )
    }

    if (id === 'labs') {
      const withAttachment = db.labs.filter((l) => l.attachment).length
      return (
        <>
          <div className="rpt-summary">
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">{db.labs.length}</div><div className="rpt-sum-item__lbl">Total Tests</div></div>
            <div className="rpt-sum-item"><div className="rpt-sum-item__val" style={{ color: 'var(--danger)' }}>{labStatusData.find((d) => d.name === 'Abnormal')?.value ?? 0}</div><div className="rpt-sum-item__lbl">Abnormal</div></div>
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">{labStatusData.find((d) => d.name === 'Normal')?.value ?? 0}</div><div className="rpt-sum-item__lbl">Normal</div></div>
            <div className="rpt-sum-item"><div className="rpt-sum-item__val">{withAttachment}</div><div className="rpt-sum-item__lbl">With PDF</div></div>
          </div>
          <ReportChartPanel
            title="Normal vs abnormal results"
            explanation="A pie chart shows the proportion of normal vs abnormal lab results. A large abnormal slice may signal patients needing follow-up or tests that need clinical review."
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={labStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {labStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.name === 'Normal' ? '#1D9E75' : '#D85A30'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ReportChartPanel>
          <table className="data-table" style={{ marginTop: 18 }}>
            <thead><tr><th>Patient</th><th>Test</th><th>Date</th><th>Result</th><th>Attachment</th><th>Status</th></tr></thead>
            <tbody>
              {db.labs.map((l) => {
                const p = db.patients.find((x) => x.id === l.patient_id)
                return (
                  <tr key={l.id}>
                    <td>{p ? patientFullName(p) : '–'}</td>
                    <td><strong>{l.test}</strong></td>
                    <td>{fmtDate(l.date)}</td>
                    <td>{l.result}</td>
                    <td>{l.attachment ? '📄 Yes' : '–'}</td>
                    <td>{l.status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )
    }

    return null
  }

  return (
    <div className="page--reports">
      <PageHero title="Reports & Analytics" subtitle="Financial, clinical, and operational insights" variant="blue" />
      <div className="reports-grid">
        {REPORTS.map((r) => (
          <button key={r.id} type="button" className={`report-card${active === r.id ? ' report-card--active' : ''}`} onClick={() => setActive(r.id)}>
            <div className="report-card__icon">{r.icon}</div>
            <div className="report-card__title">{r.title}</div>
            <div className="report-card__desc">{r.desc}</div>
          </button>
        ))}
      </div>
      {active && (
        <Card title={`${REPORTS.find((r) => r.id === active)?.title} — ${fmtDate(today())}`}>
          {renderReport(active)}
        </Card>
      )}
    </div>
  )
}
