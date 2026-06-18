import type {
  Appointment,
  BillingInvoice,
  Database,
  DispenseLogEntry,
  InventoryItem,
  LabAttachment,
  LabResult,
  MedicalRecord,
  Message,
  Patient,
  Prescription,
  StaffMember,
} from '@onim/data'
import { getSupabase } from './client'
import { mapStaffMessageRow } from './messaging'

export function emptyDatabase(): Database {
  return {
    patients: [],
    appointments: [],
    records: [],
    prescriptions: [],
    labs: [],
    inventory: [],
    dispense_log: [],
    billing: [],
    messages: {},
    staff: [],
  }
}

function mapPatient(row: Record<string, unknown>): Patient {
  return {
    id: String(row.id),
    fname: String(row.fname),
    lname: String(row.lname),
    dob: row.dob ? String(row.dob) : '',
    sex: row.sex ? String(row.sex) : '',
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    address: String(row.address ?? ''),
    id_num: String(row.id_num ?? ''),
    nhis: String(row.nhis ?? ''),
    specialty: String(row.specialty),
    blood: row.blood ? String(row.blood) : '',
    weight: row.weight != null && row.weight !== '' ? Number(row.weight) : 0,
    height: row.height != null && row.height !== '' ? Number(row.height) : 0,
    allergies: row.allergies ? String(row.allergies) : '',
    conditions: String(row.conditions ?? ''),
    current_meds: String(row.current_meds ?? ''),
    ec_name: String(row.ec_name ?? ''),
    ec_rel: String(row.ec_rel ?? ''),
    ec_phone: String(row.ec_phone ?? ''),
    status: String(row.status),
    created: String(row.created),
  }
}

function mapRecord(row: Record<string, unknown>): MedicalRecord {
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    date: String(row.date),
    type: String(row.type),
    specialty: String(row.specialty ?? ''),
    complaint: String(row.complaint ?? ''),
    exam: String(row.exam ?? ''),
    assessment: String(row.assessment ?? ''),
    plan: String(row.plan ?? ''),
    bp: String(row.bp ?? ''),
    temp: String(row.temp ?? ''),
    weight: Number(row.weight ?? 0),
    provider: String(row.provider ?? ''),
  }
}

function parseAttachment(path: unknown): LabAttachment | undefined {
  if (!path || typeof path !== 'string') return undefined
  try {
    const parsed = JSON.parse(path) as LabAttachment
    if (parsed.name && parsed.data_url) return parsed
  } catch {
    return undefined
  }
  return undefined
}

function mapLab(row: Record<string, unknown>): LabResult {
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    test: String(row.test),
    date: String(row.date),
    facility: String(row.facility ?? ''),
    result: String(row.result ?? ''),
    ref: String(row.ref ?? ''),
    status: String(row.status ?? ''),
    provider: String(row.provider ?? ''),
    notes: String(row.notes ?? ''),
    attachment: parseAttachment(row.attachment_path),
  }
}

export async function fetchDatabase(): Promise<Database | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  const [
    patientsRes,
    appointmentsRes,
    recordsRes,
    prescriptionsRes,
    labsRes,
    inventoryRes,
    dispenseRes,
    billingRes,
    messagesRes,
    profilesRes,
  ] = await Promise.all([
    supabase.from('patients').select('*').order('created', { ascending: false }),
    supabase.from('appointments').select('*').order('date', { ascending: false }),
    supabase.from('medical_records').select('*').order('date', { ascending: false }),
    supabase.from('prescriptions').select('*').order('date', { ascending: false }),
    supabase.from('lab_results').select('*').order('date', { ascending: false }),
    supabase.from('inventory').select('*').order('name'),
    supabase.from('dispense_log').select('*').order('date', { ascending: false }),
    supabase.from('billing').select('*').order('date', { ascending: false }),
    supabase.from('messages').select('*').order('created_at'),
    supabase.from('profiles').select('id, full_name, email, role, specialty, phone'),
  ])

  const firstError = [
    patientsRes.error,
    appointmentsRes.error,
    recordsRes.error,
    prescriptionsRes.error,
    labsRes.error,
    inventoryRes.error,
    dispenseRes.error,
    billingRes.error,
    messagesRes.error,
  ].find(Boolean)

  if (firstError) return { error: firstError!.message }

  const messages: Record<string, Message[]> = {}
  for (const m of messagesRes.data ?? []) {
    const thread = String(m.thread_id)
    if (!messages[thread]) messages[thread] = []
    messages[thread].push(
      mapStaffMessageRow({
        id: String(m.id),
        thread_id: thread,
        sender_id: String(m.sender_id),
        recipient_id: String(m.recipient_id),
        body: String(m.body),
        created_at: String(m.created_at),
      }),
    )
  }

  const staff: StaffMember[] = (profilesRes.data ?? []).map((p) => ({
    id: String(p.id),
    name: String(p.full_name),
    username: String(p.email).split('@')[0] ?? '',
    role: String(p.role),
    specialty: String(p.specialty ?? ''),
    email: String(p.email),
    phone: String(p.phone ?? ''),
  }))

  return {
    patients: (patientsRes.data ?? []).map(mapPatient),
    appointments: (appointmentsRes.data ?? []) as Appointment[],
    records: (recordsRes.data ?? []).map(mapRecord),
    prescriptions: (prescriptionsRes.data ?? []) as Prescription[],
    labs: (labsRes.data ?? []).map(mapLab),
    inventory: (inventoryRes.data ?? []) as InventoryItem[],
    dispense_log: (dispenseRes.data ?? []).map((d) => ({
      date: String(d.date),
      med_id: String(d.med_id ?? ''),
      med_name: String(d.med_name),
      patient_id: String(d.patient_id ?? ''),
      patient_name: String(d.patient_name ?? ''),
      qty: Number(d.qty),
      lot: String(d.lot ?? ''),
      provider: String(d.provider ?? ''),
    })) as DispenseLogEntry[],
    billing: (billingRes.data ?? []).map((b) => ({
      ...b,
      amount: Number(b.amount),
    })) as BillingInvoice[],
    messages,
    staff,
  }
}

