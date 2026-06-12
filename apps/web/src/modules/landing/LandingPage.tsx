import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@onim/auth'
import { getDefaultRouteForRole } from '@onim/types'
import './LandingPage.css'

const FEATURES = [
  {
    icon: '👥',
    title: 'Patients & Profiles',
    desc: 'Register patients, search records, and view full clinical timelines in one place.',
  },
  {
    icon: '📅',
    title: 'Appointments & Scheduling',
    desc: 'Schedule visits, track status, and manage telemedicine links for your clinic.',
  },
  {
    icon: '📋',
    title: 'Medical Records',
    desc: 'Consultation notes, assessments, and visit documentation for every encounter.',
  },
  {
    icon: '💊',
    title: 'Prescriptions & Pharmacy',
    desc: 'Prescribe medications, track dispense history, and manage inventory levels.',
  },
  {
    icon: '🧪',
    title: 'Labs & Results',
    desc: 'Record test values, flag abnormal results, and attach PDF lab reports.',
  },
  {
    icon: '📊',
    title: 'Billing & Reports',
    desc: 'Invoices, payment tracking, and analytics dashboards for clinic operations.',
  },
]

const ROLES = [
  { icon: '🩺', title: 'Doctors', desc: 'Patients, records, prescriptions, labs, appointments, and messaging.' },
  { icon: '💉', title: 'Nurses', desc: 'Patient care, appointments, records, labs, and inventory support.' },
  { icon: '💊', title: 'Pharmacists', desc: 'Prescriptions, medication inventory, dispense logs, and messaging.' },
  { icon: '⚙️', title: 'Admin', desc: 'Full module access, team overview, and clinic settings.' },
  { icon: '🧾', title: 'Accountants', desc: 'Billing, invoices, inventory oversight, and financial reports.' },
]

export function LandingPage() {
  const { isAuthenticated, isLoading, profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated && profile) {
      navigate(getDefaultRouteForRole(profile.role), { replace: true })
    }
  }, [isLoading, isAuthenticated, profile, navigate])

  if (!isLoading && isAuthenticated && profile) return null

  return (
    <div className="oh-landing">
      <header className="oh-nav">
        <div className="oh-nav__inner">
          <Link to="/" className="oh-nav__brand">
            <span className="oh-nav__logo" aria-hidden />
            <span>
              <strong>Onim Health</strong>
              <small>GH</small>
            </span>
          </Link>
          <nav className="oh-nav__links" aria-label="Primary">
            <a href="#features">Modules</a>
            <a href="#roles">Team access</a>
          </nav>
          <Link to="/login" className="oh-nav__btn">Sign in</Link>
        </div>
      </header>

      <section className="oh-hero">
        <div className="oh-hero__inner">
          <motion.span
            className="oh-hero__badge"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            Onim Health
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            Your clinic
            <br />
            <span>workspace.</span>
          </motion.h1>
          <motion.p
            className="oh-hero__sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Sign in to manage patients, appointments, records, prescriptions,
            labs, inventory, billing, and team messaging — based on your role.
          </motion.p>

          <motion.div
            className="oh-hero__preview"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="oh-dash">
              <div className="oh-dash__top">
                <div className="oh-dash__dots"><span /><span /><span /></div>
                <span className="oh-dash__url">onimhealth.com/dashboard</span>
              </div>
              <div className="oh-dash__body">
                <aside className="oh-dash__sidebar">
                  <div className="oh-dash__side-brand" />
                  {['Dashboard', 'Patients', 'Appointments', 'Records', 'Labs', 'Billing'].map((item, i) => (
                    <div key={item} className={`oh-dash__nav${i === 0 ? ' is-active' : ''}`}>{item}</div>
                  ))}
                </aside>
                <div className="oh-dash__main">
                  <div className="oh-dash__header">
                    <strong>Dashboard</strong>
                    <div className="oh-dash__avatar" />
                  </div>
                  <div className="oh-dash__cards">
                    <div className="oh-dash__card oh-dash__card--hi">
                      <span>Patients</span>
                      <strong>248</strong>
                    </div>
                    <div className="oh-dash__card">
                      <span>Today&apos;s appointments</span>
                      <strong>18</strong>
                    </div>
                    <div className="oh-dash__card">
                      <span>Active prescriptions</span>
                      <strong>64</strong>
                    </div>
                    <div className="oh-dash__card">
                      <span>Inventory alerts</span>
                      <strong>3</strong>
                    </div>
                  </div>
                  <div className="oh-dash__panels">
                    <div className="oh-dash__chart">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <span key={i} style={{ height: `${30 + (i % 4) * 14}%` }} />
                      ))}
                    </div>
                    <div className="oh-dash__list">
                      {['Weight Loss · 10:30 AM', 'Mental Health · 11:00 AM', 'Labs review · 2:00 PM'].map((row) => (
                        <div key={row} className="oh-dash__list-row">{row}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <p className="oh-hero__note">Authorized Onim Health staff only</p>
        </div>
      </section>

      <section id="features" className="oh-features">
        <div className="oh-features__head">
          <span className="oh-label">Modules</span>
          <h2>What you can access</h2>
          <p>Tools available depend on your role after you sign in.</p>
        </div>
        <div className="oh-features__grid">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              className="oh-feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <div className="oh-feature-card__icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="roles" className="oh-roles">
        <div className="oh-roles__layout">
          <div className="oh-roles__copy">
            <span className="oh-label">Access</span>
            <h2>Built for every role on the team</h2>
            <p>
              Doctors, nurses, pharmacists, admin, and finance staff each get
              a sidebar tailored to what they need — nothing more.
            </p>
          </div>
          <div className="oh-roles__list">
            {ROLES.map((role, i) => (
              <motion.div
                key={role.title}
                className="oh-role-card"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
              >
                <span className="oh-role-card__icon">{role.icon}</span>
                <div>
                  <h3>{role.title}</h3>
                  <p>{role.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="oh-cta">
        <h2>Sign in to continue</h2>
        <p>Use your Onim Health staff credentials.</p>
        <Link to="/login" className="oh-cta__btn">Sign in</Link>
      </section>

      <footer className="oh-footer">
        <div className="oh-footer__inner">
          <strong>Onim Health GH</strong>
        </div>
        <div className="oh-footer__bottom">
          <span>© {new Date().getFullYear()} Onim Health</span>
        </div>
      </footer>
    </div>
  )
}
