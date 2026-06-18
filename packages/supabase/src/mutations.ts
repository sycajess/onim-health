import type {
  Appointment,
  BillingInvoice,
  InventoryItem,
  LabAttachment,
  LabResult,
  MedicalRecord,
  Prescription,
} from '@onim/data'
import { getSupabase } from './client'
import { conversationThreadId, type StaffMessageRow } from './messaging'

function today(): string {
  return new Date().toISOString().split('T')[0]!
}

function generateMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`
}

type MutError = { error: string }

async function nextId(table: string, prefix: string, pad = 3): Promise<string> {
  const supabase = getSupabase()!
  const { data } = await supabase.from(table).select('id').order('id', { ascending: false }).limit(1)
  let num = 1
  if (data?.[0]?.id) {
    const n = parseInt(String(data[0].id).replace(prefix, ''), 10)
    if (!Number.isNaN(n)) num = n + 1
  }
  return `${prefix}${String(num).padStart(pad, '0')}`
}

function notConfigured(): MutError {
  return { error: 'Supabase is not configured.' }
}

export async function updateAppointmentStatus(id: string, status: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  return true
}

export type NewAppointmentInput = {
  patient_id: string
  date: string
  time: string
  type: string
  specialty?: string
  provider?: string
  notes?: string
}

export async function createAppointment(input: NewAppointmentInput): Promise<Appointment | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const id = await nextId('appointments', 'A')
  const row = {
    id,
    patient_id: input.patient_id,
    date: input.date,
    time: input.time,
    type: input.type,
    specialty: input.specialty ?? '',
    provider: input.provider ?? '',
    notes: input.notes ?? '',
    status: 'Scheduled',
    meet_link: generateMeetLink(),
  }
  const { error } = await supabase.from('appointments').insert(row)
  if (error) return { error: error.message }
  return row as Appointment
}

export type NewRecordInput = {
  patient_id: string
  date?: string
  type: string
  specialty?: string
  complaint?: string
  exam?: string
  assessment?: string
  plan?: string
  bp?: string
  temp?: string
  weight?: number
  provider?: string
}

export async function createMedicalRecord(input: NewRecordInput): Promise<MedicalRecord | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const id = await nextId('medical_records', 'R')
  const row = {
    id,
    patient_id: input.patient_id,
    date: input.date ?? today(),
    type: input.type,
    specialty: input.specialty ?? '',
    complaint: input.complaint ?? '',
    exam: input.exam ?? '',
    assessment: input.assessment ?? '',
    plan: input.plan ?? '',
    bp: input.bp ?? '',
    temp: input.temp ?? '',
    weight: input.weight ?? 0,
    provider: input.provider ?? '',
  }
  const { error } = await supabase.from('medical_records').insert(row)
  if (error) return { error: error.message }
  return row as MedicalRecord
}

export async function updatePrescriptionStatus(id: string, status: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('prescriptions').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  return true
}

export type NewPrescriptionInput = {
  patient_id: string
  med_id?: string
  medication: string
  dosage?: string
  frequency?: string
  route?: string
  duration?: string
  refills?: number
  date?: string
  provider?: string
  notes?: string
  qty?: number
  dispense?: boolean
  patient_name?: string
}

export async function createPrescription(input: NewPrescriptionInput): Promise<Prescription | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const id = await nextId('prescriptions', 'RX')
  const qty = input.qty ?? 1
  const willDispense = input.dispense ?? false
  let qtyDispensed = 0

  const inventoryMedId = input.med_id?.trim()
  if (willDispense && inventoryMedId) {
    const { data: med } = await supabase.from('inventory').select('*').eq('id', inventoryMedId).single()
    if (med && Number(med.qty) >= qty) {
      qtyDispensed = qty
      await supabase.from('inventory').update({ qty: Number(med.qty) - qty }).eq('id', inventoryMedId)
      await supabase.from('dispense_log').insert({
        date: today(),
        med_id: inventoryMedId,
        med_name: String(med.name),
        patient_id: input.patient_id,
        patient_name: input.patient_name ?? '',
        qty,
        lot: String(med.lot ?? ''),
        provider: input.provider ?? '',
      })
    }
  }

  const row = {
    id,
    patient_id: input.patient_id,
    medication: input.medication,
    med_id: inventoryMedId ?? '',
    dosage: input.dosage ?? '',
    frequency: input.frequency ?? '',
    route: input.route ?? '',
    duration: input.duration ?? '',
    refills: input.refills ?? 0,
    date: input.date ?? today(),
    provider: input.provider ?? '',
    notes: input.notes ?? '',
    status: 'Active',
    qty_dispensed: qtyDispensed,
  }
  const { error } = await supabase.from('prescriptions').insert(row)
  if (error) return { error: error.message }
  return row as Prescription
}

export type NewLabInput = {
  patient_id: string
  test: string
  date?: string
  facility?: string
  result?: string
  ref?: string
  status?: string
  provider?: string
  notes?: string
  attachment?: LabAttachment | null
}

export async function createLabResult(input: NewLabInput): Promise<LabResult | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const id = await nextId('lab_results', 'L')
  const row = {
    id,
    patient_id: input.patient_id,
    test: input.test,
    date: input.date ?? today(),
    facility: input.facility ?? '',
    result: input.result ?? '',
    ref: input.ref ?? '',
    status: input.status ?? 'Normal',
    provider: input.provider ?? '',
    notes: input.notes ?? '',
    attachment_path: input.attachment ? JSON.stringify(input.attachment) : null,
  }
  const { error } = await supabase.from('lab_results').insert(row)
  if (error) return { error: error.message }
  return {
    id,
    patient_id: input.patient_id,
    test: input.test,
    date: row.date,
    facility: row.facility,
    result: row.result,
    ref: row.ref,
    status: row.status,
    provider: row.provider,
    notes: row.notes,
    attachment: input.attachment ?? undefined,
  }
}

export type MedicationInput = {
  name: string
  generic?: string
  category?: string
  form?: string
  strength?: string
  supplier?: string
  lot: string
  expiry: string
  qty: number
  threshold?: number
  cost?: number
  storage?: string
}

export async function saveMedication(
  input: MedicationInput,
  existingId?: string,
): Promise<InventoryItem | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const row = {
    name: input.name,
    generic: input.generic ?? '',
    category: input.category ?? 'General',
    form: input.form ?? '',
    strength: input.strength ?? '',
    supplier: input.supplier ?? '',
    lot: input.lot,
    expiry: input.expiry,
    qty: input.qty,
    threshold: input.threshold ?? 10,
    cost: input.cost ?? 0,
    storage: input.storage ?? '',
  }

  if (existingId) {
    const { error } = await supabase.from('inventory').update(row).eq('id', existingId)
    if (error) return { error: error.message }
    return { id: existingId, ...row } as InventoryItem
  }

  const id = await nextId('inventory', 'M')
  const { error } = await supabase.from('inventory').insert({ id, ...row })
  if (error) return { error: error.message }
  return { id, ...row } as InventoryItem
}

export async function dispenseMedication(
  medId: string,
  patientId: string,
  qty: number,
  provider: string,
  patientName: string,
): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { data: med, error: fetchErr } = await supabase.from('inventory').select('*').eq('id', medId).single()
  if (fetchErr || !med) return { error: fetchErr?.message ?? 'Medication not found.' }
  if (Number(med.qty) < qty) return { error: 'Insufficient stock.' }

  const { error: updateErr } = await supabase
    .from('inventory')
    .update({ qty: Number(med.qty) - qty })
    .eq('id', medId)
  if (updateErr) return { error: updateErr.message }

  const { error: logErr } = await supabase.from('dispense_log').insert({
    date: today(),
    med_id: medId,
    med_name: String(med.name),
    patient_id: patientId,
    patient_name: patientName,
    qty,
    lot: String(med.lot ?? ''),
    provider,
  })
  if (logErr) return { error: logErr.message }
  return true
}

export async function updateBillingStatus(id: string, status: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('billing').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  return true
}

export type NewInvoiceInput = {
  patient_id: string
  date?: string
  services?: string
  amount: number
  status?: string
  notes?: string
}

export async function createInvoice(input: NewInvoiceInput): Promise<BillingInvoice | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const id = await nextId('billing', 'B')
  const row = {
    id,
    patient_id: input.patient_id,
    date: input.date ?? today(),
    services: input.services ?? '',
    amount: input.amount,
    status: input.status ?? 'Pending',
    notes: input.notes ?? '',
  }
  const { error } = await supabase.from('billing').insert(row)
  if (error) return { error: error.message }
  return row as BillingInvoice
}

export async function sendMessage(
  recipientId: string,
  body: string,
  senderId: string,
): Promise<StaffMessageRow | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const trimmed = body.trim()
  if (!trimmed) return { error: 'Message cannot be empty.' }
  const { data, error } = await supabase
    .from('messages')
    .insert({
      thread_id: conversationThreadId(senderId, recipientId),
      sender_id: senderId,
      recipient_id: recipientId,
      body: trimmed,
    })
    .select('id, thread_id, sender_id, recipient_id, body, created_at')
    .single()
  if (error) return { error: error.message }
  return data as StaffMessageRow
}

export { createPatient, saveLabAttachment, updatePatient, deletePatient } from './database'
export type { NewPatientInput, UpdatePatientInput } from './database'
