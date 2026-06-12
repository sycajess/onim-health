import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData, fmtDate, displayField, formatPatientDemographics, patientFullName } from '@onim/data'
import { Badge, Card, EmptyState, PdfAttachZone, SpecialtyTag, Timeline } from '@onim/ui'
import type { TimelineEvent } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import '@onim/ui/Card.css'
import './PatientDetail.css'

const TABS = ['Overview', 'Records', 'Prescriptions', 'Labs', 'Appointments', 'Billing'] as const

export function PatientDetailPage() {
  const { id } = useParams()
  const { db, getPatient, updateLabAttachment } = useData()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const patient = id ? getPatient(id) : undefined

  const records = useMemo(
    () => db.records.filter((r) => r.patient_id === patient?.id),
    [db.records, patient?.id],
  )
  const rx = useMemo(
    () => db.prescriptions.filter((r) => r.patient_id === patient?.id),
    [db.prescriptions, patient?.id],
  )
  const labs = useMemo(
    () => db.labs.filter((l) => l.patient_id === patient?.id),
    [db.labs, patient?.id],
  )
  const appts = useMemo(
    () => db.appointments.filter((a) => a.patient_id === patient?.id),
    [db.appointments, patient?.id],
  )
  const bills = useMemo(
    () => db.billing.filter((b) => b.patient_id === patient?.id),
    [db.billing, patient?.id],
  )

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!patient) return []
    type RawEvent = TimelineEvent & { sortDate: string }
    const events: RawEvent[] = [
      ...records.map((r) => ({
        id: r.id,
        sortDate: r.date,
        date: fmtDate(r.date),
        type: 'Record',
        label: r.type,
        detail: r.complaint,
      })),
      ...rx.map((r) => ({
        id: r.id,
        sortDate: r.date,
        date: fmtDate(r.date),
        type: 'Prescription',
        label: r.medication,
        detail: `${r.dosage} · ${r.frequency}`,
      })),
      ...labs.map((l) => ({
        id: l.id,
        sortDate: l.date,
        date: fmtDate(l.date),
        type: 'Lab',
        label: l.test,
        detail: `${l.result} (${l.status})`,
      })),
      ...appts.map((a) => ({
        id: a.id,
        sortDate: a.date,
        date: fmtDate(a.date),
        type: 'Appointment',
        label: a.type,
        detail: `${a.time} · ${a.status}`,
      })),
    ]
    return events
      .sort((a, b) => (a.sortDate < b.sortDate ? 1 : -1))
      .map((ev) => ({
        id: ev.id,
        date: ev.date,
        type: ev.type,
        label: ev.label,
        detail: ev.detail,
      }))
  }, [patient, records, rx, labs, appts])

  if (!patient) {
    return <EmptyState icon="👤" title="Patient not found" description="This patient record does not exist." />
  }

  return (
    <div>
      <Link to="/patients" className="link-cell" style={{ display: 'inline-block', marginBottom: 16 }}>← Back to Patients</Link>

      <div className="pt-header">
        <div className="pt-avatar-lg">{(patient.fname[0] + patient.lname[0]).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div className="pt-name">{patientFullName(patient)}</div>
          <div className="pt-meta">
            <span className="pt-meta-item">{patient.id}</span>
            <span className="pt-meta-item">{formatPatientDemographics(patient.dob, patient.sex)}</span>
            <SpecialtyTag specialty={patient.specialty} />
            <Badge>{patient.status}</Badge>
          </div>
        </div>
        <RowActions>
          <IconAction icon="message" label={`Message ${patientFullName(patient)}`} to={`/messaging?thread=${patient.id}`} variant="primary" />
        </RowActions>
      </div>

      <div className="pt-tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={`pt-tab${tab === t ? ' pt-tab--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="pt-overview">
          <div>
            <div className="info-grid">
              {[
                ['Phone', displayField(patient.phone)],
                ['Email', displayField(patient.email)],
                ['Blood Type', displayField(patient.blood)],
                ['Weight', displayField(patient.weight, ' kg')],
                ['Height', displayField(patient.height, ' cm')],
                ['NHIS', displayField(patient.nhis)],
                ['Allergies', displayField(patient.allergies)],
                ['Conditions', displayField(patient.conditions)],
                ['Current Meds', displayField(patient.current_meds)],
              ].map(([label, value]) => (
                <div key={label} className="info-item">
                  <div className="info-item__label">{label}</div>
                  <div className="info-item__value">{value}</div>
                </div>
              ))}
            </div>
            <Card title="Emergency Contact" style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500 }}>{patient.ec_name || '–'}</div>
              <div style={{ fontSize: 12, color: 'var(--gray4)' }}>{patient.ec_rel}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{patient.ec_phone || '–'}</div>
            </Card>
          </div>
          <Card title="Activity Timeline">
            <Timeline events={timelineEvents} />
          </Card>
        </div>
      )}

      {tab === 'Records' && (
        <Card title="Medical Records" noPadding>
          {records.length ? (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Specialty</th><th>Assessment</th></tr></thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}><td>{fmtDate(r.date)}</td><td>{r.type}</td><td>{r.specialty}</td><td>{r.assessment}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState icon="📋" title="No records yet" />}
        </Card>
      )}

      {tab === 'Prescriptions' && (
        <Card title="Prescriptions" noPadding>
          {rx.length ? (
            <table className="data-table">
              <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Status</th></tr></thead>
              <tbody>
                {rx.map((r) => (
                  <tr key={r.id}><td><strong>{r.medication}</strong></td><td>{r.dosage}</td><td>{r.frequency}</td><td><Badge>{r.status}</Badge></td></tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState icon="💊" title="No prescriptions" />}
        </Card>
      )}

      {tab === 'Labs' && (
        <div className="pt-labs-list">
          {labs.length ? labs.map((l) => (
            <Card key={l.id} title={`${l.test} — ${fmtDate(l.date)}`}>
              <div style={{ marginBottom: 8 }}><strong>{l.result}</strong> <Badge>{l.status}</Badge></div>
              <div style={{ fontSize: 12, color: 'var(--gray4)', marginBottom: 12 }}>{l.facility} · Ref: {l.ref}</div>
              <PdfAttachZone
                attachment={l.attachment ? { name: l.attachment.name, dataUrl: l.attachment.data_url } : null}
                onAttach={(file) => updateLabAttachment(l.id, { name: file.name, data_url: file.dataUrl })}
                onRemove={() => updateLabAttachment(l.id, null)}
              />
            </Card>
          )) : <EmptyState icon="🧪" title="No lab results" />}
        </div>
      )}

      {tab === 'Appointments' && (
        <Card title="Appointments" noPadding>
          {appts.length ? (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {appts.map((a) => (
                  <tr key={a.id}>
                    <td>{fmtDate(a.date)}</td><td>{a.time}</td><td>{a.type}</td>
                    <td><Badge>{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState icon="📅" title="No appointments" />}
        </Card>
      )}

      {tab === 'Billing' && (
        <Card title="Billing" noPadding>
          {bills.length ? (
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td><td>{fmtDate(b.date)}</td>
                    <td><strong>GHS {b.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</strong></td>
                    <td><Badge>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState icon="🧾" title="No invoices" />}
        </Card>
      )}
    </div>
  )
}
