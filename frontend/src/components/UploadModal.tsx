import React, { useState, useRef } from 'react';
import { documentApi } from '../api/documentApi';
import { Upload, X, AlertCircle, FileCheck } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('Báo cáo');
  const [accessMode, setAccessMode] = useState<'INTERNAL' | 'PRIVATE'>('INTERNAL');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title.trim()) {
        // Auto-fill title from filename without extension
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên tài liệu (Title)');
      return;
    }
    if (!file) {
      setError('Vui lòng chọn tệp tài liệu cần tải lên');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('documentType', documentType);
      formData.append('accessMode', accessMode);

      await documentApi.uploadDocument(formData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDocumentType('Báo cáo');
      setAccessMode('INTERNAL');
      setFile(null);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi tải lên tài liệu.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Tải Lên Tài Liệu Mới</h3>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="doc-title">
                Tên tài liệu <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="doc-title"
                type="text"
                className="form-input"
                placeholder="Nhập tên tài liệu..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doc-type">
                Loại tài liệu <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                id="doc-type"
                className="form-select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
              >
                <option value="Báo cáo">Báo cáo</option>
                <option value="Hợp đồng">Hợp đồng</option>
                <option value="Hóa đơn">Hóa đơn</option>
                <option value="Quyết định">Quyết định</option>
                <option value="Tài liệu kỹ thuật">Tài liệu kỹ thuật</option>
                <option value="Khác">Tài liệu chung / Khác</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Chế độ truy cập <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="radio"
                    name="accessMode"
                    value="INTERNAL"
                    checked={accessMode === 'INTERNAL'}
                    onChange={() => setAccessMode('INTERNAL')}
                  />
                  <span>Nội bộ (Toàn bộ nhân sự được xem)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="radio"
                    name="accessMode"
                    value="PRIVATE"
                    checked={accessMode === 'PRIVATE'}
                    onChange={() => setAccessMode('PRIVATE')}
                  />
                  <span>Riêng tư (Chỉ người được cấp quyền)</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doc-desc">
                Mô tả tóm tắt
              </label>
              <textarea
                id="doc-desc"
                className="form-textarea"
                rows={3}
                placeholder="Nhập mô tả tóm tắt nội dung tài liệu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Tệp đính kèm <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip"
                id="file-input"
              />
              <div
                className="file-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <FileCheck size={32} color="var(--color-success)" />
                    <p style={{ fontWeight: 600 }}>{file.name}</p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {(file.size / 1024).toFixed(1)} KB — Nhấp để chọn tệp khác
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={32} color="var(--color-primary)" />
                    <p style={{ fontWeight: 500 }}>Nhấp để chọn tệp tài liệu từ máy tính</p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Hỗ trợ PDF, DOCX, XLSX, TXT, Hình ảnh... (Tối đa 20MB)
                    </span>
                  </div>
                )}
              </div>
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
              id="submit-upload-btn"
            >
              {isSubmitting ? 'Đang lưu trữ...' : 'Lưu trữ & Tải lên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
