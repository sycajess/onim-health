import { motion } from 'framer-motion'
import './PageHero.css'

type PageHeroProps = {
  title: string
  subtitle: string
  variant?: 'teal' | 'blue' | 'amber' | 'rose' | 'slate'
}

export function PageHero({ title, subtitle, variant = 'teal' }: PageHeroProps) {
  return (
    <motion.div
      className={`page-hero page-hero--${variant}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </motion.div>
  )
}
