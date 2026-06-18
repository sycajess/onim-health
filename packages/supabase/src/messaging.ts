import type { Message } from '@onim/data'
import { getSupabase } from './client'

export type StaffMessageRow = {
  id: string
  thread_id: string
  sender_id: string
  recipient_id: string
  body: string
  created_at: string
}

export function conversationThreadId(userA: string, userB: string): string {
  return [userA, userB].sort().join(':')
}

export function partnerIdFromThread(threadId: string, myId: string): string {
  const [a, b] = threadId.split(':')
  return a === myId ? b : a
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffDays === 0) return d.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString('en-GH')
}

export function mapStaffMessageRow(row: StaffMessageRow): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.body,
    time: formatMessageTime(row.created_at),
    createdAt: row.created_at,
  }
}

export function subscribeToStaffMessages(onInsert: (row: StaffMessageRow) => void): () => void {
  const supabase = getSupabase()
  if (!supabase) return () => {}

  const channel = supabase
    .channel('staff-messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        onInsert(payload.new as StaffMessageRow)
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
