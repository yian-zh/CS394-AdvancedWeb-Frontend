import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { authService } from '../services/authService';

const LoginForm = ({ onSuccess, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email or Username is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      const data = await authService.login(email, password);
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ submit: err.message || 'Invalid email or password.' });
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
        id="email"
        type="email"
        placeholder="example@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        iconLeft={<Mail size={18} />}
        autoComplete="email"
      />

      <Input
        label="Password"
        id="password"
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
        autoComplete="current-password"
      />

      <div className="auth-options">
        <label className="auth-remember">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Remember me</span>
        </label>
        <a
          href="#forgot"
          className="auth-forgot-link"
          onClick={(e) => {
            e.preventDefault();
            if (onForgotPassword) onForgotPassword();
          }}
        >
          Forgot Password?
        </a>
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        iconRight={<ArrowRight size={16} />}
        style={{ marginTop: '8px' }}
      >
        Login to Dashboard
      </Button>
    </form>
  );
};

export default LoginForm;
