import React, { useState, useEffect } from 'react';
import { X, Edit3, Loader2, Shield, Lock } from 'lucide-react';
import { adminUserApi, UserItem } from '../api/adminUserApi';

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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Edit3 size={20} className="text-primary" />
            <h3 id="edit-user-modal-title">Cập nhật tài khoản</h3>
          </div>
          <button
            type="button"
            className="btn-icon-close"
            onClick={onClose}
            title="Đóng"
            id="close-edit-user-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label>Tên đăng nhập</label>
              <div className="immutable-input-wrap">
                <input
                  type="text"
                  className="form-control"
                  value={user.username}
                  disabled
                  readOnly
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
                <span className="immutable-lock-icon" title="Tên đăng nhập cố định để bảo toàn quyền sở hữu tài liệu">
                  <Lock size={16} />
                </span>
              </div>
              <small className="form-hint text-muted">Tên đăng nhập cố định để đảm bảo tính toàn vẹn quyền sở hữu tài liệu.</small>
            </div>

            <div className="form-group">
              <label htmlFor="edit-fullname-input">Họ và tên</label>
              <input
                id="edit-fullname-input"
                type="text"
                className="form-control"
                placeholder="Nhập họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-email-input">Email</label>
              <input
                id="edit-email-input"
                type="email"
                className="form-control"
                placeholder="Nhập địa chỉ email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-role-select">
                Gán vai trò <span className="text-danger">*</span>
              </label>
              <div className="select-with-icon">
                <Shield size={16} className="text-muted" />
                <select
                  id="edit-role-select"
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="ROLE_STAFF">ROLE_STAFF (Nhân viên)</option>
                  <option value="ROLE_ADMIN">ROLE_ADMIN (Quản trị viên)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Trạng thái hoạt động</label>
              <label className="checkbox-toggle-row">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  id="edit-enabled-toggle"
                />
                <span className={enabled ? 'text-success font-medium' : 'text-danger font-medium'}>
                  {enabled ? 'Kích hoạt (Cho phép đăng nhập)' : 'Vô hiệu hóa (Khóa tài khoản)'}
                </span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
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
        </form>
      </div>
    </div>
  );
};
