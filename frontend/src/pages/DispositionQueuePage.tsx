import React, { useState, useEffect, useCallback } from 'react';
import { DispositionItem, documentApi } from '../api/documentApi';
import { Navbar } from '../components/Navbar';
import { PreviewModal } from '../components/PreviewModal';
import { EnterpriseModal } from '../components/common/EnterpriseModal';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  Loader2,
  X,
  Archive,
  Calendar
} from 'lucide-react';

export const DispositionQueuePage: React.FC = () => {
  const [dispositions, setDispositions] = useState<DispositionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<{ id: number; title: string; originalFileName: string; customUrl?: string; customType?: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Approve Modal state
  const [approveItem, setApproveItem] = useState<DispositionItem | null>(null);
  const [approveComment, setApproveComment] = useState<string>('');
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Reject Modal state
  const [rejectItem, setRejectItem] = useState<DispositionItem | null>(null);
  const [rejectComment, setRejectComment] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  const fetchQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const data = await documentApi.getAdminDispositionQueue(params);
      setDispositions(data);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể tải hàng đợi tiêu hủy hồ sơ'
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleInspect = async (item: DispositionItem) => {
    try {
      const { url, contentType } = await documentApi.previewDocument(item.documentId);
      setPreviewDoc({
        id: item.documentId,
        title: `${item.documentTitle || 'Tài liệu'} (v${item.currentVersion || 1})`,
        originalFileName: 'document.pdf',
        customUrl: url,
        customType: contentType,
      });
      setIsPreviewOpen(true);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể tải bản xem trước của tài liệu'
      });
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveItem) return;
    try {
      setIsApproving(true);
      await documentApi.approveDisposition(approveItem.requestId, approveComment.trim() || undefined);
      setNotification({
        type: 'success',
        text: `Đã phê duyệt tiêu hủy tài liệu #${approveItem.documentId} thành công! Tài liệu đã chuyển sang trạng thái DISPOSED.`
      });
      setApproveItem(null);
      setApproveComment('');
      fetchQueue();
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Lỗi khi phê duyệt tiêu hủy tài liệu'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectItem) return;
    if (!rejectComment.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối yêu cầu tiêu hủy.');
      return;
    }
    try {
      setIsRejecting(true);
      setRejectError(null);
      await documentApi.rejectDisposition(rejectItem.requestId, rejectComment.trim());
      setNotification({
        type: 'success',
        text: `Đã từ chối yêu cầu tiêu hủy #${rejectItem.requestId}. Tài liệu tiếp tục được lưu trữ.`
      });
      setRejectItem(null);
      setRejectComment('');
      fetchQueue();
    } catch (err: any) {
      setRejectError(err?.response?.data?.message || 'Lỗi khi từ chối yêu cầu tiêu hủy');
    } finally {
      setIsRejecting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const filteredDispositions = dispositions.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.documentTitle && item.documentTitle.toLowerCase().includes(term)) ||
      (item.reason && item.reason.toLowerCase().includes(term)) ||
      (item.requestedBy && item.requestedBy.toLowerCase().includes(term)) ||
      String(item.documentId).includes(term) ||
      String(item.requestId).includes(term)
    );
  });

  return (
    <div className="layout-root">
      <Navbar currentView="disposition-queue" />

      <main className="main-content" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Archive size={24} color="#dc2626" />
              <span>Hàng Đợi Tiêu Hủy Tài Liệu</span>
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Quy trình tiêu hủy có kiểm soát (Controlled Disposition Workflow). Tài liệu được xử lý logic sang trạng thái DISPOSED, toàn bộ file và lịch sử vẫn được bảo toàn.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchQueue}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            id="refresh-disposition-queue-btn"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        {notification && (
          <div
            style={{
              padding: '0.85rem 1.2rem',
              borderRadius: '8px',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: notification.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '1.2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(st)}
                id={`filter-disposition-${st.toLowerCase()}-btn`}
              >
                {st === 'PENDING' ? 'Chờ phê duyệt' : st === 'APPROVED' ? 'Đã tiêu hủy' : st === 'REJECTED' ? 'Đã từ chối' : st === 'CANCELLED' ? 'Đã hủy' : 'Tất cả'}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm tài liệu, lý do..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem', width: '100%', fontSize: '0.85rem' }}
              id="search-disposition-queue-input"
            />
          </div>
        </div>

        {/* Disposition Table */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
              <p>Đang tải danh sách yêu cầu tiêu hủy...</p>
            </div>
          ) : filteredDispositions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Clock size={36} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Không có yêu cầu tiêu hủy nào phù hợp.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem', width: '60px' }}>Mã YC</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Tài liệu</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Thời hạn lưu trữ</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Người yêu cầu</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Lý do tiêu hủy</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Điều kiện</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Trạng thái</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right', minWidth: '160px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDispositions.map((item) => {
                    const isPending = item.status === 'PENDING';
                    return (
                      <tr key={item.requestId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#64748b' }}>
                          #{item.requestId}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.documentTitle || `Tài liệu #${item.documentId}`}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Mã TL: #{item.documentId} • Phiên bản: v{item.currentVersion || 1}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
                            <Calendar size={14} color="#64748b" />
                            <span>{item.retentionUntil || 'Chưa đặt'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 500 }}>{item.requestedBy}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(item.requestedAt)}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', maxWidth: '240px' }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={item.reason}>
                            {item.reason}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          {item.legalHold ? (
                            <span className="ent-badge ent-badge--danger">
                              Legal Hold
                            </span>
                          ) : item.eligibleForDisposition ? (
                            <span className="ent-badge ent-badge--success">
                              Đủ điều kiện
                            </span>
                          ) : (
                            <span className="ent-badge ent-badge--warning">
                              Chưa đủ ĐK
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          <span
                            className={
                              item.status === 'APPROVED'
                                ? 'ent-badge ent-badge--danger'
                                : item.status === 'REJECTED' || item.status === 'CANCELLED'
                                ? 'ent-badge ent-badge--neutral'
                                : 'ent-badge ent-badge--warning'
                            }
                          >
                            {item.status === 'PENDING'
                              ? 'Chờ duyệt'
                              : item.status === 'APPROVED'
                              ? 'Đã tiêu hủy'
                              : item.status === 'REJECTED'
                              ? 'Đã từ chối'
                              : 'Đã hủy'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleInspect(item)}
                              title="Xem chi tiết tài liệu"
                              id={`inspect-disposition-${item.requestId}-btn`}
                            >
                              <Eye size={14} />
                              <span>Kiểm tra</span>
                            </button>

                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => setApproveItem(item)}
                                  title="Phê duyệt tiêu hủy (chuyển sang DISPOSED)"
                                  id={`approve-disposition-${item.requestId}-btn`}
                                  style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                                >
                                  <CheckCircle size={14} />
                                  <span>Duyệt</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => {
                                    setRejectItem(item);
                                    setRejectComment('');
                                    setRejectError(null);
                                  }}
                                  title="Từ chối yêu cầu tiêu hủy"
                                  id={`reject-disposition-${item.requestId}-btn`}
                                >
                                  <XCircle size={14} />
                                  <span>Từ chối</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal
          isOpen={isPreviewOpen}
          document={previewDoc as any}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewDoc(null);
          }}
          onDownload={() => {}}
        />
      )}

      {/* Approve Modal */}
      {approveItem && (
        <EnterpriseModal
          isOpen={Boolean(approveItem)}
          onClose={() => setApproveItem(null)}
          preventClose={isApproving}
          title="Phê Duyệt Tiêu Hủy Tài Liệu"
          subtitle={`Tài liệu #${approveItem.documentId} — ${approveItem.documentTitle}`}
          icon={<Archive size={20} />}
          size="sm"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setApproveItem(null)}
                disabled={isApproving}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmApprove}
                disabled={isApproving}
                id="confirm-approve-disposition-btn"
              >
                {isApproving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                <span>Xác nhận tiêu hủy</span>
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ent-alert ent-alert--danger" style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
              <div>
                <strong>Lưu ý quan trọng:</strong> Phê duyệt sẽ chuyển tài liệu sang trạng thái <strong>DISPOSED</strong>. Tệp vật lý và lịch sử kiểm toán được lưu trữ theo quy định bảo lưu.
              </div>
            </div>

            <div style={{ fontSize: '0.88rem' }}>
              <p style={{ margin: '0 0 0.35rem 0', color: 'var(--color-text-main)' }}>
                Tài liệu: <strong>{approveItem.documentTitle}</strong> (#{approveItem.documentId})
              </p>
              <p style={{ margin: '0 0 0.35rem 0', color: 'var(--color-text-muted)' }}>
                Lý do yêu cầu: <em>"{approveItem.reason}"</em>
              </p>
              <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                Người yêu cầu: <strong>{approveItem.requestedBy}</strong> ({formatDate(approveItem.requestedAt)})
              </p>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.825rem' }}>
                Ghi chú phê duyệt (Tùy chọn):
              </label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Nhập ghi chú phê duyệt tiêu hủy..."
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                style={{ minHeight: '80px', height: 'auto', padding: '0.5rem 0.75rem', resize: 'vertical' }}
                id="approve-disposition-comment-input"
              />
            </div>
          </div>
        </EnterpriseModal>
      )}

      {/* Reject Modal */}
      {rejectItem && (
        <EnterpriseModal
          isOpen={Boolean(rejectItem)}
          onClose={() => setRejectItem(null)}
          preventClose={isRejecting}
          title="Từ Chối Yêu Cầu Tiêu Hủy"
          subtitle={`Tài liệu #${rejectItem.documentId} — ${rejectItem.documentTitle}`}
          icon={<XCircle size={20} />}
          size="sm"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectItem(null)}
                disabled={isRejecting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                id="confirm-reject-disposition-btn"
              >
                {isRejecting ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                <span>Xác nhận từ chối</span>
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rejectError && (
              <div className="ent-alert ent-alert--danger" style={{ margin: 0 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{rejectError}</span>
              </div>
            )}

            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
              Từ chối yêu cầu tiêu hủy tài liệu <strong>{rejectItem.documentTitle}</strong> (#{rejectItem.documentId}).
              Tài liệu sẽ tiếp tục duy trì ở trạng thái lưu trữ (ARCHIVED).
            </p>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.825rem' }}>
                Lý do từ chối (Bắt buộc):
              </label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Nhập lý do từ chối yêu cầu tiêu hủy..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                style={{ minHeight: '80px', height: 'auto', padding: '0.5rem 0.75rem', resize: 'vertical' }}
                id="reject-disposition-comment-input"
                required
              />
            </div>
          </div>
        </EnterpriseModal>
      )}
    </div>
  );
};
