import { useEffect, useRef, useState } from 'react'
import { searchRxNormDrugs, type RxNormDrug } from '../lib/rxnorm'

type MedicationSearchProps = {
  value: string
  onChange: (name: string) => void
  onSelectDrug?: (drug: RxNormDrug) => void
  placeholder?: string
}

export function MedicationSearch({ value, onChange, onSelectDrug, placeholder }: MedicationSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<RxNormDrug[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    const timer = window.setTimeout(() => {
      setLoading(true)
      void searchRxNormDrugs(query)
        .then((items) => {
          setResults(items)
          setOpen(items.length > 0)
        })
        .finally(() => setLoading(false))
    }, 300)

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
    onChange(drug.name)
    onSelectDrug?.(drug)
    setQuery(drug.name)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        className="form-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          if (e.target.value.trim().length >= 2) setOpen(true)
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder ?? 'Search drug…'}
        autoComplete="off"
      />
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11, color: 'var(--gray4)' }}>
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid var(--gray2)',
              borderTopColor: 'var(--teal)',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'med-search-spin 0.7s linear infinite',
            }}
          />
          Searching…
        </div>
      )}
      <style>{`@keyframes med-search-spin { to { transform: rotate(360deg); } }`}</style>
      {open && results.length > 0 && (
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
          {results.map((drug) => (
            <button
              key={`${drug.rxcui}-${drug.name}`}
              type="button"
              onClick={() => pick(drug)}
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
