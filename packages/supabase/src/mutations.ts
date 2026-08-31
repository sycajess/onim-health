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
import { logAuditEvent } from './audit'
import { conversationThreadId, type StaffMessageRow } from './messaging'

function today(): string {
  return new Date().toISOString().split('T')[0]!
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
  void logAuditEvent({
    action: 'update',
    entity_type: 'appointment',
    entity_id: id,
    details: { status },
  })
  return true
}

export async function updateAppointmentMeetLink(id: string, meet_link: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('appointments').update({
    meet_link,
    calendar_synced: false,
    calendar_event_id: null,
  }).eq('id', id)
  if (error) return { error: error.message }
  return true
}

export async function updateAppointmentCalendarSync(
  id: string,
  calendar_event_id: string,
): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('appointments').update({
    calendar_event_id,
    calendar_synced: true,
  }).eq('id', id)
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
  meet_link?: string
  calendar_event_id?: string
  calendar_synced?: boolean
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
    meet_link: input.meet_link ?? '',
    calendar_event_id: input.calendar_event_id ?? '',
    calendar_synced: input.calendar_synced ?? false,
  }
  const { error } = await supabase.from('appointments').insert(row)
  if (error) return { error: error.message }
  void logAuditEvent({
    action: 'create',
    entity_type: 'appointment',
    entity_id: id,
    patient_id: input.patient_id,
  })
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
  labs_ordered?: string
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
    labs_ordered: input.labs_ordered ?? '',
    plan: input.plan ?? '',
    bp: input.bp ?? '',
    temp: input.temp ?? '',
    weight: input.weight ?? 0,
    provider: input.provider ?? '',
  }
  const { error } = await supabase.from('medical_records').insert(row)
  if (error) return { error: error.message }
  void logAuditEvent({
    action: 'create',
    entity_type: 'record',
    entity_id: id,
    patient_id: input.patient_id,
  })
  return row as MedicalRecord
}

export type UpdateRecordInput = Partial<Omit<NewRecordInput, 'patient_id'>>

export async function updateMedicalRecord(
  id: string,
  patientId: string,
  input: UpdateRecordInput,
): Promise<MedicalRecord | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const patch: Record<string, unknown> = {}
  if (input.date !== undefined) patch.date = input.date
  if (input.type !== undefined) patch.type = input.type
  if (input.specialty !== undefined) patch.specialty = input.specialty
  if (input.complaint !== undefined) patch.complaint = input.complaint
  if (input.exam !== undefined) patch.exam = input.exam
  if (input.assessment !== undefined) patch.assessment = input.assessment
  if (input.labs_ordered !== undefined) patch.labs_ordered = input.labs_ordered
  if (input.plan !== undefined) patch.plan = input.plan
  if (input.bp !== undefined) patch.bp = input.bp
  if (input.temp !== undefined) patch.temp = input.temp
  if (input.weight !== undefined) patch.weight = input.weight
  if (input.provider !== undefined) patch.provider = input.provider
  const { data, error } = await supabase.from('medical_records').update(patch).eq('id', id).select('*').single()
  if (error) return { error: error.message }
  void logAuditEvent({ action: 'update', entity_type: 'record', entity_id: id, patient_id: patientId })
  return mapRecordRow(data)
}

export async function deleteMedicalRecord(id: string, patientId: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('medical_records').delete().eq('id', id)
  if (error) return { error: error.message }
  void logAuditEvent({ action: 'delete', entity_type: 'record', entity_id: id, patient_id: patientId })
  return true
}

function mapRecordRow(row: Record<string, unknown>): MedicalRecord {
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    date: String(row.date),
    type: String(row.type),
    specialty: String(row.specialty ?? ''),
    complaint: String(row.complaint ?? ''),
    exam: String(row.exam ?? ''),
    assessment: String(row.assessment ?? ''),
    labs_ordered: String(row.labs_ordered ?? ''),
    plan: String(row.plan ?? ''),
    bp: String(row.bp ?? ''),
    temp: String(row.temp ?? ''),
    weight: Number(row.weight ?? 0),
    provider: String(row.provider ?? ''),
  }
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
  med_rxcui?: string
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
    med_rxcui: input.med_rxcui?.trim() || null,
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
  void logAuditEvent({
    action: 'create',
    entity_type: 'prescription',
    entity_id: id,
    patient_id: input.patient_id,
  })
  return row as Prescription
}

