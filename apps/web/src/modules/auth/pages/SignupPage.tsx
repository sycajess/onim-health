import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@onim/auth'
import { getDefaultRouteForRole } from '@onim/types'
import { Button } from '@onim/ui'
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
    <AuthShell error={error || undefined} footer={<>Already have an account? <Link to="/login">Sign in</Link></>}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <PasswordField
          id="signup-password"
          label="Password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          required
          variant="login"
        />
        <PasswordField
          id="signup-confirm"
          label="Confirm password"
          placeholder="Repeat password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          required
          variant="login"
        />
        <Button type="submit" variant="primary" className="login-submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
    </AuthShell>
  )
}
