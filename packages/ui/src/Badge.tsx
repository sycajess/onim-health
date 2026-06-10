import './Badge.css'

type BadgeVariant =
  | 'teal'
  | 'amber'
  | 'danger'
  | 'gray'
  | 'blue'
  | 'success'

const STATUS_MAP: Record<string, BadgeVariant> = {
  Active: 'teal',
  Pending: 'amber',
  Confirmed: 'teal',
  Scheduled: 'blue',
  Completed: 'gray',
  Cancelled: 'danger',
  Normal: 'teal',
  'Abnormal – High': 'danger',
  'Abnormal – Low': 'amber',
  Critical: 'danger',
  'Paid – Cash': 'success',
  'Paid – MoMo': 'success',
  'Paid – Insurance': 'success',
  Partial: 'amber',
}

type BadgeProps = {
  children: string
  variant?: BadgeVariant
}

export function Badge({ children, variant }: BadgeProps) {
  const v = variant ?? STATUS_MAP[children] ?? 'gray'
  return <span className={`badge badge--${v}`}>{children}</span>
}
