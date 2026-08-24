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
export { logAuditEvent, fetchAuditLog } from './audit'
export type { AuditLogEntry, AuditEventInput } from './audit'
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
  updateMedicalRecord,
  deleteMedicalRecord,
  updatePrescriptionStatus,
  createPrescription,
  updatePrescription,
  deletePrescription,
  createLabResult,
  updateLabResult,
  deleteLabResult,
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
  UpdateRecordInput,
  NewPrescriptionInput,
  UpdatePrescriptionInput,
  NewLabInput,
  UpdateLabInput,
  MedicationInput,
  NewInvoiceInput,
  ClinicSettingsInput,
} from './mutations'
