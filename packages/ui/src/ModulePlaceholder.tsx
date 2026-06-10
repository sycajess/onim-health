import { motion } from 'framer-motion'
import { EmptyState } from './EmptyState'
import { FadeIn } from './FadeIn'
import './ModulePlaceholder.css'

type ModulePlaceholderProps = {
  title: string
  description: string
  icon: string
}

export function ModulePlaceholder({ title, description, icon }: ModulePlaceholderProps) {
  return (
    <div className="module-placeholder">
      <FadeIn>
        <motion.div
          className="module-placeholder__hero"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="module-placeholder__icon">{icon}</span>
        </motion.div>
      </FadeIn>
      <EmptyState icon={icon} title={title} description={description} />
      <FadeIn delay={0.26}>
        <div className="module-placeholder__cards">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="module-placeholder__card"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(29,158,117,0.15)' }}
            />
          ))}
        </div>
      </FadeIn>
    </div>
  )
}
