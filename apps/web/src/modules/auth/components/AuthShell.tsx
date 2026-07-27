import type { ReactNode } from 'react'

type AuthShellProps = {
  children: ReactNode
  footer?: ReactNode
  error?: string
}

export function AuthShell({ children, footer, error }: AuthShellProps) {
  return (
    <div className="login-screen">
      <div className="login-box">
        <img className="login-logo-img" src="/onim-logo.png" alt="Onim Health" />
        <div className="login-sub">Patient Records System</div>
        {error ? <div className="login-error">{error}</div> : null}
        {children}
        {footer ? <div className="login-footer">{footer}</div> : null}
      </div>
    </div>
  )
}
