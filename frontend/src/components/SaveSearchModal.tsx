import React, { useState } from 'react';
import { BookmarkPlus, Loader2 } from 'lucide-react';
import { savedSearchApi, SavedSearchItem } from '../api/savedSearchApi';
import { EnterpriseModal } from './common/EnterpriseModal';

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuery: string;
  currentDocumentType: string;
  currentSearchScope?: 'METADATA' | 'CONTENT' | 'ALL' | string;
  onSaved: (saved: SavedSearchItem) => void;
}

export const SaveSearchModal: React.FC<SaveSearchModalProps> = ({
  isOpen,
  onClose,
  currentQuery,
  currentDocumentType,
  currentSearchScope,
  onSaved,
}) => {
  const [name, setName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên bộ lọc tìm kiếm.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const saved = await savedSearchApi.createSavedSearch({
        name: name.trim(),
        query: currentQuery.trim() || undefined,
        documentType: currentDocumentType || undefined,
        searchScope: currentSearchScope || 'METADATA',
      });
      onSaved(saved);
      setName('');
      onClose();
    } catch (err: any) {
      console.error('Save search error:', err);
      setError(err.response?.data?.message || 'Không thể lưu bộ lọc tìm kiếm. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Lưu bộ lọc tìm kiếm"
      subtitle="Lưu lại điều kiện lọc để tái sử dụng nhanh chóng"
      icon={<BookmarkPlus size={20} />}
      size="sm"
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            id="confirm-save-search-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <BookmarkPlus size={15} />
                <span>Lưu bộ lọc</span>
              </>
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div className="ent-alert ent-alert--danger" style={{ margin: 0 }}>
            <span>{error}</span>
          </div>
        )}

        <div
          style={{
            padding: '0.85rem',
            borderRadius: '8px',
            backgroundColor: 'var(--color-card-muted)',
            border: '1px solid var(--color-border)',
            fontSize: '0.825rem',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--color-text-main)', display: 'block', marginBottom: '0.4rem' }}>
            Điều kiện lưu trữ:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span className="ent-badge ent-badge--info">
              Từ khóa: <strong>{currentQuery.trim() || '(Tất cả)'}</strong>
            </span>
            <span className="ent-badge ent-badge--info">
              Phân loại: <strong>{currentDocumentType || '(Tất cả)'}</strong>
            </span>
            <span className="ent-badge ent-badge--info">
              Phạm vi:{' '}
              <strong>
                {currentSearchScope === 'CONTENT'
                  ? 'Nội dung tài liệu'
                  : currentSearchScope === 'ALL'
                  ? 'Tất cả'
                  : 'Thông tin tài liệu'}
              </strong>
            </span>
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="saved-search-name-input">
            Tên bộ lọc tìm kiếm <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            id="saved-search-name-input"
            type="text"
            className="form-input"
            placeholder="Ví dụ: Báo cáo kỹ thuật, Hợp đồng quý 3..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            disabled={isSubmitting}
          />
        </div>
      </form>
    </EnterpriseModal>
  );
};
