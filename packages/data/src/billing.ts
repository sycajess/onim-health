export const BILLING_SERVICE_TYPES = [
  'Consultation',
  'Lab Test',
  'Medication / Drugs',
  'Procedure',
  'Imaging',
  'Vaccination',
  'Follow-up Visit',
  'Counselling',
  'Other',
] as const

export type BillingServiceType = (typeof BILLING_SERVICE_TYPES)[number]

export type BillingLineItem = {
  type: BillingServiceType | string
  description: string
  amount: number
  icd10?: string
  icd10Name?: string
  gdrg?: string
  gdrgName?: string
}

export type BillingServicesPayload = {
  lines: BillingLineItem[]
}

export function serializeBillingServices(lines: BillingLineItem[]): string {
  return JSON.stringify({ lines } satisfies BillingServicesPayload)
}

export function parseBillingServices(services: string): BillingLineItem[] {
  if (!services.trim()) return []
  try {
    const parsed = JSON.parse(services) as BillingServicesPayload
    if (Array.isArray(parsed?.lines)) return parsed.lines
  } catch {
    /* legacy plain text */
  }
  return [{ type: 'Other', description: services.trim(), amount: 0 }]
}

export function formatBillingServicesSummary(services: string): string {
  const lines = parseBillingServices(services)
  if (!lines.length) return '–'
  return lines
    .map((l) => {
      const codes = [l.icd10, l.gdrg].filter(Boolean).join(' · ')
      const base = `${l.type}${l.description ? ` — ${l.description}` : ''}`
      return codes ? `${base} [${codes}]` : base
    })
    .join('; ')
}

export function billingLinesTotal(lines: BillingLineItem[]): number {
  return lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0)
}

export function isPaidBillingStatus(status: string): boolean {
  return status.startsWith('Paid')
}

export function billingPaymentMethod(status: string): string {
  if (status === 'Paid – Cash') return 'Cash'
  if (status === 'Paid – MoMo') return 'Mobile Money (MoMo)'
  if (status === 'Paid – Insurance') return 'Insurance'
  if (status === 'Partial') return 'Partial payment'
  if (status === 'Pending') return 'Pending'
  return status
}
