import React, { useState } from 'react';
import { X, UserPlus, Loader2, Shield } from 'lucide-react';
import { adminUserApi, UserItem } from '../api/adminUserApi';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: UserItem) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ROLE_STAFF');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Mật khẩu tối thiểu phải từ 6 ký tự.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const newUser = await adminUserApi.createUser({
        username: username.trim(),
        password,
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        role,
      });
      onUserCreated(newUser);
      onClose();
    } catch (err: any) {
      console.error('Create user error:', err);
      const msg = err.response?.data?.message || 'Không thể tạo người dùng. Vui lòng thử lại.';
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
            <UserPlus size={20} className="text-primary" />
            <h3 id="create-user-modal-title">Thêm người dùng mới (US-22)</h3>
          </div>
          <button
            type="button"
            className="btn-icon-close"
            onClick={onClose}
            title="Đóng"
            id="close-create-user-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label htmlFor="create-username-input">
                Tên đăng nhập <span className="text-danger">*</span>
              </label>
              <input
                id="create-username-input"
                type="text"
                className="form-control"
                placeholder="Ví dụ: nguyenvana"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
              <small className="form-hint">Duy nhất trong hệ thống, không thể thay đổi sau khi tạo.</small>
            </div>

            <div className="form-group">
              <label htmlFor="create-password-input">
                Mật khẩu <span className="text-danger">*</span>
              </label>
              <input
                id="create-password-input"
                type="password"
                className="form-control"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <small className="form-hint">Mật khẩu sẽ được mã hóa an toàn bằng thuật toán BCrypt.</small>
            </div>

            <div className="form-group">
              <label htmlFor="create-fullname-input">Họ và tên</label>
              <input
                id="create-fullname-input"
                type="text"
                className="form-control"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="create-email-input">Email</label>
              <input
                id="create-email-input"
                type="email"
                className="form-control"
                placeholder="Ví dụ: vana@edms.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="create-role-select">
                Vai trò (Role) <span className="text-danger">*</span>
              </label>
              <div className="select-with-icon">
                <Shield size={16} className="text-muted" />
                <select
                  id="create-role-select"
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="ROLE_STAFF">ROLE_STAFF (Nhân viên)</option>
                  <option value="ROLE_ADMIN">ROLE_ADMIN (Quản trị viên)</option>
                </select>
              </div>
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
              id="confirm-create-user-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Tạo người dùng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
