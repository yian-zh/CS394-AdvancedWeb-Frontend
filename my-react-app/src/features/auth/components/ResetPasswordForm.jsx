import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { authService } from '../services/authService';

const ResetPasswordForm = ({ initialEmail = '', initialToken = '', onSuccess, onCancel }) => {
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid';
    }
    if (!token.trim()) {
      newErrors.token = 'Reset token is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await authService.resetPassword({
        email,
        token,
        password,
        passwordConfirmation: confirmPassword,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Password reset submit error:', err);
      setErrors({ submit: err.message || 'Invalid or expired token.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-card-body auth-fade-enter">
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

      <Input
        label="Reset Token"
        id="reset-token"
        type="text"
        placeholder="Enter 64-character token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        error={errors.token}
        iconLeft={<KeyRound size={18} />}
      />

      <Input
        label="New Password"
        id="new-password"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        iconLeft={<Lock size={18} />}
        iconRight={
          <button
            type="button"
            className="ui-input-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        autoComplete="new-password"
      />

      <Input
        label="Confirm New Password"
        id="confirm-password"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        iconLeft={<Lock size={18} />}
        autoComplete="new-password"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        <Button
          type="submit"
          isLoading={isLoading}
          iconRight={<ArrowRight size={16} />}
        >
          Reset Password
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
          Cancel & Sign In
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
