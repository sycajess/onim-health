import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfWorker

export type ParsedLabReport = {
  test?: string
  result?: string
  ref?: string
  date?: string
  facility?: string
  notes?: string
  filled: string[]
}

const COMMON_TESTS = [
  'HbA1c',
  'Hemoglobin',
  'Haemoglobin',
  'Glucose',
  'Fasting Blood Sugar',
  'FBS',
  'Random Blood Sugar',
  'RBS',
  'WBC',
  'RBC',
  'Platelet',
  'Creatinine',
  'Urea',
  'ALT',
  'AST',
  'TSH',
  'Cholesterol',
  'HDL',
  'LDL',
  'Triglycerides',
  'Bilirubin',
  'Albumin',
  'Potassium',
  'Sodium',
  'Malaria',
  'HIV',
  'Hepatitis B',
  'Urinalysis',
]

const FACILITY_RE = /\b(laboratory|laboratories|diagnostic|diagnostics|hospital|medical centre|medical center|clinic|pathology|lab\b)/i
const DATE_RE =
  /\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d{2})\b/i
const RANGE_RE = /(\d+(?:\.\d+)?)\s*(?:–|—|-|\sto\s)\s*(\d+(?:\.\d+)?)/
const MIN_TEXT_CHARS = 40

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  if (!base64) throw new Error('Invalid file data.')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function normalizeDate(raw: string): string | undefined {
  const iso = raw.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/)
  if (iso) {
    return `${iso[1]}-${iso[2]!.padStart(2, '0')}-${iso[3]!.padStart(2, '0')}`
  }
  const dmy = raw.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/)
  if (dmy) {
    const year = dmy[3]!.length === 2 ? `20${dmy[3]}` : dmy[3]!
    return `${year}-${dmy[2]!.padStart(2, '0')}-${dmy[1]!.padStart(2, '0')}`
  }
  return undefined
}

function parseFacility(lines: string[]): string | undefined {
  for (const line of lines.slice(0, 12)) {
    const trimmed = line.trim()
    if (trimmed.length < 4 || trimmed.length > 80) continue
    if (FACILITY_RE.test(trimmed) && !/patient|name|date of birth|dob|sex|age/i.test(trimmed)) {
      return trimmed
    }
  }
  return undefined
}

function parseDate(text: string): string | undefined {
  const match = text.match(DATE_RE)
  if (!match) return undefined
  return normalizeDate(match[0])
}

type TestMatch = { test: string; result: string; ref: string; score: number }

function parseTestLine(line: string): TestMatch | null {
  const cleaned = line.replace(/\s{2,}/g, ' ').trim()
  if (cleaned.length < 4) return null

  for (const name of COMMON_TESTS) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(
      `${escaped}\\s*[:\\-]?\\s*([\\d.]+)\\s*(%|mg\\/dL|mmol\\/L|g\\/dL|U\\/L|IU\\/L|cells\\/µL|10\\^9\\/L|x10\\^9\\/L)?\\s*(?:\\(?\\s*(?:ref(?:erence)?\\.?\\s*(?:range)?\\.?\\s*:?\\s*)?(${RANGE_RE.source})\\s*\\)?)?`,
      'i',
    )
    const match = cleaned.match(pattern)
    if (match) {
      const result = `${match[1]}${match[2] ? ` ${match[2]}` : ''}`.trim()
      const ref = match[3] && match[4] ? `${match[3]}–${match[4]}` : ''
      return { test: name, result, ref, score: 10 }
    }
  }

  const generic = cleaned.match(
    /^([A-Za-z][A-Za-z0-9 /\-()]{2,40}?)\s+([\d.]+)\s*(%|mg\/dL|mmol\/L|g\/dL|U\/L|IU\/L)?(?:\s+(?:ref(?:erence)?\.?\s*(?:range)?\.?\s*:?\s*)?(\d+(?:\.\d+)?\s*(?:–|—|-|\sto\s)\s*\d+(?:\.\d+)?))?/i,
  )
  if (generic) {
    const test = generic[1]!.trim()
    if (/patient|doctor|report|page|date|specimen|sample|lab no|invoice/i.test(test)) return null
    const result = `${generic[2]}${generic[3] ? ` ${generic[3]}` : ''}`.trim()
    const refMatch = generic[4]?.match(RANGE_RE)
    const ref = refMatch ? `${refMatch[1]}–${refMatch[2]}` : ''
    return { test, result, ref, score: 5 }
  }

  const colon = cleaned.match(
    /^([A-Za-z][A-Za-z0-9 /\-()]{2,40})\s*:\s*([\d.]+)\s*(%|mg\/dL|mmol\/L|g\/dL|U\/L|IU\/L)?(?:\s*\(?\s*(?:ref|reference)\.?\s*:?\s*(\d+(?:\.\d+)?\s*(?:–|—|-|\sto\s)\s*\d+(?:\.\d+)?)\s*\)?)?/i,
  )
  if (colon) {
    const refMatch = colon[4]?.match(RANGE_RE)
    return {
      test: colon[1]!.trim(),
      result: `${colon[2]}${colon[3] ? ` ${colon[3]}` : ''}`.trim(),
      ref: refMatch ? `${refMatch[1]}–${refMatch[2]}` : '',
      score: 6,
    }
  }

  return null
}

