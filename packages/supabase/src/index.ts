export { configureSupabase, getSupabase, isSupabaseConfigured } from './client'
export { fetchDashboardStats } from './dashboard'
export type {
  DashboardStats,
  DashboardPatient,
  DashboardAppointment,
  DashboardInventoryAlert,
} from './dashboard'
export {
  supabaseGetSession,
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
} from './auth'
export { emptyDatabase, fetchDatabase } from './database'
export {
  createPatient,
  saveLabAttachment,
  updateAppointmentStatus,
  createAppointment,
  createMedicalRecord,
  updatePrescriptionStatus,
  createPrescription,
  createLabResult,
  saveMedication,
  dispenseMedication,
  updateBillingStatus,
  createInvoice,
  sendMessage,
} from './mutations'
export type {
  NewPatientInput,
  NewAppointmentInput,
  NewRecordInput,
  NewPrescriptionInput,
  NewLabInput,
  MedicationInput,
  NewInvoiceInput,
} from './mutations'
