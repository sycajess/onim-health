/** Parse numeric value from lab result text (e.g. "6.2%", "7.2 mmol/L"). */
export function parseLabNumericValue(text: string): number | null {
  const m = text.trim().match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

export type ReferenceRange =
  | { kind: 'between'; low: number; high: number }
  | { kind: 'max'; max: number }
  | { kind: 'min'; min: number }

export function parseReferenceRange(ref: string): ReferenceRange | null {
  const t = ref.trim()
  if (!t) return null

  const between = t.match(/(\d+(?:\.\d+)?)\s*[–\-]\s*(\d+(?:\.\d+)?)/)
  if (between) {
    return { kind: 'between', low: Number(between[1]), high: Number(between[2]) }
  }

  const max = t.match(/<\s*(\d+(?:\.\d+)?)/)
  if (max) return { kind: 'max', max: Number(max[1]) }

  const min = t.match(/>\s*(\d+(?:\.\d+)?)/)
  if (min) return { kind: 'min', min: Number(min[1]) }

  return null
}

export type LabResultStatus = 'Normal' | 'Abnormal – High' | 'Abnormal – Low' | 'Critical'

export function evaluateLabResult(result: string, ref: string): LabResultStatus | null {
  const value = parseLabNumericValue(result)
  const range = parseReferenceRange(ref)
  if (value === null || !range) return null

  if (range.kind === 'between') {
    if (value < range.low) return value < range.low * 0.7 ? 'Critical' : 'Abnormal – Low'
    if (value > range.high) return value > range.high * 1.5 ? 'Critical' : 'Abnormal – High'
    return 'Normal'
  }

  if (range.kind === 'max') {
    if (value > range.max) return value > range.max * 1.5 ? 'Critical' : 'Abnormal – High'
    return 'Normal'
  }

  if (value < range.min) return value < range.min * 0.7 ? 'Critical' : 'Abnormal – Low'
  return 'Normal'
}

export function labStatusHint(result: string, ref: string): string {
  const status = evaluateLabResult(result, ref)
  if (!status || status === 'Normal') return 'Within reference range'
  if (status === 'Abnormal – High') return 'Above reference range'
  if (status === 'Abnormal – Low') return 'Below reference range'
  return 'Critically out of range'
}
