import { useEffect, useState } from 'react'
import { fetchAuditLog, type AuditLogEntry } from '@onim/supabase'
import { Badge, Card, EmptyState } from '@onim/ui'
import { formatAuditActivity } from '../../lib/auditLabels'
import '@onim/ui/Card.css'

export function ActivityLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchAuditLog(300).then((result) => {
      if (cancelled) return
      if ('error' in result) {
        setError(result.error)
        setEntries([])
      } else {
        setError('')
        setEntries(result)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <Card title="Activity Log" noPadding>
        {loading ? (
          <p style={{ padding: 16, fontSize: 13, color: 'var(--gray4)' }}>Loading activity…</p>
        ) : error ? (
          <p style={{ padding: 16, fontSize: 13, color: 'var(--danger)' }}>{error}</p>
        ) : entries.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Activity</th>
                <th>Who</th>
                <th>Role</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => (
                <tr key={row.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(row.created_at).toLocaleString()}</td>
                  <td style={{ fontSize: 13 }}>{formatAuditActivity(row)}</td>
                  <td>{row.user_name || '—'}</td>
                  <td><Badge>{row.user_role || '—'}</Badge></td>
                  <td style={{ fontSize: 12 }}>{row.entity_type}{row.entity_id ? ` · ${row.entity_id}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState icon="🔔" title="No activity yet" description="Creates, updates, views, and inventory changes will appear here." />
        )}
      </Card>
    </div>
  )
}
