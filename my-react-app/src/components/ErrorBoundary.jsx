import { Component } from 'react';

const RECOVERY_KEY = 'error_boundary_reload_attempted';

const reloadWithCacheBust = () => {
  const sep = window.location.search ? '&' : '?';
  window.location.assign(`${window.location.pathname}${window.location.search}${sep}v=${Date.now()}${window.location.hash}`);
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] App crashed:', error, info);
  }

  componentDidMount() {
    if (this.state.hasError) {
      if (!sessionStorage.getItem(RECOVERY_KEY)) {
        sessionStorage.setItem(RECOVERY_KEY, '1');
        reloadWithCacheBust();
      }
    } else {
      sessionStorage.removeItem(RECOVERY_KEY);
    }
  }

  reload = () => {
    sessionStorage.removeItem('chunk_reload_timestamp');
    reloadWithCacheBust();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            marginBottom: '16px',
          }}>
            !
          </div>
          <h1 style={{ fontSize: '22px', color: '#0f172a', margin: '0 0 8px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
            The application hit an unexpected error &mdash; usually caused by a freshly
            deployed update. Reloading the app usually fixes it.
          </p>
          <button
            type="button"
            onClick={this.reload}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: '#0b2f8a',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
