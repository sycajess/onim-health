import { Suspense, type ReactNode as ReactNodeType } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from '@onim/auth'
import { PageLoader } from '@onim/ui'
import { AppLayout } from '../layouts/AppLayout'
import { LoginPage } from '../modules/auth/pages/LoginPage'
import { SignupPage } from '../modules/auth/pages/SignupPage'
import { LandingPage } from '../modules/landing/LandingPage'
import { DashboardPage } from '../modules/dashboard/DashboardPage'
import { lazyRoute } from '../utils/lazyRoute'

const PatientsPage = lazyRoute(() => import('../modules/patients/PatientsPage'), 'PatientsPage')
const PatientDetailPage = lazyRoute(() => import('../modules/patients/PatientDetailPage'), 'PatientDetailPage')
const AppointmentsPage = lazyRoute(() => import('../modules/appointments/AppointmentsPage'), 'AppointmentsPage')
const RecordsPage = lazyRoute(() => import('../modules/records/RecordsPage'), 'RecordsPage')
const PrescriptionsPage = lazyRoute(() => import('../modules/prescriptions/PrescriptionsPage'), 'PrescriptionsPage')
const LabsPage = lazyRoute(() => import('../modules/labs/LabsPage'), 'LabsPage')
const InventoryPage = lazyRoute(() => import('../modules/inventory/InventoryPage'), 'InventoryPage')
const BillingPage = lazyRoute(() => import('../modules/billing/BillingPage'), 'BillingPage')
const MessagingPage = lazyRoute(() => import('../modules/messaging/MessagingPage'), 'MessagingPage')
const ReportsPage = lazyRoute(() => import('../modules/reports/ReportsPage'), 'ReportsPage')
const SettingsPage = lazyRoute(() => import('../modules/settings/SettingsPage'), 'SettingsPage')

function Lazy({ children }: { children: ReactNodeType }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />

          <Route element={<ProtectedRoute module="patients" />}>
            <Route
              path="patients"
              element={(
                <Lazy>
                  <PatientsPage />
                </Lazy>
              )}
            />
            <Route
              path="patients/:id"
              element={(
                <Lazy>
                  <PatientDetailPage />
                </Lazy>
              )}
            />
          </Route>

          <Route element={<ProtectedRoute module="appointments" />}>
            <Route
              path="appointments"
              element={(
                <Lazy>
                  <AppointmentsPage />
                </Lazy>
              )}
            />
          </Route>

          <Route element={<ProtectedRoute module="records" />}>
            <Route
              path="records"
              element={(
                <Lazy>
                  <RecordsPage />
                </Lazy>
              )}
            />
          </Route>

          <Route element={<ProtectedRoute module="prescriptions" />}>
            <Route
              path="prescriptions"
              element={(
                <Lazy>
                  <PrescriptionsPage />
                </Lazy>
              )}
            />
          </Route>

          <Route element={<ProtectedRoute module="labs" />}>
            <Route
              path="labs"
              element={(
                <Lazy>
                  <LabsPage />
                </Lazy>
              )}
            />
          </Route>

          <Route element={<ProtectedRoute module="inventory" />}>
            <Route
              path="inventory"
              element={(
                <Lazy>
                  <InventoryPage />
                </Lazy>
              )}
            />
          </Route>

          <Route element={<ProtectedRoute module="billing" />}>
            <Route
              path="billing"
              element={(
                <Lazy>
                  <BillingPage />
                </Lazy>
              )}
            />
          </Route>

          <Route element={<ProtectedRoute module="messaging" />}>
            <Route
              path="messaging"
              element={(
                <Lazy>
                  <MessagingPage />
                </Lazy>
              )}
            />
          </Route>

          <Route element={<ProtectedRoute module="reports" />}>
            <Route
              path="reports"
              element={(
                <Lazy>
                  <ReportsPage />
                </Lazy>
              )}
            />
          </Route>

          <Route element={<ProtectedRoute module="settings" />}>
            <Route
              path="settings"
              element={(
                <Lazy>
                  <SettingsPage />
                </Lazy>
              )}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
