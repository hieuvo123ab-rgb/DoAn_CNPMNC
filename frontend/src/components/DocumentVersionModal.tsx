import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentItem,
  DocumentVersion,
  documentApi,
} from '../api/documentApi';
import {
  History,
  Upload,
  Download,
  Eye,
  RotateCcw,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  PenLine,
  QrCode,
} from 'lucide-react';
import { PreviewModal } from './PreviewModal';
import { EnterpriseModal } from './common/EnterpriseModal';
import { ConfirmationModal } from './common/ConfirmationModal';

interface DocumentVersionModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DocumentVersionModal: React.FC<DocumentVersionModalProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload new version state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Restore state
  const [versionToRestore, setVersionToRestore] = useState<DocumentVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const canEdit =
    document?.userPermission === 'OWNER' ||
    document?.userPermission === 'ADMIN' ||
    document?.userPermission === 'EDIT';
  const isArchived = document?.lifecycleStatus === 'ARCHIVED';

  const loadVersions = useCallback(async () => {
    if (!document) return;
    try {
      setIsLoading(true);
      setMessage(null);
      const res = await documentApi.getDocumentVersions(document.id);
      setVersions(res);
    } catch (err: unknown) {
      console.error('Failed to load document versions:', err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể tải lịch sử phiên bản tài liệu.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, [document]);

  useEffect(() => {
    if (isOpen && document) {
      loadVersions();
      setSelectedFile(null);
      setChangeNote('');
      setVersionToRestore(null);
    }
  }, [isOpen, document, loadVersions]);

  if (!isOpen || !document) return null;

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Vui lòng chọn tệp phiên bản mới để tải lên.' });
      return;
    }

    try {
      setIsUploading(true);
      setMessage(null);
      const newVersion = await documentApi.uploadDocumentVersion(document.id, selectedFile, changeNote);
      setMessage({
        type: 'success',
        text: `Tải lên phiên bản v${newVersion.versionNumber} thành công!`,
      });
      setSelectedFile(null);
      setChangeNote('');
      await loadVersions();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Failed to upload new version:', err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Tải lên phiên bản mới thất bại.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!versionToRestore) return;
    try {
      setIsRestoring(true);
      setMessage(null);
      const restored = await documentApi.restoreDocumentVersion(document.id, versionToRestore.versionNumber);
      setMessage({
        type: 'success',
        text: `Khôi phục thành công! Đã tạo phiên bản v${restored.versionNumber} từ nội dung v${versionToRestore.versionNumber}.`,
      });
      setVersionToRestore(null);
      await loadVersions();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Failed to restore version:', err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Khôi phục phiên bản thất bại.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePreviewVersion = (v: DocumentVersion) => {
    const tempDoc: DocumentItem = {
      ...document,
      originalFileName: v.originalFileName,
      contentType: v.contentType,
      fileSize: v.fileSize,
      currentVersionNumber: v.versionNumber,
    };
    setPreviewDoc(tempDoc);
    setIsPreviewOpen(true);
  };

  const handleDownloadVersion = async (v: DocumentVersion) => {
    try {
      await documentApi.downloadDocumentVersion(document.id, v.versionNumber, v.originalFileName);
    } catch (err) {
      console.error('Download failed:', err);
      setMessage({ type: 'error', text: 'Tải xuống tệp phiên bản thất bại.' });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const nextVersionNumber = versions.length > 0 ? Math.max(...versions.map((v) => v.versionNumber)) + 1 : 1;
  const currentVer = document.currentVersionNumber || versions.find((v) => v.isCurrent)?.versionNumber || 1;

  return (
    <>
      <EnterpriseModal
        isOpen={isOpen}
        onClose={onClose}
        preventClose={isUploading || isRestoring}
        title={`Lịch sử Phiên bản — v${currentVer}`}
        subtitle={document.title}
        icon={<History size={20} />}
        size="xl"
        footer={
          <button type="button" onClick={onClose} disabled={isUploading || isRestoring} className="btn btn-secondary">
            Đóng
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Feedback Message */}
          {message && (
            <div
              className={`ent-alert ${
                message.type === 'success' ? 'ent-alert--success' : 'ent-alert--danger'
              }`}
              style={{ margin: 0 }}
            >
              {message.type === 'success' ? (
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              ) : (
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
              )}
              <span style={{ fontSize: '0.875rem' }}>{message.text}</span>
            </div>
          )}

          {/* Archived Alert */}
          {isArchived && (
            <div className="ent-alert ent-alert--warning" style={{ margin: 0 }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem' }}>
                Tài liệu này đã được lưu trữ (ARCHIVED) ở chế độ chỉ đọc. Không thể tải lên phiên bản mới hoặc khôi phục phiên bản lịch sử.
              </span>
            </div>
          )}

          {/* Upload New Version Section */}
          {canEdit && !isArchived && (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-card-muted)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                  <Upload size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>Tải lên phiên bản mới (v{nextVersionNumber})</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Tài liệu gốc sẽ cập nhật sang phiên bản này
                </span>
              </div>

              <form onSubmit={handleUploadVersion} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                      Chọn tệp mới <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      disabled={isUploading}
                      className="form-input"
                      style={{ height: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.825rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                      Ghi chú thay đổi (Change Note)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Cập nhật điều khoản thanh toán mục 3..."
                      value={changeNote}
                      onChange={(e) => setChangeNote(e.target.value)}
                      disabled={isUploading}
                      className="form-input"
                      style={{ fontSize: '0.825rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={15} />
                        <span>Tải lên v{nextVersionNumber}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Version History Table */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)' }}>
                <Clock size={16} style={{ color: 'var(--color-text-muted)' }} />
                <span>Danh sách các phiên bản ({versions.length})</span>
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mới nhất xếp trên cùng</span>
            </div>

            {isLoading ? (
              <div style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--color-primary)' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Đang tải lịch sử phiên bản...</p>
              </div>
            ) : versions.length === 0 ? (
              <div
                style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  border: '1px dashed var(--color-border)',
                  borderRadius: '10px',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                Chưa có lịch sử phiên bản.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table" style={{ width: '100%', fontSize: '0.825rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>Phiên bản</th>
                      <th>Tên tệp gốc</th>
                      <th style={{ width: '90px' }}>Dung lượng</th>
                      <th style={{ width: '130px' }}>Người cập nhật</th>
                      <th style={{ width: '130px' }}>Thời gian</th>
                      <th>Ghi chú</th>
                      <th style={{ textAlign: 'center', width: '140px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((v) => (
                      <tr
                        key={v.id}
                        style={{
                          backgroundColor: v.isCurrent ? 'var(--color-card-muted)' : undefined,
                        }}
                      >
                        <td className="td-nowrap">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span
                              className={`ent-badge ${
                                v.isCurrent ? 'ent-badge--success' : 'ent-badge--neutral'
                              }`}
                            >
                              v{v.versionNumber}
                            </span>
                            {v.isCurrent && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600 }}>
                                Hiện tại
                              </span>
                            )}
                            {v.signatureStatus === 'VALID' && (
                              <span
                                title={`Đã ký bởi ${v.signerUsername || '?'} — ${v.signatureAlgorithm || 'SHA256withRSA'}`}
                                className="ent-badge ent-badge--success"
                                style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                              >
                                <PenLine size={10} /> Đã ký
                              </span>
                            )}
                            {v.signatureStatus === 'INVALID' && (
                              <span
                                title="Chữ ký không hợp lệ — tệp có thể bị can thiệp"
                                className="ent-badge ent-badge--danger"
                                style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                              >
                                <PenLine size={10} /> CK không hợp lệ
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ maxWidth: '180px' }} className="cell-wrap">
                          <span title={v.originalFileName} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FileText size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                            <span>{v.originalFileName}</span>
                          </span>
                        </td>
                        <td className="td-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                          {formatFileSize(v.fileSize)}
                        </td>
                        <td className="td-nowrap">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-main)' }}>
                            <User size={13} style={{ color: 'var(--color-text-muted)' }} />
                            <span>{v.uploadedBy}</span>
                          </span>
                        </td>
                        <td className="td-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                          {formatDate(v.createdAt)}
                        </td>
                        <td className="cell-wrap" style={{ color: 'var(--color-text-main)' }}>
                          {v.changeNote ? (
                            <span>{v.changeNote}</span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>
                        <td className="td-nowrap" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <button
                              type="button"
                              onClick={() => handlePreviewVersion(v)}
                              title="Xem trước phiên bản này"
                              className="btn-icon"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadVersion(v)}
                              title="Tải xuống tệp phiên bản này"
                              className="btn-icon"
                            >
                              <Download size={15} />
                            </button>

                            <a
                              href={`/api/documents/${document.id}/versions/${v.versionNumber}/download-watermarked`}
                              target="_blank"
                              rel="noreferrer"
                              title="Tải bản có đóng dấu Watermark & mã QR"
                              className="btn-icon"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <QrCode size={15} />
                            </a>

                            <a
                              href={`/verify?docId=${document.id}&version=${v.versionNumber}&hash=${v.fileHash || ''}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Mở trang kiểm tra xác thực công khai"
                              className="btn-icon"
                              style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <ShieldCheck size={15} />
                            </a>

                            {canEdit && !isArchived && !v.isCurrent && (
                              <button
                                type="button"
                                onClick={() => setVersionToRestore(v)}
                                title="Khôi phục thành phiên bản mới nhất"
                                className="btn-icon"
                                style={{ color: 'var(--color-warning)' }}
                              >
                                <RotateCcw size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </EnterpriseModal>

      {/* Restore Confirmation Dialog */}
      {versionToRestore && (
        <ConfirmationModal
          isOpen={Boolean(versionToRestore)}
          onClose={() => setVersionToRestore(null)}
          onConfirm={handleConfirmRestore}
          title={`Khôi phục phiên bản v${versionToRestore.versionNumber}?`}
          message={`Khôi phục phiên bản này sẽ tạo phiên bản mới (v${nextVersionNumber}) dựa trên nội dung v${versionToRestore.versionNumber}. Dữ liệu lịch sử hiện tại không bị ghi đè hoặc xóa.`}
          confirmLabel="Khôi phục"
          cancelLabel="Hủy"
          variant="primary"
          isLoading={isRestoring}
        />
      )}

      {/* Preview Modal for specific version */}
      {previewDoc && (
        <PreviewModal
          document={previewDoc}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewDoc(null);
          }}
          onDownload={(doc) => {
            if (previewDoc.currentVersionNumber) {
              documentApi.downloadDocumentVersion(
                doc.id,
                previewDoc.currentVersionNumber,
                doc.originalFileName
              );
            } else {
              documentApi.downloadDocument(doc.id, doc.originalFileName);
            }
          }}
        />
      )}
    </>
  );
};
