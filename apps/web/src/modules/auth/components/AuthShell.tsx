import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
  heroTitle?: string
  heroText?: string
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  heroTitle = 'Care that feels personal.',
  heroText = 'Secure patient records, appointments, and clinical workflows — all in one modern workspace.',
}: AuthShellProps) {
  return (
    <div className="auth-split">
      <motion.aside
        className="auth-split__hero"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-split__mesh" />
        <motion.div
          className="auth-split__orb auth-split__orb--1"
          animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="auth-split__orb auth-split__orb--2"
          animate={{ y: [0, 14, 0], x: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="auth-split__hero-content">
          <Link to="/login" className="auth-split__brand">
            <span className="auth-split__brand-mark">◉</span>
            <span>
              <strong>Onim Health</strong>
              <small>Patient Records</small>
            </span>
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.6 }}
          >
            {heroText}
          </motion.p>
          <motion.div
            className="auth-split__stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            {[
              ['5k+', 'Patients managed'],
              ['99.9%', 'Uptime'],
              ['HIPAA', 'Ready design'],
            ].map(([val, lbl]) => (
              <div key={lbl} className="auth-split__stat">
                <span>{val}</span>
                <small>{lbl}</small>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.aside>

      <motion.section
        className="auth-split__panel"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-split__form-wrap">
          <div className="auth-split__form-head">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {children}
          <div className="auth-split__footer">{footer}</div>
        </div>
      </motion.section>
    </div>
  )
}
