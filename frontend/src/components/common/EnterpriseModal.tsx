import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface EnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
}

export const EnterpriseModal: React.FC<EnterpriseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="ent-modal-overlay"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`ent-modal ent-modal--${size}`}>
        <div className="ent-modal__header">
          <div className="ent-modal__title-group">
            {icon && <div className="ent-modal__icon">{icon}</div>}
            <div>
              <h3 className="ent-modal__title">{title}</h3>
              {subtitle && <p className="ent-modal__subtitle">{subtitle}</p>}
            </div>
          </div>
          {showCloseButton && (
            <button
              type="button"
              className="ent-modal__close-btn"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="ent-modal__body">{children}</div>

        {footer && <div className="ent-modal__footer">{footer}</div>}
      </div>
    </div>
  );
};
