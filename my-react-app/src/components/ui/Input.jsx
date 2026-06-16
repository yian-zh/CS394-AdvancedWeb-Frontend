import React from 'react';

const Input = React.forwardRef(({
  label,
  id,
  type = 'text',
  error,
  iconLeft,
  iconRight,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`ui-input-wrapper ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="ui-input-label">
          {label}
        </label>
      )}
      <div className="ui-input-container">
        {iconLeft && <span className="ui-input-icon icon-left">{iconLeft}</span>}
        <input
          id={id}
          type={type}
          ref={ref}
          className={`ui-input ${iconLeft ? 'has-icon-left' : ''} ${iconRight ? 'has-icon-right' : ''} ${error ? 'is-invalid' : ''} ${className}`}
          {...props}
        />
        {iconRight && <span className="ui-input-icon icon-right">{iconRight}</span>}
      </div>
      {error && <span className="ui-input-error">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
