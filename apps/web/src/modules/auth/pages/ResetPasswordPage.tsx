import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@onim/auth'
import { Button } from '@onim/ui'
import { AuthShell } from '../components/AuthShell'
import { PasswordField } from '../components/PasswordField'
import './AuthPages.css'

export function ResetPasswordPage() {
  const { isLoading, isAuthenticated, isPasswordRecovery, updatePassword, clearPasswordRecovery, signOut } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isLoading) return
    const hash = window.location.hash.replace(/^#/, '')
    const search = window.location.search.replace(/^\?/, '')
    const params = new URLSearchParams(hash || search)
    if (params.get('type') === 'recovery') {
      try {
        sessionStorage.setItem('onim_password_recovery', '1')
      } catch {
        /* ignore */
      }
    }
    const t = window.setTimeout(() => setReady(true), 500)
    return () => window.clearTimeout(t)
  }, [isLoading])

  const canReset = isAuthenticated && (isPasswordRecovery || (() => {
    try {
      return sessionStorage.getItem('onim_password_recovery') === '1'
    } catch {
      return false
    }
  })())

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const result = await updatePassword(password)
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    clearPasswordRecovery()
    signOut()
    navigate('/login', { replace: true, state: { passwordReset: true } })
  }

  if (isLoading || !ready) {
    return (
      <AuthShell>
        <p style={{ fontSize: 13, color: 'var(--gray4)', margin: 0 }}>Checking reset link…</p>
      </AuthShell>
    )
  }

  if (!canReset) {
    return (
      <AuthShell error="This reset link is invalid or has expired." footer={<>Request a new one from <Link to="/forgot-password">Forgot password</Link></>}>
        <p style={{ fontSize: 13, color: 'var(--gray4)', margin: 0 }}>
          Open the link from your email again, or request a fresh reset.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell error={error || undefined} footer={<>Back to <Link to="/login">Sign in</Link></>}>
      <p style={{ fontSize: 13, color: 'var(--gray4)', margin: '0 0 16px', lineHeight: 1.45 }}>
        Choose a new password for your account.
      </p>
      <form onSubmit={handleSubmit}>
        <PasswordField
          id="new-password"
          label="New password"
          placeholder="At least 8 characters"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          required
          variant="login"
        />
        <PasswordField
          id="confirm-password"
          label="Confirm password"
          placeholder="Repeat password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          minLength={8}
          required
          variant="login"
        />
        <Button type="submit" variant="primary" className="login-submit" disabled={loading}>
          {loading ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
