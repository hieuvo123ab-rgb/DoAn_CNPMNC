import React, { useState, useEffect } from 'react';
import { DocumentItem, documentApi } from '../api/documentApi';
import { Save, Edit3, Loader2 } from 'lucide-react';
import { EnterpriseModal } from './common/EnterpriseModal';

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
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={isSubmitting}
      title="Cập Nhật Thông Tin Tài Liệu"
      subtitle={`Tài liệu #${document.id} — ${document.originalFileName}`}
      icon={<Edit3 size={20} />}
      size="md"
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
            disabled={isSubmitting || !title.trim()}
            id="save-document-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Lưu thay đổi</span>
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

        <div className="form-group" style={{ margin: 0 }}>
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

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="edit-type-select">
            Phân loại tài liệu <span style={{ color: 'var(--color-danger)' }}>*</span>
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

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="edit-desc-textarea">
            Mô tả / Trích yếu nội dung
          </label>
          <textarea
            className="form-input"
            style={{ minHeight: '90px', height: 'auto', padding: '0.6rem 0.75rem', resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả tóm tắt nội dung tài liệu..."
            rows={3}
            disabled={isSubmitting}
            id="edit-desc-textarea"
          />
        </div>
      </form>
    </EnterpriseModal>
  );
};
