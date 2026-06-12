import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import './PageHero.css'

type PageHeroProps = {
  title: string
  subtitle: string
  variant?: 'teal' | 'blue' | 'amber' | 'rose' | 'slate'
  action?: ReactNode
}

export function PageHero({ title, subtitle, variant = 'teal', action }: PageHeroProps) {
  return (
    <motion.div
      className={`page-hero page-hero--${variant}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="page-hero__row">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {action && <div className="page-hero__action">{action}</div>}
      </div>
    </motion.div>
  )
}
