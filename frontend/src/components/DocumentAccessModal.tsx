import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentItem,
  documentApi,
  DocumentPermissionsResponse,
} from '../api/documentApi';
import {
  X,
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
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể tải danh sách quyền truy cập.';
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
        text: `Đã chuyển chế độ truy cập sang ${newMode === 'INTERNAL' ? 'Nội bộ (INTERNAL)' : 'Riêng tư (PRIVATE)'} thành công.`,
      });
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update access mode:', err);
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi thay đổi chế độ truy cập.';
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
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi chia sẻ tài liệu.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevoke = async (userId: number, username: string) => {
    if (!confirm(`Bạn có chắc chắn muốn thu hồi quyền truy cập của người dùng "${username}"?`)) {
      return;
    }

    try {
      setRevokingUserId(userId);
      setMessage(null);
      await documentApi.revokePermission(document.id, userId);
      setMessage({ type: 'success', text: `Đã thu hồi quyền của người dùng ${username}.` });
      await loadPermissions();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Revoke error:', err);
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi thu hồi quyền.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setRevokingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Quyền truy cập & Chia sẻ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {document.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {message && (
            <div
              className={`p-3.5 rounded-xl flex items-start space-x-3 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 font-medium">{message.text}</span>
            </div>
          )}

          {/* Section 1: Access Mode */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900 dark:text-white">
              Chế độ truy cập tài liệu
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isSavingMode}
                onClick={() => handleUpdateAccessMode('INTERNAL')}
                className={`flex items-start p-4 rounded-xl border text-left transition-all ${
                  accessMode === 'INTERNAL'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Globe className={`w-5 h-5 mr-3 shrink-0 mt-0.5 ${accessMode === 'INTERNAL' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Nội bộ (INTERNAL)
                    {accessMode === 'INTERNAL' && (
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium">Hiện tại</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Mọi người dùng đã xác thực đều có thể xem và tải xuống tài liệu.
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={isSavingMode}
                onClick={() => handleUpdateAccessMode('PRIVATE')}
                className={`flex items-start p-4 rounded-xl border text-left transition-all ${
                  accessMode === 'PRIVATE'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Lock className={`w-5 h-5 mr-3 shrink-0 mt-0.5 ${accessMode === 'PRIVATE' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Riêng tư (PRIVATE)
                    {accessMode === 'PRIVATE' && (
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium">Hiện tại</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Chỉ bạn, Quản trị viên và người dùng được chia sẻ mới truy cập được.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 2: Share with user form */}
          <form onSubmit={handleShare} className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900 dark:text-white">
              Chia sẻ cho người dùng
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nhập tên đăng nhập (username)..."
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
              />
              <select
                value={targetPermission}
                onChange={(e) => setTargetPermission(e.target.value as 'READ' | 'EDIT')}
                className="px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
              >
                <option value="READ">Chỉ xem (READ)</option>
                <option value="EDIT">Xem & Sửa (EDIT)</option>
              </select>
              <button
                type="submit"
                disabled={isSharing || !targetUsername.trim()}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors whitespace-nowrap"
              >
                {isSharing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-1.5" />
                )}
                Chia sẻ
              </button>
            </div>
          </form>

          {/* Section 3: Shared Users List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                Danh sách người dùng đã được chia sẻ
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {permissionsData?.permissions.length || 0} người
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 flex justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : permissionsData && permissionsData.permissions.length > 0 ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
                {permissionsData.permissions.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{p.username}</span>
                          {p.fullName && (
                            <span className="text-xs text-slate-400">({p.fullName})</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          Cấp ngày: {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          p.permission === 'EDIT'
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {p.permission === 'EDIT' ? 'Xem & Sửa' : 'Chỉ xem'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRevoke(p.userId, p.username)}
                        disabled={revokingUserId === p.userId}
                        title="Thu hồi quyền"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        {revokingUserId === p.userId ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chưa có người dùng nào được chia sẻ riêng biệt.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
