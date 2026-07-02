import type { ReactNode } from 'react'
import './FormField.css'

type FormFieldProps = {
  label: string
  children: ReactNode
  span?: number
}

export function FormField({ label, children, span }: FormFieldProps) {
  return (
    <label className={`form-field${span ? ' form-field--span-2' : ''}`}>
      <span className="form-field__label">{label}</span>
      {children}
    </label>
  )
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>
}
