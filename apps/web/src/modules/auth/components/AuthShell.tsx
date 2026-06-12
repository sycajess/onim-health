import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="auth-page">
      <Link to="/" className="auth-page__home">
        ← Back to home
      </Link>

      <motion.div
        className="auth-page__card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link to="/" className="auth-page__brand">
          <span className="auth-page__logo" aria-hidden />
          <span>
            <strong>Onim Health</strong>
            <small>GH</small>
          </span>
        </Link>

        <div className="auth-page__head">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {children}

        <div className="auth-page__footer">{footer}</div>
      </motion.div>
    </div>
  )
}
