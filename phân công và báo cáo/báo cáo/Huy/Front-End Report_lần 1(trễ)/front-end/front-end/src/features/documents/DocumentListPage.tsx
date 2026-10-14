import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  RotateCcw,
} from 'lucide-react'
import { documentService } from '@/services/documentService'
import type { Document, DocumentStatus } from '@/types'
import { formatBytes, formatDateOnly } from '@/utils/formatters'
import StatusBadge from '@/components/ui/StatusBadge'
import SignatureBadge from '@/components/ui/SignatureBadge'
import FileTypeIcon from '@/components/ui/FileTypeIcon'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'

export default function DocumentListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = (searchParams.get('status') as DocumentStatus) || 'all'
  const initialQuery = searchParams.get('q') || ''

  const [documents, setDocuments] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Filters state
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>(initialStatus)
  const [selectedTag, setSelectedTag] = useState('')
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title' | 'fileSize'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Modals state
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { showToast } = useToast()

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const res = await documentService.getDocuments({
        page,
        pageSize,
        query: searchQuery,
        status: statusFilter,
        tag: selectedTag,
        sortBy,
        sortOrder,
      })
      setDocuments(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [page, pageSize, searchQuery, statusFilter, selectedTag, sortBy, sortOrder])

  // Get all unique tags for filter dropdown
  const allTags = useMemo(() => {
    const set = new Set<string>()
    documents.forEach((d) => d.tags?.forEach((t) => set.add(t)))
    return Array.from(set)
  }, [documents])

  const handleStatusFilterChange = (status: DocumentStatus | 'all') => {
    setStatusFilter(status)
    setPage(1)
    if (status === 'all') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', status)
    }
    setSearchParams(searchParams)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setSelectedTag('')
    setSortBy('updatedAt')
    setSortOrder('desc')
    setPage(1)
    setSearchParams({})
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDoc) return
    setIsDeleting(true)
    try {
      await documentService.deleteDocument(deleteDoc.id)
      showToast(`Đã xóa tài liệu "${deleteDoc.title}"`, 'success')
      setDeleteDoc(null)
      loadDocuments()
    } catch {
      showToast('Xóa tài liệu thất bại', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleQuickStatusChange = async (doc: Document, newStatus: DocumentStatus) => {
    try {
      await documentService.updateDocumentStatus(doc.id, newStatus)
      showToast(`Đã cập nhật trạng thái thành công`, 'success')
      loadDocuments()
    } catch {
      showToast('Cập nhật trạng thái thất bại', 'error')
    }
  }

  const handleExportCSV = () => {
    if (documents.length === 0) return
    const headers = ['ID', 'Tiêu đề', 'Tên tệp', 'Trạng thái', 'Phiên bản', 'Kích thước (Bytes)', 'Chữ ký số', 'Ngày cập nhật']
    const rows = documents.map((d) => [
      d.id,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.fileName}"`,
      d.status,
      `v${d.version}`,
      d.fileSize,
      d.signatureStatus,
      d.updatedAt,
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `Danh_Sach_Tai_Lieu_${new Date().toISOString().slice(0, 10)}.csv`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Đã xuất danh sách tài liệu sang tệp CSV', 'success')
  }

  const filterTabs: { key: DocumentStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'approved', label: 'Đã duyệt' },
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'draft', label: 'Bản nháp' },
    { key: 'rejected', label: 'Từ chối' },
    { key: 'archived', label: 'Lưu trữ' },
  ]

  return (
    <div className="space-y-5">
      {/* Page Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Danh sách Tài liệu</h2>
          <p className="text-sm text-gray-500">
            Quản lý toàn bộ kho văn bản, hợp đồng, chứng từ và hồ sơ số hóa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            title="Xuất danh sách ra file CSV"
          >
            <Download className="h-4 w-4" />
            Xuất CSV
          </button>
          <Link to="/upload" className="btn-primary">
            <Plus className="h-4 w-4" />
            Tải lên tài liệu
          </Link>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="card p-4 space-y-4">
        {/* Search input + Tag & Sort options */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Tìm kiếm theo tiêu đề, tên file, từ khóa..."
              className="input pl-10 pr-4 py-2"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tag filter */}
            {allTags.length > 0 && (
              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value)
                  setPage(1)
                }}
                className="input py-2 text-xs w-auto"
              >
                <option value="">Tất cả thẻ (Tags)</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            )}

            {/* Sort selector */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as [any, any]
                setSortBy(sb)
                setSortOrder(so)
                setPage(1)
              }}
              className="input py-2 text-xs w-auto"
            >
              <option value="updatedAt-desc">Mới cập nhật nhất</option>
              <option value="updatedAt-asc">Cũ nhất trước</option>
              <option value="title-asc">Tên tài liệu: A - Z</option>
              <option value="title-desc">Tên tài liệu: Z - A</option>
              <option value="fileSize-desc">Dung lượng giảm dần</option>
              <option value="fileSize-asc">Dung lượng tăng dần</option>
            </select>

            {(searchQuery || statusFilter !== 'all' || selectedTag) && (
              <button
                onClick={handleClearFilters}
                className="btn-secondary py-2 px-3 text-xs text-gray-600 hover:text-gray-900"
                title="Xóa bộ lọc"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Status Tab Bar */}
        <div className="flex border-b border-gray-100 overflow-x-auto gap-2 pt-1">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => handleStatusFilterChange(tab.key)}
                className={`whitespace-nowrap px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                  isActive
                    ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-16">
            <LoadingState message="Đang tải danh sách tài liệu..." />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="Không tìm thấy tài liệu nào"
              description={
                searchQuery || statusFilter !== 'all' || selectedTag
                  ? 'Không có tài liệu nào khớp với điều kiện lọc hiện tại. Vui lòng thử từ khóa khác hoặc xóa bộ lọc.'
                  : 'Kho tài liệu hiện đang trống. Hãy tải lên tài liệu đầu tiên!'
              }
              action={
                searchQuery || statusFilter !== 'all' || selectedTag ? (
                  <button onClick={handleClearFilters} className="btn-secondary">
                    <RotateCcw className="h-4 w-4" />
                    Xóa bộ lọc
                  </button>
                ) : (
                  <Link to="/upload" className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Tải lên ngay
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3.5">Tài liệu</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5">Chữ ký số</th>
                  <th className="px-6 py-3.5">Phiên bản</th>
                  <th className="px-6 py-3.5">Người tạo</th>
                  <th className="px-6 py-3.5">Cập nhật</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="transition-colors hover:bg-gray-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                          <FileTypeIcon fileName={doc.fileName} mimeType={doc.mimeType} />
                        </div>
                        <div className="min-w-0 max-w-sm">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="font-medium text-gray-900 hover:text-primary-600 transition-colors block truncate"
                          >
                            {doc.title}
                          </Link>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                            <span className="truncate max-w-[150px]">{doc.fileName}</span>
                            <span>•</span>
                            <span>{formatBytes(doc.fileSize)}</span>
                            {doc.tags && doc.tags.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  {doc.tags.slice(0, 2).map((t) => (
                                    <span
                                      key={t}
                                      className="rounded bg-gray-100 px-1.5 py-0.2 text-[10px] text-gray-600"
                                    >
                                      #{t}
                                    </span>
                                  ))}
                                  {doc.tags.length > 2 && (
                                    <span className="text-[10px] text-gray-400">
                                      +{doc.tags.length - 2}
                                    </span>
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <SignatureBadge status={doc.signatureStatus} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        v{doc.version}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
                          {doc.createdBy?.fullName?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs text-gray-700 truncate max-w-[100px]">
                          {doc.createdBy?.fullName || 'User'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {formatDateOnly(doc.updatedAt)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/preview/${doc.id}`}
                          title="Xem trước"
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => documentService.downloadMockFile(doc)}
                          title="Tải xuống tệp"
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {doc.status === 'pending' && (
                          <button
                            onClick={() => handleQuickStatusChange(doc, 'approved')}
                            title="Phê duyệt nhanh"
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteDoc(doc)}
                          title="Xóa tài liệu"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/documents/${doc.id}`}
                          className="btn-secondary py-1 px-2.5 text-xs font-medium ml-1"
                        >
                          Chi tiết
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/50">
            <div className="text-xs text-gray-500">
              Hiển thị <span className="font-semibold text-gray-900">{documents.length}</span> trong{' '}
              <span className="font-semibold text-gray-900">{total}</span> tài liệu
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Số dòng:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Trước
                </button>
                <span className="px-2 text-xs font-medium text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        title="Xác nhận xóa tài liệu"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa tài liệu{' '}
            <span className="font-semibold text-gray-900">"{deleteDoc?.title}"</span>? Hành động này sẽ
            xóa vĩnh viễn tệp cùng toàn bộ lịch sử các phiên bản liên quan.
          </p>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setDeleteDoc(null)}
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
              {isDeleting ? 'Đang xóa...' : 'Xóa tài liệu'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
