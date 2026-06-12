import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData, patientFullName } from '@onim/data'
import { Card, EmptyState } from '@onim/ui'
import { IconAction } from '../../components/IconAction'
import '@onim/ui/Card.css'
import './Messaging.css'

export function MessagingPage() {
  const { db, sendMessage } = useData()
  const [params] = useSearchParams()
  const threadParam = params.get('thread')
  const threadIds = useMemo(() => {
    const ids = Object.keys(db.messages).length
      ? Object.keys(db.messages)
      : db.patients.slice(0, 10).map((p) => p.id)
    if (threadParam && db.patients.some((p) => p.id === threadParam) && !ids.includes(threadParam)) {
      return [threadParam, ...ids]
    }
    return ids
  }, [db.messages, db.patients, threadParam])
  const [activeId, setActiveId] = useState(threadParam ?? threadIds[0] ?? '')
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (threadParam && db.patients.some((p) => p.id === threadParam)) setActiveId(threadParam)
  }, [threadParam, db.patients])
  const activePatient = db.patients.find((p) => p.id === activeId)
  const messages = db.messages[activeId] ?? []

  async function handleSend() {
    if (!activeId || !draft.trim()) return
    const ok = await sendMessage(activeId, draft.trim())
    if (ok) setDraft('')
  }

  return (
    <div className="msg-layout">
      <Card title="Threads" noPadding>
        {threadIds.length ? (
          <div className="msg-threads">
            {threadIds.map((id) => {
              const p = db.patients.find((x) => x.id === id)
              if (!p) return null
              const last = db.messages[id]?.at(-1)?.text ?? 'No messages yet'
              return (
                <button
                  key={id}
                  type="button"
                  className={`msg-thread${activeId === id ? ' msg-thread--active' : ''}`}
                  onClick={() => setActiveId(id)}
                >
                  <div className="avatar">{(p.fname[0] + p.lname[0]).toUpperCase()}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="avatar-name">{patientFullName(p)}</div>
                    <div className="avatar-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{last}</div>
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
          <EmptyState icon="💬" title="No messages yet" description="Send a secure message to start the thread." />
        )}
        {activePatient && (
          <div className="msg-compose">
            <input
              className="form-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
            />
            <IconAction icon="send" label="Send message" variant="primary" onClick={() => void handleSend()} disabled={!draft.trim()} />
          </div>
        )}
      </Card>
    </div>
  )
}
