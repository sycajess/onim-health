import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isChunkLoadError } from '../utils/chunkError'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.error) {
      const updatedApp = isChunkLoadError(this.state.error)

      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray5)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            {updatedApp ? 'Update available' : 'Something went wrong'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--gray4)', marginBottom: 16, maxWidth: 360, marginInline: 'auto' }}>
            {updatedApp
              ? 'Please reload the page to continue with the latest version.'
              : 'Please try again. If this keeps happening, contact your administrator.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
