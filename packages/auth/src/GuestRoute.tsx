import { Navigate, Outlet } from 'react-router-dom'
import { getDefaultRouteForRole } from '@onim/types'
import { useAuth } from './useAuth'

export function GuestRoute() {
  const { isAuthenticated, isLoading, profile } = useAuth()

  if (!isLoading && isAuthenticated && profile) {
    return <Navigate to={getDefaultRouteForRole(profile.role)} replace />
  }

  return <Outlet />
}
