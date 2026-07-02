import { useEffect, useRef, useState } from 'react'
import { searchRxNormDrugs, type RxNormDrug } from '../lib/rxnorm'

type MedicationSearchProps = {
  value: string
  onChange: (name: string) => void
  onSelectDrug?: (drug: RxNormDrug) => void
  placeholder?: string
}

const MIN_QUERY = 2
const DEBOUNCE_MS = 150

export function MedicationSearch({ value, onChange, onSelectDrug, placeholder }: MedicationSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<RxNormDrug[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const requestId = useRef(0)
  const lastPicked = useRef<string | null>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY) {
      setResults([])
      setOpen(false)
      setLoading(false)
      return
    }

    if (trimmed === lastPicked.current) {
      lastPicked.current = null
      setResults([])
      setOpen(false)
      setLoading(false)
      return
    }

    setOpen(true)
    const id = ++requestId.current
    const timer = window.setTimeout(() => {
      setLoading(true)
      void searchRxNormDrugs(trimmed)
        .then((items) => {
          if (requestId.current !== id) return
          setResults(items)
          setOpen(true)
        })
        .finally(() => {
          if (requestId.current !== id) return
          setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(drug: RxNormDrug) {
    lastPicked.current = drug.name
    onChange(drug.name)
    onSelectDrug?.(drug)
    setQuery(drug.name)
    setResults([])
    setOpen(false)
  }

  const showPanel = open && query.trim().length >= MIN_QUERY

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        className="form-input"
        value={query}
        onChange={(e) => {
          lastPicked.current = null
          setQuery(e.target.value)
          onChange(e.target.value)
          if (e.target.value.trim().length >= MIN_QUERY) setOpen(true)
        }}
        onFocus={() => query.trim().length >= MIN_QUERY && setOpen(true)}
        placeholder={placeholder ?? 'Search drug…'}
        autoComplete="off"
      />
      {showPanel && (
        <div
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: 'var(--white)',
            border: '1px solid var(--gray2)',
            borderRadius: 8,
            maxHeight: 220,
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          {loading && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--gray4)' }}>Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--gray4)' }}>No matches</div>
          )}
          {!loading && results.map((drug) => (
            <button
              key={`${drug.rxcui}-${drug.name}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                pick(drug)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                borderBottom: '1px solid var(--gray1)',
              }}
            >
              <div style={{ fontWeight: 500 }}>{drug.name}</div>
              {drug.strength && (
                <div style={{ fontSize: 11, color: 'var(--gray4)', marginTop: 2 }}>Strength: {drug.strength}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
