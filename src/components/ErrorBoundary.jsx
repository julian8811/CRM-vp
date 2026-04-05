import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: 560 }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: 8 }}>Algo salió mal</h1>
          <p style={{ color: '#64748b', marginBottom: 16 }}>
            Revisá la consola del navegador (F12) o probá recargar la página.
          </p>
          <pre
            style={{
              background: '#f1f5f9',
              padding: 12,
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 12,
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
