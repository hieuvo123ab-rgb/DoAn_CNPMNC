import React, { useState, useEffect, useCallback } from 'react';
import { DocumentItem, DispositionItem, documentApi } from '../api/documentApi';
import { useAuth } from '../context/AuthContext';
import {
  Archive,
  RotateCcw,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
  Clock,
  ShieldCheck,
  Send,
  Ban,
  FileSpreadsheet
} from 'lucide-react';
import { EnterpriseModal } from './common/EnterpriseModal';

interface DocumentLifecycleModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentLifecycleModal: React.FC<DocumentLifecycleModalProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [retentionDate, setRetentionDate] = useState<string>('');
  const [legalHoldReason, setLegalHoldReason] = useState<string>('');

  // Phase 9: Disposition state
  const [dispositions, setDispositions] = useState<DispositionItem[]>([]);
  const [showRequestForm, setShowRequestForm] = useState<boolean>(false);
  const [dispositionReason, setDispositionReason] = useState<string>('');
  const [dispositionLoading, setDispositionLoading] = useState<boolean>(false);

  const fetchDispositions = useCallback(async () => {
    if (!document) return;
    try {
      const data = await documentApi.getDispositionHistory(document.id);
      setDispositions(data);
    } catch {
      // Ignored for non-owners/non-admins
    }
  }, [document]);

  useEffect(() => {
    if (document && isOpen) {
      setRetentionDate(document.retentionUntil || '');
      setLegalHoldReason(document.legalHoldReason || '');
      setMessage(null);
      setShowRequestForm(false);
      setDispositionReason('');
      fetchDispositions();
    }
  }, [document, isOpen, fetchDispositions]);

  if (!isOpen || !document) return null;

  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isOwner = user?.username === document.createdBy;
  const canManageLifecycle = isAdmin || isOwner;
  const isArchived = document.lifecycleStatus === 'ARCHIVED';
  const isDisposed = document.lifecycleStatus === 'DISPOSED';
  const currentReviewStatus = document.currentReviewStatus || document.reviewStatus || 'DRAFT';
  const isApproved = currentReviewStatus === 'APPROVED';

  const pendingDisposition = dispositions.find(d => d.status === 'PENDING');

  // Handle Archive
  const handleArchive = async () => {
    if (!canManageLifecycle) return;
    if (!isApproved) {
      setMessage({ type: 'error', text: 'Chỉ tài liệu có phiên bản hiện tại ĐÃ PHÊ DUYỆT mới có thể lưu trữ.' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await documentApi.archiveDocument(document.id, retentionDate ? { retentionUntil: retentionDate } : undefined);
      setMessage({ type: 'success', text: 'Lưu trữ tài liệu thành công! Tài liệu đã chuyển sang chế độ chỉ đọc.' });
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể lưu trữ tài liệu.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Unarchive
  const handleUnarchive = async () => {
    if (!canManageLifecycle) return;
    try {
      setLoading(true);
      setMessage(null);
      await documentApi.unarchiveDocument(document.id);
      setMessage({ type: 'success', text: 'Khôi phục tài liệu về trạng thái hoạt động thành công!' });
      fetchDispositions();
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể khôi phục tài liệu.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Retention Update (Admin only)
  const handleUpdateRetention = async () => {
    if (!isAdmin) return;
    if (!retentionDate) {
      setMessage({ type: 'error', text: 'Vui lòng chọn ngày thời hạn lưu trữ hợp lệ.' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await documentApi.updateRetention(document.id, retentionDate);
      setMessage({ type: 'success', text: 'Cập nhật thời hạn lưu trữ (retentionUntil) thành công!' });
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể cập nhật thời hạn lưu trữ.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Legal Hold Toggle (Admin only)
  const handleToggleLegalHold = async (enabled: boolean) => {
    if (!isAdmin) return;
    if (enabled && !legalHoldReason.trim()) {
      setMessage({ type: 'error', text: 'Bắt buộc nhập lý do khi kích hoạt Legal Hold.' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await documentApi.updateLegalHold(document.id, enabled, enabled ? legalHoldReason.trim() : undefined);
      setMessage({
        type: 'success',
        text: enabled ? 'Kích hoạt lệnh Legal Hold thành công!' : 'Đã giải phóng Legal Hold cho tài liệu.',
      });
      if (!enabled) setLegalHoldReason('');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể thay đổi trạng thái Legal Hold.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Phase 9: Request Disposition
  const handleRequestDisposition = async () => {
    if (!isArchived || !canManageLifecycle) return;
    if (!dispositionReason.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập lý do yêu cầu tiêu hủy.' });
      return;
    }

    try {
      setDispositionLoading(true);
      setMessage(null);
      await documentApi.requestDisposition(document.id, dispositionReason.trim());
      setMessage({ type: 'success', text: 'Đã gửi yêu cầu tiêu hủy thành công! Chờ Quản trị viên xét duyệt.' });
      setShowRequestForm(false);
      setDispositionReason('');
      fetchDispositions();
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể gửi yêu cầu tiêu hủy.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setDispositionLoading(false);
    }
  };

  // Handle Phase 9: Cancel Disposition Request
  const handleCancelDisposition = async () => {
    if (!pendingDisposition || !canManageLifecycle) return;
    try {
      setDispositionLoading(true);
      setMessage(null);
      await documentApi.cancelDisposition(document.id);
      setMessage({ type: 'success', text: 'Đã hủy yêu cầu tiêu hủy tài liệu thành công.' });
      fetchDispositions();
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể hủy yêu cầu tiêu hủy.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setDispositionLoading(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('vi-VN');
    } catch {
      return iso;
    }
  };

  return (
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={loading || dispositionLoading}
      title="Quản Lý Vòng Đời & Tiêu Hủy"
      subtitle={`Tài liệu #${document.id} — ${document.title}`}
      icon={<Archive size={20} className="text-primary" />}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} id="close-lifecycle-modal-footer-btn">
            Đóng
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {message && (
          <div
            className={`ent-alert ${message.type === 'success' ? 'ent-alert--success' : 'ent-alert--danger'}`}
            style={{ margin: 0 }}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Document Overview */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-card-muted)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <FileText size={18} className="text-primary" />
            <strong style={{ fontSize: '0.975rem', color: 'var(--color-text-main)' }}>{document.title}</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Phiên bản hiện tại: </span>
              <strong>v{document.currentVersionNumber || 1}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Trạng thái xét duyệt: </span>
              <span className={`ent-badge ${isApproved ? 'ent-badge--success' : currentReviewStatus === 'PENDING' ? 'ent-badge--warning' : currentReviewStatus === 'REJECTED' ? 'ent-badge--danger' : 'ent-badge--neutral'}`}>
                {isApproved ? 'Đã duyệt (APPROVED)' : currentReviewStatus === 'PENDING' ? 'Chờ duyệt (PENDING)' : currentReviewStatus === 'REJECTED' ? 'Bị từ chối (REJECTED)' : 'Bản nháp (DRAFT)'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Trạng thái vòng đời: </span>
              <span className={`ent-badge ${isDisposed ? 'ent-badge--danger' : isArchived ? 'ent-badge--warning' : 'ent-badge--primary'}`}>
                {isDisposed ? 'Đã tiêu hủy (DISPOSED)' : isArchived ? 'Đã lưu trữ (ARCHIVED)' : 'Đang hoạt động (ACTIVE)'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Legal Hold: </span>
              <span className={`ent-badge ${document.legalHold ? 'ent-badge--danger' : 'ent-badge--success'}`}>
                {document.legalHold ? 'ĐANG BẬT (HOLD ACTIVE)' : 'TẮT'}
              </span>
            </div>
          </div>

          {isArchived && (
            <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Lưu trữ bởi: <strong>{document.archivedBy || '—'}</strong> vào lúc: <strong>{formatDate(document.archivedAt)}</strong>
            </div>
          )}

          {isDisposed && (
            <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
              Tiêu hủy bởi: <strong>{document.disposedBy || 'Admin'}</strong> vào lúc: <strong>{formatDate(document.disposedAt)}</strong>
            </div>
          )}
        </div>

        {/* DISPOSED Warning Banner */}
        {isDisposed && (
          <div
            className="ent-alert ent-alert--danger"
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Archive size={24} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>Hồ sơ đã kết thúc vòng đời nghiệp vụ (DISPOSED)</strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem' }}>
                Tài liệu đã được tiêu hủy có kiểm soát. File vật lý, phiên bản lịch sử và nhật ký kiểm toán được lưu trữ bảo toàn phục vụ thanh tra và chứng thực.
              </p>
            </div>
          </div>
        )}

        {/* Disposition Eligibility Indicator (for ARCHIVED docs) */}
        {!isDisposed && (
          <div
            style={{
              padding: '0.9rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-card-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)' }}>
                <Clock size={16} style={{ color: document.eligibleForDisposition ? 'var(--color-success)' : 'var(--color-text-muted)' }} />
                <span>Điều kiện xử lý tiêu hủy (Disposition Eligibility):</span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {document.retentionUntil ? `Thời hạn lưu trữ: ${document.retentionUntil}` : 'Chưa đặt thời hạn lưu trữ'}
                {' • '}
                (Không tự động xóa; chỉ sẵn sàng khi hết hạn lưu trữ & không có Legal Hold)
              </p>
            </div>
            <div>
              <span className={`ent-badge ${document.eligibleForDisposition ? 'ent-badge--success' : 'ent-badge--neutral'}`}>
                {document.eligibleForDisposition ? 'ĐỦ ĐIỀU KIỆN (ELIGIBLE)' : 'CHƯA ĐỦ ĐIỀU KIỆN'}
              </span>
            </div>
          </div>
        )}

        {/* Phase 9: Disposition Request & Workflow Actions */}
        {isArchived && canManageLifecycle && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)' }}>
              <Send size={16} className="text-danger" />
              <span>Quy trình tiêu hủy có kiểm soát</span>
            </h4>

            {pendingDisposition ? (
              <div
                className="ent-alert ent-alert--warning"
                style={{ margin: 0, flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}
              >
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} />
                  <span>Đang có yêu cầu tiêu hủy chờ xét duyệt (Mã YC #{pendingDisposition.requestId})</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>
                  Người gửi: <strong>{pendingDisposition.requestedBy}</strong> vào lúc <strong>{formatDate(pendingDisposition.requestedAt)}</strong>
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>
                  Lý do: <em>"{pendingDisposition.reason}"</em>
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={handleCancelDisposition}
                  disabled={dispositionLoading}
                  id="cancel-disposition-request-btn"
                  style={{ marginTop: '0.3rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {dispositionLoading ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                  <span>Hủy yêu cầu tiêu hủy</span>
                </button>
              </div>
            ) : document.eligibleForDisposition ? (
              <div>
                {!showRequestForm ? (
                  <div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.8rem' }}>
                      Tài liệu đã đáp ứng đầy đủ điều kiện tiêu hủy theo chính sách lưu trữ. Bạn có thể gửi yêu cầu tiêu hủy để Quản trị viên xem xét và phê duyệt.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setShowRequestForm(true)}
                      id="open-disposition-request-form-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Archive size={15} />
                      <span>Yêu cầu tiêu hủy</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-card-muted)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <h5 style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                      Yêu cầu xử lý hồ sơ / tiêu hủy tài liệu
                    </h5>
                    <div
                      className="ent-alert ent-alert--danger"
                      style={{ margin: '0 0 0.8rem 0', fontSize: '0.8rem' }}
                    >
                      <span><strong>Xác nhận:</strong> Yêu cầu này sẽ gửi hồ sơ vào hàng đợi xem xét. Tài liệu sẽ không bị xóa vật lý.</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-main)' }}>
                        Lý do yêu cầu tiêu hủy (Bắt buộc):
                      </label>
                      <textarea
                        rows={3}
                        className="form-input"
                        placeholder="Ví dụ: Hết thời hạn lưu trữ theo chính sách quy định của cơ quan..."
                        value={dispositionReason}
                        onChange={(e) => setDispositionReason(e.target.value)}
                        style={{ width: '100%', fontSize: '0.85rem' }}
                        id="disposition-reason-input"
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setShowRequestForm(false);
                          setDispositionReason('');
                        }}
                        disabled={dispositionLoading}
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleRequestDisposition}
                        disabled={dispositionLoading}
                        id="submit-disposition-request-btn"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {dispositionLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        <span>Gửi yêu cầu tiêu hủy</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Tài liệu hiện chưa đủ điều kiện tiêu hủy (chưa hết hạn lưu trữ hoặc đang có Legal Hold).
              </p>
            )}
          </div>
        )}

        {/* Section: Archive / Unarchive (disabled if DISPOSED) */}
        {!isDisposed && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)' }}>
              <Archive size={16} />
              <span>Chuyển đổi trạng thái lưu trữ</span>
            </h4>

            {!isArchived ? (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.8rem' }}>
                  Lưu trữ tài liệu biến tài liệu thành bản ghi kinh doanh chỉ đọc (Read-only business record).
                  Tất cả thao tác sửa đổi metadata, tải lên phiên bản mới, gửi duyệt và phân quyền sẽ bị khóa.
                </p>

                {!isApproved ? (
                  <div className="ent-alert ent-alert--warning" style={{ margin: 0 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>Phiên bản hiện tại chưa được phê duyệt. Vui lòng gửi duyệt và chờ phê duyệt trước khi lưu trữ.</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '0.8rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-main)' }}>
                        Thời hạn lưu trữ tối thiểu (Retention Until - Tùy chọn):
                      </label>
                      <input
                        type="date"
                        className="form-input"
                        value={retentionDate}
                        onChange={(e) => setRetentionDate(e.target.value)}
                        style={{ maxWidth: '240px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        id="archive-retention-input"
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.2rem' }}>
                        Trước ngày này, tài liệu không được coi là đủ điều kiện tiêu hủy.
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={loading || !canManageLifecycle}
                      onClick={handleArchive}
                      id="confirm-archive-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {loading ? <Loader2 size={15} className="animate-spin" /> : <Archive size={15} />}
                      <span>Xác nhận lưu trữ tài liệu</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.8rem' }}>
                  Tài liệu hiện đang được lưu trữ (ARCHIVED). Khi khôi phục về trạng thái hoạt động (ACTIVE),
                  tài liệu sẽ trở lại chế độ chỉnh sửa bình thường theo phân quyền ACL.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={loading || !canManageLifecycle}
                  onClick={handleUnarchive}
                  id="confirm-unarchive-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                  <span>Khôi phục trạng thái hoạt động (Unarchive)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section: Admin Retention Management (hidden if DISPOSED) */}
        {isAdmin && isArchived && !isDisposed && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)' }}>
              <Calendar size={16} />
              <span>Quản trị thời hạn lưu trữ (Admin only)</span>
            </h4>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-main)' }}>
                  Cập nhật ngày Retention Until:
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={retentionDate}
                  onChange={(e) => setRetentionDate(e.target.value)}
                  style={{ maxWidth: '240px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  id="update-retention-input"
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={handleUpdateRetention}
                id="update-retention-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Calendar size={15} />}
                <span>Lưu thời hạn mới</span>
              </button>
            </div>
          </div>
        )}

        {/* Section: Admin Legal Hold Management (hidden if DISPOSED) */}
        {isAdmin && !isDisposed && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)' }}>
              <ShieldAlert size={16} className="text-danger" />
              <span>Quản trị Legal Hold (Admin only)</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.8rem' }}>
              Legal Hold dùng để bảo lưu pháp lý tài liệu và ngăn chặn tuyệt đối việc đánh dấu đủ điều kiện tiêu hủy.
            </p>

            {document.legalHold ? (
              <div className="ent-alert ent-alert--danger" style={{ margin: '0 0 0.8rem 0', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Lý do áp dụng: {document.legalHoldReason || 'Không có lý do'}
                </div>
                <div style={{ fontSize: '0.78rem' }}>
                  Thiết lập bởi: <strong>{document.legalHoldSetBy || 'Admin'}</strong> vào ngày <strong>{formatDate(document.legalHoldSetAt)}</strong>
                </div>
                <div style={{ marginTop: '0.6rem' }}>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={loading}
                    onClick={() => handleToggleLegalHold(false)}
                    id="release-legal-hold-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                    <span>Giải phóng Legal Hold (Release)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-main)' }}>
                  Lý do thiết lập Legal Hold (Bắt buộc):
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Nhập lý do áp dụng lệnh bảo lưu pháp lý..."
                  value={legalHoldReason}
                  onChange={(e) => setLegalHoldReason(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', marginBottom: '0.6rem' }}
                  id="legal-hold-reason-input"
                />
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={loading}
                  onClick={() => handleToggleLegalHold(true)}
                  id="enable-legal-hold-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldAlert size={15} />}
                  <span>Kích hoạt Legal Hold</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Disposition History Table */}
        {dispositions.length > 0 && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-card-muted)',
            }}
          >
            <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)' }}>
              <FileSpreadsheet size={16} className="text-primary" />
              <span>Lịch sử xử lý tiêu hủy ({dispositions.length} bản ghi)</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {dispositions.map((d) => (
                <div
                  key={d.requestId}
                  style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <strong style={{ color: 'var(--color-text-main)' }}>Yêu cầu #{d.requestId}</strong>
                    <span className={`ent-badge ${d.status === 'APPROVED' ? 'ent-badge--danger' : d.status === 'PENDING' ? 'ent-badge--warning' : d.status === 'REJECTED' ? 'ent-badge--neutral' : 'ent-badge--secondary'}`}>
                      {d.status === 'PENDING' ? 'Chờ duyệt' : d.status === 'APPROVED' ? 'Đã phê duyệt' : d.status === 'REJECTED' ? 'Bị từ chối' : 'Đã hủy'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                    Lý do: <em>"{d.reason}"</em>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                    Gửi bởi: <strong>{d.requestedBy}</strong> ({formatDate(d.requestedAt)})
                    {d.reviewedBy && (
                      <span> • Xử lý bởi: <strong>{d.reviewedBy}</strong> ({formatDate(d.reviewedAt)})</span>
                    )}
                    {d.reviewComment && (
                      <div>Ý kiến: <em>"{d.reviewComment}"</em></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </EnterpriseModal>
  );
};
