export const BILLING_TARIFF_TIERS = ['cash', 'private_insurance', 'nhis'] as const

export type BillingTariffTier = (typeof BILLING_TARIFF_TIERS)[number]

export const BILLING_TARIFF_LABELS: Record<BillingTariffTier, string> = {
  cash: 'Cash / Private',
  private_insurance: 'Private Insurance',
  nhis: 'NHIS',
}

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
  cashPrice: number
  privateInsurancePrice: number
  nhisTariff: number
  amount?: number
  icd10?: string
  icd10Name?: string
  gdrg?: string
  gdrgName?: string
}

export type BillingServicesPayload = {
  lines: BillingLineItem[]
}

function normalizeLine(line: BillingLineItem): BillingLineItem {
  const legacy = Number(line.amount) || 0
  return {
    ...line,
    cashPrice: Number(line.cashPrice) || legacy,
    privateInsurancePrice: Number(line.privateInsurancePrice) || legacy,
    nhisTariff: Number(line.nhisTariff) || legacy,
  }
}

export function billingLineAmount(line: BillingLineItem, tier: BillingTariffTier): number {
  const l = normalizeLine(line)
  if (tier === 'cash') return l.cashPrice
  if (tier === 'private_insurance') return l.privateInsurancePrice
  return l.nhisTariff
}

export function serializeBillingServices(lines: BillingLineItem[]): string {
  return JSON.stringify({ lines: lines.map(normalizeLine) } satisfies BillingServicesPayload)
}

export function parseBillingServices(services: string): BillingLineItem[] {
  if (!services.trim()) return []
  try {
    const parsed = JSON.parse(services) as BillingServicesPayload
    if (Array.isArray(parsed?.lines)) return parsed.lines.map(normalizeLine)
  } catch {
    /* legacy plain text */
  }
  return [{ type: 'Other', description: services.trim(), cashPrice: 0, privateInsurancePrice: 0, nhisTariff: 0, amount: 0 }]
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

export function billingLinesTotal(lines: BillingLineItem[], tier: BillingTariffTier = 'cash'): number {
  return lines.reduce((sum, l) => sum + billingLineAmount(l, tier), 0)
}

export function validateInvoiceForSave(input: {
  primaryIcd10: string
  paymentTier: BillingTariffTier
  lines: BillingLineItem[]
  patientNhis: string
}): string | null {
  if (!input.primaryIcd10.trim()) return 'Primary ICD-10 diagnosis is required.'
  if (!input.lines.length) return 'Add at least one service line.'
  for (const line of input.lines) {
    if (!line.gdrg?.trim() && input.paymentTier === 'nhis') {
      return 'Each NHIS service line needs a G-DRG code.'
    }
  }
  if (input.paymentTier === 'nhis' && !input.patientNhis.trim()) {
    return 'Patient NHIS membership number is required for NHIS billing.'
  }
  const total = billingLinesTotal(input.lines, input.paymentTier)
  if (total <= 0) return 'Invoice total must be greater than zero.'
  return null
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

export function isNhisClaimInvoice(invoice: {
  payment_tier?: string
  primary_icd10?: string
  nhis_cleared?: boolean
}): boolean {
  return invoice.payment_tier === 'nhis' && !!invoice.primary_icd10?.trim() && !!invoice.nhis_cleared
}
