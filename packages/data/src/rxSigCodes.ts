export type RxSigCode = {
  code: string
  meaning: string
}

export const RX_SIG_CODES: RxSigCode[] = [
  { code: 'QD', meaning: 'Once daily' },
  { code: 'QAM', meaning: 'Every morning' },
  { code: 'QPM', meaning: 'Every evening' },
  { code: 'QHS', meaning: 'At bedtime' },
  { code: 'BID', meaning: 'Twice daily' },
  { code: 'TID', meaning: 'Three times daily' },
  { code: 'QID', meaning: 'Four times daily' },
  { code: 'QOD', meaning: 'Every other day' },
  { code: 'QW', meaning: 'Once weekly' },
  { code: 'BIW', meaning: 'Twice weekly' },
  { code: 'Q2H', meaning: 'Every 2 hours' },
  { code: 'Q4H', meaning: 'Every 4 hours' },
  { code: 'Q6H', meaning: 'Every 6 hours' },
  { code: 'Q8H', meaning: 'Every 8 hours' },
  { code: 'Q12H', meaning: 'Every 12 hours' },
  { code: 'PRN', meaning: 'As needed' },
  { code: 'AC', meaning: 'Before meals' },
  { code: 'PC', meaning: 'After meals' },
  { code: 'BID AC', meaning: 'Twice daily before meals' },
  { code: 'TID AC', meaning: 'Three times daily before meals' },
  { code: 'QID AC', meaning: 'Four times daily before meals' },
  { code: 'BID PC', meaning: 'Twice daily after meals' },
  { code: 'TID PC', meaning: 'Three times daily after meals' },
  { code: 'STAT', meaning: 'Immediately' },
  { code: 'ONCE', meaning: 'One time only' },
]

export function searchRxSigCodes(query: string): RxSigCode[] {
  const q = query.trim().toUpperCase()
  if (!q) return RX_SIG_CODES.slice(0, 12)
  return RX_SIG_CODES.filter(
    (s) => s.code.startsWith(q) || s.code.includes(q) || s.meaning.toUpperCase().includes(q),
  ).slice(0, 15)
}

export function expandSigCode(value: string): string {
  const trimmed = value.trim()
  const upper = trimmed.toUpperCase()
  const exact = RX_SIG_CODES.find((s) => s.code === upper)
  if (exact) return `${exact.code} — ${exact.meaning}`
  return trimmed
}
