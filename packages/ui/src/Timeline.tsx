import { motion } from 'framer-motion'
import './Timeline.css'

export type TimelineEvent = {
  id: string
  date: string
  type: string
  label: string
  detail?: string
}

type TimelineProps = {
  events: TimelineEvent[]
  emptyMessage?: string
}

export function Timeline({ events, emptyMessage = 'No activity yet' }: TimelineProps) {
  if (!events.length) {
    return <p className="timeline-empty">{emptyMessage}</p>
  }

  return (
    <div className="timeline">
      {events.map((ev, i) => (
        <motion.div
          key={ev.id}
          className="timeline__item"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="timeline__dot" />
          <div className="timeline__date">{ev.date}</div>
          <div className="timeline__content">
            <div className="timeline__type">{ev.type}</div>
            <div className="timeline__note">
              <strong>{ev.label}</strong>
              {ev.detail ? ` — ${ev.detail}` : ''}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
