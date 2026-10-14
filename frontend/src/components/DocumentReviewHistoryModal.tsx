import React, { useState, useEffect, useCallback } from 'react';
import { DocumentItem, ReviewItem, documentApi } from '../api/documentApi';
import { X, CheckCircle2, Clock, AlertTriangle, FileText, Loader2, ShieldCheck, User } from 'lucide-react';

interface DocumentReviewHistoryModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentReviewHistoryModal: React.FC<DocumentReviewHistoryModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!document) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await documentApi.getDocumentReviewHistory(document.id);
      setHistory(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải lịch sử xét duyệt');
    } finally {
      setIsLoading(false);
    }
  }, [document]);

  useEffect(() => {
    if (isOpen && document) {
      fetchHistory();
    }
  }, [isOpen, document, fetchHistory]);

  if (!isOpen || !document) return null;

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
          <span className="badge-review badge-approved" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0'
          }}>
            <CheckCircle2 size={12} /> Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="badge-review badge-rejected" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca'
          }}>
            <AlertTriangle size={12} /> Bị từ chối
          </span>
        );
      case 'PENDING':
        return (
          <span className="badge-review badge-pending" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a'
          }}>
            <Clock size={12} /> Chờ duyệt
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="badge-review badge-superseded" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0'
          }}>
            Đã thay thế
          </span>
        );
      default:
        return <span style={{ fontSize: '0.75rem' }}>{status}</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              backgroundColor: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                Lịch sử xét duyệt tài liệu
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                {document.title} (Phiên bản hiện tại: v{document.currentVersionNumber || 1})
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title="Đóng"
            id="close-review-history-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Đang tải lịch sử xét duyệt...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem',
                color: 'var(--color-text-muted)'
              }}>
                <FileText size={24} />
              </div>
              <h4 style={{ margin: '0 0 0.4rem', color: 'var(--color-text-main)', fontSize: '1rem' }}>
                Chưa có lượt xét duyệt nào
              </h4>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Tài liệu này chưa từng được gửi xét duyệt hoặc chưa có quyết định phê duyệt/từ chối.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '85px' }}>Phiên bản</th>
                    <th style={{ width: '120px' }}>Trạng thái</th>
                    <th>Người gửi & Ngày gửi</th>
                    <th>Người duyệt & Ngày duyệt</th>
                    <th>Nhận xét / Lý do</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((rev) => (
                    <tr key={rev.reviewId}>
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
                          v{rev.versionNumber}
                        </span>
                      </td>
                      <td>{getStatusBadge(rev.status)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <User size={12} className="text-muted" /> {rev.submittedBy}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {formatDate(rev.submittedAt)}
                          </span>
                        </div>
                      </td>
                      <td>
                        {rev.reviewedBy ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <ShieldCheck size={12} style={{ color: '#166534' }} /> {rev.reviewedBy}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {formatDate(rev.reviewedAt)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>Chưa duyệt</span>
                        )}
                      </td>
                      <td>
                        {rev.reviewComment ? (
                          <span style={{ color: 'var(--color-text-main)', wordBreak: 'break-word' }}>
                            {rev.reviewComment}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Không có</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            id="close-review-history-footer-btn"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
