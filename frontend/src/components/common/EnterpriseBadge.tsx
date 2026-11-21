import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple';

export interface EnterpriseBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pill?: boolean;
}

export const EnterpriseBadge: React.FC<EnterpriseBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pill = true,
  className = '',
  ...props
}) => {
  const baseClass = 'ent-badge';
  const variantClass = `ent-badge--${variant}`;
  const sizeClass = `ent-badge--${size}`;
  const shapeClass = pill ? 'ent-badge--pill' : 'ent-badge--rounded';

  return (
    <span
      className={`${baseClass} ${variantClass} ${sizeClass} ${shapeClass} ${className}`.trim()}
      {...props}
    >
      {dot && <span className="ent-badge__dot" aria-hidden="true" />}
      <span className="ent-badge__content">{children}</span>
    </span>
  );
};
