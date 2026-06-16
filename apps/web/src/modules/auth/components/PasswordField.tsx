import { useState } from 'react'

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  minLength?: number
  required?: boolean
  variant?: 'default' | 'login'
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  required,
  variant = 'default',
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  if (variant === 'login') {
    return (
      <>
        <label htmlFor={id}>{label}</label>
        <div className="password-wrap">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete}
            minLength={minLength}
            required={required}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="auth-field">
      <label className="auth-field__label" htmlFor={id}>{label}</label>
      <div className="auth-field__wrap auth-field__wrap--password">
        <span className="auth-field__icon">🔒</span>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="auth-field__input auth-field__input--password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
        />
        <button
          type="button"
          className="auth-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}