export type UpdatePrescriptionInput = {
  medication?: string
  med_rxcui?: string
  dosage?: string
  frequency?: string
  route?: string
  duration?: string
  refills?: number
  notes?: string
  status?: string
}

export async function updatePrescription(
  id: string,
  patientId: string,
  input: UpdatePrescriptionInput,
): Promise<Prescription | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const patch: Record<string, unknown> = {}
  if (input.medication !== undefined) patch.medication = input.medication
  if (input.med_rxcui !== undefined) patch.med_rxcui = input.med_rxcui?.trim() || null
  if (input.dosage !== undefined) patch.dosage = input.dosage
  if (input.frequency !== undefined) patch.frequency = input.frequency
  if (input.route !== undefined) patch.route = input.route
  if (input.duration !== undefined) patch.duration = input.duration
  if (input.refills !== undefined) patch.refills = input.refills
  if (input.notes !== undefined) patch.notes = input.notes
  if (input.status !== undefined) patch.status = input.status
  const { data, error } = await supabase.from('prescriptions').update(patch).eq('id', id).select('*').single()
  if (error) return { error: error.message }
  void logAuditEvent({ action: 'update', entity_type: 'prescription', entity_id: id, patient_id: patientId })
  return mapPrescriptionRow(data)
}

export async function deletePrescription(id: string, patientId: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('prescriptions').delete().eq('id', id)
  if (error) return { error: error.message }
  void logAuditEvent({ action: 'delete', entity_type: 'prescription', entity_id: id, patient_id: patientId })
  return true
}

function mapPrescriptionRow(row: Record<string, unknown>): Prescription {
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    medication: String(row.medication),
    med_id: String(row.med_id ?? ''),
    med_rxcui: row.med_rxcui ? String(row.med_rxcui) : undefined,
    dosage: String(row.dosage ?? ''),
    frequency: String(row.frequency ?? ''),
    route: String(row.route ?? ''),
    duration: String(row.duration ?? ''),
    refills: Number(row.refills ?? 0),
    date: String(row.date),
    provider: String(row.provider ?? ''),
    notes: String(row.notes ?? ''),
    status: String(row.status),
    qty_dispensed: Number(row.qty_dispensed ?? 0),
  }
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
  uploader_name?: string
  uploader_contact?: string
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
    uploader_name: input.uploader_name ?? '',
    uploader_contact: input.uploader_contact ?? '',
    notes: input.notes ?? '',
    attachment_path: input.attachment ? JSON.stringify(input.attachment) : null,
  }
  const { error } = await supabase.from('lab_results').insert(row)
  if (error) return { error: error.message }
  void logAuditEvent({
    action: 'create',
    entity_type: 'lab',
    entity_id: id,
    patient_id: input.patient_id,
  })
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
    uploader_name: row.uploader_name,
    uploader_contact: row.uploader_contact,
    notes: row.notes,
    attachment: input.attachment ?? undefined,
  }
}

export type UpdateLabInput = {
  test?: string
  date?: string
  facility?: string
  result?: string
  ref?: string
  status?: string
  provider?: string
  notes?: string
}

