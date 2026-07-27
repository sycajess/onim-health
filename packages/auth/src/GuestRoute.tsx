import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getDefaultRouteForRole } from '@onim/types'
import { useAuth } from './useAuth'

export function GuestRoute() {
  const { isAuthenticated, isLoading, profile, isPasswordRecovery } = useAuth()
  const location = useLocation()

  const allowWhileAuthed =
    location.pathname === '/reset-password' || isPasswordRecovery

  if (!isLoading && isAuthenticated && profile && !allowWhileAuthed) {
    return <Navigate to={getDefaultRouteForRole(profile.role)} replace />
  }

  return <Outlet />
}
