import React, { useState, useEffect } from 'react';
import { verificationApi, PublicVerificationResponse } from '../api/verificationApi';
import {
  Search,
  AlertTriangle,
  ShieldCheck,
  AlertOctagon,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  FileCheck,
  Shield,
  Download,
} from 'lucide-react';

export const VerifyPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PublicVerificationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual query states
  const [queryHash, setQueryHash] = useState<string>('');
  const [queryDocId, setQueryDocId] = useState<string>('');
  const [queryVersion, setQueryVersion] = useState<string>('');

  // Dropzone file upload state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Read URL query params on load (e.g. from QR code scan: /verify?docId=1&version=2&hash=sha256:...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('hash');
    const docId = params.get('docId');
    const version = params.get('version');

    if (hash || (docId && version)) {
      if (hash) setQueryHash(hash);
      if (docId) setQueryDocId(docId);
      if (version) setQueryVersion(version);

      executeVerification({
        hash: hash || undefined,
        docId: docId ? parseInt(docId, 10) : undefined,
        version: version ? parseInt(version, 10) : undefined,
      });
    }
  }, []);

  const executeVerification = async (params: { docId?: number; version?: number; hash?: string }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await verificationApi.verifyPublic(params);
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Không thể kết nối đến máy chủ xác thực.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryHash.trim() && (!queryDocId.trim() || !queryVersion.trim())) {
      setErrorMsg('Vui lòng nhập mã băm SHA-256 hoặc nhập cặp Mã tài liệu + Phiên bản.');
      return;
    }
    executeVerification({
      hash: queryHash.trim() || undefined,
      docId: queryDocId.trim() ? parseInt(queryDocId.trim(), 10) : undefined,
      version: queryVersion.trim() ? parseInt(queryVersion.trim(), 10) : undefined,
    });
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setUploadedFileName(file.name);
    try {
      const data = await verificationApi.verifyFile(file);
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Lỗi xử lý tệp tin tải lên.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const [copiedHash, setCopiedHash] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-main)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Top Brand Bar */}
      <div
        style={{
          maxWidth: '860px',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.1rem',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              EDMS — Kiểm tra tính xác thực tài liệu
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Đối soát toàn vẹn nội dung và chữ ký số
            </p>
          </div>
        </div>

        <a
          href="/"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
        >
          <ArrowLeft size={15} />
          <span>Về trang chủ EDMS</span>
        </a>
      </div>

      <div style={{ maxWidth: '860px', width: '100%' }}>
        {/* Intro */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>
            Xác thực tính toàn vẹn của tài liệu
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.5 }}>
            Kiểm tra tệp tin bằng mã băm SHA-256 hoặc quét mã QR trên bản in để đối soát với bản ghi lưu trữ trên hệ thống.
          </p>
        </div>

        {/* Forms Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          {/* Box 1: File Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              padding: '1.75rem',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface)',
              border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'border-color 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-card-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.85rem',
                color: 'var(--color-primary)',
              }}
            >
              <FileCheck size={24} />
            </div>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              Kéo thả tệp tin để đối soát
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Hỗ trợ PDF, DOCX, PNG, JPG. Kiểm tra mã băm SHA-256.
            </p>
            {uploadedFileName && (
              <span
                className="ent-badge ent-badge--info"
                style={{ marginTop: '0.85rem', fontSize: '0.75rem' }}
              >
                Đang đối soát: {uploadedFileName}
              </span>
            )}
          </div>

          {/* Box 2: Manual Search */}
          <div
            style={{
              padding: '1.75rem',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <h3
              style={{
                margin: '0 0 1rem 0',
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--color-text-main)',
              }}
            >
              <Search size={16} style={{ color: 'var(--color-primary)' }} />
              <span>Tra cứu theo Mã băm / Số hiệu</span>
            </h3>
            <form onSubmit={handleManualSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  Mã băm SHA-256 (hoặc quét từ mã QR):
                </label>
                <input
                  type="text"
                  placeholder="sha256:..."
                  value={queryHash}
                  onChange={(e) => setQueryHash(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.825rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                    Mã tài liệu:
                  </label>
                  <input
                    type="number"
                    placeholder="123"
                    value={queryDocId}
                    onChange={(e) => setQueryDocId(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.825rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                    Phiên bản:
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={queryVersion}
                    onChange={(e) => setQueryVersion(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.825rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ marginTop: '0.25rem' }}
              >
                {loading ? 'Đang kiểm tra...' : 'Kiểm tra tài liệu'}
              </button>
            </form>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="ent-alert ent-alert--danger" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--color-text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--color-primary)' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Đang đối soát dữ liệu trên hệ thống EDMS...</p>
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '12px',
              border: result.found && !result.tampered
                ? '1px solid var(--color-success)'
                : '1px solid var(--color-danger)',
              overflow: 'hidden',
              marginBottom: '2rem',
            }}
          >
            {/* Status Header Banner */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: result.found && !result.tampered
                  ? 'var(--color-success-subtle)'
                  : 'var(--color-danger-subtle)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {result.found && !result.tampered ? (
                  <ShieldCheck size={28} style={{ color: 'var(--color-success)' }} />
                ) : (
                  <AlertOctagon size={28} style={{ color: 'var(--color-danger)' }} />
                )}
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: result.found && !result.tampered
                        ? 'var(--color-success)'
                        : 'var(--color-danger)',
                    }}
                  >
                    {result.found && !result.tampered
                      ? 'TÀI LIỆU HỢP LỆ — NỘI DUNG NGUYÊN VẸN'
                      : result.found
                      ? 'CẢNH BÁO: TỆP TIN ĐÃ BỊ THAY ĐỔI HOẶC CAN THIỆP'
                      : 'KHÔNG TÌM THẤY TÀI LIỆU TRÊN HỆ THỐNG'}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    {result.message}
                  </p>
                </div>
              </div>

              <span
                className={`ent-badge ${
                  result.found && !result.tampered ? 'ent-badge--success' : 'ent-badge--danger'
                }`}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
              >
                {result.integrityStatus || 'NOT FOUND'}
              </span>
            </div>

            {/* Certificate Details Body */}
            {result.found && (
              <div style={{ padding: '1.5rem' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {/* Left Column: Document Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tiêu đề tài liệu:</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {result.title || '—'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mã tài liệu:</span>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                          #{result.documentId}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Phiên bản:</span>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                          v{result.versionNumber}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Phân loại:</span>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                          {result.documentType || 'Chung'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mã băm SHA-256:</span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.25rem',
                          backgroundColor: 'var(--color-card-muted)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <code style={{ fontSize: '0.75rem', color: 'var(--color-primary)', wordBreak: 'break-all', flex: 1 }}>
                          {result.fileHash}
                        </code>
                        <button
                          type="button"
                          onClick={() => result.fileHash && copyToClipboard(result.fileHash)}
                          className="btn-icon"
                          title="Sao chép mã băm"
                          style={{ flexShrink: 0 }}
                        >
                          {copiedHash ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Digital Signature & Seal */}
                  <div
                    style={{
                      backgroundColor: 'var(--color-card-muted)',
                      padding: '1.25rem',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Trạng thái chữ ký:</span>
                      <span
                        className={`ent-badge ${
                          result.signatureStatus === 'VALID' ? 'ent-badge--success' : 'ent-badge--neutral'
                        }`}
                      >
                        {result.signatureStatus === 'VALID' ? 'ĐÃ KÝ SỐ HỢP LỆ' : result.signatureStatus || 'CHƯA KÝ'}
                      </span>
                    </div>

                    {result.signerUsername && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Người ký xác thực:</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                          {result.signerUsername} {result.signedAt ? `(${new Date(result.signedAt).toLocaleString('vi-VN')})` : ''}
                        </div>
                      </div>
                    )}

                    {result.certSerialNumber && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Số sê-ri chứng thư số (CA):</span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-main)' }}>
                          #{result.certSerialNumber}
                        </div>
                      </div>
                    )}

                    {result.certSubject && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Đơn vị cấp chứng chỉ:</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                          {result.certSubject}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                        Thời điểm đối soát: {result.verifiedAt ? new Date(result.verifiedAt).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <a
                    href={`/api/documents/${result.documentId}/versions/${result.versionNumber}/preview-watermarked`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Download size={14} />
                    <span>Xem bản in có Watermark & QR</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          EDMS — Hệ thống quản lý và kiểm tra tính toàn vẹn tài liệu điện tử.
        </div>
      </div>
    </div>
  );
};
