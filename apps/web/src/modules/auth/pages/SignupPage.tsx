import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@onim/auth'
import { getDefaultRouteForRole } from '@onim/types'
import { AuthShell } from '../components/AuthShell'
import './AuthPages.css'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const result = await signUp(email, password)
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    navigate(getDefaultRouteForRole(result.profile.role), { replace: true })
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Join your clinic's secure records platform"
      heroTitle="Built for modern care teams."
      heroText="Register once — your administrator assigns your role and access automatically."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <p className="auth-form__hint">No role selection here — access is assigned by your admin after signup.</p>
        {error && (
          <motion.p className="auth-form__error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            {error}
          </motion.p>
        )}
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="signup-email">Email address</label>
          <div className="auth-field__wrap">
            <span className="auth-field__icon">✉</span>
            <input
              id="signup-email"
              type="email"
              className="auth-field__input"
              placeholder="you@onimhealth.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="signup-password">Password</label>
          <div className="auth-field__wrap">
            <span className="auth-field__icon">🔒</span>
            <input
              id="signup-password"
              type="password"
              className="auth-field__input"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="signup-confirm">Confirm password</label>
          <div className="auth-field__wrap">
            <span className="auth-field__icon">✓</span>
            <input
              id="signup-confirm"
              type="password"
              className="auth-field__input"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        <motion.button type="submit" className="auth-submit" disabled={loading} whileTap={{ scale: 0.98 }}>
          {loading ? 'Creating account…' : 'Create account →'}
        </motion.button>
      </form>
    </AuthShell>
  )
}
