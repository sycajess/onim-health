import type { ReactNode } from 'react'

export function FormGrid({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
}

type FieldProps = {
  label: string
  children: ReactNode
  span?: boolean
}

export function FormField({ label, children, span }: FieldProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: span ? '1 / -1' : undefined }}>
      <span style={{ fontSize: 11, color: 'var(--gray4)', textTransform: 'uppercase' }}>{label}</span>
      {children}
    </label>
  )
}

export function PatientSelect({
  patients,
  value,
  onChange,
}: {
  patients: { id: string; fname: string; lname: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <select className="form-input" value={value} onChange={(e) => onChange(e.target.value)} required>
      <option value="">Select patient…</option>
      {patients.map((p) => (
        <option key={p.id} value={p.id}>{p.fname} {p.lname}</option>
      ))}
    </select>
  )
}
