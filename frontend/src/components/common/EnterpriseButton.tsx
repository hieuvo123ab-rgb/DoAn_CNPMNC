import React from 'react';
import { Loader2 } from 'lucide-react';

export interface EnterpriseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const EnterpriseButton: React.FC<EnterpriseButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseClass = 'ent-btn';
  const variantClass = `ent-btn--${variant}`;
  const sizeClass = `ent-btn--${size}`;
  const loadingClass = isLoading ? 'ent-btn--loading' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="ent-btn__spinner" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : (
        icon && <span className="ent-btn__icon-left">{icon}</span>
      )}
      <span className="ent-btn__text">{children}</span>
      {!isLoading && rightIcon && <span className="ent-btn__icon-right">{rightIcon}</span>}
    </button>
  );
};
