import React from 'react';
import { FolderOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}) => {
  return (
    <div className={`ent-empty-state ${className}`.trim()}>
      <div className="ent-empty-state__icon-wrap">
        {icon || <FolderOpen size={36} className="ent-empty-state__icon" />}
      </div>
      <h4 className="ent-empty-state__title">{title}</h4>
      {description && <p className="ent-empty-state__desc">{description}</p>}
      {(action || secondaryAction) && (
        <div className="ent-empty-state__actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
