import React, { useState } from 'react';
import { X, BookmarkPlus, Loader2 } from 'lucide-react';
import { savedSearchApi, SavedSearchItem } from '../api/savedSearchApi';

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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <BookmarkPlus size={20} className="text-primary" />
            <h3 id="save-search-modal-title">Lưu bộ lọc tìm kiếm (US-07)</h3>
          </div>
          <button
            type="button"
            className="btn-icon-close"
            onClick={onClose}
            title="Đóng"
            id="close-save-search-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="search-condition-preview-box">
              <span className="preview-label">Điều kiện lưu trữ:</span>
              <div className="preview-tags">
                <span className="badge badge-info">
                  Từ khóa: <strong>{currentQuery.trim() || '(Tất cả)'}</strong>
                </span>
                <span className="badge badge-info">
                  Phân loại: <strong>{currentDocumentType || '(Tất cả)'}</strong>
                </span>
                <span className="badge badge-info">
                  Phạm vi: <strong>{currentSearchScope === 'CONTENT' ? 'Nội dung tài liệu' : currentSearchScope === 'ALL' ? 'Tất cả' : 'Thông tin tài liệu'}</strong>
                </span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="saved-search-name-input">
                Tên bộ lọc tìm kiếm <span className="text-danger">*</span>
              </label>
              <input
                id="saved-search-name-input"
                type="text"
                className="form-control"
                placeholder="Ví dụ: Báo cáo kỹ thuật, Hợp đồng quý 3..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
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
              id="confirm-save-search-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <BookmarkPlus size={16} />
                  <span>Lưu bộ lọc</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
