import { SPECIALTIES, SPECIALTY_COLORS } from '@onim/data'
import './SpecialtyFilter.css'

type SpecialtyFilterProps = {
  value: string
  onChange: (value: string) => void
}

export function SpecialtyFilter({ value, onChange }: SpecialtyFilterProps) {
  return (
    <div className="specialty-filter">
      <div className="specialty-filter__head">
        <span className="specialty-filter__label">Specialty</span>
        {value && (
          <button type="button" className="specialty-filter__clear" onClick={() => onChange('')}>
            Clear filter
          </button>
        )}
      </div>
      <div className="specialty-filter__chips" role="group" aria-label="Filter by specialty">
        <button
          type="button"
          className={`specialty-filter__chip${!value ? ' is-active' : ''}`}
          onClick={() => onChange('')}
          aria-pressed={!value}
        >
          All
        </button>
        {SPECIALTIES.map((s) => (
          <button
            key={s}
            type="button"
            className={`specialty-filter__chip${value === s ? ' is-active' : ''}`}
            onClick={() => onChange(value === s ? '' : s)}
            aria-pressed={value === s}
          >
            <span
              className="specialty-filter__dot"
              style={{ background: SPECIALTY_COLORS[s] ?? 'var(--teal)' }}
              aria-hidden
            />
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
