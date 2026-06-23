export type Role =
  | 'admin'
  | 'doctor'
  | 'pharmacist'
  | 'nutritionist'
  | 'nurse'
  | 'staff'
  | 'accountant'
  | 'lab_partner'

export type ModuleId =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'records'
  | 'prescriptions'
  | 'labs'
  | 'inventory'
  | 'billing'
  | 'messaging'
  | 'reports'
  | 'settings'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin / Super User',
  doctor: 'Doctor',
  pharmacist: 'Pharmacist',
  nutritionist: 'Nutritionist',
  nurse: 'Nurse',
  staff: 'General Staff',
  accountant: 'Accountant',
  lab_partner: 'Lab Partner',
}

export const ROLE_PERMISSIONS: Record<Role, Record<ModuleId, boolean>> = {
  admin: {
    dashboard: true,
    patients: true,
    appointments: true,
    records: true,
    prescriptions: true,
    labs: true,
    inventory: true,
    billing: true,
    messaging: true,
    reports: true,
    settings: true,
  },
  doctor: {
    dashboard: true,
    patients: true,
    appointments: true,
    records: true,
    prescriptions: true,
    labs: true,
    inventory: false,
    billing: false,
    messaging: true,
    reports: true,
    settings: false,
  },
  pharmacist: {
    dashboard: true,
    patients: true,
    appointments: false,
    records: false,
    prescriptions: true,
    labs: false,
    inventory: true,
    billing: false,
    messaging: true,
    reports: true,
    settings: false,
  },
  nutritionist: {
    dashboard: true,
    patients: true,
    appointments: true,
    records: true,
    prescriptions: false,
    labs: true,
    inventory: false,
    billing: false,
    messaging: true,
    reports: false,
    settings: false,
  },
  nurse: {
    dashboard: true,
    patients: true,
    appointments: true,
    records: true,
    prescriptions: false,
    labs: true,
    inventory: true,
    billing: false,
    messaging: true,
    reports: false,
    settings: false,
  },
  staff: {
    dashboard: true,
    patients: true,
    appointments: true,
    records: false,
    prescriptions: false,
    labs: false,
    inventory: false,
    billing: false,
    messaging: true,
    reports: false,
    settings: false,
  },
  accountant: {
    dashboard: true,
    patients: false,
    appointments: false,
    records: false,
    prescriptions: false,
    labs: false,
    inventory: true,
    billing: true,
    messaging: false,
    reports: true,
    settings: false,
  },
  lab_partner: {
    dashboard: true,
    patients: true,
    appointments: false,
    records: false,
    prescriptions: false,
    labs: true,
    inventory: false,
    billing: false,
    messaging: false,
    reports: false,
    settings: false,
  },
}

export type ModuleConfig = {
  id: ModuleId
  path: string
  label: string
  icon: string
  section: 'overview' | 'clinical' | 'operations' | 'analytics' | 'system'
  roles: Role[]
}

export const MODULES: ModuleConfig[] = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: '⊞', section: 'overview', roles: ['admin', 'doctor', 'pharmacist', 'nutritionist', 'nurse', 'staff', 'accountant', 'lab_partner'] },
  { id: 'patients', path: '/patients', label: 'Patients', icon: '👥', section: 'overview', roles: ['admin', 'doctor', 'nurse', 'pharmacist', 'nutritionist', 'staff', 'lab_partner'] },
  { id: 'appointments', path: '/appointments', label: 'Appointments', icon: '📅', section: 'overview', roles: ['admin', 'doctor', 'nurse', 'nutritionist', 'staff'] },
  { id: 'records', path: '/records', label: 'Medical Records', icon: '📋', section: 'clinical', roles: ['admin', 'doctor', 'nurse', 'nutritionist'] },
  { id: 'prescriptions', path: '/prescriptions', label: 'Prescriptions', icon: '💊', section: 'clinical', roles: ['admin', 'doctor', 'pharmacist'] },
  { id: 'labs', path: '/labs', label: 'Lab Results', icon: '🧪', section: 'clinical', roles: ['admin', 'doctor', 'nurse', 'nutritionist', 'lab_partner'] },
  { id: 'inventory', path: '/inventory', label: 'Medication Inventory', icon: '📦', section: 'operations', roles: ['admin', 'pharmacist', 'nurse', 'accountant'] },
  { id: 'billing', path: '/billing', label: 'Billing', icon: '🧾', section: 'operations', roles: ['admin', 'accountant'] },
  { id: 'messaging', path: '/messaging', label: 'Team Messaging', icon: '💬', section: 'operations', roles: ['admin', 'doctor', 'pharmacist', 'nutritionist', 'nurse', 'staff'] },
  { id: 'reports', path: '/reports', label: 'Reports', icon: '📊', section: 'analytics', roles: ['admin', 'doctor', 'pharmacist', 'accountant'] },
  { id: 'settings', path: '/settings', label: 'Settings', icon: '⚙️', section: 'system', roles: ['admin'] },
]

export function canAccessModule(role: Role, module: ModuleId): boolean {
  return ROLE_PERMISSIONS[role]?.[module] ?? false
}

/** Mirrors Supabase `profiles` table */
export type Profile = {
  id: string
  email: string
  full_name: string
  role: Role
  specialty?: string
  phone?: string
  avatar_initials: string
}

export function getDefaultRouteForRole(role: Role): string {
  const first = MODULES.find((m) => canAccessModule(role, m.id))
  return first?.path ?? '/dashboard'
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export {
  canPerformAction,
  canWriteModule,
  type ActionId,
} from './permissions'
