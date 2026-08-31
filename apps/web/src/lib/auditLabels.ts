import type { AuditLogEntry } from '@onim/supabase'

export function formatAuditActivity(entry: AuditLogEntry): string {
  const who = entry.user_name || 'Someone'
  const entity = entry.entity_type || 'item'
  const id = entry.entity_id ? ` ${entry.entity_id}` : ''
  const detailName =
    typeof entry.details?.name === 'string'
      ? entry.details.name
      : typeof entry.details?.med_name === 'string'
        ? entry.details.med_name
        : typeof entry.details?.status === 'string'
          ? `→ ${entry.details.status}`
          : ''

  const verb =
    entry.action === 'create'
      ? 'added'
      : entry.action === 'update'
        ? 'updated'
        : entry.action === 'delete'
          ? 'deleted'
          : entry.action === 'view'
            ? 'viewed'
            : entry.action === 'login'
              ? 'signed in'
              : entry.action

  if (entry.action === 'login') return `${who} signed in`
  if (entity === 'inventory') return `${who} ${verb} medication${detailName ? ` “${detailName}”` : id}`
  if (entity === 'dispense') return `${who} dispensed${detailName ? ` ${detailName}` : ' medication'}${id}`
  if (entity === 'billing') return `${who} ${verb} invoice${id}${detailName ? ` ${detailName}` : ''}`
  if (entity === 'patient') return `${who} ${verb} patient${detailName ? ` “${detailName}”` : id}`
  if (entity === 'appointment') return `${who} ${verb} appointment${id}${detailName ? ` ${detailName}` : ''}`
  if (entity === 'lab') return `${who} ${verb} lab result${id}`
  if (entity === 'prescription') return `${who} ${verb} prescription${id}`
  if (entity === 'record') return `${who} ${verb} medical record${id}`
  return `${who} ${verb} ${entity}${id}${detailName ? ` ${detailName}` : ''}`
}

export function isWithinLastHours(iso: string, hours: number): boolean {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return false
  return Date.now() - t <= hours * 60 * 60 * 1000
}
