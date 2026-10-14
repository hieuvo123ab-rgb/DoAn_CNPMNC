import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Printer,
  Eye,
  FileSignature,
  CheckCircle,
  XCircle,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Upload,
  History,
  FileText,
  Calendar,
  User as UserIcon,
  HardDrive,
  Hash,
  Archive,
} from 'lucide-react'
import { documentService } from '@/services/documentService'
import type { Document, DocumentStatus } from '@/types'
import { formatBytes, formatDate } from '@/utils/formatters'
import StatusBadge from '@/components/ui/StatusBadge'
import SignatureBadge from '@/components/ui/SignatureBadge'
import FileTypeIcon from '@/components/ui/FileTypeIcon'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedHash, setCopiedHash] = useState(false)

  // Modals
  const [isSignModalOpen, setIsSignModalOpen] = useState(false)
  const [signerName, setSignerName] = useState('Nguyễn Văn Quản Trị (Giám đốc Điều hành)')
  const [certOrg, setCertOrg] = useState('Ban Cơ yếu Chính phủ - CA Root')
  const [isSigning, setIsSigning] = useState(false)

  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [versionFileName, setVersionFileName] = useState('')
  const [versionFileSize, setVersionFileSize] = useState(0)
  const [versionChangeNote, setVersionChangeNote] = useState('')
  const [isUploadingVersion, setIsUploadingVersion] = useState(false)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadDocument = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const doc = await documentService.getDocument(id)
      setDocument(doc)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDocument()
  }, [id])

  if (isLoading) {
    return <LoadingState message="Đang tải thông tin chi tiết tài liệu..." />
  }

  if (!document) {
    return (
      <div className="py-12">
        <EmptyState
          title="Không tìm thấy tài liệu"
          description="Tài liệu bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
          action={
            <Link to="/documents" className="btn-primary">
              <ArrowLeft className="h-4 w-4" />
              Quay lại danh sách
            </Link>
          }
        />
      </div>
    )
  }

  const handleCopyHash = () => {
    if (document.integrityHash) {
      navigator.clipboard.writeText(document.integrityHash)
      setCopiedHash(true)
      showToast('Đã sao chép mã SHA-256 vào bộ nhớ tạm', 'info')
      setTimeout(() => setCopiedHash(false), 2000)
    }
  }

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    try {
      const updated = await documentService.updateDocumentStatus(document.id, newStatus)
      setDocument(updated)
      showToast('Cập nhật trạng thái thành công', 'success')
      loadDocument()
    } catch {
      showToast('Lỗi cập nhật trạng thái', 'error')
    }
  }

  const handleSignConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigning(true)
    try {
      const updated = await documentService.signDocument(document.id, {
        signerName,
        certificateOrg: certOrg,
      })
      setDocument(updated)
      setIsSignModalOpen(false)
      showToast('Tài liệu đã được ký số điện tử thành công!', 'success')
      loadDocument()
    } catch {
      showToast('Ký số thất bại', 'error')
    } finally {
      setIsSigning(false)
    }
  }

  const handleVersionFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setVersionFileName(file.name)
      setVersionFileSize(file.size)
    }
  }

  const handleNewVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!versionFileName) {
      showToast('Vui lòng chọn tệp phiên bản mới', 'error')
      return
    }
    setIsUploadingVersion(true)
    try {
      await documentService.addDocumentVersion(document.id, {
        fileName: versionFileName,
        fileSize: versionFileSize || 1024000,
        changeNote: versionChangeNote || 'Cập nhật phiên bản mới',
      })
      setIsVersionModalOpen(false)
      setVersionFileName('')
      setVersionChangeNote('')
      showToast('Đã nâng cấp phiên bản mới thành công!', 'success')
      loadDocument()
    } catch {
      showToast('Không thể tải lên phiên bản mới', 'error')
    } finally {
      setIsUploadingVersion(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await documentService.deleteDocument(document.id)
      showToast(`Đã xóa tài liệu "${document.title}"`, 'success')
      navigate('/documents', { replace: true })
    } catch {
      showToast('Xóa tài liệu thất bại', 'error')
      setIsDeleting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Navigation & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách tài liệu
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/preview/${document.id}`} className="btn-secondary">
            <Eye className="h-4 w-4" />
            Xem trước
          </Link>
          <button
            onClick={() => documentService.downloadMockFile(document)}
            className="btn-secondary"
          >
            <Download className="h-4 w-4" />
            Tải tệp về
          </button>
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="h-4 w-4" />
            In ấn
          </button>

          {document.signatureStatus !== 'verified' && (
            <button
              onClick={() => setIsSignModalOpen(true)}
              className="btn-primary bg-indigo-600 hover:bg-indigo-700"
            >
              <FileSignature className="h-4 w-4" />
              Ký số điện tử
            </button>
          )}

          {document.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange('approved')}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="h-4 w-4" />
                Phê duyệt
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                className="btn-secondary text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </button>
            </>
          )}

          {document.status === 'approved' && (
            <button
              onClick={() => handleStatusChange('archived')}
              className="btn-secondary text-indigo-700 hover:bg-indigo-50"
            >
              <Archive className="h-4 w-4" />
              Lưu trữ
            </button>
          )}
        </div>
      </div>

      {/* Main Document Header Banner */}
      <div className="card p-6 border-l-4 border-l-primary-600">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 border border-primary-100 text-primary-600">
              <FileTypeIcon
                fileName={document.fileName}
                mimeType={document.mimeType}
                className="h-7 w-7"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <StatusBadge status={document.status} />
                <SignatureBadge status={document.signatureStatus} />
                <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
                  Phiên bản v{document.version}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                {document.title}
              </h1>
              {document.description && (
                <p className="mt-2 text-sm text-gray-600 max-w-3xl leading-relaxed">
                  {document.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-400">Thẻ phân loại:</span>
            {document.tags.map((t) => (
              <span
                key={t}
                className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Metadata Details & Signature Integrity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Document Metadata */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">Thông tin tệp tin & Hệ thống</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Tên tệp gốc
                </p>
                <p className="font-semibold text-gray-800 break-all">{document.fileName}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5" />
                  Kích thước tệp
                </p>
                <p className="font-semibold text-gray-800">
                  {formatBytes(document.fileSize)} ({document.fileSize.toLocaleString('vi-VN')} bytes)
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" />
                  Người khởi tạo
                </p>
                <p className="font-semibold text-gray-800">
                  {document.createdBy?.fullName} ({document.createdBy?.email})
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Thời gian tạo
                </p>
                <p className="font-semibold text-gray-800">{formatDate(document.createdAt)}</p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  Mã băm toàn vẹn (SHA-256 Checksum)
                </p>
                <div className="mt-1 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 p-2.5 font-mono text-xs text-gray-700">
                  <span className="break-all flex-1">{document.integrityHash}</span>
                  <button
                    onClick={handleCopyHash}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                    title="Sao chép SHA-256"
                  >
                    {copiedHash ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Version History */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-600" />
                <h2 className="text-base font-bold text-gray-900">
                  Lịch sử phiên bản ({document.versions?.length || 1})
                </h2>
              </div>
              <button
                onClick={() => setIsVersionModalOpen(true)}
                className="btn-primary py-1.5 px-3 text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                Tải lên bản mới
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {document.versions && document.versions.length > 0 ? (
                document.versions.map((ver) => (
                  <div key={ver.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-800">
                          v{ver.version}
                        </span>
                        <span className="font-semibold text-gray-900 text-sm">{ver.fileName}</span>
                        {ver.version === document.version && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-semibold text-emerald-700">
                            Hiện hành
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{ver.changeNote}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{formatDate(ver.createdAt)}</span>
                        <span>•</span>
                        <span>{formatBytes(ver.fileSize)}</span>
                        <span>•</span>
                        <span>Bởi {ver.createdBy?.fullName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          documentService.downloadMockFile({
                            title: `${document.title} (v${ver.version})`,
                            fileName: ver.fileName,
                            integrityHash: ver.integrityHash,
                          })
                        }
                        className="btn-secondary py-1.5 px-3 text-xs font-medium"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Tải bản này
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6">
                  <p className="text-xs text-gray-500">Chưa có bản ghi lịch sử bổ sung.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Digital Signature Status Card & Danger Zone */}
        <div className="space-y-6">
          {/* Digital Signature Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-primary-50 p-3 text-primary-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Chứng nhận Chữ ký số</h3>
                <p className="text-xs text-gray-500">Tiêu chuẩn xác thực điện tử</p>
              </div>
            </div>

            {document.signatureStatus === 'verified' && document.signatureDetails ? (
              <div className="space-y-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 text-xs text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle className="h-4 w-4" />
                  Xác thực chữ ký hợp lệ
                </div>
                <div className="space-y-1 border-t border-emerald-200/60 pt-2 text-emerald-900">
                  <p className="text-gray-500">Người ký:</p>
                  <p className="font-semibold">{document.signatureDetails.signedBy}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Đơn vị cấp chứng thư:</p>
                  <p className="font-semibold">{document.signatureDetails.certificateOrg}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Thuật toán mã hóa:</p>
                  <p className="font-semibold font-mono">{document.signatureDetails.algorithm}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Thời điểm ký:</p>
                  <p className="font-semibold">{formatDate(document.signatureDetails.signedAt)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
                  <p className="font-semibold">Văn bản này hiện chưa được ký số điện tử.</p>
                  <p className="mt-1 text-amber-700">
                    Ký số giúp đảm bảo pháp lý, chống chối bỏ và xác nhận người có thẩm quyền phê chuẩn nội dung.
                  </p>
                </div>

                <button
                  onClick={() => setIsSignModalOpen(true)}
                  className="btn-primary w-full bg-indigo-600 hover:bg-indigo-700 text-sm"
                >
                  <FileSignature className="h-4 w-4" />
                  Tiến hành ký số ngay
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="card p-6 space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">Thao tác nhanh</h3>
            <Link
              to={`/preview/${document.id}`}
              className="btn-secondary w-full justify-start text-xs font-medium"
            >
              <Eye className="h-4 w-4 text-primary-600" />
              Mở chế độ xem trước toàn màn hình
            </Link>
            <button
              onClick={() => documentService.downloadMockFile(document)}
              className="btn-secondary w-full justify-start text-xs font-medium"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              Tải tệp đính kèm về máy tính
            </button>
          </div>

          {/* Danger zone */}
          <div className="card p-6 border border-rose-200 bg-rose-50/20">
            <h3 className="font-bold text-rose-800 text-sm mb-2">Vùng nguy hiểm</h3>
            <p className="text-xs text-gray-600 mb-4">
              Xóa tài liệu này khỏi cơ sở dữ liệu hệ thống. Thao tác này không thể hoàn tác.
            </p>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="btn-danger w-full text-xs font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa tài liệu vĩnh viễn
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Sign Document */}
      <Modal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        title="Ký số điện tử tài liệu"
      >
        <form onSubmit={handleSignConfirm} className="space-y-4">
          <p className="text-xs text-gray-500">
            Hệ thống sẽ gắn chữ ký điện tử mật mã RSA-2048/SHA-256 vào tệp tài liệu này.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Họ tên người ký & chức danh
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              required
              className="input text-sm"
              placeholder="VD: Nguyễn Văn A (Tổng Giám đốc)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nhà cung cấp chứng thư số (CA)
            </label>
            <input
              type="text"
              value={certOrg}
              onChange={(e) => setCertOrg(e.target.value)}
              required
              className="input text-sm"
              placeholder="VD: Ban Cơ yếu Chính phủ / VNPT-CA / Viettel-CA"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsSignModalOpen(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSigning}
              className="btn-primary bg-indigo-600 hover:bg-indigo-700"
            >
              {isSigning ? 'Đang xác thực chữ ký...' : 'Xác nhận ký số'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Upload New Version */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title={`Tải lên phiên bản mới (v${document.version + 1})`}
      >
        <form onSubmit={handleNewVersionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Chọn tệp tin phiên bản mới
            </label>
            <input
              type="file"
              onChange={handleVersionFileSelect}
              className="input text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Ghi chú thay đổi (Changelog)
            </label>
            <textarea
              value={versionChangeNote}
              onChange={(e) => setVersionChangeNote(e.target.value)}
              placeholder="Mô tả nội dung cập nhật, sửa đổi trong phiên bản này..."
              rows={3}
              className="input text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsVersionModalOpen(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploadingVersion}
              className="btn-primary"
            >
              {isUploadingVersion ? 'Đang lưu phiên bản...' : 'Lưu phiên bản mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xóa tài liệu vĩnh viễn"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa tài liệu{' '}
            <span className="font-semibold text-gray-900">"{document.title}"</span>? Hành động này sẽ
            xóa toàn bộ lịch sử các phiên bản và chứng thư liên quan.
          </p>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="btn-secondary"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="btn-danger"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
