import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from '@onim/auth'
import { AppLayout } from '../layouts/AppLayout'

const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('../modules/auth/pages/SignupPage').then((m) => ({ default: m.SignupPage })))
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

export function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route element={<ProtectedRoute module="patients" />}>
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:id" element={<PatientDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute module="appointments" />}>
            <Route path="appointments" element={<AppointmentsPage />} />
          </Route>

          <Route element={<ProtectedRoute module="records" />}>
            <Route path="records" element={<RecordsPage />} />
          </Route>

          <Route element={<ProtectedRoute module="prescriptions" />}>
            <Route path="prescriptions" element={<PrescriptionsPage />} />
          </Route>

          <Route element={<ProtectedRoute module="labs" />}>
            <Route path="labs" element={<LabsPage />} />
          </Route>

          <Route element={<ProtectedRoute module="inventory" />}>
            <Route path="inventory" element={<InventoryPage />} />
          </Route>

          <Route element={<ProtectedRoute module="billing" />}>
            <Route path="billing" element={<BillingPage />} />
          </Route>

          <Route element={<ProtectedRoute module="messaging" />}>
            <Route path="messaging" element={<MessagingPage />} />
          </Route>

          <Route element={<ProtectedRoute module="reports" />}>
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          <Route element={<ProtectedRoute module="settings" />}>
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
