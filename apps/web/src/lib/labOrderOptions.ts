/** Standard lab order checklist for medical records / printable lab requests */
export const LAB_ORDER_OPTIONS = [
  'Full Blood Count (FBC/CBC)',
  'Fasting Blood Glucose',
  'HbA1c',
  'Lipid Profile',
  'Liver Function Test (LFT)',
  'Kidney/Renal Function Test',
  'Electrolytes',
  'Urinalysis',
  'Thyroid Function Test (TSH / FT4)',
  'Pregnancy Test (β-hCG)',
] as const

export type LabOrderOption = (typeof LAB_ORDER_OPTIONS)[number]

export function parseLabsOrdered(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function formatLabsOrdered(selected: string[], other = ''): string {
  const extra = other.trim()
  return [...selected, ...(extra ? [extra] : [])].join('\n')
}
