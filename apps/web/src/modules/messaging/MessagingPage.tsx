import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@onim/auth'
import { useData } from '@onim/data'
import { conversationThreadId, partnerIdFromThread } from '@onim/supabase'
import { canAccessModule, ROLE_LABELS, type Role } from '@onim/types'
import { Card, EmptyState } from '@onim/ui'
import { IconAction } from '../../components/IconAction'
import '@onim/ui/Card.css'
import './Messaging.css'

function staffInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function MessagingPage() {
  const { profile } = useAuth()
  const { db, sendMessage } = useData()
  const [params] = useSearchParams()
  const withParam = params.get('with')
  const myId = profile?.id ?? ''

  const chatStaff = useMemo(
    () =>
      db.staff.filter(
        (s) => s.id !== myId && canAccessModule(s.role as Role, 'messaging'),
      ),
    [db.staff, myId],
  )

  const threads = useMemo(() => {
    const items = Object.entries(db.messages).map(([threadId, msgs]) => {
      const partnerId = partnerIdFromThread(threadId, myId)
      const last = msgs.at(-1)
      return {
        threadId,
        partnerId,
        lastText: last?.text ?? '',
        lastAt: last?.createdAt ?? '',
      }
    })
    items.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
    return items
  }, [db.messages, myId])

  const [activePartnerId, setActivePartnerId] = useState('')
  const [staffSearch, setStaffSearch] = useState('')
  const [draft, setDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (withParam && chatStaff.some((s) => s.id === withParam)) {
      setActivePartnerId(withParam)
    }
  }, [withParam, chatStaff])

  useEffect(() => {
    if (!activePartnerId && threads.length) {
      setActivePartnerId(threads[0]!.partnerId)
    }
  }, [activePartnerId, threads])

  const activeStaff = chatStaff.find((s) => s.id === activePartnerId)
  const threadId = myId && activePartnerId ? conversationThreadId(myId, activePartnerId) : ''
  const messages = threadId ? (db.messages[threadId] ?? []) : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, activePartnerId])

  const filteredStaff = useMemo(() => {
    const q = staffSearch.trim().toLowerCase()
    if (!q) return chatStaff
    return chatStaff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        ROLE_LABELS[s.role as Role]?.toLowerCase().includes(q) ||
        s.specialty.toLowerCase().includes(q),
    )
  }, [chatStaff, staffSearch])

  async function handleSend() {
    if (!activePartnerId || !draft.trim()) return
    const ok = await sendMessage(activePartnerId, draft.trim())
    if (ok) setDraft('')
  }

  return (
    <div className="msg-layout">
      <Card title="Conversations" noPadding>
        {threads.length ? (
          <div className="msg-threads">
            {threads.map(({ threadId: tid, partnerId, lastText }) => {
              const member = chatStaff.find((s) => s.id === partnerId)
              if (!member) return null
              return (
                <button
                  key={tid}
                  type="button"
                  className={`msg-thread${activePartnerId === partnerId ? ' msg-thread--active' : ''}`}
                  onClick={() => setActivePartnerId(partnerId)}
                >
                  <div className="avatar">{staffInitials(member.name)}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="avatar-name">{member.name}</div>
                    <div className="avatar-sub msg-thread__preview">{lastText || 'No messages yet'}</div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState icon="💬" title="No conversations yet" description="Start a chat with a team member below." />
        )}

        <div className="msg-staff-picker">
          <div className="msg-staff-picker__label">Message a team member</div>
          <input
            className="form-input"
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
            placeholder="Search staff…"
          />
          <div className="msg-staff-list">
            {filteredStaff.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`msg-thread${activePartnerId === s.id ? ' msg-thread--active' : ''}`}
                onClick={() => setActivePartnerId(s.id)}
              >
                <div className="avatar">{staffInitials(s.name)}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="avatar-name">{s.name}</div>
                  <div className="avatar-sub">
                    {ROLE_LABELS[s.role as Role]}
                    {s.specialty ? ` · ${s.specialty}` : ''}
                  </div>
                </div>
              </button>
            ))}
            {!filteredStaff.length && (
              <div className="msg-staff-empty">No staff match your search.</div>
            )}
          </div>
        </div>
      </Card>

      <Card
        title={
          activeStaff
            ? `Chat with ${activeStaff.name}`
            : 'Team Messaging'
        }
      >
        {activeStaff ? (
          <div className="msg-chat-header">
            <span className={`role-badge role-${activeStaff.role}`}>
              {ROLE_LABELS[activeStaff.role as Role]}
            </span>
            {activeStaff.specialty && (
              <span className="msg-chat-header__meta">{activeStaff.specialty}</span>
            )}
          </div>
        ) : null}

        {messages.length ? (
          <div className="msg-messages">
            {messages.map((m) => {
              const mine = m.senderId === myId
              return (
                <div key={m.id} className={`msg-bubble msg-bubble--${mine ? 'mine' : 'theirs'}`}>
                  <div className="msg-bubble__text">{m.text}</div>
                  <div className="msg-bubble__time">{m.time}</div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : activeStaff ? (
          <EmptyState
            icon="💬"
            title="No messages yet"
            description={`Send a message to ${activeStaff.name} to start the conversation.`}
          />
        ) : (
          <EmptyState
            icon="💬"
            title="Select a team member"
            description="Pick someone from the list to start an internal chat."
          />
        )}

        {activeStaff && (
          <div className="msg-compose">
            <input
              className="form-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
            />
            <IconAction
              icon="send"
              label="Send message"
              variant="primary"
              onClick={() => void handleSend()}
              disabled={!draft.trim()}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
