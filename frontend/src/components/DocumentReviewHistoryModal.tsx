import React, { useState, useEffect, useCallback } from 'react';
import { DocumentItem, ReviewItem, documentApi } from '../api/documentApi';
import { CheckCircle2, Clock, AlertTriangle, FileText, Loader2, ShieldCheck, User } from 'lucide-react';
import { EnterpriseModal } from './common/EnterpriseModal';

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
          <span className="ent-badge ent-badge--success">
            <CheckCircle2 size={12} /> Đã duyệt
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
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Lịch sử xét duyệt tài liệu"
      subtitle={`${document.title} (Phiên bản: v${document.currentVersionNumber || 1})`}
      icon={<ShieldCheck size={20} />}
      size="lg"
      footer={
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          id="close-review-history-footer-btn"
        >
          Đóng
        </button>
      }
    >
      <div>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Đang tải lịch sử xét duyệt...</p>
          </div>
        ) : error ? (
          <div className="ent-alert ent-alert--danger" style={{ marginBottom: '1rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
            <FileText size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 0.4rem', color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
              Chưa có lượt xét duyệt nào
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Tài liệu này chưa từng được gửi xét duyệt hoặc chưa có quyết định phê duyệt/từ chối.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', fontSize: '0.825rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Phiên bản</th>
                  <th style={{ width: '120px' }}>Trạng thái</th>
                  <th>Người gửi & Ngày gửi</th>
                  <th>Người duyệt & Ngày duyệt</th>
                  <th>Nhận xét / Lý do</th>
                </tr>
              </thead>
              <tbody>
                {history.map((rev) => (
                  <tr key={rev.reviewId}>
                    <td className="td-nowrap">
                      <span className="ent-badge ent-badge--info">
                        v{rev.versionNumber}
                      </span>
                    </td>
                    <td className="td-nowrap">{getStatusBadge(rev.status)}</td>
                    <td className="td-nowrap">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-main)' }}>
                          <User size={13} style={{ color: 'var(--color-text-muted)' }} /> {rev.submittedBy}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {formatDate(rev.submittedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="td-nowrap">
                      {rev.reviewedBy ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-main)' }}>
                            <ShieldCheck size={13} style={{ color: 'var(--color-success)' }} /> {rev.reviewedBy}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {formatDate(rev.reviewedAt)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="cell-wrap">
                      {rev.reviewComment ? (
                        <span style={{ color: 'var(--color-text-main)' }}>
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
    </EnterpriseModal>
  );
};
