import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, usePermissions } from '@onim/auth'
import { useData, fmtDate, patientFullName, evaluateLabResult, formatLabSource, type LabResult } from '@onim/data'
import { Badge, Button, Card, EmptyState, PdfAttachZone } from '@onim/ui'
import type { PdfAttachment } from '@onim/ui'
import { IconAction, RowActions } from '../../components/IconAction'
import { EditLabModal } from '../../components/AdminEditModals'
import { NewLabModal } from '../../components/modals/ClinicModals'
import '@onim/ui/Card.css'

export function LabsPage() {
  const { db, updateLabAttachment, deleteLabResult } = useData()
  const { profile } = useAuth()
  const { canWriteModule, canEditEntry, canDeleteEntry } = usePermissions()
  const canWrite = canWriteModule('labs')
  const isExternalLab = profile?.role === 'lab_partner'
  const [modalOpen, setModalOpen] = useState(false)
  const [editLab, setEditLab] = useState<LabResult | null>(null)

  function handleAttach(labId: string, file: PdfAttachment) {
    updateLabAttachment(labId, { name: file.name, data_url: file.dataUrl })
  }

  async function handleDelete(lab: LabResult) {
    if (!window.confirm(`Delete lab result ${lab.id}? This cannot be undone.`)) return
    const ok = await deleteLabResult(lab.id, lab.patient_id)
    if (!ok) window.alert('Could not delete lab result.')
  }

  return (
    <div>
      <Card
        title={isExternalLab ? 'External Labs' : 'Lab Results'}
        action={canWrite ? (
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            {isExternalLab ? '+ Upload Result' : '+ Add Result'}
          </Button>
        ) : undefined}
        noPadding
      >
        {db.labs.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Test</th>
                <th>Result</th>
                <th>Reference</th>
                <th>External lab</th>
                <th>Status</th>
                <th>Report</th>
                {(canEditEntry || canDeleteEntry) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {db.labs.map((l) => {
                const p = db.patients.find((x) => x.id === l.patient_id)
                const attachment = l.attachment
                  ? { name: l.attachment.name, dataUrl: l.attachment.data_url }
                  : null
                const evaluated = evaluateLabResult(l.result, l.ref)
                const source = formatLabSource(l)
                const resultStyle =
                  evaluated === 'Abnormal – High' || evaluated === 'Critical'
                    ? { color: 'var(--danger)', fontWeight: 600 as const }
                    : evaluated === 'Abnormal – Low'
                      ? { color: 'var(--amber)', fontWeight: 600 as const }
                      : undefined
                return (
                  <tr key={l.id}>
                    <td>{p ? <Link to={`/patients/${p.id}`} className="link-cell">{patientFullName(p)}</Link> : '–'}</td>
                    <td>{fmtDate(l.date)}</td>
                    <td><strong>{l.test}</strong></td>
                    <td style={resultStyle}>{l.result}</td>
                    <td>{l.ref || '–'}</td>
                    <td>{source || '–'}</td>
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
                    {(canEditEntry || canDeleteEntry) && (
                      <td>
                        <RowActions>
                          {canEditEntry && (
                            <IconAction icon="edit" label="Edit lab" onClick={() => setEditLab(l)} />
                          )}
                          {canDeleteEntry && (
                            <IconAction icon="delete" label="Delete lab" variant="danger" onClick={() => void handleDelete(l)} />
                          )}
                        </RowActions>
                      </td>
                    )}
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
      <EditLabModal lab={editLab} open={!!editLab} onClose={() => setEditLab(null)} />
    </div>
  )
}
