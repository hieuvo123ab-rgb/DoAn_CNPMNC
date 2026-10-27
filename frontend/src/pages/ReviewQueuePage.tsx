import React, { useState, useEffect, useCallback } from 'react';
import { ReviewItem, documentApi } from '../api/documentApi';
import { Navbar } from '../components/Navbar';
import { PreviewModal } from '../components/PreviewModal';
import { EnterpriseModal } from '../components/common/EnterpriseModal';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  User,
  X
} from 'lucide-react';

export const ReviewQueuePage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<{ id: number; title: string; originalFileName: string; customUrl?: string; customType?: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Approve Modal state
  const [approveReviewItem, setApproveReviewItem] = useState<ReviewItem | null>(null);
  const [approveComment, setApproveComment] = useState<string>('');
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Reject Modal state
  const [rejectReviewItem, setRejectReviewItem] = useState<ReviewItem | null>(null);
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
      const data = await documentApi.getAdminReviewQueue(params);
      setReviews(data);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể tải hàng đợi xét duyệt'
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handlePreview = async (item: ReviewItem) => {
    try {
      const { url, contentType } = await documentApi.previewReviewVersion(item.reviewId);
      setPreviewDoc({
        id: item.documentId,
        title: `${item.documentTitle || 'Tài liệu'} (v${item.versionNumber})`,
        originalFileName: item.originalFileName || 'document.pdf',
        customUrl: url,
        customType: contentType,
      });
      setIsPreviewOpen(true);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể tải bản xem trước của phiên bản gửi duyệt'
      });
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveReviewItem) return;
    try {
      setIsApproving(true);
      await documentApi.approveReview(approveReviewItem.reviewId, approveComment);
      setNotification({
        type: 'success',
        text: `Đã phê duyệt tài liệu #${approveReviewItem.documentId} phiên bản v${approveReviewItem.versionNumber} thành công!`
      });
      setApproveReviewItem(null);
      setApproveComment('');
      fetchQueue();
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Lỗi khi phê duyệt tài liệu'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReviewItem) return;
    if (!rejectComment.trim()) {
      setRejectError('Lý do từ chối là bắt buộc và không được để trống.');
      return;
    }
    try {
      setIsRejecting(true);
      setRejectError(null);
      await documentApi.rejectReview(rejectReviewItem.reviewId, rejectComment.trim());
      setNotification({
        type: 'success',
        text: `Đã từ chối tài liệu #${rejectReviewItem.documentId} phiên bản v${rejectReviewItem.versionNumber}.`
      });
      setRejectReviewItem(null);
      setRejectComment('');
      fetchQueue();
    } catch (err: any) {
      setRejectError(err?.response?.data?.message || 'Lỗi khi từ chối tài liệu');
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.documentTitle && r.documentTitle.toLowerCase().includes(term)) ||
      (r.originalFileName && r.originalFileName.toLowerCase().includes(term)) ||
      (r.submittedBy && r.submittedBy.toLowerCase().includes(term)) ||
      r.documentId.toString().includes(term)
    );
  });

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="ent-badge ent-badge--success">
            <CheckCircle size={12} /> Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="ent-badge ent-badge--danger">
            <AlertTriangle size={12} /> Bị từ chối
          </span>
        );
      case 'PENDING':
        return (
          <span className="ent-badge ent-badge--warning">
            <Clock size={12} /> Chờ duyệt
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="ent-badge ent-badge--neutral">
            Đã thay thế
          </span>
        );
      default:
        return <span className="ent-badge ent-badge--neutral">{status}</span>;
    }
  };

  return (
    <div className="layout-root">
      <Navbar currentView="review-queue" />

      <main className="main-content" style={{ padding: '1.75rem 2rem' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                backgroundColor: '#eff6ff', color: '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                  Hàng đợi xét duyệt tài liệu
                </h2>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  Phê duyệt hoặc từ chối các phiên bản tài liệu do người dùng gửi duyệt
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchQueue()}
            disabled={isLoading}
            id="refresh-queue-btn"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'}`}
            style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>{notification.text}</span>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('PENDING')}
              id="filter-pending-btn"
            >
              <Clock size={13} />
              <span>Chờ duyệt</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('APPROVED')}
              id="filter-approved-btn"
            >
              <CheckCircle size={13} />
              <span>Đã duyệt</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'REJECTED' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('REJECTED')}
              id="filter-rejected-btn"
            >
              <XCircle size={13} />
              <span>Bị từ chối</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('ALL')}
              id="filter-all-btn"
            >
              <span>Tất cả</span>
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo tên tài liệu, người gửi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2rem', height: '34px', fontSize: '0.85rem' }}
              id="search-queue-input"
            />
          </div>
        </div>

        {/* Queue Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Đang tải danh sách hàng đợi...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem',
                color: 'var(--color-text-muted)'
              }}>
                <CheckCircle size={24} style={{ color: '#16a34a' }} />
              </div>
              <h4 style={{ margin: '0 0 0.35rem', color: 'var(--color-text-main)', fontSize: '1.05rem' }}>
                {statusFilter === 'PENDING'
                  ? 'Hàng đợi đang trống — Không có yêu cầu nào cần duyệt!'
                  : 'Không có bản ghi xét duyệt nào'}
              </h4>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Khi người dùng gửi xét duyệt các phiên bản tài liệu mới, yêu cầu sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>ID</th>
                    <th>Tài liệu & Tệp đính kèm</th>
                    <th style={{ width: '90px' }}>Phiên bản</th>
                    <th style={{ width: '150px' }}>Người gửi duyệt</th>
                    <th style={{ width: '150px' }}>Thời gian gửi</th>
                    <th style={{ width: '120px' }}>Trạng thái</th>
                    <th style={{ width: '180px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((item) => {
                    const isPending = item.status === 'PENDING';

                    return (
                      <tr key={item.reviewId} className="doc-row">
                        <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                          #{item.reviewId}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.92rem' }}>
                              {item.documentTitle || `Tài liệu #${item.documentId}`}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FileText size={12} /> {item.originalFileName || '—'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: '#f0f9ff',
                            color: '#0369a1',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            border: '1px solid #bae6fd'
                          }}>
                            v{item.versionNumber}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <User size={13} className="text-muted" /> {item.submittedBy}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                            {formatDate(item.submittedAt)}
                          </span>
                        </td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            {/* Preview exact version */}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handlePreview(item)}
                              title="Xem trước nội dung chính xác của phiên bản gửi duyệt"
                              id={`preview-review-btn-${item.reviewId}`}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                            >
                              <Eye size={13} />
                              <span>Xem</span>
                            </button>

                            {/* Approve Button */}
                            {isPending && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: '#16a34a', color: '#fff', border: 'none',
                                  padding: '0.25rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
                                }}
                                onClick={() => {
                                  setApproveReviewItem(item);
                                  setApproveComment('');
                                }}
                                title="Phê duyệt phiên bản này"
                                id={`approve-review-btn-${item.reviewId}`}
                              >
                                <CheckCircle size={13} />
                                <span>Duyệt</span>
                              </button>
                            )}

                            {/* Reject Button */}
                            {isPending && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: '#dc2626', color: '#fff', border: 'none',
                                  padding: '0.25rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
                                }}
                                onClick={() => {
                                  setRejectReviewItem(item);
                                  setRejectComment('');
                                  setRejectError(null);
                                }}
                                title="Từ chối phiên bản này (yêu cầu nêu lý do)"
                                id={`reject-review-btn-${item.reviewId}`}
                              >
                                <XCircle size={13} />
                                <span>Từ chối</span>
                              </button>
                            )}

                            {!isPending && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                {item.status === 'SUPERSEDED' ? 'Đã bị thay thế' : 'Đã có quyết định'}
                              </span>
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
          document={previewDoc as any}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewDoc(null);
          }}
          onDownload={() => {}}
        />
      )}

      {/* Approve Confirmation Modal */}
      {approveReviewItem && (
        <EnterpriseModal
          isOpen={Boolean(approveReviewItem)}
          onClose={() => setApproveReviewItem(null)}
          title="Xác nhận phê duyệt tài liệu"
          subtitle={`Tài liệu #${approveReviewItem.documentId} — v${approveReviewItem.versionNumber}`}
          icon={<CheckCircle size={20} />}
          size="sm"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setApproveReviewItem(null)}
                disabled={isApproving}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmApprove}
                disabled={isApproving}
                id="confirm-approve-btn"
              >
                {isApproving ? 'Đang duyệt...' : 'Phê duyệt'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
              Bạn có chắc chắn muốn phê duyệt phiên bản <strong>v{approveReviewItem.versionNumber}</strong> của tài liệu <strong>"{approveReviewItem.documentTitle}"</strong>?
            </p>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>
                Ghi chú phê duyệt (Tùy chọn):
              </label>
              <textarea
                className="form-input"
                style={{ minHeight: '80px', height: 'auto', padding: '0.5rem 0.75rem', resize: 'vertical' }}
                rows={3}
                placeholder="Nhập nhận xét hoặc lưu ý khi phê duyệt..."
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                id="approve-comment-input"
              />
            </div>
          </div>
        </EnterpriseModal>
      )}

      {/* Reject Confirmation Modal */}
      {rejectReviewItem && (
        <EnterpriseModal
          isOpen={Boolean(rejectReviewItem)}
          onClose={() => setRejectReviewItem(null)}
          title="Từ chối yêu cầu xét duyệt"
          subtitle={`Tài liệu #${rejectReviewItem.documentId} — v${rejectReviewItem.versionNumber}`}
          icon={<XCircle size={20} />}
          size="sm"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectReviewItem(null)}
                disabled={isRejecting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                id="confirm-reject-btn"
              >
                {isRejecting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
              Từ chối phiên bản <strong>v{rejectReviewItem.versionNumber}</strong> của tài liệu <strong>"{rejectReviewItem.documentTitle}"</strong>.
            </p>

            {rejectError && (
              <div className="ent-alert ent-alert--danger" style={{ margin: 0 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{rejectError}</span>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>
                Lý do từ chối <span style={{ color: 'var(--color-danger)' }}>* (Bắt buộc)</span>:
              </label>
              <textarea
                className="form-input"
                style={{ minHeight: '90px', height: 'auto', padding: '0.5rem 0.75rem', resize: 'vertical' }}
                rows={4}
                placeholder="Nêu rõ lý do cần bổ sung, chỉnh sửa hoặc không đạt yêu cầu..."
                value={rejectComment}
                onChange={(e) => {
                  setRejectComment(e.target.value);
                  if (rejectError) setRejectError(null);
                }}
                id="reject-comment-input"
                required
              />
            </div>
          </div>
        </EnterpriseModal>
      )}
    </div>
  );
};
