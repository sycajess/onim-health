import { useEffect, useRef, useState } from 'react'
import { IconAction, IconGlyph, type IconName } from './IconAction'

type StatusIconMenuProps = {
  value: string
  options: string[]
  onChange: (value: string) => void
}

function optionIcon(opt: string): IconName {
  if (/cancel/i.test(opt)) return 'cancel'
  if (/paid/i.test(opt)) return 'paid'
  if (/complete|confirm|active/i.test(opt)) return 'complete'
  return 'more'
}

export function StatusIconMenu({ value, options, onChange }: StatusIconMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const menuOptions = options.filter((opt) => opt !== value)

  return (
    <div className="status-icon-menu" ref={ref}>
      <IconAction
        icon="more"
        label={`Status: ${value}. Change status`}
        onClick={() => setOpen((v) => !v)}
      />
      {open && menuOptions.length > 0 && (
        <div className="status-icon-menu__panel" role="menu">
          {menuOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              role="menuitem"
              className="status-icon-menu__option"
              title={opt}
              aria-label={opt}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
            >
              <IconGlyph icon={optionIcon(opt)} />
              <span className="status-icon-menu__label">{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
