import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@onim/auth'
import {
  createAppointment,
  createInvoice,
  createLabResult,
  createMedicalRecord,
  createPatient,
  createPrescription,
  deletePatient,
  dispenseMedication,
  emptyDatabase,
  fetchDatabase,
  saveLabAttachment,
  saveMedication,
  sendMessage,
  subscribeToStaffMessages,
  mapStaffMessageRow,
  updateAppointmentStatus,
  updateBillingStatus,
  updateBillingNhisCleared,
  markBillingNhisExported,
  saveClinicSettings,
  updatePatient,
  updatePrescriptionStatus,
  type MedicationInput,
  type NewAppointmentInput,
  type NewInvoiceInput,
  type NewLabInput,
  type NewPatientInput,
  type UpdatePatientInput,
  type NewPrescriptionInput,
  type NewRecordInput,
  adminUpdateStaff,
  adminDeleteStaff,
  type ClinicSettingsInput,
  type AdminStaffInput,
  type StaffMessageRow,
} from '@onim/supabase'
import type { Database, LabAttachment, Patient } from './types'

type DataContextValue = {
  db: Database
  loading: boolean
  error: string | null
  getPatient: (id: string) => Patient | undefined
  searchPatients: (query: string, specialty?: string) => Patient[]
  addPatient: (input: NewPatientInput) => Promise<Patient | { error: string }>
  updatePatient: (id: string, input: UpdatePatientInput) => Promise<Patient | { error: string }>
  deletePatient: (id: string) => Promise<boolean | { error: string }>
  updateLabAttachment: (labId: string, attachment: LabAttachment | null) => Promise<boolean>
  updateAppointmentStatus: (id: string, status: string) => Promise<boolean>
  addAppointment: (input: NewAppointmentInput) => Promise<boolean>
  addRecord: (input: NewRecordInput) => Promise<boolean>
  updatePrescriptionStatus: (id: string, status: string) => Promise<boolean>
  addPrescription: (input: NewPrescriptionInput) => Promise<boolean>
  addLabResult: (input: NewLabInput) => Promise<boolean>
  saveMedication: (input: MedicationInput, existingId?: string) => Promise<boolean>
  dispenseMedication: (medId: string, patientId: string, qty: number, patientName: string) => Promise<boolean | { error: string }>
  updateBillingStatus: (id: string, status: string) => Promise<boolean>
  updateBillingNhisCleared: (id: string, cleared: boolean) => Promise<boolean>
  markBillingNhisExported: (ids: string[]) => Promise<boolean>
  saveClinicSettings: (input: ClinicSettingsInput) => Promise<boolean>
  addInvoice: (input: NewInvoiceInput) => Promise<boolean>
  sendMessage: (recipientId: string, text: string) => Promise<boolean>
  adminUpdateStaff: (input: AdminStaffInput) => Promise<boolean>
  adminDeleteStaff: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

async function runMutation<T>(fn: () => Promise<T | { error: string }>, refresh: () => Promise<void>): Promise<boolean> {
  const result = await fn()
  if (typeof result === 'object' && result !== null && 'error' in result) return false
  await refresh()
  return true
}

function appendStaffMessage(db: Database, row: StaffMessageRow): Database {
  const thread = row.thread_id
  const message = mapStaffMessageRow(row)
  const existing = db.messages[thread] ?? []
  if (existing.some((m) => m.id === message.id)) return db
  return {
    ...db,
    messages: {
      ...db.messages,
      [thread]: [...existing, message].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    },
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, profile } = useAuth()
  const [db, setDb] = useState<Database>(() => emptyDatabase())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setDb(emptyDatabase())
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const result = await fetchDatabase()
    if ('error' in result) {
      setError(result.error)
      setDb(emptyDatabase())
    } else {
      setDb(result)
    }
    setLoading(false)
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    void refresh()
  }, [authLoading, refresh])

  useEffect(() => {
    if (!isAuthenticated) return
    return subscribeToStaffMessages((row) => {
      setDb((prev) => appendStaffMessage(prev, row))
    })
  }, [isAuthenticated])

  const getPatient = useCallback((id: string) => db.patients.find((p) => p.id === id), [db.patients])

  const searchPatients = useCallback(
    (query: string, specialty?: string) => {
      const q = query.trim().toLowerCase()
      return db.patients.filter((p) => {
        const matchSpec = !specialty || p.specialty === specialty
        const matchSearch =
          !q ||
          `${p.fname} ${p.lname} ${p.phone} ${p.id} ${p.email}`.toLowerCase().includes(q)
        return matchSpec && matchSearch
      })
    },
    [db.patients],
  )

  const addPatient = useCallback(async (input: NewPatientInput) => {
    const result = await createPatient(input)
    if ('error' in result) return result
    await refresh()
    return result
  }, [refresh])

  const handleUpdatePatient = useCallback(async (id: string, input: UpdatePatientInput) => {
    const result = await updatePatient(id, input)
    if ('error' in result) return result
    await refresh()
    return result
  }, [refresh])

  const handleDeletePatient = useCallback(async (id: string) => {
    const result = await deletePatient(id)
    if (typeof result === 'object' && 'error' in result) return result
    await refresh()
    return true
  }, [refresh])

  const updateLabAttachment = useCallback(
    async (labId: string, attachment: LabAttachment | null) => {
      const result = await saveLabAttachment(labId, attachment)
      if (typeof result === 'object' && 'error' in result) return false
      await refresh()
      return true
    },
    [refresh],
  )

  const handleUpdateAppointmentStatus = useCallback(
    async (id: string, status: string) => runMutation(() => updateAppointmentStatus(id, status), refresh),
    [refresh],
  )

  const addAppointment = useCallback(
    async (input: NewAppointmentInput) => runMutation(() => createAppointment(input), refresh),
    [refresh],
  )

  const addRecord = useCallback(
    async (input: NewRecordInput) => runMutation(() => createMedicalRecord(input), refresh),
    [refresh],
  )

  const handleUpdatePrescriptionStatus = useCallback(
    async (id: string, status: string) => runMutation(() => updatePrescriptionStatus(id, status), refresh),
    [refresh],
  )

  const addPrescription = useCallback(
    async (input: NewPrescriptionInput) => runMutation(() => createPrescription(input), refresh),
    [refresh],
  )

  const addLabResult = useCallback(
    async (input: NewLabInput) => runMutation(() => createLabResult(input), refresh),
    [refresh],
  )

  const handleSaveMedication = useCallback(
    async (input: MedicationInput, existingId?: string) => runMutation(() => saveMedication(input, existingId), refresh),
    [refresh],
  )

  const handleDispenseMedication = useCallback(
    async (medId: string, patientId: string, qty: number, patientName: string) => {
      const provider = profile?.full_name ?? ''
      const result = await dispenseMedication(medId, patientId, qty, provider, patientName)
      if (typeof result === 'object' && 'error' in result) return result
      await refresh()
      return true
    },
    [profile, refresh],
  )

  const handleUpdateBillingStatus = useCallback(
    async (id: string, status: string) => runMutation(() => updateBillingStatus(id, status), refresh),
    [refresh],
  )

  const addInvoice = useCallback(
    async (input: NewInvoiceInput) => runMutation(() => createInvoice(input), refresh),
    [refresh],
  )

  const handleSendMessage = useCallback(
    async (recipientId: string, text: string) => {
      if (!profile?.id) return false
      const result = await sendMessage(recipientId, text, profile.id)
      if ('error' in result) return false
      setDb((prev) => appendStaffMessage(prev, result))
      return true
    },
    [profile],
  )

  const handleUpdateBillingNhisCleared = useCallback(
    async (id: string, cleared: boolean) => runMutation(() => updateBillingNhisCleared(id, cleared), refresh),
    [refresh],
  )

  const handleMarkBillingNhisExported = useCallback(
    async (ids: string[]) => runMutation(() => markBillingNhisExported(ids), refresh),
    [refresh],
  )

  const handleSaveClinicSettings = useCallback(
    async (input: ClinicSettingsInput) => runMutation(() => saveClinicSettings(input), refresh),
    [refresh],
  )

  const handleAdminUpdateStaff = useCallback(
    async (input: AdminStaffInput) => runMutation(() => adminUpdateStaff(input), refresh),
    [refresh],
  )

  const handleAdminDeleteStaff = useCallback(
    async (id: string) => runMutation(() => adminDeleteStaff(id), refresh),
    [refresh],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      db,
      loading,
      error,
      getPatient,
      searchPatients,
      addPatient,
      updatePatient: handleUpdatePatient,
      deletePatient: handleDeletePatient,
      updateLabAttachment,
      updateAppointmentStatus: handleUpdateAppointmentStatus,
      addAppointment,
      addRecord,
      updatePrescriptionStatus: handleUpdatePrescriptionStatus,
      addPrescription,
      addLabResult,
      saveMedication: handleSaveMedication,
      dispenseMedication: handleDispenseMedication,
      updateBillingStatus: handleUpdateBillingStatus,
      updateBillingNhisCleared: handleUpdateBillingNhisCleared,
      markBillingNhisExported: handleMarkBillingNhisExported,
      saveClinicSettings: handleSaveClinicSettings,
      addInvoice,
      sendMessage: handleSendMessage,
      adminUpdateStaff: handleAdminUpdateStaff,
      adminDeleteStaff: handleAdminDeleteStaff,
      refresh,
    }),
    [
      db,
      loading,
      error,
      getPatient,
      searchPatients,
      addPatient,
      handleUpdatePatient,
      handleDeletePatient,
      updateLabAttachment,
      handleUpdateAppointmentStatus,
      addAppointment,
      addRecord,
      handleUpdatePrescriptionStatus,
      addPrescription,
      addLabResult,
      handleSaveMedication,
      handleDispenseMedication,
      handleUpdateBillingStatus,
      handleUpdateBillingNhisCleared,
      handleMarkBillingNhisExported,
      handleSaveClinicSettings,
      addInvoice,
      handleSendMessage,
      handleAdminUpdateStaff,
      handleAdminDeleteStaff,
      refresh,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
