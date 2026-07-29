import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2, ChevronDown } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export default function AsyncSelect({
  value,
  onChange,
  fetchOptions,
  placeholder = 'Search...',
  label,
  getOptionLabel = (opt) => opt.label || opt.name || String(opt.id),
  getOptionValue = (opt) => opt.id,
  renderOption,
  error,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const debouncedSearch = useDebounce(search, 300);

  const selectedLabel = value ? (typeof value === 'string' ? value : getOptionLabel(value)) : '';

  const doFetch = useCallback(async (term) => {
    setLoading(true);
    try {
      const results = await fetchOptions(term);
      setOptions(results || []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [fetchOptions]);

  useEffect(() => {
    if (open && !fetched) {
      doFetch('');
    }
  }, [open, fetched, doFetch]);

  useEffect(() => {
    if (open && fetched) {
      doFetch(debouncedSearch);
    }
  }, [debouncedSearch, open, doFetch]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange(null);
    setSearch('');
    setOptions([]);
    setFetched(false);
  };

  return (
    <div className="ui-input-wrapper" ref={ref}>
      {label && <label className="ui-input-label">{label}</label>}
      <div className="ui-input-container" style={{ position: 'relative' }}>
        <span className="ui-input-icon icon-left" style={{ pointerEvents: 'none' }}>
          <Search size={16} />
        </span>
        <input
          ref={inputRef}
          type="text"
          className={`ui-input has-icon-left has-icon-right ${error ? 'is-invalid' : ''}`}
          placeholder={open ? placeholder : (selectedLabel || placeholder)}
          value={open ? search : selectedLabel}
          onFocus={() => setOpen(true)}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          readOnly={!open}
        />
        <span
          className="ui-input-icon icon-right"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); if (selectedLabel) handleClear(); }}
        >
          {loading ? <Loader2 size={16} className="ui-button-spinner" /> : (selectedLabel ? <X size={16} /> : <ChevronDown size={16} />)}
        </span>

        {open && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: '#ffffff',
              border: '1px solid rgba(197, 197, 211, 0.4)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
              zIndex: 100,
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '240px',
              overflowY: 'auto',
            }}
          >
            {loading && options.length === 0 && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
                <Loader2 size={16} className="ui-button-spinner" style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                Searching...
              </div>
            )}

            {!loading && options.length === 0 && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
                {search ? 'No results found' : 'Start typing to search...'}
              </div>
            )}

            {options.map((opt) => (
              <div
                key={getOptionValue(opt)}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: getOptionValue(opt) === getOptionValue(value) ? 'rgba(0, 35, 111, 0.06)' : 'transparent',
                  fontSize: '13px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    getOptionValue(opt) === getOptionValue(value) ? 'rgba(0, 35, 111, 0.06)' : 'transparent';
                }}
              >
                {renderOption ? (
                  renderOption(opt)
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{getOptionLabel(opt)}</span>
                    {opt.sub && <span style={{ fontSize: '11px', color: '#64748b' }}>{opt.sub}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <span className="ui-input-error">{error}</span>}
    </div>
  );
}
