import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Upload,
  X,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { documentService } from '@/services/documentService'
import type { Document, DocumentStatus } from '@/types'
import { formatBytes } from '@/utils/formatters'
import FileTypeIcon from '@/components/ui/FileTypeIcon'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

interface UploadFileItem {
  file: File
  title: string
  description: string
  tags: string
  status: DocumentStatus
}

export default function UploadPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [files, setFiles] = useState<UploadFileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedDocs, setUploadedDocs] = useState<Document[]>([])

  const addFiles = useCallback((rawFiles: File[]) => {
    const newItems: UploadFileItem[] = rawFiles.map((file) => {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      return {
        file,
        title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
        description: '',
        tags: 'Tài liệu mới, Doanh nghiệp',
        status: 'pending',
      }
    })
    setFiles((prev) => [...prev, ...newItems])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const dropped = Array.from(e.dataTransfer.files)
      if (dropped.length > 0) {
        addFiles(dropped)
      }
    },
    [addFiles]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const updateFileMeta = (index: number, key: keyof UploadFileItem, value: any) => {
    setFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    )
  }

  // Pre-fill a sample file for quick testing
  const handleAddSampleFile = () => {
    const sampleBlob = new Blob(['Nội dung văn bản quy chế thử nghiệm'], { type: 'application/pdf' })
    const sampleFile = new File([sampleBlob], 'Bien_Ban_Hop_Ban_Giam_Doc_2026.pdf', {
      type: 'application/pdf',
    })
    addFiles([sampleFile])
  }

  const handleStartUpload = async () => {
    if (files.length === 0) return
    setIsUploading(true)
    setUploadProgress(15)

    try {
      // Simulate progress
      const p1 = setTimeout(() => setUploadProgress(45), 250)
      const p2 = setTimeout(() => setUploadProgress(80), 500)

      const created: Document[] = []
      for (const item of files) {
        const tagList = item.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)

        const doc = await documentService.createDocument({
          title: item.title || item.file.name,
          description: item.description,
          fileName: item.file.name,
          fileSize: item.file.size || 1500000,
          mimeType: item.file.type || 'application/pdf',
          tags: tagList.length > 0 ? tagList : ['Tài liệu'],
          status: item.status,
        })
        created.push(doc)
      }

      clearTimeout(p1)
      clearTimeout(p2)
      setUploadProgress(100)

      await new Promise((r) => setTimeout(r, 300))
      setUploadedDocs(created)
      setFiles([])
      showToast(`Đã tải lên thành công ${created.length} tài liệu!`, 'success')
    } catch {
      showToast('Có lỗi xảy ra khi tải lên tài liệu', 'error')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          Tải lên Tài liệu vào Hệ thống
        </h2>
        <p className="text-sm text-gray-500">
          Chọn tệp từ máy tính, thiết lập thông tin ban đầu và cấp mã bảo mật toàn vẹn SHA-256.
        </p>
      </div>

      {/* Success banner if completed */}
      {uploadedDocs.length > 0 && (
        <div className="card border-emerald-200 bg-emerald-50/60 p-6 animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-emerald-900">
                Tải lên hoàn tất ({uploadedDocs.length} tài liệu)!
              </h3>
              <p className="mt-1 text-xs text-emerald-700">
                Tài liệu đã được lưu trữ an toàn trong kho dữ liệu và sẵn sàng cho quy trình xử lý.
              </p>

              <div className="mt-4 space-y-2">
                {uploadedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl bg-white p-3 border border-emerald-200/80 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <FileTypeIcon fileName={doc.fileName} mimeType={doc.mimeType} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{doc.title}</p>
                        <p className="text-xs text-gray-400 font-mono">ID: {doc.id}</p>
                      </div>
                    </div>
                    <Link
                      to={`/documents/${doc.id}`}
                      className="btn-primary py-1 px-3 text-xs flex items-center gap-1"
                    >
                      Xem chi tiết
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setUploadedDocs([])}
                  className="btn-secondary text-xs"
                >
                  Tải lên tài liệu khác
                </button>
                <button
                  onClick={() => navigate('/documents')}
                  className="btn-primary text-xs"
                >
                  Về danh sách tài liệu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'card relative flex flex-col items-center justify-center border-2 border-dashed p-10 text-center transition-all',
          isDragging
            ? 'border-primary-500 bg-primary-50/50 scale-[1.01]'
            : 'border-gray-300 hover:border-primary-400 bg-white'
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mb-4 shadow-sm">
          <Upload className="h-8 w-8" />
        </div>

        <h3 className="text-base font-semibold text-gray-900">
          Kéo & thả tệp tin vào đây, hoặc nhấn để duyệt
        </h3>
        <p className="mt-1 text-xs text-gray-500 max-w-sm">
          Hỗ trợ PDF, Microsoft Word, Excel, hình ảnh PNG/JPG. Kích thước tối đa 50MB/tệp.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <label className="btn-primary cursor-pointer">
            <Upload className="h-4 w-4" />
            Chọn tệp từ thiết bị
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
            />
          </label>

          <button
            type="button"
            onClick={handleAddSampleFile}
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Thêm tệp mẫu để thử nghiệm nhanh không cần chọn từ máy tính"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Thêm tệp thử nghiệm nhanh
          </button>
        </div>
      </div>

      {/* Selected Files Configuration List */}
      {files.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Tệp đã chọn ({files.length})
              </h3>
              <p className="text-xs text-gray-500">
                Điền thông tin và siêu dữ liệu trước khi hoàn tất lưu trữ
              </p>
            </div>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-gray-500 hover:text-rose-600 transition-colors"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="divide-y divide-gray-100 p-6 space-y-6">
            {files.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="space-y-4 rounded-xl border border-gray-200/80 p-5 bg-white shadow-sm"
              >
                {/* Header of file card */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileTypeIcon fileName={item.file.name} mimeType={item.file.type} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm truncate max-w-sm">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-gray-400">{formatBytes(item.file.size)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFile(index)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Gỡ bỏ tệp"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Tiêu đề tài liệu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateFileMeta(index, 'title', e.target.value)}
                      className="input text-xs"
                      placeholder="Nhập tiêu đề hiển thị..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Trạng thái ban đầu
                    </label>
                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateFileMeta(index, 'status', e.target.value as DocumentStatus)
                      }
                      className="input text-xs"
                    >
                      <option value="pending">Chờ phê duyệt (Pending)</option>
                      <option value="draft">Bản nháp (Draft)</option>
                      <option value="approved">Đã phê duyệt (Approved)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-gray-700 mb-1">
                      Thẻ phân loại (Tags, cách nhau bởi dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={item.tags}
                      onChange={(e) => updateFileMeta(index, 'tags', e.target.value)}
                      className="input text-xs"
                      placeholder="Hợp đồng, Đối tác, 2026..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-gray-700 mb-1">
                      Mô tả nội dung tóm tắt
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateFileMeta(index, 'description', e.target.value)}
                      rows={2}
                      className="input text-xs"
                      placeholder="Mô tả tóm tắt nội dung văn bản này..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload progress & trigger */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
            {isUploading && (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span>Đang tải lên và mã hóa SHA-256...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-primary-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleStartUpload}
              disabled={isUploading}
              className="btn-primary w-full py-2.5 font-semibold text-sm flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tiến hành lưu trữ ({files.length} tệp)...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Bắt đầu lưu trữ {files.length} tài liệu vào kho
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
