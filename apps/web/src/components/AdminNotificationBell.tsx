import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchAuditLog, type AuditLogEntry } from '@onim/supabase'
import { formatAuditActivity, isWithinLastHours } from '../lib/auditLabels'
import './AdminNotificationBell.css'

type AdminNotificationBellProps = {
  adminUserId: string
}

export function AdminNotificationBell({ adminUserId }: AdminNotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    const result = await fetchAuditLog(100)
    if (!('error' in result)) setEntries(result)
    setLoading(false)
  }

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const notifications = useMemo(() => {
    return entries.filter((e) => {
      if (!isWithinLastHours(e.created_at, 24)) return false
      // Admin should not be notified about their own actions
      if (e.user_id && e.user_id === adminUserId) return false
      return true
    })
  }, [adminUserId, entries])

  return (
    <div className="admin-bell" ref={wrapRef}>
      <button
        type="button"
        className="admin-bell__btn"
        aria-label={`Notifications${notifications.length ? `, ${notifications.length} new` : ''}`}
        onClick={() => {
          setOpen((v) => !v)
          if (!open) void load()
        }}
      >
        🔔
        {notifications.length > 0 && <span className="admin-bell__badge">{notifications.length > 99 ? '99+' : notifications.length}</span>}
      </button>
      {open && (
        <div className="admin-bell__panel" role="dialog" aria-label="Activity notifications">
          <div className="admin-bell__head">
            <strong>Last 24 hours</strong>
            <span className="admin-bell__hint">Your own actions are hidden here</span>
          </div>
          {loading && !notifications.length ? (
            <p className="admin-bell__empty">Loading…</p>
          ) : notifications.length ? (
            <ul className="admin-bell__list">
              {notifications.map((e) => (
                <li key={e.id}>
                  <div className="admin-bell__item-text">{formatAuditActivity(e)}</div>
                  <div className="admin-bell__item-time">{new Date(e.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-bell__empty">No team activity in the last 24 hours.</p>
          )}
        </div>
      )}
    </div>
  )
}