export type NewPatientInput = {
  fname: string
  lname: string
  dob?: string
  sex?: string
  phone?: string
  email?: string
  address?: string
  id_num?: string
  nhis?: string
  specialty?: string
  blood?: string
  weight?: number | null
  height?: number | null
  allergies?: string
  conditions?: string
  current_meds?: string
  ec_name?: string
  ec_rel?: string
  ec_phone?: string
}

export async function createPatient(input: NewPatientInput): Promise<Patient | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  const { data: latest } = await supabase.from('patients').select('id').order('id', { ascending: false }).limit(1)
  let num = 1
  if (latest?.[0]?.id) {
    const n = parseInt(String(latest[0].id).replace('P', ''), 10)
    if (!Number.isNaN(n)) num = n + 1
  }
  const id = `P${String(num).padStart(3, '0')}`
  const today = new Date().toISOString().slice(0, 10)

  if (!input.fname.trim() || !input.lname.trim()) {
    return { error: 'First and last name are required.' }
  }
  if (!input.specialty?.trim()) {
    return { error: 'Specialty is required.' }
  }

  const row = {
    id,
    fname: input.fname.trim(),
    lname: input.lname.trim(),
    dob: input.dob?.trim() || null,
    sex: input.sex?.trim() || null,
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    address: input.address?.trim() ?? '',
    id_num: input.id_num?.trim() ?? '',
    nhis: input.nhis?.trim() ?? '',
    specialty: input.specialty.trim(),
    blood: input.blood?.trim() || null,
    weight: input.weight ?? null,
    height: input.height ?? null,
    allergies: input.allergies?.trim() || null,
    conditions: input.conditions?.trim() ?? '',
    current_meds: input.current_meds?.trim() ?? '',
    ec_name: input.ec_name?.trim() ?? '',
    ec_rel: input.ec_rel?.trim() ?? '',
    ec_phone: input.ec_phone?.trim() ?? '',
    status: 'Active',
    created: today,
  }

  const { error } = await supabase.from('patients').insert(row)
  if (error) return { error: error.message }
  return mapPatient(row)
}

export type UpdatePatientInput = {
  fname: string
  lname: string
  dob?: string
  sex?: string
  phone?: string
  email?: string
  address?: string
  id_num?: string
  nhis?: string
  specialty?: string
  blood?: string
  weight?: number | null
  height?: number | null
  allergies?: string
  conditions?: string
  current_meds?: string
  ec_name?: string
  ec_rel?: string
  ec_phone?: string
}

export async function updatePatient(
  id: string,
  input: UpdatePatientInput,
): Promise<Patient | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  if (!input.fname.trim() || !input.lname.trim()) {
    return { error: 'First and last name are required.' }
  }
  if (!input.specialty?.trim()) {
    return { error: 'Specialty is required.' }
  }

  const row = {
    fname: input.fname.trim(),
    lname: input.lname.trim(),
    dob: input.dob?.trim() || null,
    sex: input.sex?.trim() || null,
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    address: input.address?.trim() ?? '',
    id_num: input.id_num?.trim() ?? '',
    nhis: input.nhis?.trim() ?? '',
    specialty: input.specialty.trim(),
    blood: input.blood?.trim() || null,
    weight: input.weight ?? null,
    height: input.height ?? null,
    allergies: input.allergies?.trim() || null,
    conditions: input.conditions?.trim() ?? '',
    current_meds: input.current_meds?.trim() ?? '',
    ec_name: input.ec_name?.trim() ?? '',
    ec_rel: input.ec_rel?.trim() ?? '',
    ec_phone: input.ec_phone?.trim() ?? '',
  }

  const { data, error } = await supabase.from('patients').update(row).eq('id', id).select('*').single()
  if (error) return { error: error.message }
  return mapPatient(data)
}

export async function deletePatient(id: string): Promise<true | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  await supabase.from('dispense_log').delete().eq('patient_id', id)

  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) return { error: error.message }
  return true
}

export async function saveLabAttachment(
  labId: string,
  attachment: LabAttachment | null,
): Promise<boolean | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  const attachment_path = attachment ? JSON.stringify(attachment) : null
  const { error } = await supabase.from('lab_results').update({ attachment_path }).eq('id', labId)
  if (error) return { error: error.message }
  return true
}
