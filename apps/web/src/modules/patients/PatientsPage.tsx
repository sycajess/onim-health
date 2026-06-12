import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useData, fmtDate, formatPatientDemographics, patientInitials, patientFullName } from '@onim/data'
import { Badge, Card, EmptyState, PageHero, SpecialtyTag } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import { SpecialtyFilter } from '../../components/SpecialtyFilter'
import '@onim/ui/Card.css'

export function PatientsPage() {
  const { searchPatients } = useData()
  const [params] = useSearchParams()
  const [specialty, setSpecialty] = useState('')
  const q = params.get('q') ?? ''
  const patients = searchPatients(q, specialty || undefined)

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
                <td>{p.phone}</td>
                <td><Badge>{p.status}</Badge></td>
                <td>{fmtDate(p.created)}</td>
                <td>
                  <RowActions>
                    <IconAction icon="view" label={`View ${patientFullName(p)}`} to={`/patients/${p.id}`} />
                    <IconAction icon="message" label={`Message ${patientFullName(p)}`} to={`/messaging?thread=${p.id}`} />
                  </RowActions>
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
    </div>
  )
}