export async function updateLabResult(
  id: string,
  patientId: string,
  input: UpdateLabInput,
): Promise<LabResult | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const patch: Record<string, unknown> = {}
  if (input.test !== undefined) patch.test = input.test
  if (input.date !== undefined) patch.date = input.date
  if (input.facility !== undefined) patch.facility = input.facility
  if (input.result !== undefined) patch.result = input.result
  if (input.ref !== undefined) patch.ref = input.ref
  if (input.status !== undefined) patch.status = input.status
  if (input.provider !== undefined) patch.provider = input.provider
  if (input.notes !== undefined) patch.notes = input.notes
  const { data, error } = await supabase.from('lab_results').update(patch).eq('id', id).select('*').single()
  if (error) return { error: error.message }
  void logAuditEvent({ action: 'update', entity_type: 'lab', entity_id: id, patient_id: patientId })
  const attachment = data.attachment_path
    ? (JSON.parse(String(data.attachment_path)) as LabAttachment)
    : undefined
  return {
    id: String(data.id),
    patient_id: String(data.patient_id),
    test: String(data.test),
    date: String(data.date),
    facility: String(data.facility ?? ''),
    result: String(data.result ?? ''),
    ref: String(data.ref ?? ''),
    status: String(data.status),
    provider: String(data.provider ?? ''),
    uploader_name: String(data.uploader_name ?? ''),
    uploader_contact: String(data.uploader_contact ?? ''),
    notes: String(data.notes ?? ''),
    attachment,
  }
}

export async function deleteLabResult(id: string, patientId: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('lab_results').delete().eq('id', id)
  if (error) return { error: error.message }
  void logAuditEvent({ action: 'delete', entity_type: 'lab', entity_id: id, patient_id: patientId })
  return true
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

  if (existingId) {
    const { data: existing, error: fetchErr } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', existingId)
      .single()
    if (fetchErr || !existing) return { error: fetchErr?.message ?? 'Medication not found.' }

    // Preserve fields the edit form does not collect (form, strength, supplier, cost, storage)
    const row = {
      name: input.name,
      generic: input.generic ?? String(existing.generic ?? ''),
      category: input.category ?? String(existing.category ?? 'General'),
      form: input.form ?? String(existing.form ?? ''),
      strength: input.strength ?? String(existing.strength ?? ''),
      supplier: input.supplier ?? String(existing.supplier ?? ''),
      lot: input.lot,
      expiry: input.expiry,
      qty: input.qty,
      threshold: input.threshold !== undefined ? input.threshold : Number(existing.threshold ?? 0),
      cost: input.cost ?? Number(existing.cost ?? 0),
      storage: input.storage ?? String(existing.storage ?? ''),
    }
    const { error } = await supabase.from('inventory').update(row).eq('id', existingId)
    if (error) return { error: error.message }
    void logAuditEvent({
      action: 'update',
      entity_type: 'inventory',
      entity_id: existingId,
      details: { name: row.name, qty: row.qty },
    })
    return { id: existingId, ...row, archived: Boolean(existing.archived) } as InventoryItem
  }

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
    threshold: input.threshold !== undefined ? input.threshold : 0,
    cost: input.cost ?? 0,
    storage: input.storage ?? '',
    archived: false,
  }
  const id = await nextId('inventory', 'M')
  const { error } = await supabase.from('inventory').insert({ id, ...row })
  if (error) return { error: error.message }
  void logAuditEvent({
    action: 'create',
    entity_type: 'inventory',
    entity_id: id,
    details: { name: row.name, qty: row.qty, lot: row.lot },
  })
  return { id, ...row } as InventoryItem
}

export async function archiveInventoryLot(id: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { data: existing, error: fetchErr } = await supabase.from('inventory').select('name, lot').eq('id', id).single()
  if (fetchErr) return { error: fetchErr.message }
  const { error } = await supabase.from('inventory').update({ archived: true }).eq('id', id)
  if (error) return { error: error.message }
  void logAuditEvent({
    action: 'update',
    entity_type: 'inventory',
    entity_id: id,
    details: { archived: true, name: existing?.name, lot: existing?.lot },
  })
  return true
}

export async function restoreInventoryLot(id: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('inventory').update({ archived: false }).eq('id', id)
  if (error) return { error: error.message }
  void logAuditEvent({
    action: 'update',
    entity_type: 'inventory',
    entity_id: id,
    details: { archived: false },
  })
  return true
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
  void logAuditEvent({
    action: 'create',
    entity_type: 'dispense',
    entity_id: medId,
    patient_id: patientId,
    details: { qty, med_name: String(med.name) },
  })
  return true
}

