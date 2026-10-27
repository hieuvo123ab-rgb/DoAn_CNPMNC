import React, { useState, useRef, useEffect } from 'react';
import { documentApi } from '../api/documentApi';
import { EnterpriseModal } from './common/EnterpriseModal';
import {
  Upload,
  AlertCircle,
  FileCheck,
  AlertTriangle,
  Loader2,
  FileText,
  Globe,
  Lock
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB maximum
const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'png',
  'jpg',
  'jpeg',
  'zip'
];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('Báo cáo');
  const [accessMode, setAccessMode] = useState<'INTERNAL' | 'PRIVATE'>('INTERNAL');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setDocumentType('Báo cáo');
      setAccessMode('INTERNAL');
      setFile(null);
      setFileError(null);
      setSubmitError(null);
      setIsDragOver(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateAndSetFile = (selectedFile: File) => {
    setFileError(null);
    setSubmitError(null);

    // 1. Check size limit
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
      setFile(null);
      setFileError(
        `Dung lượng tệp vượt quá giới hạn 20MB (tệp của bạn: ${sizeMb} MB). Vui lòng chọn tệp nhỏ hơn.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return false;
    }

    // 2. Check extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
      setFile(null);
      setFileError(
        `Định dạng tệp .${ext} không được hỗ trợ. Vui lòng chọn tệp PDF, DOCX, XLSX, TXT, hình ảnh hoặc ZIP.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return false;
    }

    setFile(selectedFile);

    // Auto-fill title if empty
    if (!title.trim()) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
    return true;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title.trim()) {
      setSubmitError('Vui lòng nhập tên tài liệu.');
      return;
    }
    if (!file) {
      setSubmitError('Vui lòng chọn tệp tài liệu cần lưu trữ.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSubmitError('Dung lượng tệp vượt quá giới hạn 20MB.');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('documentType', documentType);
      formData.append('accessMode', accessMode);

      await documentApi.uploadDocument(formData);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      const msg =
        err.response?.data?.message ||
        'Có lỗi xảy ra khi tải lên tài liệu. Vui lòng kiểm tra lại kết nối và thử lại.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const footerContent = (
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
        type="submit"
        form="upload-document-form"
        className="btn btn-primary"
        disabled={isSubmitting || !file}
        id="submit-upload-btn"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Đang lưu trữ & tải lên...</span>
          </>
        ) : (
          <>
            <Upload size={16} />
            <span>Lưu trữ & Tải lên</span>
          </>
        )}
      </button>
    </>
  );

  return (
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tải Lên Tài Liệu Mới"
      subtitle="Hỗ trợ định dạng PDF, DOCX, XLSX, TXT, hình ảnh (Dung lượng tối đa 20MB)"
      icon={<FileText size={20} className="text-primary" />}
      size="lg"
      footer={footerContent}
    >
      <form id="upload-document-form" onSubmit={handleSubmit} noValidate>
        {/* Global Error Banner */}
        {submitError && (
          <div className="ent-alert ent-alert--danger" role="alert">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 1. Document Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="doc-title">
            Tên tài liệu
            <span className="form-label-required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="doc-title"
            type="text"
            className="form-input"
            placeholder="Nhập tên tài liệu lưu trữ..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            required
            autoFocus
          />
        </div>

        {/* 2. Document Type */}
        <div className="form-group">
          <label className="form-label" htmlFor="doc-type">
            Loại tài liệu
            <span className="form-label-required" aria-hidden="true">
              *
            </span>
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
            <option value="Công văn">Công văn</option>
            <option value="Biên bản">Biên bản</option>
            <option value="Tài liệu kỹ thuật">Tài liệu kỹ thuật</option>
            <option value="Khác">Tài liệu chung / Khác</option>
          </select>
        </div>

        {/* 3. Access Mode */}
        <div className="form-group">
          <label className="form-label">
            Quyền truy cập
            <span className="form-label-required" aria-hidden="true">
              *
            </span>
          </label>
          <div className="ent-radio-grid-2" role="radiogroup" aria-label="Quyền truy cập tài liệu">
            <div
              className={`ent-radio-card ${
                accessMode === 'INTERNAL' ? 'ent-radio-card--selected' : ''
              }`}
              onClick={() => setAccessMode('INTERNAL')}
              role="radio"
              aria-checked={accessMode === 'INTERNAL'}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setAccessMode('INTERNAL');
                }
              }}
            >
              <div className="ent-radio-custom" aria-hidden="true">
                <div className="ent-radio-custom-dot" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={15} style={{ color: 'var(--color-primary)' }} />
                  <span className="ent-radio-card-text">Nội bộ cơ quan</span>
                </div>
                <span className="ent-radio-card-subtext">
                  Tất cả tài khoản trong hệ thống đều được xem
                </span>
              </div>
            </div>

            <div
              className={`ent-radio-card ${
                accessMode === 'PRIVATE' ? 'ent-radio-card--selected' : ''
              }`}
              onClick={() => setAccessMode('PRIVATE')}
              role="radio"
              aria-checked={accessMode === 'PRIVATE'}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setAccessMode('PRIVATE');
                }
              }}
            >
              <div className="ent-radio-custom" aria-hidden="true">
                <div className="ent-radio-custom-dot" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={15} style={{ color: 'var(--color-warning)' }} />
                  <span className="ent-radio-card-text">Riêng tư bảo mật</span>
                </div>
                <span className="ent-radio-card-subtext">
                  Chỉ người tạo và người được chỉ định quyền truy cập
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Summary Description (Full width textarea) */}
        <div className="form-group">
          <label className="form-label" htmlFor="doc-desc">
            Mô tả tóm tắt nội dung
          </label>
          <textarea
            id="doc-desc"
            className="form-textarea"
            rows={3}
            placeholder="Nhập mô tả tóm tắt hoặc ghi chú nghiệp vụ về tài liệu..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
          />
        </div>

        {/* 4. File Upload Dropzone (Full width) */}
        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
          <label className="form-label">
            Tệp tài liệu đính kèm
            <span className="form-label-required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip"
            id="modal-file-input"
          />

          <div
            className={`file-dropzone ${
              isDragOver ? 'file-dropzone--dragover' : ''
            } ${fileError ? 'file-dropzone--error' : ''} ${
              file && !fileError ? 'file-dropzone--selected' : ''
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Kéo thả hoặc nhấp để chọn tệp tài liệu"
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            {file && !fileError ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <FileCheck size={36} style={{ color: 'var(--color-success)' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {formatFileSize(file.size)} —{' '}
                  <span style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                    Nhấp để đổi tệp khác
                  </span>
                </div>
              </div>
            ) : fileError ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <AlertTriangle size={36} style={{ color: 'var(--color-danger)' }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-danger)' }}>
                  {fileError}
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Nhấp để chọn lại tệp tài liệu
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Upload size={36} style={{ color: 'var(--color-primary)' }} />
                <div style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--color-text-main)' }}>
                  Kéo thả tệp vào đây hoặc nhấn để chọn từ máy tính
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Hỗ trợ: PDF, DOCX, XLSX, PPTX, TXT, hình ảnh, ZIP (Dung lượng tối đa: 20MB)
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </EnterpriseModal>
  );
};

export default UploadModal;
