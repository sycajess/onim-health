import type { CSSProperties, ReactNode } from 'react'
import './Card.css'

type CardProps = {
  title?: string
  action?: ReactNode
  children: ReactNode
  noPadding?: boolean
  style?: CSSProperties
}

export function Card({ title, action, children, noPadding, style }: CardProps) {
  return (
    <div className="card" style={style}>
      {title && (
        <div className="card__header">
          <h3 className="card__title">{title}</h3>
          {action}
        </div>
      )}
      <div className={noPadding ? 'card__body card__body--flush' : 'card__body'}>
        {children}
      </div>
    </div>
  )
}
