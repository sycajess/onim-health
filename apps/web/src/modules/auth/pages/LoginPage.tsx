import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@onim/auth'
import { getDefaultRouteForRole } from '@onim/types'
import { AuthShell } from '../components/AuthShell'
import { PasswordField } from '../components/PasswordField'
import './AuthPages.css'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    navigate(getDefaultRouteForRole(result.profile.role), { replace: true })
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your workspace"
      footer={
        <>
          No account? <Link to="/signup">Create one</Link>
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
          <label className="auth-field__label" htmlFor="email">Email address</label>
          <div className="auth-field__wrap">
            <span className="auth-field__icon">✉</span>
            <input
              id="email"
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
          id="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />
        <motion.button type="submit" className="auth-submit" disabled={loading} whileTap={{ scale: 0.98 }}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </motion.button>
      </form>
    </AuthShell>
  )
}
