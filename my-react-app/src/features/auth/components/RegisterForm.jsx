import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const RegisterForm = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Full Name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
        onSuccess({ name, email });
      }
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-card-body auth-fade-enter">
      <Input
        label="Full Name"
        id="name"
        type="text"
        placeholder="Alex Johnson"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        iconLeft={<User size={18} />}
        autoComplete="name"
      />

      <Input
        label="Email Address"
        id="email"
        type="email"
        placeholder="alex.johnson@district.edu"
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
        autoComplete="new-password"
      />

      <Input
        label="Confirm Password"
        id="confirmPassword"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        iconLeft={<Lock size={18} />}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        isLoading={isLoading}
        iconRight={<ArrowRight size={16} />}
        style={{ marginTop: '8px' }}
      >
        Create Account
      </Button>
    </form>
  );
};

export default RegisterForm;
