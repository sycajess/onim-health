import { useEffect, useRef, useState } from 'react'
import { searchRxSigCodes, type RxSigCode } from '@onim/data'

type SigCodeInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SigCodeInput({ value, onChange, placeholder }: SigCodeInputProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<RxSigCode[]>([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setResults(searchRxSigCodes(q))
    setOpen(true)
  }, [query])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(sig: RxSigCode) {
    const next = `${sig.code} — ${sig.meaning}`
    setQuery(next)
    onChange(next)
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
          if (e.target.value.trim()) setOpen(true)
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder ?? 'e.g. BID, TID AC…'}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="search-input__dropdown">
          {results.map((sig) => (
            <button key={sig.code} type="button" className="search-input__option" onClick={() => pick(sig)}>
              <div className="search-input__option-name">{sig.code}</div>
              <div className="search-input__option-code">{sig.meaning}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
