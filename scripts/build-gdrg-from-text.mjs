import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const source = process.argv[2]
if (!source) {
  console.error('Usage: node scripts/build-gdrg-from-text.mjs <tariff-text-file>')
  process.exit(1)
}

const text = readFileSync(source, 'utf8')
  .replace(/\r/g, '')
  .replace(/\u00a0/g, ' ')
  .replace(/,/g, '')

const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)
const lines = []
for (const line of rawLines) {
  if (/^[A-Z]{4}\d{2,3}[A-Z]?\b/.test(line) || lines.length === 0) {
    lines.push(line)
    continue
  }
  if (/^\d+(?:\.\d+)?\s*$/.test(line) && lines.length) {
    lines[lines.length - 1] += ` ${line}`
    continue
  }
  const skip =
    /^MDC:|^G-DRG |^Page |^TARIFF|^NATIONAL|^Introduction|^Tables|^This booklet|^The tables|^Version|^July|^OCTOBER|^\d{4}$/i.test(
      line,
    )
  if (!skip && lines.length && !/\d+\.\d+\s*$/.test(lines[lines.length - 1])) {
    lines[lines.length - 1] += ` ${line}`
  }
}

const out = []
const seen = new Set()
const re = /^([A-Z]{4}\d{2,3}[A-Z]?)\s+(.+?)\s+(\d+(?:\.\d+)?)\s*$/
for (const line of lines) {
  const m = line.match(re)
  if (!m) continue
  const code = m[1]
  if (seen.has(code)) continue
  seen.add(code)
  out.push({
    code,
    name: m[2].replace(/\s+/g, ' ').trim(),
    tariff: Number(m[3]),
  })
}

out.sort((a, b) => a.code.localeCompare(b.code))
const dest = join(__dirname, '../packages/data/src/gdrg-data.json')
writeFileSync(dest, `${JSON.stringify(out)}\n`)
console.log(`Wrote ${out.length} codes to ${dest}`)
const prefs = {}
for (const x of out) {
  const p = x.code.slice(0, 4)
  prefs[p] = (prefs[p] || 0) + 1
}
console.log(prefs)
