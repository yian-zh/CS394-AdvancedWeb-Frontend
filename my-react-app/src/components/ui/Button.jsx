import React from 'react';

/**
 * Reusable Button component supporting loading spinner, disabled state, and variant styling.
 */
const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  loadingText,
  iconLeft,
  iconRight,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const isButtonDisabled = Boolean(disabled || isLoading);

  return (
    <button
      type={type}
      className={`ui-button variant-${variant} ${isLoading ? 'is-loading' : ''} ${className}`}
      disabled={isButtonDisabled}
      style={{
        ...(isButtonDisabled ? { opacity: 0.7, cursor: 'not-allowed', filter: 'grayscale(15%)' } : {}),
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <span 
            className="ui-button-spinner" 
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'ui-spin 0.75s linear infinite'
            }} 
          />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        <>
          {iconLeft && <span className="ui-button-icon icon-left">{iconLeft}</span>}
          {children}
          {iconRight && <span className="ui-button-icon icon-right">{iconRight}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
export { Button };
