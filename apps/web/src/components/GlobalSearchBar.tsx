import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import './GlobalSearchBar.css'

export function GlobalSearchBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState('')

  const onPatients = location.pathname.startsWith('/patients')
  const urlQuery = onPatients ? (params.get('q') ?? '') : ''
  const value = onPatients ? urlQuery : draft

  function handleChange(next: string) {
    if (!onPatients) setDraft(next)

    if (next.trim().length > 1) {
      navigate(`/patients?q=${encodeURIComponent(next.trim())}`)
    } else if (onPatients && next.trim().length === 0) {
      navigate('/patients')
    }
  }

  return (
    <motion.div
      className="search-bar"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.35 }}
    >
      <span className="search-bar__icon" aria-hidden>
        🔍
      </span>
      <input
        type="search"
        className="search-bar__input"
        placeholder="Search patients, records..."
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Global search"
      />
    </motion.div>
  )
}