function pickBestTest(lines: string[]): TestMatch | null {
  let best: TestMatch | null = null
  for (const line of lines) {
    const match = parseTestLine(line)
    if (!match) continue
    if (!best || match.score > best.score || (match.ref && !best.ref)) best = match
  }
  return best
}

async function extractPdfText(dataUrl: string): Promise<string> {
  const bytes = dataUrlToBytes(dataUrl)
  const pdf = await getDocument({ data: bytes }).promise
  const chunks: string[] = []
  for (let page = 1; page <= pdf.numPages; page += 1) {
    const content = await pdf.getPage(page).then((p) => p.getTextContent())
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    chunks.push(pageText)
  }
  return normalizeText(chunks.join('\n'))
}

async function renderPdfPagesToImages(dataUrl: string, maxPages = 2): Promise<string[]> {
  const bytes = dataUrlToBytes(dataUrl)
  const pdf = await getDocument({ data: bytes }).promise
  const images: string[] = []
  const limit = Math.min(pdf.numPages, maxPages)
  for (let i = 1; i <= limit; i += 1) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    await page.render({ canvasContext: ctx, viewport, canvas }).promise
    images.push(canvas.toDataURL('image/png'))
  }
  return images
}

async function ocrImages(images: string[]): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  try {
    const parts: string[] = []
    for (const image of images) {
      const { data } = await worker.recognize(image)
      if (data.text?.trim()) parts.push(data.text)
    }
    return normalizeText(parts.join('\n'))
  } finally {
    await worker.terminate()
  }
}

export function parseLabReportText(text: string): ParsedLabReport {
  const normalized = normalizeText(text)
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean)
  const filled: string[] = []
  const out: ParsedLabReport = { filled }

  const facility = parseFacility(lines)
  if (facility) {
    out.facility = facility
    filled.push('Lab / Hospital')
  }

  const date = parseDate(normalized)
  if (date) {
    out.date = date
    filled.push('Date')
  }

  const testMatch = pickBestTest(lines)
  if (testMatch) {
    out.test = testMatch.test
    out.result = testMatch.result
    if (testMatch.ref) out.ref = testMatch.ref
    filled.push('Test', 'Result')
    if (testMatch.ref) filled.push('Reference range')
  } else {
    const rangeOnly = normalized.match(
      /(?:result|value)\s*[:.]?\s*([\d.]+)\s*(%|mg\/dL|mmol\/L|g\/dL|U\/L|IU\/L)?[\s\S]{0,80}?(?:ref(?:erence)?\.?\s*(?:range)?\.?\s*:?\s*)(\d+(?:\.\d+)?\s*(?:–|—|-|\sto\s)\s*\d+(?:\.\d+)?)/i,
    )
    if (rangeOnly) {
      out.result = `${rangeOnly[1]}${rangeOnly[2] ? ` ${rangeOnly[2]}` : ''}`.trim()
      const refMatch = rangeOnly[3]!.match(RANGE_RE)
      if (refMatch) out.ref = `${refMatch[1]}–${refMatch[2]}`
      filled.push('Result')
      if (out.ref) filled.push('Reference range')
    }
  }

  if (filled.length) {
    out.notes = 'Auto-filled from uploaded report — please review all fields before saving.'
  }

  return out
}

function isImageFile(fileName: string, dataUrl: string): boolean {
  const lower = fileName.toLowerCase()
  return (
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(lower) ||
    dataUrl.startsWith('data:image/')
  )
}

function isPdfFile(fileName: string, dataUrl: string): boolean {
  return fileName.toLowerCase().endsWith('.pdf') || dataUrl.includes('application/pdf')
}

export async function parseLabReportFromDataUrl(dataUrl: string, fileName: string): Promise<ParsedLabReport> {
  try {
    if (isImageFile(fileName, dataUrl)) {
      const text = await ocrImages([dataUrl])
      if (!text.trim()) {
        return { filled: [], notes: 'Could not read text from this image. Enter details manually.' }
      }
      const parsed = parseLabReportText(text)
      if (parsed.filled.length) {
        parsed.notes = 'Auto-filled via OCR from image — please review all fields before saving.'
      }
      return parsed
    }

    if (!isPdfFile(fileName, dataUrl)) {
      return { filled: [], notes: 'Upload a PDF or image lab report for auto-fill.' }
    }

    let text = await extractPdfText(dataUrl)
    let usedOcr = false

    if (text.replace(/\s/g, '').length < MIN_TEXT_CHARS) {
      const images = await renderPdfPagesToImages(dataUrl, 2)
      if (images.length) {
        text = await ocrImages(images)
        usedOcr = true
      }
    }

    if (!text.trim()) {
      return {
        filled: [],
        notes: 'Could not read text from this PDF (even with OCR). Enter details manually.',
      }
    }

    const parsed = parseLabReportText(text)
    if (parsed.filled.length && usedOcr) {
      parsed.notes = 'Auto-filled via OCR from scanned PDF — please review all fields before saving.'
    }
    return parsed
  } catch {
    return { filled: [], notes: 'Could not parse this file. Enter details manually.' }
  }
}