export async function updateBillingStatus(id: string, status: string): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('billing').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  void logAuditEvent({
    action: 'update',
    entity_type: 'billing',
    entity_id: id,
    details: { status },
  })
  return true
}

export type NewInvoiceInput = {
  patient_id: string
  date?: string
  services?: string
  amount: number
  status?: string
  notes?: string
  payment_tier?: string
  primary_icd10?: string
  primary_icd10_name?: string
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
    payment_tier: input.payment_tier ?? 'cash',
    primary_icd10: input.primary_icd10?.trim() ?? '',
    primary_icd10_name: input.primary_icd10_name?.trim() ?? '',
    nhis_cleared: false,
  }
  const { error } = await supabase.from('billing').insert(row)
  if (error) return { error: error.message }

  // Deduct inventory + dispense log for medication lines tied to stock
  try {
    let lines: { type?: string; inventoryMedId?: string; qty?: number }[] = []
    try {
      const parsed = JSON.parse(row.services) as { lines?: typeof lines }
      if (Array.isArray(parsed?.lines)) lines = parsed.lines
    } catch {
      lines = []
    }
    const { data: patient } = await supabase.from('patients').select('fname, lname').eq('id', input.patient_id).maybeSingle()
    const patientName = patient ? `${patient.fname ?? ''} ${patient.lname ?? ''}`.trim() : input.patient_id
    const { data: authUser } = await supabase.auth.getUser()
    const { data: profile } = authUser.user
      ? await supabase.from('profiles').select('full_name').eq('id', authUser.user.id).maybeSingle()
      : { data: null }
    const provider = String(profile?.full_name ?? 'Billing')

    for (const line of lines) {
      if (line.type !== 'Medication / Drugs' || !line.inventoryMedId) continue
      const qty = Math.max(1, Number(line.qty) || 1)
      const dispenseResult = await dispenseMedication(line.inventoryMedId, input.patient_id, qty, provider, patientName)
      if (typeof dispenseResult === 'object' && 'error' in dispenseResult) {
        void logAuditEvent({
          action: 'update',
          entity_type: 'billing',
          entity_id: id,
          patient_id: input.patient_id,
          details: { dispense_error: dispenseResult.error, med_id: line.inventoryMedId },
        })
      }
    }
  } catch {
    /* invoice already saved */
  }

  void logAuditEvent({
    action: 'create',
    entity_type: 'billing',
    entity_id: id,
    patient_id: input.patient_id,
    details: { amount: row.amount, status: row.status },
  })
  return {
    id,
    patient_id: input.patient_id,
    date: row.date,
    services: row.services,
    amount: row.amount,
    status: row.status,
    notes: row.notes,
    payment_tier: row.payment_tier,
    primary_icd10: row.primary_icd10,
    primary_icd10_name: row.primary_icd10_name,
    nhis_cleared: false,
    nhis_exported_at: '',
  } as BillingInvoice
}

export async function updateBillingNhisCleared(id: string, cleared: boolean): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('billing').update({ nhis_cleared: cleared }).eq('id', id)
  if (error) return { error: error.message }
  return true
}

export async function markBillingNhisExported(ids: string[]): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const stamp = new Date().toISOString()
  const { error } = await supabase.from('billing').update({ nhis_exported_at: stamp }).in('id', ids)
  if (error) return { error: error.message }
  return true
}

export type ClinicSettingsInput = {
  provider_accreditation: string
  eclaim_authorization: string
  hefra_approved?: boolean
  hefra_license_number?: string
}

export async function saveClinicSettings(input: ClinicSettingsInput): Promise<true | MutError> {
  const supabase = getSupabase()
  if (!supabase) return notConfigured()
  const { error } = await supabase.from('clinic_settings').upsert({
    id: 'default',
    provider_accreditation: input.provider_accreditation.trim(),
    eclaim_authorization: input.eclaim_authorization.trim(),
    hefra_approved: input.hefra_approved ?? true,
    hefra_license_number: input.hefra_license_number?.trim() ?? '',
    updated_at: new Date().toISOString(),
  })
  if (error) return { error: error.message }
  return true
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
