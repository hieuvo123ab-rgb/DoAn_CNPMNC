import React, { useState, useEffect } from 'react';
import { Edit3, Loader2, Shield, Lock, AlertCircle } from 'lucide-react';
import { adminUserApi, UserItem } from '../api/adminUserApi';
import { EnterpriseModal } from './common/EnterpriseModal';

interface EditUserModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onUserUpdated: (user: UserItem) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onUserUpdated,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ROLE_STAFF');
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setRole(user.role);
      setEnabled(user.enabled);
      setError(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const updated = await adminUserApi.updateUser(user.id, {
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        role,
        enabled,
      });
      onUserUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Update user error:', err);
      const msg = err.response?.data?.message || 'Không thể cập nhật người dùng. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContent = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClose}
        disabled={isSubmitting}
        id="close-edit-user-btn"
      >
        Hủy
      </button>
      <button
        type="submit"
        form="edit-user-form"
        className="btn btn-primary"
        disabled={isSubmitting}
        id="confirm-edit-user-btn"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Đang lưu...</span>
          </>
        ) : (
          <>
            <Edit3 size={16} />
            <span>Lưu thay đổi</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={isSubmitting}
      title="Cập nhật tài khoản"
      subtitle={`Chỉnh sửa thông tin cho người dùng @${user.username}`}
      icon={<Edit3 size={20} className="text-primary" />}
      size="md"
      footer={footerContent}
    >
      <form id="edit-user-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="ent-alert ent-alert--danger" role="alert" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Tên đăng nhập</label>
          <div className="immutable-input-wrap">
            <input
              type="text"
              className="form-input"
              value={user.username}
              disabled
              readOnly
            />
            <span className="immutable-lock-icon" title="Tên đăng nhập cố định để bảo toàn quyền sở hữu tài liệu">
              <Lock size={16} />
            </span>
          </div>
          <span className="form-hint">Tên đăng nhập cố định để đảm bảo tính toàn vẹn quyền sở hữu tài liệu.</span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-fullname-input">Họ và tên</label>
          <input
            id="edit-fullname-input"
            type="text"
            className="form-input"
            placeholder="Nhập họ và tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-email-input">Email</label>
          <input
            id="edit-email-input"
            type="email"
            className="form-input"
            placeholder="Nhập địa chỉ email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-role-select">
            Gán vai trò <span className="text-danger">*</span>
          </label>
          <div className="select-with-icon">
            <Shield size={16} className="text-muted" />
            <select
              id="edit-role-select"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="ROLE_STAFF">ROLE_STAFF (Chuyên viên)</option>
              <option value="ROLE_ADMIN">ROLE_ADMIN (Quản trị viên)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Trạng thái hoạt động</label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', padding: '0.4rem 0' }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              id="edit-enabled-toggle"
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: enabled ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {enabled ? 'Kích hoạt (Cho phép đăng nhập)' : 'Vô hiệu hóa (Khóa tài khoản)'}
            </span>
          </label>
        </div>
      </form>
    </EnterpriseModal>
  );
};

export default EditUserModal;
