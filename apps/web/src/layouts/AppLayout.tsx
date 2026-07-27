import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, usePermissions } from '@onim/auth'
import { useData } from '@onim/data'
import { MODULES, ROLE_LABELS, getModuleLabel } from '@onim/types'
import { Button, PageLoader } from '@onim/ui'
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
  const { canAccessModule, canCreatePatient } = usePermissions()
  const { db, loading: dataLoading, error: dataError } = useData()
  const location = useLocation()
  const navigate = useNavigate()
  const [patientModalOpen, setPatientModalOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  if (!profile) return null
  if (dataLoading) return <PageLoader />
  if (dataError) {
    return (
      <div className="content" style={{ padding: 48 }}>
        <h2>Could not load clinic data</h2>
        <p style={{ color: 'var(--gray4)' }}>{dataError}</p>
      </div>
    )
  }

  const { role } = profile
  const visibleModules = MODULES.filter((m) => canAccessModule(m.id))
  const sections = [...new Set(visibleModules.map((m) => m.section))]
  const activeModule = MODULES.find((m) => location.pathname.startsWith(m.path))
  const pendingApprovals = role === 'admin' ? db.staff.filter((s) => !s.approved).length : 0

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      {navOpen && <button type="button" className="sidebar-backdrop" aria-label="Close menu" onClick={() => setNavOpen(false)} />}
      <aside className={`sidebar${navOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__logo">
          <img className="sidebar__logo-img" src="/onim-logo.png" alt="Onim Health" />
          <div className="sidebar__logo-sub">Patient Records System</div>
        </div>

        {sections.map((section) => (
          <div key={section} className="sidebar__section">
            <div className="sidebar__label">{SECTION_LABELS[section]}</div>
            {visibleModules
              .filter((m) => m.section === section)
              .map((mod) => (
                <NavLink
                  key={mod.id}
                  to={mod.path}
                  className={({ isActive }) =>
                    `sidebar__nav${isActive ? ' sidebar__nav--active' : ''}`
                  }
                  end={mod.path === '/dashboard'}
                  onClick={() => setNavOpen(false)}
                >
                  <span className="sidebar__nav-icon">{mod.icon}</span>
                  {getModuleLabel(mod, role)}
                  {mod.id === 'settings' && pendingApprovals > 0 && (
                    <span className="sidebar__nav-badge">{pendingApprovals}</span>
                  )}
                </NavLink>
              ))}
          </div>
        ))}

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{profile.avatar_initials}</div>
            <div>
              <div className="sidebar__username">{profile.full_name}</div>
              <div className="sidebar__role">{ROLE_LABELS[role]}</div>
            </div>
          </div>
          <div className="sidebar__footer-brand">Onim Health © 2026</div>
          <button type="button" className="sidebar__signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar__start">
            <button type="button" className="topbar__menu" aria-label="Open menu" onClick={() => setNavOpen(true)}>☰</button>
            <h1 className="topbar__title">
              {activeModule ? getModuleLabel(activeModule, role) : 'Onim Health'}
            </h1>
          </div>
          <div className="topbar__actions">
            <GlobalSearchBar />
            {canCreatePatient && (
              <Button variant="primary" onClick={() => setPatientModalOpen(true)}>
                + New Patient
              </Button>
            )}
          </div>
        </header>

        <main className="content">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <NewPatientModal open={patientModalOpen} onClose={() => setPatientModalOpen(false)} />
    </div>
  )
}
