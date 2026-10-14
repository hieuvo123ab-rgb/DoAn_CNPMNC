import React, { useState, useEffect, useCallback } from 'react';
import { DispositionItem, documentApi } from '../api/documentApi';
import { Navbar } from '../components/Navbar';
import { PreviewModal } from '../components/PreviewModal';
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
      <Navbar />

      <main className="main-content" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Archive size={24} color="#dc2626" />
              <span>Hàng Đợi Tiêu Hủy Tài Liệu (Phase 9)</span>
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
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                              Legal Hold
                            </span>
                          ) : item.eligibleForDisposition ? (
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                              Đủ điều kiện
                            </span>
                          ) : (
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                              Chưa đủ ĐK
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              backgroundColor:
                                item.status === 'APPROVED' ? '#fee2e2' : item.status === 'REJECTED' ? '#f1f5f9' : item.status === 'CANCELLED' ? '#e2e8f0' : '#fef3c7',
                              color:
                                item.status === 'APPROVED' ? '#991b1b' : item.status === 'REJECTED' ? '#475569' : item.status === 'CANCELLED' ? '#64748b' : '#92400e',
                              border: `1px solid ${
                                item.status === 'APPROVED' ? '#fecaca' : item.status === 'REJECTED' ? '#cbd5e1' : item.status === 'CANCELLED' ? '#cbd5e1' : '#fde68a'
                              }`,
                            }}
                          >
                            {item.status === 'PENDING' ? 'Chờ duyệt' : item.status === 'APPROVED' ? 'Đã tiêu hủy (DISPOSED)' : item.status === 'REJECTED' ? 'Đã từ chối' : 'Đã hủy'}
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
        <div className="modal-backdrop" style={{ zIndex: 1200 }}>
          <div className="modal-card" style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                <Archive size={20} />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Phê Duyệt Tiêu Hủy Tài Liệu</h3>
              </div>
              <button type="button" className="btn-icon" onClick={() => setApproveItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.2rem' }}>
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#991b1b',
                  lineHeight: '1.4',
                }}
              >
                <strong>Lưu ý quan trọng:</strong> Phê duyệt sẽ chuyển tài liệu sang trạng thái <strong>DISPOSED</strong>. File vật lý và lịch sử vẫn được bảo toàn trong Phase 9.
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
                <p style={{ margin: '0 0 0.4rem 0' }}>
                  Tài liệu: <strong>{approveItem.documentTitle}</strong> (#{approveItem.documentId})
                </p>
                <p style={{ margin: '0 0 0.4rem 0', color: '#64748b' }}>
                  Lý do yêu cầu: <em>"{approveItem.reason}"</em>
                </p>
                <p style={{ margin: 0, color: '#64748b' }}>
                  Người yêu cầu: <strong>{approveItem.requestedBy}</strong> ({formatDate(approveItem.requestedAt)})
                </p>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Ghi chú phê duyệt (Tùy chọn):
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Nhập ghi chú phê duyệt tiêu hủy..."
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  id="approve-disposition-comment-input"
                />
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '0.8rem 1.2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
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
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                {isApproving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                <span>Xác nhận tiêu hủy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectItem && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }}>
          <div className="modal-card" style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
                <XCircle size={20} />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Từ Chối Yêu Cầu Tiêu Hủy</h3>
              </div>
              <button type="button" className="btn-icon" onClick={() => setRejectItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.2rem' }}>
              {rejectError && (
                <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#991b1b', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {rejectError}
                </div>
              )}

              <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#475569' }}>
                Từ chối yêu cầu tiêu hủy tài liệu <strong>{rejectItem.documentTitle}</strong> (#{rejectItem.documentId}).
                Tài liệu sẽ tiếp tục duy trì ở trạng thái lưu trữ (ARCHIVED).
              </p>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Lý do từ chối (Bắt buộc):
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Nhập lý do từ chối yêu cầu tiêu hủy..."
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  id="reject-disposition-comment-input"
                  required
                />
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '0.8rem 1.2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
