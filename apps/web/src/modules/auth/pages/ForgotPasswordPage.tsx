import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@onim/auth'
import { Button } from '@onim/ui'
import { AuthShell } from '../components/AuthShell'
import './AuthPages.css'

function resetRedirectUrl() {
  return `${window.location.origin.replace(/\/$/, '')}/reset-password`
}

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await requestPasswordReset(email, resetRedirectUrl())
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell footer={<>Back to <Link to="/login">Sign in</Link></>}>
        <p style={{ fontSize: 14, color: 'var(--gray4)', lineHeight: 1.5, margin: 0 }}>
          If an account exists for <strong>{email.trim().toLowerCase()}</strong>, we sent a password reset link.
          Check your inbox (and spam), then use the link to set a new password.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell error={error || undefined} footer={<>Remembered it? <Link to="/login">Sign in</Link></>}>
      <p style={{ fontSize: 13, color: 'var(--gray4)', margin: '0 0 16px', lineHeight: 1.45 }}>
        Enter your work email and we&apos;ll send a reset link.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="forgot-email">Email</label>
        <input
          id="forgot-email"
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Button type="submit" variant="primary" className="login-submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  )
}
