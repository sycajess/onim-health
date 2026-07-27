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
  supabaseRefreshProfile,
  supabaseRequestPasswordReset,
  supabaseUpdatePassword,
} from './auth'
export {
  conversationThreadId,
  partnerIdFromThread,
  mapStaffMessageRow,
  subscribeToStaffMessages,
} from './messaging'
export type { StaffMessageRow } from './messaging'
export {
  adminUpdateStaff,
  adminDeleteStaff,
} from './staffAdmin'
export type { AdminStaffInput } from './staffAdmin'
export { emptyDatabase, fetchDatabase } from './database'
export {
  createPatient,
  updatePatient,
  deletePatient,
  saveLabAttachment,
  updateAppointmentStatus,
  updateAppointmentMeetLink,
  updateAppointmentCalendarSync,
  createAppointment,
  createMedicalRecord,
  updatePrescriptionStatus,
  createPrescription,
  createLabResult,
  saveMedication,
  dispenseMedication,
  updateBillingStatus,
  createInvoice,
  updateBillingNhisCleared,
  markBillingNhisExported,
  saveClinicSettings,
  sendMessage,
} from './mutations'
export type {
  NewPatientInput,
  UpdatePatientInput,
  NewAppointmentInput,
  NewRecordInput,
  NewPrescriptionInput,
  NewLabInput,
  MedicationInput,
  NewInvoiceInput,
  ClinicSettingsInput,
} from './mutations'
