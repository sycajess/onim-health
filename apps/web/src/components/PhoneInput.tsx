import { useEffect, useMemo, useState } from 'react'
import './PhoneInput.css'

export type CountryCallingCode = {
  code: string
  country: string
  cca2: string
}

type RestCountry = {
  name: { common: string }
  cca2: string
  idd?: { root?: string; suffixes?: string[] }
}

function parseCallingCodes(countries: RestCountry[]): CountryCallingCode[] {
  const items: CountryCallingCode[] = []

  for (const c of countries) {
    const idd = c.idd
    const root = idd?.root
    if (!root || !idd) continue

    const suffixes = idd.suffixes?.length ? idd.suffixes : ['']
    for (const suffix of suffixes) {
      items.push({
        code: `${root}${suffix}`,
        country: c.name.common,
        cca2: c.cca2,
      })
    }
  }

  return items.sort((a, b) => a.country.localeCompare(b.country))
}

let cachedCodes: CountryCallingCode[] | null = null
let fetchPromise: Promise<CountryCallingCode[]> | null = null

async function loadCountryCodes(): Promise<CountryCallingCode[]> {
  if (cachedCodes) return cachedCodes
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load country codes')
      return res.json() as Promise<RestCountry[]>
    })
    .then(parseCallingCodes)
    .then((codes) => {
      cachedCodes = codes
      return codes
    })
    .finally(() => {
      fetchPromise = null
    })

  return fetchPromise
}

const DEFAULT_CODE = '+233'

type PhoneInputProps = {
  countryCode: string
  number: string
  onCountryCodeChange: (code: string) => void
  onNumberChange: (number: string) => void
}

export function PhoneInput({
  countryCode,
  number,
  onCountryCodeChange,
  onNumberChange,
}: PhoneInputProps) {
  const [codes, setCodes] = useState<CountryCallingCode[]>(
    cachedCodes ?? [{ code: DEFAULT_CODE, country: 'Ghana', cca2: 'GH' }],
  )
  const [loading, setLoading] = useState(!cachedCodes)

  useEffect(() => {
    let cancelled = false
    void loadCountryCodes()
      .then((list) => {
        if (!cancelled) setCodes(list)
      })
      .catch(() => {
        if (!cancelled) {
          setCodes([{ code: DEFAULT_CODE, country: 'Ghana', cca2: 'GH' }])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const options = useMemo(() => {
    const seen = new Set<string>()
    return codes.filter((item) => {
      const key = `${item.code}-${item.cca2}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [codes])

  return (
    <div className="phone-input">
      <select
        className="form-input phone-input__code"
        value={countryCode}
        onChange={(e) => onCountryCodeChange(e.target.value)}
        disabled={loading}
        aria-label="Country code"
      >
        {options.map((item) => (
          <option key={`${item.code}-${item.cca2}`} value={item.code}>
            {item.code} · {item.country}
          </option>
        ))}
      </select>
      <input
        className="form-input phone-input__number"
        type="tel"
        inputMode="tel"
        value={number}
        onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s-]/g, ''))}
        placeholder="XX XXX XXXX"
        aria-label="Phone number"
      />
    </div>
  )
}

export function formatPhone(countryCode: string, number: string): string {
  const digits = number.replace(/\D/g, '')
  if (!digits) return ''
  return `${countryCode} ${digits}`
}
