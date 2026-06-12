import { useMemo } from 'react'
import {
  canAccessModule,
  canPerformAction,
  canWriteModule,
  type ActionId,
  type ModuleId,
} from '@onim/types'
import { useAuth } from './useAuth'

export function usePermissions() {
  const { profile } = useAuth()
  const role = profile?.role

  return useMemo(() => {
    const deny = {
      role: undefined as undefined,
      canAccessModule: () => false,
      canWriteModule: () => false,
      canPerformAction: () => false,
      canCreatePatient: false,
      canEditPatient: false,
      canDeletePatient: false,
      canMessage: false,
      canManageInventory: false,
      canDispenseInventory: false,
    }

    if (!role) return deny

    return {
      role,
      canAccessModule: (module: ModuleId) => canAccessModule(role, module),
      canWriteModule: (module: ModuleId) => canWriteModule(role, module),
      canPerformAction: (action: ActionId) => canPerformAction(role, action),
      canCreatePatient: canPerformAction(role, 'patients:create'),
      canEditPatient: canPerformAction(role, 'patients:edit'),
      canDeletePatient: canPerformAction(role, 'patients:delete'),
      canMessage: canAccessModule(role, 'messaging'),
      canManageInventory: canPerformAction(role, 'inventory:manage'),
      canDispenseInventory: canPerformAction(role, 'inventory:dispense'),
    }
  }, [role])
}
