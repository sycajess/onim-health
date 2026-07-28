import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, displayField, formatPatientDemographics, patientFullName, formatCodedList, parseCodedEntries, formatLabSource, type DrugAllergyAlert, type MedicalRecord } from '@onim/data'
import { checkPatientMedAllergiesWithRxNorm, checkDrugAllergyWithRxNorm } from '../../lib/drugAllergy'
import type { ModuleId } from '@onim/types'
import { Badge, Button, Card, EmptyState, PdfAttachZone, SpecialtyTag, Timeline } from '@onim/ui'
import type { TimelineEvent } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import { AppointmentMeetCell } from '../../components/AppointmentMeetCell'
import { NewPatientModal } from '../../components/NewPatientModal'
import { NewRecordModal } from '../../components/modals/ClinicModals'
import { RecordDetailModal } from '../../components/RecordDetailModal'
import '../../components/RecordDetailModal.css'
import '@onim/ui/Card.css'
import './PatientDetail.css'
import '../../components/SearchInput.css'

const TABS = ['Overview', 'Records', 'Prescriptions', 'Labs', 'Appointments', 'Billing'] as const

const TAB_MODULES: Record<(typeof TABS)[number], ModuleId | null> = {
  Overview: null,
  Records: 'records',
  Prescriptions: 'prescriptions',
  Labs: 'labs',
  Appointments: 'appointments',
  Billing: 'billing',
}

