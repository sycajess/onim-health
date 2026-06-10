import { useState } from 'react'
import { useData, patientFullName } from '@onim/data'
import { Card, EmptyState } from '@onim/ui'
import '@onim/ui/Card.css'
import './Messaging.css'

export function MessagingPage() {
  const { db } = useData()
  const threadIds = Object.keys(db.messages)
  const [activeId, setActiveId] = useState(threadIds[0] ?? '')
  const activePatient = db.patients.find((p) => p.id === activeId)
  const messages = db.messages[activeId] ?? []

  return (
    <div className="msg-layout">
      <Card title="Threads" noPadding>
        {threadIds.length ? (
          <div className="msg-threads">
            {threadIds.map((id) => {
              const p = db.patients.find((x) => x.id === id)
              if (!p) return null
              return (
                <button
                  key={id}
                  type="button"
                  className={`msg-thread${activeId === id ? ' msg-thread--active' : ''}`}
                  onClick={() => setActiveId(id)}
                >
                  <div className="avatar">{(p.fname[0] + p.lname[0]).toUpperCase()}</div>
                  <div>
                    <div className="avatar-name">{patientFullName(p)}</div>
                    <div className="avatar-sub">{db.messages[id]?.length ?? 0} messages</div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState icon="💬" title="No message threads" />
        )}
      </Card>

      <Card title={activePatient ? `Chat with ${patientFullName(activePatient)}` : 'Secure Messaging'}>
        {messages.length ? (
          <div className="msg-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg-bubble msg-bubble--${m.from}`}>
                <div className="msg-bubble__text">{m.text}</div>
                <div className="msg-bubble__time">{m.time}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="💬" title="Select a thread" description="Choose a patient to view messages." />
        )}
      </Card>
    </div>
  )
}
