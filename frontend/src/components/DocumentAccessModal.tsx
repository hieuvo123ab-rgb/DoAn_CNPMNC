import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentItem,
  documentApi,
  DocumentPermissionsResponse,
} from '../api/documentApi';
import {
  Shield,
  Users,
  UserPlus,
  Trash2,
  Lock,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ConfirmationModal } from './common/ConfirmationModal';
import { EnterpriseModal } from './common/EnterpriseModal';

interface DocumentAccessModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DocumentAccessModal: React.FC<DocumentAccessModalProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [accessMode, setAccessMode] = useState<'INTERNAL' | 'PRIVATE'>('INTERNAL');
  const [permissionsData, setPermissionsData] = useState<DocumentPermissionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingMode, setIsSavingMode] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [revokingUserId, setRevokingUserId] = useState<number | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ userId: number; username: string } | null>(null);

  const [targetUsername, setTargetUsername] = useState<string>('');
  const [targetPermission, setTargetPermission] = useState<'READ' | 'EDIT'>('READ');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPermissions = useCallback(async () => {
    if (!document) return;
    try {
      setIsLoading(true);
      setMessage(null);
      const res = await documentApi.getPermissions(document.id);
      setPermissionsData(res);
      setAccessMode(res.accessMode === 'PRIVATE' ? 'PRIVATE' : 'INTERNAL');
    } catch (err: unknown) {
      console.error('Failed to load permissions:', err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể tải danh sách quyền truy cập.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, [document]);

  useEffect(() => {
    if (isOpen && document) {
      loadPermissions();
    }
  }, [isOpen, document, loadPermissions]);

  if (!isOpen || !document) return null;

  const handleUpdateAccessMode = async (newMode: 'INTERNAL' | 'PRIVATE') => {
    try {
      setIsSavingMode(true);
      setMessage(null);
      await documentApi.updateAccessMode(document.id, newMode);
      setAccessMode(newMode);
      setMessage({
        type: 'success',
        text: `Đã chuyển chế độ truy cập sang ${
          newMode === 'INTERNAL' ? 'Nội bộ (INTERNAL)' : 'Riêng tư (PRIVATE)'
        } thành công.`,
      });
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update access mode:', err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Lỗi khi thay đổi chế độ truy cập.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSavingMode(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên đăng nhập của người dùng cần chia sẻ.' });
      return;
    }

    try {
      setIsSharing(true);
      setMessage(null);
      await documentApi.shareDocument(document.id, {
        username: targetUsername.trim(),
        permission: targetPermission,
      });
      setTargetUsername('');
      setMessage({
        type: 'success',
        text: `Đã chia sẻ quyền ${targetPermission} cho người dùng ${targetUsername.trim()} thành công.`,
      });
      await loadPermissions();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Share error:', err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Lỗi khi chia sẻ tài liệu.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    const { userId, username } = revokeTarget;
    try {
      setRevokingUserId(userId);
      setMessage(null);
      await documentApi.revokePermission(document.id, userId);
      setMessage({ type: 'success', text: `Đã thu hồi quyền của người dùng ${username}.` });
      setRevokeTarget(null);
      await loadPermissions();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Revoke error:', err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Lỗi khi thu hồi quyền.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setRevokingUserId(null);
    }
  };

  return (
    <>
      <EnterpriseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Quyền truy cập & Chia sẻ"
        subtitle={document.title}
        icon={<Shield size={20} />}
        size="lg"
        footer={
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Đóng
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {message && (
            <div
              className={`ent-alert ${
                message.type === 'success' ? 'ent-alert--success' : 'ent-alert--danger'
              }`}
              style={{ margin: 0 }}
            >
              {message.type === 'success' ? (
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              ) : (
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
              )}
              <span style={{ fontSize: '0.875rem' }}>{message.text}</span>
            </div>
          )}

          {/* Section 1: Access Mode */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Chế độ truy cập tài liệu
            </label>
            <div className="ent-radio-grid-2">
              <div
                className={`ent-radio-card ${accessMode === 'INTERNAL' ? 'ent-radio-card--selected' : ''}`}
                onClick={() => !isSavingMode && handleUpdateAccessMode('INTERNAL')}
                style={{ cursor: isSavingMode ? 'not-allowed' : 'pointer' }}
              >
                <div className="ent-radio-card__icon">
                  <Globe size={20} />
                </div>
                <div className="ent-radio-card__body">
                  <div className="ent-radio-card__title">
                    <span>Nội bộ (INTERNAL)</span>
                    {accessMode === 'INTERNAL' && (
                      <span className="ent-badge ent-badge--primary" style={{ fontSize: '0.7rem' }}>
                        Hiện tại
                      </span>
                    )}
                  </div>
                  <div className="ent-radio-card__desc">
                    Mọi người dùng đã xác thực đều có thể xem và tải xuống tài liệu.
                  </div>
                </div>
              </div>

              <div
                className={`ent-radio-card ${accessMode === 'PRIVATE' ? 'ent-radio-card--selected' : ''}`}
                onClick={() => !isSavingMode && handleUpdateAccessMode('PRIVATE')}
                style={{ cursor: isSavingMode ? 'not-allowed' : 'pointer' }}
              >
                <div className="ent-radio-card__icon">
                  <Lock size={20} />
                </div>
                <div className="ent-radio-card__body">
                  <div className="ent-radio-card__title">
                    <span>Riêng tư (PRIVATE)</span>
                    {accessMode === 'PRIVATE' && (
                      <span className="ent-badge ent-badge--primary" style={{ fontSize: '0.7rem' }}>
                        Hiện tại
                      </span>
                    )}
                  </div>
                  <div className="ent-radio-card__desc">
                    Chỉ bạn, Quản trị viên và người dùng được chỉ định mới truy cập được.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--color-border)', margin: 0 }} />

          {/* Section 2: Share with user form */}
          <form onSubmit={handleShare}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Chia sẻ cho người dùng
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Nhập tên đăng nhập (username)..."
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                className="form-input"
                style={{ flex: 1, minWidth: '180px' }}
                disabled={isSharing}
              />
              <select
                value={targetPermission}
                onChange={(e) => setTargetPermission(e.target.value as 'READ' | 'EDIT')}
                className="form-select"
                style={{ width: 'auto', minWidth: '150px' }}
                disabled={isSharing}
              >
                <option value="READ">Chỉ xem (READ)</option>
                <option value="EDIT">Xem & Sửa (EDIT)</option>
              </select>
              <button
                type="submit"
                disabled={isSharing || !targetUsername.trim()}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
              >
                {isSharing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                <span>Chia sẻ</span>
              </button>
            </div>
          </form>

          {/* Section 3: Shared Users List */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <label className="form-label" style={{ margin: 0 }}>
                Danh sách người dùng đã được chia sẻ
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {permissionsData?.permissions.length || 0} người
              </span>
            </div>

            {isLoading ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Đang tải danh sách quyền...</p>
              </div>
            ) : permissionsData && permissionsData.permissions.length > 0 ? (
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                {permissionsData.permissions.map((p, idx) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderBottom:
                        idx < permissionsData.permissions.length - 1
                          ? '1px solid var(--color-border)'
                          : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary-subtle)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                          {p.username}
                          {p.fullName && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.4rem', fontWeight: 400 }}>
                              ({p.fullName})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Cấp ngày: {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span
                        className={`ent-badge ${
                          p.permission === 'EDIT' ? 'ent-badge--warning' : 'ent-badge--info'
                        }`}
                      >
                        {p.permission === 'EDIT' ? 'Xem & Sửa' : 'Chỉ xem'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRevokeTarget({ userId: p.userId, username: p.username })}
                        disabled={revokingUserId === p.userId}
                        title="Thu hồi quyền"
                        className="btn-icon"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        {revokingUserId === p.userId ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  border: '1px dashed var(--color-border)',
                  borderRadius: '10px',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Users size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Chưa có người dùng nào được cấp quyền riêng biệt.
                </p>
              </div>
            )}
          </div>
        </div>
      </EnterpriseModal>

      {revokeTarget && (
        <ConfirmationModal
          isOpen={Boolean(revokeTarget)}
          onClose={() => setRevokeTarget(null)}
          onConfirm={handleRevokeConfirm}
          title="Xác nhận thu hồi quyền"
          message={`Bạn có chắc chắn muốn thu hồi quyền truy cập tài liệu của người dùng "${revokeTarget.username}" không?`}
          confirmLabel="Thu hồi quyền"
          cancelLabel="Hủy"
          variant="danger"
          isLoading={revokingUserId === revokeTarget.userId}
        />
      )}
    </>
  );
};
