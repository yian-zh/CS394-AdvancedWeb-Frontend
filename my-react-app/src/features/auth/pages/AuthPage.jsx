import { useState } from 'react';
import { Bus, CheckCircle2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import '../styles/auth.css';

const AuthPage = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'
  const [authSuccess, setAuthSuccess] = useState(null); // { type: 'register', email: string }

  const handleLoginSuccess = (data) => {
    if (onLogin) {
      onLogin({ email: data.email });
    }
  };

  const handleRegisterSuccess = (data) => {
    setAuthSuccess({
      type: 'register',
      email: data.email,
    });
  };

  const handleReset = () => {
    setAuthSuccess(null);
    setActiveTab('signin');
  };

  return (
    <div className="auth-page">
      {/* Decorative Atmospheric Blur Backgrounds */}
      <div className="auth-bg-circle auth-bg-circle-1"></div>
      <div className="auth-bg-circle auth-bg-circle-2"></div>

      <div className="auth-container">
        {/* Branding Header */}
        <header className="auth-branding">
          <div className="auth-logo-wrapper">
            <span className="auth-logo-icon">
              <Bus size={22} strokeWidth={2.5} />
            </span>
            <span className="auth-logo-text">SBMS</span>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">School Bus Management System Portal</p>
        </header>

        {/* Main Card Portal */}
        <Card>
          {authSuccess ? (
            <div className="auth-card-body auth-fade-enter" style={{ textAlign: 'center', padding: '40px 32px' }}>
              <div style={{ color: 'var(--primary-brand)', display: 'inline-flex', marginBottom: '16px' }}>
                <CheckCircle2 size={48} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--primary-brand)', margin: '0 0 8px 0' }}>
                Account Created Successfully!
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-dark)', marginBottom: '24px', opacity: 0.8 }}>
                Verification email sent to {authSuccess.email}
              </p>
              <button
                type="button"
                className="ui-button variant-primary"
                onClick={handleReset}
              >
                Go Back to Login
              </button>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="auth-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'signin'}
                  className={`auth-tab-btn ${activeTab === 'signin' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('signin')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'signup'}
                  className={`auth-tab-btn ${activeTab === 'signup' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('signup')}
                >
                  Register
                </button>
              </div>

              {/* Form Body Toggle */}
              {activeTab === 'signin' ? (
                <LoginForm onSuccess={handleLoginSuccess} />
              ) : (
                <RegisterForm onSuccess={handleRegisterSuccess} />
              )}
            </>
          )}
        </Card>

        {/* Footer Links */}
        <footer className="auth-footer">
          <a href="#support" className="auth-footer-link" onClick={(e) => e.preventDefault()}>
            Help & Support
          </a>
          <span className="auth-footer-divider"></span>
          <a href="#privacy" className="auth-footer-link" onClick={(e) => e.preventDefault()}>
            Privacy Policy
          </a>
        </footer>
      </div>
    </div>
  );
};

export default AuthPage;
