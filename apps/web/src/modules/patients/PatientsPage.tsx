import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, formatPatientDemographics, patientInitials, patientFullName, type Patient } from '@onim/data'
import { Badge, Card, EmptyState, PageHero, SpecialtyTag } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import { NewPatientModal } from '../../components/NewPatientModal'
import { SpecialtyFilter } from '../../components/SpecialtyFilter'
import '@onim/ui/Card.css'

export function PatientsPage() {
  const { searchPatients, deletePatient } = useData()
  const { canEditPatient, canDeletePatient, canMessage } = usePermissions()
  const [params] = useSearchParams()
  const [specialty, setSpecialty] = useState('')
  const [editPatient, setEditPatient] = useState<Patient | null>(null)
  const q = params.get('q') ?? ''
  const patients = searchPatients(q, specialty || undefined)
  const showActions = canEditPatient || canDeletePatient || canMessage

  async function handleDelete(p: Patient) {
    if (!window.confirm(`Delete ${patientFullName(p)}? This cannot be undone.`)) return
    const result = await deletePatient(p.id)
    if (typeof result === 'object' && 'error' in result) {
      window.alert(result.error)
    }
  }

  return (
    <div className="page--patients">
      <PageHero
        title="Patients"
        subtitle={`${patients.length} record${patients.length === 1 ? '' : 's'}${specialty ? ` · ${specialty}` : ''}${q ? ` matching "${q}"` : ''}`}
        variant="teal"
      />
      <Card title="All Patients" noPadding>
        <SpecialtyFilter value={specialty} onChange={setSpecialty} />
        {patients.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age / Sex</th>
                <th>Specialty</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Registered</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
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
                  <td>{formatPatientDemographics(p.dob, p.sex)}</td>
                  <td><SpecialtyTag specialty={p.specialty} /></td>
                  <td>{p.phone || '–'}</td>
                  <td><Badge>{p.status}</Badge></td>
                  <td>{fmtDate(p.created)}</td>
                  <td>
                    {showActions && (
                      <RowActions>
                        {canEditPatient && (
                          <IconAction icon="edit" label={`Edit ${patientFullName(p)}`} onClick={() => setEditPatient(p)} />
                        )}
                        {canMessage && (
                          <IconAction icon="message" label={`Message ${patientFullName(p)}`} to={`/messaging?thread=${p.id}`} />
                        )}
                        {canDeletePatient && (
                          <IconAction icon="delete" label={`Delete ${patientFullName(p)}`} variant="danger" onClick={() => void handleDelete(p)} />
                        )}
                      </RowActions>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon="👥"
            title="No patients found"
            description={q ? `No results for "${q}".` : 'Register your first patient with + New Patient.'}
          />
        )}
      </Card>

      <NewPatientModal
        open={!!editPatient}
        onClose={() => setEditPatient(null)}
        patient={editPatient}
      />
    </div>
  )
}
