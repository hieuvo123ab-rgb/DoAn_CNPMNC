import React from 'react';
import { EnterpriseModal } from './EnterpriseModal';
import { EnterpriseButton } from './EnterpriseButton';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'danger',
  isLoading = false
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle size={20} className="text-danger" />;
      case 'warning':
        return <AlertCircle size={20} className="text-warning" />;
      default:
        return <Info size={20} className="text-primary" />;
    }
  };

  return (
    <EnterpriseModal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      icon={getIcon()}
      size="sm"
      footer={
        <div className="ent-modal__actions">
          <EnterpriseButton
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </EnterpriseButton>
          <EnterpriseButton
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </EnterpriseButton>
        </div>
      }
    >
      <div className="ent-confirmation-message">{message}</div>
    </EnterpriseModal>
  );
};
