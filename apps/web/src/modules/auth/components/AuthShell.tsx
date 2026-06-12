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
      <div className="auth-page__card">
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
        <Link to="/" className="auth-page__home-in-card">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
