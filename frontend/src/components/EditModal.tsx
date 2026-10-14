import React, { useState, useEffect } from 'react';
import { DocumentItem, documentApi } from '../api/documentApi';
import { X, Save, Edit3, Loader2 } from 'lucide-react';

interface EditModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DOCUMENT_TYPES = [
  'Báo cáo',
  'Hợp đồng',
  'Hóa đơn',
  'Quyết định',
  'Công văn',
  'Biên bản',
  'Khác',
];

export const EditModal: React.FC<EditModalProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('Báo cáo');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document && isOpen) {
      setTitle(document.title || '');
      setDescription(document.description || '');
      setDocumentType(document.documentType || 'Báo cáo');
      setError(null);
    }
  }, [document, isOpen]);

  if (!isOpen || !document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Tiêu đề tài liệu không được để trống.');
      return;
    }
    if (!documentType.trim()) {
      setError('Loại tài liệu không được để trống.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await documentApi.updateDocument(document.id, {
        title: title.trim(),
        description: description.trim(),
        documentType: documentType.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Update document error:', err);
      const msg = err.response?.data?.message || 'Không thể cập nhật tài liệu. Vui lòng kiểm tra quyền hạn.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Edit3 size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Cập Nhật Thông Tin Tài Liệu</h3>
          </div>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="edit-title-input">
                Tiêu đề tài liệu <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề tài liệu..."
                required
                disabled={isSubmitting}
                id="edit-title-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-type-select">
                Phân loại tài liệu (US-14) <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                className="form-select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                disabled={isSubmitting}
                id="edit-type-select"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-desc-input">
                Trích yếu / Mô tả
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tóm tắt ngắn gọn nội dung tài liệu..."
                disabled={isSubmitting}
                id="edit-desc-input"
              />
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
              <p style={{ margin: 0 }}><strong>Tệp đính kèm:</strong> {document.originalFileName}</p>
              <p style={{ margin: '0.25rem 0 0 0' }}><strong>Người tạo:</strong> {document.createdBy}</p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} id="save-edit-btn">
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
