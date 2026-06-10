import './Badge.css'

const MAP: Record<string, string> = {
  'Weight Loss': 'weight',
  'Sexual Health': 'sexual',
  'Mental Health': 'mental',
  Fertility: 'fertility',
  Hair: 'hair',
  Skin: 'skin',
}

export function SpecialtyTag({ specialty }: { specialty: string }) {
  const key = MAP[specialty] ?? 'weight'
  return <span className={`specialty-tag specialty-tag--${key}`}>{specialty}</span>
}
