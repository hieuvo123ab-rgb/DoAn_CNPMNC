import React, { useState, useEffect } from 'react';
import { DocumentItem, documentApi } from '../api/documentApi';
import { Download, FileText, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { EnterpriseModal } from './common/EnterpriseModal';

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

  const footerActions = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {previewUrl && isPdf && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            title="Mở tab mới"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ExternalLink size={15} />
            <span>Mở tab mới</span>
          </a>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onDownload(document)}
          title="Tải xuống tệp gốc"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Download size={15} />
          <span>Tải về</span>
        </button>
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
        Đóng
      </button>
    </div>
  );

  return (
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      title={document.title}
      subtitle={`${document.originalFileName} • ${formatFileSize(document.fileSize)} • ${document.documentType}`}
      icon={<FileText size={20} className="text-primary" />}
      size="xl"
      footer={footerActions}
    >
      {/* Body Preview Area */}
      <div
        style={{
          width: '100%',
          height: '65vh',
          minHeight: '360px',
          overflow: 'hidden',
          backgroundColor: isPdf ? 'transparent' : 'var(--color-card-muted)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ margin: 0 }}>Đang tải dữ liệu xem trước...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'var(--color-danger)', padding: '2rem' }}>
            <AlertCircle size={40} style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontWeight: 500, margin: '0 0 1rem 0' }}>{error}</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onDownload(document)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto' }}
            >
              <Download size={15} />
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
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <img
              src={previewUrl}
              alt={document.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '6px',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </div>
        ) : isText && textContent !== null ? (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', backgroundColor: 'var(--color-surface)', padding: '1.25rem' }}>
            <pre
              style={{
                color: 'var(--color-text-main)',
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
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              maxWidth: '440px',
              width: '90%',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <FileText size={28} className="text-primary" />
            </div>
            <h4 style={{ color: 'var(--color-text-main)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Định dạng không hỗ trợ xem trực tiếp
            </h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              Tệp <strong>{document.originalFileName}</strong> ({formatFileSize(document.fileSize)}) cần phần mềm văn phòng chuyên dụng để mở.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto' }}
              onClick={() => onDownload(document)}
            >
              <Download size={15} />
              <span>Tải xuống tệp để mở</span>
            </button>
          </div>
        )}
      </div>
    </EnterpriseModal>
  );
};
