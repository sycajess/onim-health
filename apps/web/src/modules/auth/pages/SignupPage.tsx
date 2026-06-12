import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@onim/auth'
import { getDefaultRouteForRole } from '@onim/types'
import { AuthShell } from '../components/AuthShell'
import { PasswordField } from '../components/PasswordField'
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
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
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
        <PasswordField
          id="signup-password"
          label="Password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <PasswordField
          id="signup-confirm"
          label="Confirm password"
          placeholder="Repeat password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          required
        />
        <motion.button type="submit" className="auth-submit" disabled={loading} whileTap={{ scale: 0.98 }}>
          {loading ? 'Creating account…' : 'Create account →'}
        </motion.button>
      </form>
    </AuthShell>
  )
}
