import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useData, fmtDate, patientAge, patientInitials, patientFullName, SPECIALTIES } from '@onim/data'
import { Badge, Card, EmptyState, PageHero, SpecialtyTag } from '@onim/ui'
import '@onim/ui/Card.css'

export function PatientsPage() {
  const { searchPatients } = useData()
  const [params] = useSearchParams()
  const [specialty, setSpecialty] = useState('')
  const q = params.get('q') ?? ''
  const patients = searchPatients(q, specialty || undefined)

  return (
    <div className="page--patients">
    <PageHero title="Patients" subtitle={`${patients.length} records${q ? ` matching "${q}"` : ''}`} variant="teal" />
    <Card
      title="All Patients"
      action={
        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={{ width: 160 }}>
          <option value="">All Specialties</option>
          {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      }
      noPadding
    >
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
                <td>{patientAge(p.dob)} / {p.sex}</td>
                <td><SpecialtyTag specialty={p.specialty} /></td>
                <td>{p.phone}</td>
                <td><Badge>{p.status}</Badge></td>
                <td>{fmtDate(p.created)}</td>
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
