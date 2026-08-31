import { Link } from 'react-router-dom'
import type { ReactNode, ButtonHTMLAttributes } from 'react'
import './IconAction.css'

export type IconName =
  | 'video'
  | 'edit'
  | 'delete'
  | 'dispense'
  | 'complete'
  | 'cancel'
  | 'paid'
  | 'cash'
  | 'momo'
  | 'insurance'
  | 'partial'
  | 'pending'
  | 'message'
  | 'send'
  | 'print'
  | 'mail'
  | 'more'

const ICONS: Record<IconName, ReactNode> = {
  video: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m16 13 5-3v8l-5-3v-2Z" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  delete: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  ),
  dispense: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M10 2v4" />
      <path d="M14 2v4" />
      <path d="M8 6h8l-1 14H9L8 6Z" />
      <path d="M6 6h12" />
    </svg>
  ),
  complete: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  cancel: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  paid: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h2" />
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="7" width="18" height="11" rx="2" />
      <circle cx="17" cy="17" r="4" />
      <path d="M17 15.5v3" />
      <path d="M15.5 17h3" />
      <path d="M6 11h8" />
    </svg>
  ),
  momo: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M10 18h4" />
      <rect x="9" y="6" width="6" height="8" rx="1" />
      <path d="M10.5 10h3" />
      <path d="M10.5 12.5h3" />
    </svg>
  ),
  insurance: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 3l8 4v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
      <path d="M9.5 12.5 11 14l3.5-4" />
    </svg>
  ),
  partial: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 0 0 16" />
      <path d="M12 4v16" />
    </svg>
  ),
  pending: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M21 11.5a8.4 8.4 0 0 1-1.9 5.4 8.5 8.5 0 0 1-6.6 3.1 8.4 8.4 0 0 1-3.9-1L3 21l1.9-5.6A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 11.5 3 8.4 8.4 0 0 1 17 4.9 8.5 8.5 0 0 1 21 11.5Z" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  ),
  print: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  ),
}

type IconActionProps = {
  icon: IconName
  label: string
  to?: string
  href?: string
  variant?: 'default' | 'primary' | 'success' | 'danger'
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled' | 'type'>

export function IconAction({
  icon,
  label,
  to,
  href,
  variant = 'default',
  onClick,
  disabled,
  type = 'button',
}: IconActionProps) {
  const className = `icon-action icon-action--${variant}`

  if (to) {
    return (
      <Link to={to} className={className} aria-label={label} title={label}>
        {ICONS[icon]}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={className} aria-label={label} title={label} target="_blank" rel="noreferrer">
        {ICONS[icon]}
      </a>
    )
  }

  return (
    <button type={type} className={className} aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      {ICONS[icon]}
    </button>
  )
}

export function IconGlyph({ icon }: { icon: IconName }) {
  return ICONS[icon]
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="row-actions">{children}</div>
}
