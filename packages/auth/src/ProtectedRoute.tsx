import { Navigate, Outlet } from 'react-router-dom'
import type { ModuleId } from '@onim/types'
import { canAccessModule, getDefaultRouteForRole } from '@onim/types'
import { AuthLoading } from './AuthLoading'
import { PendingApprovalScreen } from './PendingApprovalScreen'
import { useAuth } from './useAuth'

type ProtectedRouteProps = {
  module?: ModuleId
  loginPath?: string
}

export function ProtectedRoute({
  module,
  loginPath = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuth()

  if (isLoading) return <AuthLoading />

  if (!isAuthenticated || !profile) {
    return <Navigate to={loginPath} replace />
  }

  if (profile.approved === false) {
    return <PendingApprovalScreen />
  }

  if (module && !canAccessModule(profile.role, module)) {
    return <Navigate to={getDefaultRouteForRole(profile.role)} replace />
  }

  return <Outlet />
}
