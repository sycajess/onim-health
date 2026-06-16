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
        <div className="login-logo">Onim Health</div>
        <div className="login-sub">Patient Records System</div>
        {error ? <div className="login-error">{error}</div> : null}
        {children}
        {footer ? <div className="login-footer">{footer}</div> : null}
      </div>
    </div>
  )
}
