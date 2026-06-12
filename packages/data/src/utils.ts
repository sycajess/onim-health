import type { Patient } from './types'

export function fmtDate(d: string | undefined): string {
  if (!d) return '–'
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function today(): string {
  return new Date().toISOString().split('T')[0]!
}

export function dateOffset(days: number): string {
  const x = new Date()
  x.setDate(x.getDate() + days)
  return x.toISOString().split('T')[0]!
}

export function daysUntil(d: string): number {
  return Math.round((new Date(d).getTime() - Date.now()) / 86400000)
}

export function patientInitials(p: Pick<Patient, 'fname' | 'lname'>): string {
  return (p.fname[0] + p.lname[0]).toUpperCase()
}

export function patientAge(dob: string): number {
  if (!dob) return NaN
  return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000)
}

export function formatPatientAge(dob: string): string {
  if (!dob) return '–'
  const age = patientAge(dob)
  if (Number.isNaN(age)) return '–'
  return String(age)
}

export function formatPatientDemographics(dob: string, sex: string): string {
  const parts: string[] = []
  if (dob) parts.push(`${formatPatientAge(dob)} yrs`)
  if (sex) parts.push(sex)
  return parts.length ? parts.join(' · ') : '–'
}

export function displayField(value: string | number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || value === '') return '–'
  if (typeof value === 'number' && value === 0) return '–'
  return `${value}${suffix}`
}

export function patientFullName(p: Pick<Patient, 'fname' | 'lname'>): string {
  return `${p.fname} ${p.lname}`
}

export function generateMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`
}

export const SPECIALTIES = [
  'Weight Loss',
  'Sexual Health',
  'Mental Health',
  'Fertility',
  'Hair',
  'Skin',
] as const

export const SPECIALTY_COLORS: Record<string, string> = {
  'Weight Loss': 'var(--teal)',
  'Sexual Health': 'var(--danger)',
  'Mental Health': 'var(--blue)',
  Fertility: '#D4537E',
  Hair: 'var(--amber)',
  Skin: 'var(--success)',
}
