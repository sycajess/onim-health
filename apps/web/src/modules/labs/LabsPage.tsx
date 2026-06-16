import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, patientFullName } from '@onim/data'
import { Badge, Button, Card, EmptyState, PdfAttachZone } from '@onim/ui'
import type { PdfAttachment } from '@onim/ui'
import { NewLabModal } from '../../components/modals/ClinicModals'
import '@onim/ui/Card.css'

export function LabsPage() {
  const { db, updateLabAttachment } = useData()
  const { canWriteModule } = usePermissions()
  const canWrite = canWriteModule('labs')
  const [modalOpen, setModalOpen] = useState(false)

  function handleAttach(labId: string, file: PdfAttachment) {
    updateLabAttachment(labId, { name: file.name, data_url: file.dataUrl })
  }

  return (
    <div>
      <Card
        title="Lab Results"
        action={canWrite ? <Button variant="primary" onClick={() => setModalOpen(true)}>+ Add Result</Button> : undefined}
        noPadding
      >
        {db.labs.length ? (
          <table className="data-table">
            <thead>
              <tr><th>Patient</th><th>Date</th><th>Test</th><th>Result</th><th>Reference</th><th>Facility</th><th>Status</th><th>Report</th></tr>
            </thead>
            <tbody>
              {db.labs.map((l) => {
                const p = db.patients.find((x) => x.id === l.patient_id)
                const attachment = l.attachment
                  ? { name: l.attachment.name, dataUrl: l.attachment.data_url }
                  : null
                return (
                  <tr key={l.id}>
                    <td>{p ? <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link> : '–'}</td>
                    <td>{fmtDate(l.date)}</td>
                    <td><strong>{l.test}</strong></td>
                    <td>{l.result}</td>
                    <td>{l.ref}</td>
                    <td>{l.facility}</td>
                    <td><Badge>{l.status}</Badge></td>
                    <td>
                      {canWrite ? (
                        <PdfAttachZone
                          attachment={attachment}
                          onAttach={(file) => handleAttach(l.id, file)}
                          onRemove={() => updateLabAttachment(l.id, null)}
                          label="Attach PDF"
                        />
                      ) : attachment ? (
                        <a href={attachment.dataUrl} target="_blank" rel="noreferrer" className="link-cell">View</a>
                      ) : '–'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState icon="🧪" title="No lab results" />
        )}
      </Card>
      <NewLabModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
