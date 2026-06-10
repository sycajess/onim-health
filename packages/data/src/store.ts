import type { Database, LabAttachment, Patient } from './types'
import { createSeedDatabase } from './seed'
import { today } from './utils'

const DB_KEY = 'onim_db'
const VERSION_KEY = 'onim_db_version'
const CURRENT_VERSION = '2'

type Listener = () => void

let db: Database = createSeedDatabase()
let nextPatientNum = 6
const listeners = new Set<Listener>()

function loadFromStorage(): Database | null {
  try {
    const version = localStorage.getItem(VERSION_KEY)
    const raw = localStorage.getItem(DB_KEY)
    if (!raw || version !== CURRENT_VERSION) return null
    return JSON.parse(raw) as Database
  } catch {
    return null
  }
}

function persist() {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
  listeners.forEach((l) => l())
}

function initStore() {
  const stored = loadFromStorage()
  if (stored) {
    db = stored
    const nums = db.patients
      .map((p) => parseInt(p.id.replace('P', ''), 10))
      .filter((n) => !Number.isNaN(n))
    nextPatientNum = (nums.length ? Math.max(...nums) : 5) + 1
  } else {
    db = createSeedDatabase()
    persist()
  }
}

initStore()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getDatabase(): Database {
  return db
}

export function resetDatabase() {
  db = createSeedDatabase()
  nextPatientNum = 6
  persist()
}

export function getPatient(id: string): Patient | undefined {
  return db.patients.find((p) => p.id === id)
}

export function searchPatients(query: string, specialty?: string): Patient[] {
  const q = query.trim().toLowerCase()
  return db.patients.filter((p) => {
    const matchSpec = !specialty || p.specialty === specialty
    const matchSearch =
      !q ||
      `${p.fname} ${p.lname} ${p.phone} ${p.id} ${p.email}`.toLowerCase().includes(q)
    return matchSpec && matchSearch
  })
}

export type NewPatientInput = {
  fname: string
  lname: string
  phone?: string
  email?: string
  specialty?: string
}

export function addPatient(input: NewPatientInput): Patient {
  const id = `P${String(nextPatientNum++).padStart(3, '0')}`
  const patient: Patient = {
    id,
    fname: input.fname,
    lname: input.lname,
    dob: '1990-01-01',
    sex: 'Female',
    phone: input.phone ?? '',
    email: input.email ?? '',
    address: '',
    id_num: '',
    nhis: '',
    specialty: input.specialty ?? 'Weight Loss',
    blood: 'O+',
    weight: 0,
    height: 0,
    allergies: 'None',
    conditions: '',
    current_meds: '',
    ec_name: '',
    ec_rel: '',
    ec_phone: '',
    status: 'Active',
    created: today(),
  }
  db.patients.push(patient)
  db.messages[id] = []
  persist()
  return patient
}

export function updateLabAttachment(labId: string, attachment: LabAttachment | null) {
  const lab = db.labs.find((l) => l.id === labId)
  if (!lab) return false
  if (attachment) lab.attachment = attachment
  else delete lab.attachment
  persist()
  return true
}
