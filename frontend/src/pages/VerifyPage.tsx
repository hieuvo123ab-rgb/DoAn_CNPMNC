import React, { useState, useEffect } from 'react';
import { verificationApi, PublicVerificationResponse } from '../api/verificationApi';

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép mã băm vào bộ nhớ tạm!');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '2.5rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Top Brand Bar */}
      <div style={{
        maxWidth: '850px',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.2rem',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            E
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              Xác thực tài liệu
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
              Kiểm tra thông tin xác thực và tính toàn vẹn
            </p>
          </div>
        </div>

        <a
          href="/"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#1e293b',
            color: '#93c5fd',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
            border: '1px solid #334155',
            transition: 'all 0.2s'
          }}
        >
          ← Quay lại đăng nhập
        </a>
      </div>

      <div style={{ maxWidth: '850px', width: '100%' }}>
        {/* Intro Hero */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          padding: '1.5rem',
          background: 'radial-gradient(ellipse at top, rgba(30, 58, 138, 0.25), transparent 70%)'
        }}>
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#60a5fa',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            marginBottom: '0.75rem'
          }}>
            TRA CỨU TÀI LIỆU
          </span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
            Kiểm tra tính xác thực tài liệu
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', maxWidth: '620px', margin: '0 auto', lineHeight: 1.5 }}>
            Tra cứu thông tin tài liệu qua mã QR, mã băm SHA-256 hoặc mã tài liệu;
            kiểm tra chữ ký số khi tài liệu có thông tin chữ ký.
          </p>
        </div>

        {/* Tab or Forms Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Box 1: File Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              padding: '1.75rem',
              borderRadius: '16px',
              backgroundColor: dragActive ? 'rgba(30, 58, 138, 0.3)' : '#1e293b',
              border: `2px dashed ${dragActive ? '#60a5fa' : '#334155'}`,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.2s',
              cursor: 'pointer'
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
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              color: '#38bdf8',
              fontSize: '1.5rem'
            }}>
              📄
            </div>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 600 }}>
              Kéo thả tệp tin để đối soát
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
              Hỗ trợ PDF, DOCX, PNG và JPG. Tệp được kiểm tra bằng mã băm SHA-256.
            </p>
            {uploadedFileName && (
              <span style={{
                marginTop: '1rem',
                fontSize: '0.75rem',
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px'
              }}>
                Đang đối soát: {uploadedFileName}
              </span>
            )}
          </div>

          {/* Box 2: Manual Search */}
          <div style={{
            padding: '1.75rem',
            borderRadius: '16px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔍</span> Tra cứu theo Mã băm / Số hiệu
            </h3>
            <form onSubmit={handleManualSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Mã băm SHA-256 (hoặc quét từ QR):
                </label>
                <input
                  type="text"
                  placeholder="sha256:..."
                  value={queryHash}
                  onChange={(e) => setQueryHash(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    Mã tài liệu (ID):
                  </label>
                  <input
                    type="number"
                    placeholder="123"
                    value={queryDocId}
                    onChange={(e) => setQueryDocId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    Phiên bản (Version):
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={queryVersion}
                    onChange={(e) => setQueryVersion(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.65rem 1rem',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
                }}
              >
                {loading ? 'Đang thẩm định...' : 'Kiểm tra tài liệu'}
              </button>
            </form>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(59, 130, 246, 0.2)',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              margin: '0 auto 1rem auto',
              animation: 'spin 1s linear infinite'
            }} />
            Đang kiểm tra thông tin tài liệu...
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '18px',
            border: result.found && !result.tampered
              ? '1px solid rgba(34, 197, 94, 0.4)'
              : '1px solid rgba(239, 68, 68, 0.4)',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
            marginBottom: '2rem'
          }}>
            {/* Status Header Banner */}
            <div style={{
              padding: '1.25rem 1.75rem',
              backgroundColor: result.found && !result.tampered
                ? 'rgba(34, 197, 94, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
              borderBottom: result.found && !result.tampered
                ? '1px solid rgba(34, 197, 94, 0.2)'
                : '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.75rem' }}>
                  {result.found && !result.tampered ? '🛡️' : '🚨'}
                </span>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: result.found && !result.tampered ? '#4ade80' : '#f87171'
                  }}>
                    {result.found && !result.tampered
                      ? 'CHỨNG THỰC THÀNH CÔNG — TÍNH TOÀN VẸN HỢP LỆ'
                      : (result.found ? 'CẢNH BÁO: TỆP TIN CÓ DẤU HIỆU XÂM PHẠM (TAMPERED)' : 'KHÔNG TÌM THẤY TÀI LIỆU CHÍNH HÃNG')}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    {result.message}
                  </p>
                </div>
              </div>

              <div style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: result.found && !result.tampered ? '#166534' : '#991b1b',
                color: '#fff'
              }}>
                {result.integrityStatus || 'NOT FOUND'}
              </div>
            </div>

            {/* Certificate Details Body */}
            {result.found && (
              <div style={{ padding: '1.75rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  {/* Left Column: Document Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tiêu đề tài liệu:</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                        {result.title || 'N/A'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mã tài liệu:</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#60a5fa' }}>
                          #{result.documentId}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Phiên bản:</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                          v{result.versionNumber}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Phân loại:</span>
                        <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>
                          {result.documentType || 'Chung'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mã băm vật lý (SHA-256):</span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.25rem',
                        backgroundColor: '#0f172a',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #334155'
                      }}>
                        <code style={{ fontSize: '0.75rem', color: '#38bdf8', wordBreak: 'break-all' }}>
                          {result.fileHash}
                        </code>
                        <button
                          onClick={() => result.fileHash && copyToClipboard(result.fileHash)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '0 0.25rem'
                          }}
                          title="Sao chép"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Digital Signature & Seal */}
                  <div style={{
                    backgroundColor: '#0f172a',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Trạng thái chữ ký:</span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        backgroundColor: result.signatureStatus === 'VALID' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                        color: result.signatureStatus === 'VALID' ? '#4ade80' : '#94a3b8'
                      }}>
                        {result.signatureStatus === 'VALID' ? 'ĐÃ KÝ SỐ HỢP LỆ (VALID)' : (result.signatureStatus || 'CHƯA KÝ')}
                      </span>
                    </div>

                    {result.signerUsername && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Người ký xác thực:</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                          {result.signerUsername} ({result.signedAt ? new Date(result.signedAt).toLocaleString() : ''})
                        </div>
                      </div>
                    )}

                    {result.certSerialNumber && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Số sê-ri chứng thư số (CA):</span>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          #{result.certSerialNumber}
                        </div>
                      </div>
                    )}

                    {result.certSubject && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đơn vị cấp chứng chỉ (Subject):</span>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                          {result.certSubject}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #1e293b' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Thời điểm đối soát: {result.verifiedAt ? new Date(result.verifiedAt).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action: Open in EDMS */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                  <a
                    href={`/api/documents/${result.documentId}/versions/${result.versionNumber}/preview-watermarked`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '0.55rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: '#fff',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    Xem PDF có Watermark & QR
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.75rem', color: '#64748b' }}>
          EDMS — Kiểm tra tính xác thực của tài liệu.
        </div>
      </div>
    </div>
  );
};
