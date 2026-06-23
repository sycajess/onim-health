/** Domain types — mirror Supabase tables for easy swap later */

export type Patient = {
  id: string
  fname: string
  lname: string
  dob: string
  sex: string
  phone: string
  email: string
  address: string
  id_num: string
  nhis: string
  specialty: string
  blood: string
  weight: number
  height: number
  allergies: string
  allergy_codes: unknown
  conditions: string
  condition_codes: unknown
  current_meds: string
  ec_name: string
  ec_rel: string
  ec_phone: string
  status: string
  created: string
}

export type Appointment = {
  id: string
  patient_id: string
  date: string
  time: string
  type: string
  specialty: string
  provider: string
  notes: string
  status: string
  meet_link: string
}

export type MedicalRecord = {
  id: string
  patient_id: string
  date: string
  type: string
  specialty: string
  complaint: string
  exam: string
  assessment: string
  plan: string
  bp: string
  temp: string
  weight: number
  provider: string
}

export type Prescription = {
  id: string
  patient_id: string
  medication: string
  med_id: string
  med_rxcui?: string
  dosage: string
  frequency: string
  route: string
  duration: string
  refills: number
  date: string
  provider: string
  notes: string
  status: string
  qty_dispensed: number
}

export type LabAttachment = {
  name: string
  data_url: string
}

export type LabResult = {
  id: string
  patient_id: string
  test: string
  date: string
  facility: string
  result: string
  ref: string
  status: string
  provider: string
  notes: string
  attachment?: LabAttachment
}

export type InventoryItem = {
  id: string
  name: string
  generic: string
  category: string
  form: string
  strength: string
  supplier: string
  lot: string
  expiry: string
  qty: number
  threshold: number
  cost: number
  storage: string
}

export type DispenseLogEntry = {
  date: string
  med_id: string
  med_name: string
  patient_id: string
  patient_name: string
  qty: number
  lot: string
  provider: string
}

export type BillingInvoice = {
  id: string
  patient_id: string
  date: string
  services: string
  amount: number
  status: string
  notes: string
}

export type Message = {
  id: string
  senderId: string
  text: string
  time: string
  createdAt: string
}

export type StaffMember = {
  id: string
  name: string
  username: string
  role: string
  specialty: string
  email: string
  phone: string
  license_number: string
  license_expiry: string
}

export type Database = {
  patients: Patient[]
  appointments: Appointment[]
  records: MedicalRecord[]
  prescriptions: Prescription[]
  labs: LabResult[]
  inventory: InventoryItem[]
  dispense_log: DispenseLogEntry[]
  billing: BillingInvoice[]
  messages: Record<string, Message[]>
  staff: StaffMember[]
}
