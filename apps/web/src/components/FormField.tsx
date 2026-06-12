import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  children: ReactNode
  span?: number
}

export function FormField({ label, children, span }: FormFieldProps) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        gridColumn: span ? `span ${span}` : undefined,
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>{label}</span>
      {children}
    </label>
  )
}

export function FormGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {children}
    </div>
  )
}
