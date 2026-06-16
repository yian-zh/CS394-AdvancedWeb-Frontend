const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  iconLeft,
  iconRight,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`ui-button variant-${variant} ${isLoading ? 'is-loading' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="ui-button-spinner"></span>
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
