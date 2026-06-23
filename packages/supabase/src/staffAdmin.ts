import { getSupabase } from './client'
import type { Role } from '@onim/types'

type MutError = { error: string }

function notConfigured(): MutError {
  return { error: 'Supabase is not configured.' }
}

export type AdminStaffInput = {
  id: string
  role: Role
  full_name: string
  specialty?: string
  phone?: string
  license_number?: string
  license_expiry?: string
}

export async function adminUpdateStaff(input: AdminStaffInput): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.rpc('admin_update_staff', {
    target_id: input.id,
    p_role: input.role,
    p_full_name: input.full_name,
    p_specialty: input.specialty ?? '',
    p_phone: input.phone ?? '',
    p_license_number: input.license_number ?? null,
    p_license_expiry: input.license_expiry || null,
  })
  if (error) return { error: error.message }
  return true
}

export async function adminDeleteStaff(targetId: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.rpc('admin_delete_staff', { target_id: targetId })
  if (error) return { error: error.message }
  return true
}
