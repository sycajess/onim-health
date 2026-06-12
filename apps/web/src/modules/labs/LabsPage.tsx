import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { usePermissions } from '@onim/auth'
import { useData, fmtDate, patientFullName } from '@onim/data'
import { Badge, Button, EmptyState, PageHero, PdfAttachZone } from '@onim/ui'
import type { PdfAttachment } from '@onim/ui'
import { NewLabModal } from '../../components/modals/ClinicModals'

export function LabsPage() {
  const { db, updateLabAttachment } = useData()
  const { canWriteModule } = usePermissions()
  const canWrite = canWriteModule('labs')
  const [modalOpen, setModalOpen] = useState(false)

  function handleAttach(labId: string, file: PdfAttachment) {
    updateLabAttachment(labId, { name: file.name, data_url: file.dataUrl })
  }

  return (
    <div className="page--labs">
      <PageHero
        title="Lab Results"
        subtitle="Test values, abnormal flags, and report attachments"
        variant="rose"
        action={canWrite ? <Button variant="primary" onClick={() => setModalOpen(true)}>+ Add Result</Button> : undefined}
      />
      {db.labs.length ? (
        <div className="lab-grid">
          {db.labs.map((l, i) => {
            const p = db.patients.find((x) => x.id === l.patient_id)
            const abnormal = l.status.includes('Abnormal')
            const attachment = l.attachment
              ? { name: l.attachment.name, dataUrl: l.attachment.data_url }
              : null
            return (
              <motion.div
                key={l.id}
                className={`lab-tile${abnormal ? ' lab-tile--abnormal' : ''}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div style={{ fontSize: 12, color: 'var(--gray4)' }}>{fmtDate(l.date)} · {l.facility}</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
                  <div style={{ fontWeight: 600 }}>{l.test}</div>
                </div>
                <div className="lab-tile__value">{l.result}</div>
                <div style={{ fontSize: 11, color: 'var(--gray4)', marginBottom: 8 }}>Ref: {l.ref}</div>
                {p && <Link to={`/patients/${p.id}`} className="link-cell" style={{ fontSize: 12 }}>{patientFullName(p)}</Link>}
                <div style={{ marginTop: 8, marginBottom: 10 }}><Badge>{l.status}</Badge></div>
                {canWrite ? (
                  <PdfAttachZone
                    attachment={attachment}
                    onAttach={(file) => handleAttach(l.id, file)}
                    onRemove={() => updateLabAttachment(l.id, null)}
                  />
                ) : attachment ? (
                  <a href={attachment.dataUrl} target="_blank" rel="noreferrer" className="link-cell" style={{ fontSize: 12 }}>View report</a>
                ) : null}
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="🧪" title="No lab results" />
      )}
      <NewLabModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
