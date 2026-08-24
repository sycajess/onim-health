import type { ModuleId, Role } from './index'
import { ROLE_PERMISSIONS } from './index'

export type ActionId =
  | 'patients:create'
  | 'patients:edit'
  | 'patients:delete'
  | 'entries:edit'
  | 'entries:delete'
  | 'inventory:manage'
  | 'inventory:dispense'

const ACTION_ROLES: Record<ActionId, readonly Role[]> = {
  'patients:create': ['admin', 'doctor', 'nurse', 'nutritionist', 'staff', 'pharmacist', 'accountant', 'lab_partner'],
  'patients:edit': ['admin', 'doctor', 'nurse', 'nutritionist', 'staff'],
  'patients:delete': ['admin'],
  'entries:edit': ['admin'],
  'entries:delete': ['admin'],
  'inventory:manage': ['admin', 'pharmacist'],
  'inventory:dispense': ['admin', 'pharmacist', 'nurse'],
}

export function canPerformAction(role: Role, action: ActionId): boolean {
  return ACTION_ROLES[action].includes(role)
}

function canAccessModule(role: Role, module: ModuleId): boolean {
  return ROLE_PERMISSIONS[role]?.[module] ?? false
}

/** Whether the role can create or update records in a module (not just view). */
export function canWriteModule(role: Role, module: ModuleId): boolean {
  if (!canAccessModule(role, module)) return false

  switch (module) {
    case 'patients':
      return canPerformAction(role, 'patients:edit')
    case 'prescriptions':
      // Nurses may view meds; only clinical/pharmacy roles prescribe or change status
      return role === 'admin' || role === 'doctor' || role === 'pharmacist'
    case 'inventory':
      return (
        canPerformAction(role, 'inventory:manage') ||
        canPerformAction(role, 'inventory:dispense')
      )
    default:
      return true
  }
}
