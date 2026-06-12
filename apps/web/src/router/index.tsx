import { lazy, Suspense, type ReactNode as ReactNodeType } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from '@onim/auth'
import { PageLoader } from '@onim/ui'
import { AppLayout } from '../layouts/AppLayout'
import { LoginPage } from '../modules/auth/pages/LoginPage'
import { SignupPage } from '../modules/auth/pages/SignupPage'
import { LandingPage } from '../modules/landing/LandingPage'
const DashboardPage = lazy(() => import('../modules/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const PatientsPage = lazy(() => import('../modules/patients/PatientsPage').then((m) => ({ default: m.PatientsPage })))
const PatientDetailPage = lazy(() => import('../modules/patients/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage })))
const AppointmentsPage = lazy(() => import('../modules/appointments/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })))
const RecordsPage = lazy(() => import('../modules/records/RecordsPage').then((m) => ({ default: m.RecordsPage })))
const PrescriptionsPage = lazy(() => import('../modules/prescriptions/PrescriptionsPage').then((m) => ({ default: m.PrescriptionsPage })))
const LabsPage = lazy(() => import('../modules/labs/LabsPage').then((m) => ({ default: m.LabsPage })))
const InventoryPage = lazy(() => import('../modules/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })))
const BillingPage = lazy(() => import('../modules/billing/BillingPage').then((m) => ({ default: m.BillingPage })))
const MessagingPage = lazy(() => import('../modules/messaging/MessagingPage').then((m) => ({ default: m.MessagingPage })))
const ReportsPage = lazy(() => import('../modules/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('../modules/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))

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
          <Route
            path="dashboard"
            element={(
              <Lazy>
                <DashboardPage />
              </Lazy>
            )}
          />

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
