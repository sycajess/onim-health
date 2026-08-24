import { getSupabase } from './client'

export type AuditLogEntry = {
  id: string
  created_at: string
  user_id: string | null
  user_name: string
  user_role: string
  action: string
  entity_type: string
  entity_id: string
  patient_id: string | null
  details: Record<string, unknown>
}

export type AuditEventInput = {
  action: string
  entity_type?: string
  entity_id?: string
  patient_id?: string
  details?: Record<string, unknown>
}

export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.rpc('log_audit_event', {
    p_action: input.action,
    p_entity_type: input.entity_type ?? '',
    p_entity_id: input.entity_id ?? '',
    p_patient_id: input.patient_id ?? null,
    p_details: input.details ?? {},
  })
}

export async function fetchAuditLog(limit = 200): Promise<AuditLogEntry[] | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return { error: error.message }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    created_at: String(row.created_at),
    user_id: row.user_id ? String(row.user_id) : null,
    user_name: String(row.user_name ?? ''),
    user_role: String(row.user_role ?? ''),
    action: String(row.action),
    entity_type: String(row.entity_type ?? ''),
    entity_id: String(row.entity_id ?? ''),
    patient_id: row.patient_id ? String(row.patient_id) : null,
    details: (row.details as Record<string, unknown>) ?? {},
  }))
}
