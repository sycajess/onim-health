import './PageLoader.css'

export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <div className="page-loader__spinner" />
      <span>Loading…</span>
    </div>
  )
}
