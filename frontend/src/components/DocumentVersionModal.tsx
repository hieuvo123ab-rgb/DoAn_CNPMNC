import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentItem,
  DocumentVersion,
  documentApi,
} from '../api/documentApi';
import {
  X,
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
    // Create temporary DocumentItem representation for PreviewModal
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

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Lịch sử Phiên bản
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    v{document.currentVersionNumber || versions.find((v) => v.isCurrent)?.versionNumber || 1}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xl">
                  {document.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Feedback Message */}
            {message && (
              <div
                className={`p-4 rounded-xl flex items-start space-x-3 text-sm border ${
                  message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            )}

            {/* Archived Alert */}
            {isArchived && (
              <div className="p-4 rounded-xl flex items-center space-x-3 text-sm bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Tài liệu này đã được lưu trữ (ARCHIVED) ở chế độ chỉ đọc. Không thể tải lên phiên bản mới hoặc khôi phục phiên bản lịch sử.</span>
              </div>
            )}

            {/* Upload New Version Section (if user has EDIT authority and not archived) */}
            {canEdit && !isArchived && (
              <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-300 font-semibold text-sm">
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Tải lên phiên bản mới (v{nextVersionNumber})</span>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Tài liệu gốc sẽ cập nhật sang phiên bản này
                  </span>
                </div>

                <form onSubmit={handleUploadVersion} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Chọn tệp mới *
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        disabled={isUploading}
                        className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 dark:file:bg-blue-600 file:cursor-pointer border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Ghi chú thay đổi (Change Note)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Cập nhật điều khoản thanh toán mục 3..."
                        value={changeNote}
                        onChange={(e) => setChangeNote(e.target.value)}
                        disabled={isUploading}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isUploading || !selectedFile}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tải lên...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải lên v{nextVersionNumber}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Version History Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Danh sách các phiên bản ({versions.length})</span>
                </h4>
                <span className="text-xs text-slate-500">Mới nhất xếp trên cùng</span>
              </div>

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-xs text-slate-500">Đang tải lịch sử phiên bản...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  Chưa có lịch sử phiên bản.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Phiên bản</th>
                        <th className="py-3 px-4">Tên tệp gốc</th>
                        <th className="py-3 px-4">Dung lượng</th>
                        <th className="py-3 px-4">Người cập nhật</th>
                        <th className="py-3 px-4">Thời gian</th>
                        <th className="py-3 px-4">Ghi chú</th>
                        <th className="py-3 px-4 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {versions.map((v) => (
                        <tr
                          key={v.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors ${
                            v.isCurrent ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                                  v.isCurrent
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                v{v.versionNumber}
                              </span>
                              {v.isCurrent && (
                                <span className="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <ShieldCheck className="w-3 h-3 mr-0.5" /> Hiện tại
                                </span>
                              )}
                              {/* Phase 13: Digital Signature Badge */}
                              {v.signatureStatus === 'VALID' && (
                                <span
                                  title={`Đã ký bởi ${v.signerUsername || '?'} — ${v.signatureAlgorithm || 'SHA256withRSA'}`}
                                  className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full"
                                >
                                  <PenLine className="w-2.5 h-2.5" /> Đã ký
                                </span>
                              )}
                              {v.signatureStatus === 'INVALID' && (
                                <span
                                  title="Chữ ký không hợp lệ — tệp có thể bị xâm phạm"
                                  className="flex items-center gap-0.5 text-[10px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full"
                                >
                                  <PenLine className="w-2.5 h-2.5" /> CK không hợp lệ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-[180px] truncate font-medium text-slate-800 dark:text-slate-200">
                            <span title={v.originalFileName} className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{v.originalFileName}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatFileSize(v.fileSize)}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {v.uploadedBy}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatDate(v.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                            <span title={v.changeNote || ''}>
                              {v.changeNote || <span className="italic text-slate-400">Không có ghi chú</span>}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handlePreviewVersion(v)}
                                title="Xem trước phiên bản này"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadVersion(v)}
                                title="Tải xuống tệp phiên bản này"
                                className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              {/* Phase 14: Dynamic Watermarked Download */}
                              <a
                                href={`/api/documents/${document.id}/versions/${v.versionNumber}/download-watermarked`}
                                target="_blank"
                                rel="noreferrer"
                                title="Tải bản có đóng dấu Watermark & mã QR bảo mật"
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              >
                                <QrCode className="w-4 h-4" />
                              </a>

                              {/* Phase 14: Public Verification Page Link */}
                              <a
                                href={`/verify?docId=${document.id}&version=${v.versionNumber}&hash=${v.fileHash || ''}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Mở trang chứng thực toàn vẹn & kiểm định số công khai"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </a>

                              {canEdit && !isArchived && !v.isCurrent && (
                                <button
                                  onClick={() => setVersionToRestore(v)}
                                  title="Khôi phục thành phiên bản mới nhất"
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
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

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {versionToRestore && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Xác nhận khôi phục phiên bản v{versionToRestore.versionNumber}?
              </h4>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40">
              Khôi phục phiên bản này sẽ tạo một <strong>phiên bản mới</strong> (v{nextVersionNumber}) dựa trên nội dung của phiên bản đã chọn (v{versionToRestore.versionNumber}). Các phiên bản hiện tại không bị xóa.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setVersionToRestore(null)}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center space-x-1.5"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang khôi phục...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Xác nhận khôi phục</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
