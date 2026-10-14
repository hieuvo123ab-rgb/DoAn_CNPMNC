import React from 'react';
import { DocumentItem } from '../api/documentApi';
import { X, Printer } from 'lucide-react';

interface PrintMetadataModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintMetadataModal: React.FC<PrintMetadataModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !document) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]} (${bytes.toLocaleString('vi-VN')} bytes)`;
  };

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-print"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Toolbar (hidden when printing) */}
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Printer size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>In Phiếu Đặc Tả Tài Liệu</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={16} />
              <span>In ngay (Print)</span>
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="printable-sheet" id="printable-metadata-area">
          {/* Official Header */}
          <div className="sheet-header">
            <div className="header-left">
              <p className="org-name">HỆ THỐNG LƯU TRỮ ĐIỆN TỬ (EDMS)</p>
              <p className="dep-name">TRUNG TÂM QUẢN LÝ TÀI LIỆU SỐ</p>
              <div className="header-line"></div>
            </div>
            <div className="header-right">
              <p className="country-name">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="country-motto">Độc lập - Tự do - Hạnh phúc</p>
              <div className="header-line"></div>
            </div>
          </div>

          {/* Sheet Title */}
          <div className="sheet-title-container">
            <h2 className="sheet-title">PHIẾU ĐẶC TẢ DỮ LIỆU TÀI LIỆU LƯU TRỮ</h2>
            <p className="sheet-subtitle">(Electronic Document Metadata Record)</p>
            <p className="sheet-code">Mã định danh: <strong>EDMS-DOC-{String(document.id).padStart(6, '0')}</strong></p>
          </div>

          {/* Metadata Table */}
          <table className="metadata-sheet-table">
            <tbody>
              <tr>
                <td className="meta-label">Mã số tài liệu (ID):</td>
                <td className="meta-value font-mono">#{document.id}</td>
              </tr>
              <tr>
                <td className="meta-label">Tiêu đề tài liệu:</td>
                <td className="meta-value font-bold">{document.title}</td>
              </tr>
              <tr>
                <td className="meta-label">Phân loại văn bản/tài liệu:</td>
                <td className="meta-value">
                  <span className="print-type-tag">{document.documentType || 'Tài liệu chung'}</span>
                </td>
              </tr>
              <tr>
                <td className="meta-label">Trích yếu / Mô tả nội dung:</td>
                <td className="meta-value">{document.description || '— Không có thông tin trích yếu —'}</td>
              </tr>
              <tr>
                <td className="meta-label">Tên tệp gốc đính kèm:</td>
                <td className="meta-value font-mono">{document.originalFileName}</td>
              </tr>
              <tr>
                <td className="meta-label">Định dạng tệp (MIME Type):</td>
                <td className="meta-value font-mono">{document.contentType || 'application/octet-stream'}</td>
              </tr>
              <tr>
                <td className="meta-label">Kích thước lưu trữ:</td>
                <td className="meta-value">{formatFileSize(document.fileSize)}</td>
              </tr>
              <tr>
                <td className="meta-label">Cán bộ khởi tạo / Tiếp nhận:</td>
                <td className="meta-value font-bold">{document.createdBy}</td>
              </tr>
              <tr>
                <td className="meta-label">Thời gian đăng ký hệ thống:</td>
                <td className="meta-value">{formatDate(document.createdAt)}</td>
              </tr>
              <tr>
                <td className="meta-label">Thời gian cập nhật gần nhất:</td>
                <td className="meta-value">{formatDate(document.updatedAt)}</td>
              </tr>
              <tr>
                <td className="meta-label">Trạng thái xác thực &amp; Lưu trữ:</td>
                <td className="meta-value" style={{ color: '#059669', fontWeight: 600 }}>
                  ✓ Đã lưu trữ an toàn trên máy chủ EDMS (Verified Persistent Storage)
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signatures / Confirmation */}
          <div className="sheet-signatures">
            <div className="sig-box">
              <p className="sig-title">NGƯỜI LẬP PHIẾU</p>
              <p className="sig-hint">(Ký, ghi rõ họ tên)</p>
              <div className="sig-space"></div>
              <p className="sig-name">{document.createdBy}</p>
            </div>
            <div className="sig-box">
              <p className="sig-title">CÁN BỘ PHỤ TRÁCH LƯU TRỮ</p>
              <p className="sig-hint">(Ký duyệt, xác nhận hệ thống)</p>
              <div className="sig-space"></div>
              <p className="sig-name">Hệ thống EDMS</p>
            </div>
          </div>

          <div className="sheet-footer">
            <p>Trích xuất tự động từ Hệ thống Quản lý Tài liệu Điện tử EDMS vào lúc {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Modal Footer Actions (hidden when printing) */}
        <div className="modal-footer no-print" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Giao diện in được chuẩn hóa khổ giấy A4 theo tiêu chuẩn tài liệu văn phòng.
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} />
              <span>In phiếu đặc tả</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
