import { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { authService } from '../services/authService';

const ForgotPasswordForm = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sentToken, setSentToken] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const data = await authService.sendResetLink(email);
      // Laravel PasswordResetController returns:
      // { message: '...', reset_token: '...' }
      setSentToken(data.reset_token);
    } catch (err) {
      console.error('Password reset request error:', err);
      setErrors({ submit: err.message || 'We could not find a user with that email address.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card-body auth-fade-enter">
      {sentToken ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
            padding: '14px', 
            backgroundColor: '#ecfdf5', 
            border: '1px solid #a7f3d0', 
            borderRadius: '8px', 
            color: '#065f46', 
            fontSize: '14px' 
          }}>
            Password reset link generated successfully!
          </div>

          <div style={{ 
            padding: '16px', 
            backgroundColor: 'rgba(0, 35, 111, 0.04)', 
            border: '1px dashed var(--primary-brand)', 
            borderRadius: '8px', 
            fontSize: '13px' 
          }}>
            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--primary-brand)' }}>
              Developer / Demo Reset Token:
            </strong>
            <code style={{ 
              display: 'block', 
              wordBreak: 'break-all', 
              fontFamily: 'monospace', 
              backgroundColor: '#ffffff', 
              padding: '6px 8px', 
              borderRadius: '4px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              fontWeight: 600,
              color: 'var(--text-dark)'
            }}>
              {sentToken}
            </code>
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--text-dark)', opacity: 0.7 }}>
              Copy this token and click below to enter your new password.
            </p>
          </div>

          <Button
            type="button"
            iconRight={<ArrowRight size={16} />}
            onClick={() => onSuccess({ email, token: sentToken })}
          >
            Proceed to Reset Password
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errors.submit && (
            <div style={{ 
              padding: '10px 14px', 
              backgroundColor: '#fee2e2', 
              border: '1px solid #fca5a5', 
              borderRadius: '8px', 
              color: '#991b1b', 
              fontSize: '13px' 
            }}>
              {errors.submit}
            </div>
          )}

          <p style={{ fontSize: '13px', color: 'var(--text-dark)', margin: 0, opacity: 0.8 }}>
            Enter your account email below. We'll generate a secure password reset token for your account.
          </p>

          <Input
            label="Email address"
            id="reset-email"
            type="email"
            placeholder="admin@sbms.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            iconLeft={<Mail size={18} />}
            autoComplete="email"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <Button
              type="submit"
              isLoading={isLoading}
              iconRight={<ArrowRight size={16} />}
            >
              Request Reset Token
            </Button>

            <button
              type="button"
              className="auth-forgot-link"
              onClick={onCancel}
              style={{ 
                background: 'none', 
                border: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                alignSelf: 'center',
                padding: '6px'
              }}
            >
              <ArrowLeft size={12} />
              Back to Sign In
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
