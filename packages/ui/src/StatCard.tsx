import './Card.css'

type StatCardProps = {
  icon: string
  iconBg: string
  iconColor: string
  label: string
  value: string | number
  sub: string
}

export function StatCard({ icon, iconBg, iconColor, label, value, sub }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__sub">{sub}</div>
    </div>
  )
}