export function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { db, getPatient, deletePatient, updateLabAttachment } = useData()
  const { canEditPatient, canDeletePatient, canWriteModule, canAccessModule } = usePermissions()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const [editOpen, setEditOpen] = useState(false)
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [recordDetail, setRecordDetail] = useState<MedicalRecord | null>(null)
  const patient = id ? getPatient(id) : undefined
  const canWriteRecords = canWriteModule('records')
  const canWriteLabs = canWriteModule('labs')
  const canWriteAppointments = canWriteModule('appointments')
  const showHeaderActions = canEditPatient || canDeletePatient || canWriteRecords
  const visibleTabs = TABS.filter((t) => {
    const module = TAB_MODULES[t]
    return module ? canAccessModule(module) : true
  })

  async function handleDelete() {
    if (!patient) return
    if (!window.confirm(`Delete ${patientFullName(patient)}? This cannot be undone.`)) return
    const result = await deletePatient(patient.id)
    if (typeof result === 'object' && 'error' in result) {
      window.alert(result.error)
      return
    }
    navigate('/patients', { replace: true })
  }

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

  const [rxAllergyAlerts, setRxAllergyAlerts] = useState<{ id: string; alert: DrugAllergyAlert }[]>([])
  const [rxRowAlerts, setRxRowAlerts] = useState<Record<string, DrugAllergyAlert>>({})

  useEffect(() => {
    if (!patient) {
      setRxAllergyAlerts([])
      setRxRowAlerts({})
      return
    }
    let cancelled = false
    void (async () => {
      const activeRx = rx.filter((r) => r.status === 'Active')
      const currentMeds = (patient.current_meds ?? '')
        .split(/[,;\n]+/)
        .map((m) => m.trim())
        .filter(Boolean)
        .map((name) => ({ name }))

      const meds = [
        ...activeRx.map((r) => ({ name: r.medication, rxcui: r.med_rxcui })),
        ...currentMeds,
      ]

      const alerts = await checkPatientMedAllergiesWithRxNorm(patient, meds)
      if (cancelled) return
      setRxAllergyAlerts(alerts.map((alert, i) => ({ id: `alert-${i}`, alert })))

      const rowResults = await Promise.all(
        rx.map(async (r) => {
          const alert = await checkDrugAllergyWithRxNorm(patient, r.medication, r.med_rxcui)
          return { id: r.id, alert }
        }),
      )
      if (cancelled) return
      const rowMap: Record<string, DrugAllergyAlert> = {}
      for (const { id, alert } of rowResults) {
        if (alert) rowMap[id] = alert
      }
      setRxRowAlerts(rowMap)
    })()
    return () => { cancelled = true }
  }, [patient, rx])

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
        {(showHeaderActions || (tab === 'Records' && canWriteRecords)) && (
          <div className="pt-header__actions">
            {showHeaderActions && (
              <RowActions>
                {canEditPatient && (
                  <IconAction icon="edit" label={`Edit ${patientFullName(patient)}`} onClick={() => setEditOpen(true)} />
                )}
                {canDeletePatient && (
                  <IconAction icon="delete" label={`Delete ${patientFullName(patient)}`} variant="danger" onClick={() => void handleDelete()} />
                )}
              </RowActions>
            )}
            {tab === 'Records' && canWriteRecords && (
              <Button variant="primary" onClick={() => setRecordModalOpen(true)}>
                + New Medical Record
              </Button>
            )}
          </div>
        )}
      </div>

      <NewPatientModal open={editOpen} onClose={() => setEditOpen(false)} patient={patient} />
      <NewRecordModal
        open={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        patientId={patient.id}
      />
      <RecordDetailModal
        record={recordDetail}
        open={!!recordDetail}
        onClose={() => setRecordDetail(null)}
      />

      <div className="pt-tabs">
        {visibleTabs.map((t) => (
          <button key={t} type="button" className={`pt-tab${tab === t ? ' pt-tab--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="pt-overview">
          {rxAllergyAlerts.length > 0 && (
            <div className="alert-banner alert-banner--warning" style={{ marginBottom: 16 }}>
              {rxAllergyAlerts.map(({ id, alert }) => (
                <div key={id}>{alert.message}</div>
              ))}
            </div>
          )}
          <div>
            <div className="info-grid">
              {[
                ['Phone', displayField(patient.phone)],
                ['Email', displayField(patient.email)],
                ['Address', displayField(patient.address)],
                ['Ghana Card', displayField(patient.id_num)],
                ['Blood Type', displayField(patient.blood)],
                ['Weight', displayField(patient.weight, ' kg')],
                ['Height', displayField(patient.height, ' cm')],
                ['NHIS', displayField(patient.nhis)],
                ['Allergies', displayField(patient.allergies)],
                ['Diagnosis (ICD-10)', displayField(patient.conditions)],
                ['G-DRG', formatCodedList(parseCodedEntries(patient.gdrg_codes)) || '–'],
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
            <Timeline
              events={timelineEvents}
              clickableTypes={['Record']}
              onEventClick={(ev) => {
                const record = records.find((r) => r.id === ev.id)
                if (record) setRecordDetail(record)
              }}
            />
          </Card>
        </div>
      )}

      {tab === 'Records' && (
        <Card
          title="Medical Records"
          noPadding
        >
          {records.length ? (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Specialty</th><th>Assessment</th></tr></thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="record-row-clickable"
                    onClick={() => setRecordDetail(r)}
                  >
                    <td>{fmtDate(r.date)}</td>
                    <td><span className="link-cell">{r.type}</span></td>
                    <td>{r.specialty}</td>
                    <td>{r.assessment || r.complaint || '–'}</td>
                  </tr>
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
              <thead><tr><th>Medication</th><th>Strength</th><th>Directions</th><th>Route</th><th>Qty Dispensed</th><th>Status</th></tr></thead>
              <tbody>
                {rx.map((r) => {
                  const alert = rxRowAlerts[r.id]
                  return (
                  <tr key={r.id} className={alert ? 'row-alert' : undefined}>
                    <td><strong>{r.medication}</strong>{alert ? ' ⚠' : ''}</td>
                    <td>{r.dosage || '–'}</td>
                    <td>{r.frequency || '–'}</td>
                    <td>{r.route || '–'}</td>
                    <td>{r.qty_dispensed}</td>
                    <td><Badge>{r.status}</Badge></td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          ) : <EmptyState icon="💊" title="No prescriptions" />}
        </Card>
      )}

      {tab === 'Labs' && (
        <div className="pt-labs-list">
          {labs.length ? labs.map((l) => {
            const source = formatLabSource(l)
            return (
            <Card key={l.id} title={`${l.test} — ${fmtDate(l.date)}`}>
              <div style={{ marginBottom: 8 }}><strong>{l.result}</strong> <Badge>{l.status}</Badge></div>
              <div style={{ fontSize: 12, color: 'var(--gray4)', marginBottom: 12 }}>
                {source ? `${source} · ` : ''}Ref: {l.ref || '–'}
              </div>
              {canWriteLabs ? (
                <PdfAttachZone
                  attachment={l.attachment ? { name: l.attachment.name, dataUrl: l.attachment.data_url } : null}
                  onAttach={(file) => updateLabAttachment(l.id, { name: file.name, data_url: file.dataUrl })}
                  onRemove={() => updateLabAttachment(l.id, null)}
                />
              ) : l.attachment ? (
                <a href={l.attachment.data_url} target="_blank" rel="noreferrer" className="link-cell">View report</a>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--gray4)' }}>No report attached</span>
              )}
            </Card>
            )
          }) : <EmptyState icon="🧪" title="No lab results" />}
        </div>
      )}

      {tab === 'Appointments' && (
        <Card title="Appointments" noPadding>
          {appts.length ? (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Meet / Calendar</th><th>Status</th></tr></thead>
              <tbody>
                {appts.map((a) => (
                  <tr key={a.id}>
                    <td>{fmtDate(a.date)}</td>
                    <td>{a.time}</td>
                    <td>{a.type}</td>
                    <td>
                      <AppointmentMeetCell appointment={a} patient={patient} canAdd={canWriteAppointments} />
                    </td>
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
