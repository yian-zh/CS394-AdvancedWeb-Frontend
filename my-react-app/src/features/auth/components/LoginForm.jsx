import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const LoginForm = ({ onSuccess }) => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (onSuccess) {
        onSuccess({ email, rememberMe });
      }
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-card-body auth-fade-enter">
      <Input
        label="Email or Username"
        id="email"
        type="text"
        placeholder="admin@district.edu"
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
        <a href="#forgot" className="auth-forgot-link" onClick={(e) => e.preventDefault()}>
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
