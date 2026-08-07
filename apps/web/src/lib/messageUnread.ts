const key = (userId: string) => `onim_msg_seen_${userId}`

export function getMessagesLastSeen(userId: string): string {
  try {
    return localStorage.getItem(key(userId)) || '1970-01-01T00:00:00.000Z'
  } catch {
    return '1970-01-01T00:00:00.000Z'
  }
}

export function markMessagesSeen(userId: string, at = new Date().toISOString()) {
  try {
    localStorage.setItem(key(userId), at)
  } catch {
    /* ignore */
  }
}

export function countUnreadMessages(
  messages: Record<string, { senderId: string; createdAt: string }[]>,
  myId: string,
  lastSeen: string,
): number {
  if (!myId) return 0
  let n = 0
  for (const [threadId, msgs] of Object.entries(messages)) {
    const [a, b] = threadId.split(':')
    if (a !== myId && b !== myId) continue
    for (const m of msgs) {
      if (m.senderId !== myId && m.createdAt > lastSeen) n += 1
    }
  }
  return n
}
