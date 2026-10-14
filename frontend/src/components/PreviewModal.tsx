import React, { useState, useEffect } from 'react';
import { DocumentItem, documentApi } from '../api/documentApi';
import { X, Download, FileText, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface PreviewModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (doc: DocumentItem) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  document,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !document) {
      setLoading(false);
      setError(null);
      setPreviewUrl(null);
      setTextContent(null);
      setDetectedType('');
      return;
    }

    let activeUrl: string | null = null;
    let isCancelled = false;

    const loadPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const { blob, url, contentType } = await documentApi.previewDocument(document.id);
        if (isCancelled) {
          window.URL.revokeObjectURL(url);
          return;
        }
        activeUrl = url;
        setPreviewUrl(url);

        const lowerName = document.originalFileName.toLowerCase();
        let mime = contentType || document.contentType || '';

        if (lowerName.endsWith('.pdf')) {
          mime = 'application/pdf';
        } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lowerName)) {
          mime = 'image/' + (lowerName.split('.').pop() || 'png');
        } else if (/\.(txt|json|md|csv|log|xml)$/i.test(lowerName)) {
          mime = 'text/plain';
        }
        setDetectedType(mime);

        // If text format, read text content
        if (mime.startsWith('text/') || mime.includes('json') || mime.includes('xml')) {
          const text = await blob.text();
          if (!isCancelled) {
            setTextContent(text);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Preview error:', err);
          setError('Không thể tải bản xem trước của tài liệu. Vui lòng tải xuống để xem trên thiết bị.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isCancelled = true;
      if (activeUrl) {
        window.URL.revokeObjectURL(activeUrl);
      }
    };
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const isPdf = detectedType.includes('pdf') || document.originalFileName.toLowerCase().endsWith('.pdf');
  const isImage = detectedType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(document.originalFileName);
  const isText = detectedType.startsWith('text/') || /\.(txt|json|md|csv|log|xml)$/i.test(document.originalFileName);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-preview"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', width: '95%', height: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <FileText size={22} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <div style={{ overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {document.title}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                <span>{document.originalFileName}</span>
                <span>•</span>
                <span>{formatFileSize(document.fileSize)}</span>
                <span>•</span>
                <span className="badge-type">{document.documentType}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onDownload(document)}
              title="Tải xuống tệp gốc"
            >
              <Download size={15} />
              <span>Tải về</span>
            </button>
            {previewUrl && isPdf && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                title="Mở tab mới"
              >
                <ExternalLink size={15} />
              </a>
            )}
            <button
              className="modal-close-btn"
              onClick={onClose}
              title="Đóng"
              style={{ marginLeft: '0.25rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Preview Area */}
        <div
          className="modal-body preview-body"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: isPdf ? 0 : '1.5rem',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
              <p>Đang tải dữ liệu xem trước...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#f87171', padding: '2rem' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ fontWeight: 500 }}>{error}</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
                onClick={() => onDownload(document)}
              >
                <Download size={16} />
                <span>Tải tệp xuống máy</span>
              </button>
            </div>
          ) : isPdf && previewUrl ? (
            <iframe
              src={previewUrl}
              title={document.title}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#fff',
              }}
            />
          ) : isImage && previewUrl ? (
            <div style={{ maxWidth: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={previewUrl}
                alt={document.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              />
            </div>
          ) : isText && textContent !== null ? (
            <div style={{ width: '100%', height: '100%', overflow: 'auto', backgroundColor: '#1e293b', borderRadius: '6px', padding: '1.25rem' }}>
              <pre
                style={{
                  color: '#e2e8f0',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {textContent}
              </pre>
            </div>
          ) : (
            /* Fallback for Office / Word / Excel / ZIP / Other binaries */
            <div
              style={{
                textAlign: 'center',
                backgroundColor: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '2.5rem 2rem',
                maxWidth: '480px',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                }}
              >
                <FileText size={32} color="#38bdf8" />
              </div>
              <h4 style={{ color: '#f8fafc', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Định dạng không hỗ trợ xem trực tiếp
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                Tệp <strong>{document.originalFileName}</strong> ({formatFileSize(document.fileSize)}) cần ứng dụng chuyên dụng (Microsoft Office, LibreOffice, v.v.) để hiển thị trọn vẹn nội dung.
              </p>
              <button
                className="btn btn-primary"
                style={{ margin: '0 auto' }}
                onClick={() => onDownload(document)}
              >
                <Download size={16} />
                <span>Tải xuống tệp để mở</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
