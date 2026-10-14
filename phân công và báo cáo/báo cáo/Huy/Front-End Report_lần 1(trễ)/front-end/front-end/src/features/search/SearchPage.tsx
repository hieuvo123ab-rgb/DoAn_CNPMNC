import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Eye,
  Download,
  RotateCcw,
} from 'lucide-react'
import { documentService } from '@/services/documentService'
import type { Document, SavedSearch, DocumentStatus } from '@/types'
import { formatBytes, formatDateOnly } from '@/utils/formatters'
import StatusBadge from '@/components/ui/StatusBadge'
import SignatureBadge from '@/components/ui/SignatureBadge'
import FileTypeIcon from '@/components/ui/FileTypeIcon'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')
  const [selectedTag, setSelectedTag] = useState('')
  const [results, setResults] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Saved searches
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState('')

  const { showToast } = useToast()

  const loadSavedSearches = async () => {
    const list = await documentService.getSavedSearches()
    setSavedSearches(list)
  }

  const executeSearch = async (q = query, st = statusFilter, tg = selectedTag) => {
    setIsLoading(true)
    try {
      const res = await documentService.getDocuments({
        query: q,
        status: st,
        tag: tg,
        pageSize: 50,
      })
      setResults(res.data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSavedSearches()
    if (initialQuery) {
      executeSearch(initialQuery)
    } else {
      // Execute initial search to show all
      executeSearch('')
    }
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query) {
      setSearchParams({ q: query })
    } else {
      setSearchParams({})
    }
    executeSearch(query, statusFilter, selectedTag)
  }

  const handleApplySavedSearch = (saved: SavedSearch) => {
    const q = saved.filters.query || ''
    const st = saved.filters.status?.[0] || 'all'
    const tg = saved.filters.tags?.[0] || ''

    setQuery(q)
    setStatusFilter(st)
    setSelectedTag(tg)
    showToast(`Đã áp dụng bộ lọc "${saved.name}"`, 'info')
    executeSearch(q, st, tg)
  }

  const handleDeleteSavedSearch = async (id: string) => {
    await documentService.deleteSavedSearch(id)
    showToast('Đã xóa bộ lọc đã lưu', 'info')
    loadSavedSearches()
  }

  const handleSaveCurrentSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!saveSearchName.trim()) return

    try {
      await documentService.saveSearch(saveSearchName.trim(), {
        query,
        status: statusFilter !== 'all' ? [statusFilter] : undefined,
        tags: selectedTag ? [selectedTag] : undefined,
      })
      setIsSaveModalOpen(false)
      setSaveSearchName('')
      showToast('Đã lưu tiêu chí tìm kiếm thành công!', 'success')
      loadSavedSearches()
    } catch {
      showToast('Lưu tiêu chí thất bại', 'error')
    }
  }

  const handleReset = () => {
    setQuery('')
    setStatusFilter('all')
    setSelectedTag('')
    setSearchParams({})
    executeSearch('', 'all', '')
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          Tra cứu & Tìm kiếm Nâng cao
        </h2>
        <p className="text-sm text-gray-500">
          Tìm kiếm tài liệu toàn văn theo từ khóa, thẻ phân loại, trạng thái xét duyệt và tiêu chí lưu sẵn.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="card p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập từ khóa cần tra cứu (VD: Hợp đồng, Báo cáo, An toàn thông tin, ERP...)"
              className="input pl-11 pr-4 py-2.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input py-2.5 text-xs w-auto"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="approved">Đã duyệt (Approved)</option>
              <option value="pending">Chờ duyệt (Pending)</option>
              <option value="draft">Bản nháp (Draft)</option>
              <option value="rejected">Bị từ chối (Rejected)</option>
              <option value="archived">Lưu trữ (Archived)</option>
            </select>

            <button type="submit" className="btn-primary py-2.5 px-5 text-sm">
              <Search className="h-4 w-4" />
              Tìm kiếm
            </button>

            {(query || statusFilter !== 'all' || selectedTag) && (
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary py-2.5 px-3 text-xs"
                title="Đặt lại tiêu chí tìm kiếm"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Quick Tag suggestions */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-gray-400 font-medium">Từ khóa phổ biến:</span>
          {['Hợp đồng', 'Báo cáo', 'Bảo mật', 'ERP', 'Tài chính', 'Kế hoạch'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(tag)
                executeSearch(tag, statusFilter, selectedTag)
              }}
              className="rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-700 px-2.5 py-1 text-gray-600 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Saved searches */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary-600" />
            <h3 className="text-sm font-bold text-gray-900">Tiêu chí tìm kiếm đã lưu</h3>
          </div>

          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="btn-secondary py-1 px-2.5 text-xs font-medium flex items-center gap-1.5"
          >
            <BookmarkPlus className="h-3.5 w-3.5 text-primary-600" />
            Lưu bộ lọc hiện tại
          </button>
        </div>

        <div className="p-4 flex flex-wrap gap-2.5">
          {savedSearches.length === 0 ? (
            <p className="text-xs text-gray-400 py-1 px-2">Chưa có tiêu chí nào được lưu.</p>
          ) : (
            savedSearches.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-primary-300 hover:bg-primary-50/40 transition-colors"
              >
                <button
                  onClick={() => handleApplySavedSearch(item)}
                  className="font-medium text-left hover:text-primary-700"
                >
                  {item.name}
                </button>
                <button
                  onClick={() => handleDeleteSavedSearch(item.id)}
                  className="text-gray-400 hover:text-rose-600 transition-colors ml-1 p-0.5 rounded"
                  title="Xóa tiêu chí"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-bold text-gray-900">
            Kết quả tra cứu ({results.length})
          </h3>
          {query && (
            <span className="text-xs text-gray-500">
              Từ khóa: <strong className="text-primary-700">"{query}"</strong>
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-16">
            <LoadingState message="Đang tra cứu dữ liệu..." />
          </div>
        ) : results.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="Không tìm thấy kết quả"
              description="Không có tài liệu nào phù hợp với các tiêu chí tìm kiếm đã chọn."
              action={
                <button onClick={handleReset} className="btn-secondary">
                  <RotateCcw className="h-4 w-4" />
                  Xóa tiêu chí & Hiện tất cả
                </button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {results.map((doc) => (
              <div
                key={doc.id}
                className="p-6 transition-colors hover:bg-gray-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-gray-600">
                    <FileTypeIcon fileName={doc.fileName} mimeType={doc.mimeType} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="text-base font-bold text-gray-900 hover:text-primary-600 transition-colors"
                      >
                        {doc.title}
                      </Link>
                      <StatusBadge status={doc.status} />
                      <SignatureBadge status={doc.signatureStatus} />
                    </div>

                    {doc.description && (
                      <p className="text-xs text-gray-600 max-w-2xl line-clamp-2">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-0.5">
                      <span className="font-mono text-gray-500">{doc.fileName}</span>
                      <span>•</span>
                      <span>{formatBytes(doc.fileSize)}</span>
                      <span>•</span>
                      <span>Cập nhật: {formatDateOnly(doc.updatedAt)}</span>
                      <span>•</span>
                      <span>Tạo bởi: {doc.createdBy?.fullName}</span>
                      {doc.tags && doc.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex gap-1">
                            {doc.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded bg-gray-100 px-1.5 py-0.2 text-[10px] text-gray-600"
                              >
                                #{t}
                              </span>
                            ))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link
                    to={`/preview/${doc.id}`}
                    className="btn-secondary py-1.5 px-3 text-xs"
                    title="Xem trước tài liệu"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Xem trước
                  </Link>
                  <button
                    onClick={() => documentService.downloadMockFile(doc)}
                    className="btn-secondary py-1.5 px-3 text-xs"
                    title="Tải về máy tính"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Tải về
                  </button>
                  <Link
                    to={`/documents/${doc.id}`}
                    className="btn-primary py-1.5 px-3 text-xs"
                  >
                    Chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Search Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Lưu tiêu chí tìm kiếm"
      >
        <form onSubmit={handleSaveCurrentSearch} className="space-y-4">
          <p className="text-xs text-gray-500">
            Đặt tên cho bộ lọc tìm kiếm hiện tại để nhanh chóng tái sử dụng trong các lần tra cứu sau.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tên gợi nhớ cho bộ lọc <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="VD: Hợp đồng bảo mật năm 2026..."
              required
              className="input text-sm"
            />
          </div>

          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
            <p><strong>Từ khóa:</strong> {query || '(Tất cả)'}</p>
            <p><strong>Trạng thái:</strong> {statusFilter}</p>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Lưu tiêu chí
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
