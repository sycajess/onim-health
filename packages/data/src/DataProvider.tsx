import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Database, Patient } from './types'
import {
  addPatient,
  getDatabase,
  getPatient,
  searchPatients,
  subscribe,
  updateLabAttachment,
  type NewPatientInput,
} from './store'

type DataContextValue = {
  db: Database
  getPatient: (id: string) => Patient | undefined
  searchPatients: (query: string, specialty?: string) => Patient[]
  addPatient: (input: NewPatientInput) => Patient
  updateLabAttachment: (labId: string, attachment: { name: string; data_url: string } | null) => boolean
  refresh: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => getDatabase())

  useEffect(() => subscribe(() => setDb(getDatabase())), [])

  const value = useMemo<DataContextValue>(
    () => ({
      db,
      getPatient,
      searchPatients,
      addPatient,
      updateLabAttachment,
      refresh: () => setDb(getDatabase()),
    }),
    [db],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
