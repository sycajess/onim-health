import { useEffect, useRef, useState } from 'react'

export type SearchOption = {
  code: string
  name: string
  hint?: string
}

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  onSelect?: (option: SearchOption) => void
  search: (query: string) => Promise<SearchOption[]>
  placeholder?: string
}

export function SearchInput({ value, onChange, onSelect, search, placeholder }: SearchInputProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<SearchOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const timer = window.setTimeout(() => {
      setLoading(true)
      void search(query)
        .then((items) => {
          setResults(items)
          setOpen(items.length > 0)
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(option: SearchOption) {
    const label = option.code ? `${option.name} (${option.code})` : option.name
    onChange(label)
    onSelect?.(option)
    setQuery(label)
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
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && <div className="search-input__loading">Searching…</div>}
      {open && results.length > 0 && (
        <div className="search-input__dropdown">
          {results.map((opt) => (
            <button key={`${opt.code}-${opt.name}`} type="button" className="search-input__option" onClick={() => pick(opt)}>
              <div className="search-input__option-name">{opt.name}</div>
              {opt.code && <div className="search-input__option-code">{opt.code}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type CodedTagInputProps = {
  entries: SearchOption[]
  onChange: (entries: SearchOption[]) => void
  search: (query: string) => Promise<SearchOption[]>
  placeholder?: string
}

export function CodedTagInput({ entries, onChange, search, placeholder }: CodedTagInputProps) {
  const [draft, setDraft] = useState('')

  function add(option: SearchOption) {
    if (entries.some((e) => e.code === option.code && e.name === option.name)) return
    onChange([...entries, option])
    setDraft('')
  }

  function remove(index: number) {
    onChange(entries.filter((_, i) => i !== index))
  }

  return (
    <div className="coded-tags">
      {entries.map((e, i) => (
        <span key={`${e.code}-${e.name}-${i}`} className="coded-tags__chip">
          {e.code ? `${e.name} (${e.code})` : e.name}
          <button type="button" className="coded-tags__remove" onClick={() => remove(i)} aria-label="Remove">×</button>
        </span>
      ))}
      <SearchInput
        value={draft}
        onChange={setDraft}
        onSelect={add}
        search={search}
        placeholder={placeholder}
      />
    </div>
  )
}
