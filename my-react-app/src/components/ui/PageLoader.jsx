import { Loader2 } from 'lucide-react';

export default function PageLoader({ text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      color: 'var(--primary-brand)',
      fontSize: '18px',
      gap: '12px',
    }}>
      <Loader2 size={24} className="ui-button-spinner" style={{ display: 'inline-block' }} />
      {text}
    </div>
  );
}
