import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@onim/auth'
import { MODULES, ROLE_LABELS, canAccessModule } from '@onim/types'
import { Button, PageLoader, PageTransition } from '@onim/ui'
import { GlobalSearchBar } from '../components/GlobalSearchBar'
import { NewPatientModal } from '../components/NewPatientModal'
import './AppLayout.css'

const SECTION_LABELS = {
  overview: 'Overview',
  clinical: 'Clinical',
  operations: 'Operations',
  analytics: 'Analytics',
  system: 'System',
} as const

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [patientModalOpen, setPatientModalOpen] = useState(false)

  if (!profile) return null

  const { role } = profile
  const visibleModules = MODULES.filter((m) => canAccessModule(role, m.id))
  const sections = [...new Set(visibleModules.map((m) => m.section))]
  const canAddPatients = canAccessModule(role, 'patients')

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <motion.aside
        className="sidebar"
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="sidebar__logo">
          <div className="sidebar__logo-name">Onim Health</div>
          <div className="sidebar__logo-sub">Patient Records System</div>
        </div>

        {sections.map((section, si) => (
          <motion.div
            key={section}
            className="sidebar__section"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + si * 0.06, duration: 0.4 }}
          >
            <div className="sidebar__label">{SECTION_LABELS[section]}</div>
            {visibleModules
              .filter((m) => m.section === section)
              .map((mod, mi) => (
                <NavLink
                  key={mod.id}
                  to={mod.path}
                  className={({ isActive }) =>
                    `sidebar__nav${isActive ? ' sidebar__nav--active' : ''}`
                  }
                  end={mod.path === '/dashboard'}
                >
                  <motion.span
                    className="sidebar__nav-icon"
                    whileHover={{ scale: 1.15, rotate: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                  >
                    {mod.icon}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 + si * 0.06 + mi * 0.03 }}
                  >
                    {mod.label}
                  </motion.span>
                </NavLink>
              ))}
          </motion.div>
        ))}

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{profile.avatar_initials}</div>
            <div>
              <div className="sidebar__username">{profile.full_name}</div>
              <div className="sidebar__role">{ROLE_LABELS[role]}</div>
            </div>
          </div>
          <button type="button" className="sidebar__signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </motion.aside>

      <div className="main">
        <motion.header
          className="topbar"
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h1 className="topbar__title">
            {MODULES.find((m) => location.pathname.startsWith(m.path))?.label ??
              'Onim Health'}
          </h1>
          <div className="topbar__actions">
            <GlobalSearchBar />
            {canAddPatients && (
              <Button variant="primary" onClick={() => setPatientModalOpen(true)}>
                + New Patient
              </Button>
            )}
          </div>
        </motion.header>

        <main className="content">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      <NewPatientModal open={patientModalOpen} onClose={() => setPatientModalOpen(false)} />
    </div>
  )
}
