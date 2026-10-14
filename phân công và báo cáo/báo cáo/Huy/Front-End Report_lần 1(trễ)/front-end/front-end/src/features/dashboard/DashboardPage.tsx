import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Clock,
  Upload,
  HardDrive,
  ArrowRight,
  Eye,
  Download,
  Plus,
  ShieldCheck,
  Search,
} from 'lucide-react'
import { documentService } from '@/services/documentService'
import type { Document, DocumentStatus } from '@/types'
import { formatBytes, formatRelativeTime } from '@/utils/formatters'
import StatusBadge from '@/components/ui/StatusBadge'
import SignatureBadge from '@/components/ui/SignatureBadge'
import FileTypeIcon from '@/components/ui/FileTypeIcon'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'

interface StatsData {
  totalDocuments: number
  pendingApproval: number
  uploadedThisMonth: number
  storageUsed: number
  recentDocuments: Document[]
  statusCounts: Record<DocumentStatus, number>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await documentService.getDashboardStats()
      setStats(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (isLoading || !stats) {
    return <LoadingState message="Đang tải dữ liệu tổng quan hệ thống..." />
  }

  const statCards = [
    {
      label: 'Tổng số tài liệu',
      value: stats.totalDocuments.toLocaleString('vi-VN'),
      subtext: 'Đang lưu trữ trong hệ thống',
      icon: FileText,
      color: 'bg-blue-50 text-blue-600 ring-blue-100',
    },
    {
      label: 'Chờ xét duyệt',
      value: stats.pendingApproval.toLocaleString('vi-VN'),
      subtext: stats.pendingApproval > 0 ? 'Cần người có thẩm quyền xử lý' : 'Không có yêu cầu tồn đọng',
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 ring-amber-100',
    },
    {
      label: 'Tải lên tháng này',
      value: stats.uploadedThisMonth.toLocaleString('vi-VN'),
      subtext: 'Tài liệu tạo trong tháng',
      icon: Upload,
      color: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      label: 'Dung lượng sử dụng',
      value: formatBytes(stats.storageUsed),
      subtext: 'Tổng kích thước tệp',
      icon: HardDrive,
      color: 'bg-purple-50 text-purple-600 ring-purple-100',
    },
  ]

  const statusList: { key: DocumentStatus; label: string; count: number; color: string }[] = [
    { key: 'approved', label: 'Đã phê duyệt', count: stats.statusCounts.approved || 0, color: 'bg-emerald-500' },
    { key: 'pending', label: 'Chờ xét duyệt', count: stats.statusCounts.pending || 0, color: 'bg-amber-500' },
    { key: 'draft', label: 'Bản thảo / Nháp', count: stats.statusCounts.draft || 0, color: 'bg-gray-400' },
    { key: 'rejected', label: 'Bị từ chối', count: stats.statusCounts.rejected || 0, color: 'bg-rose-500' },
    { key: 'archived', label: 'Đã lưu trữ', count: stats.statusCounts.archived || 0, color: 'bg-indigo-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Tổng quan Hệ thống Quản lý Tài liệu
          </h2>
          <p className="text-sm text-gray-500">
            Theo dõi tình trạng tài liệu, hồ sơ số hóa và tiến trình ký số của toàn doanh nghiệp.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/search" className="btn-secondary">
            <Search className="h-4 w-4" />
            Tra cứu
          </Link>
          <Link to="/upload" className="btn-primary">
            <Plus className="h-4 w-4" />
            Tải lên tài liệu
          </Link>
        </div>
      </div>

      {/* Main KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="card p-5 transition-shadow hover:shadow-md duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-gray-400">{item.subtext}</p>
              </div>
              <div className={`rounded-xl p-3 ring-1 ${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Breakdown Bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Phân bố trạng thái tài liệu</h3>
          <span className="text-xs text-gray-500">Tổng: {stats.totalDocuments} tài liệu</span>
        </div>

        {/* Progress multi-segment bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
          {statusList.map((item) => {
            const pct = stats.totalDocuments > 0 ? (item.count / stats.totalDocuments) * 100 : 0
            if (pct === 0) return null
            return (
              <div
                key={item.key}
                style={{ width: `${pct}%` }}
                className={`${item.color} transition-all duration-500`}
                title={`${item.label}: ${item.count} (${pct.toFixed(1)}%)`}
              />
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statusList.map((item) => (
            <Link
              key={item.key}
              to={`/documents?status=${item.key}`}
              className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-50"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-gray-600">{item.label}</p>
                <p className="text-sm font-bold text-gray-900">{item.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent documents */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Tài liệu cập nhật gần đây</h3>
            <p className="text-xs text-gray-500">Danh sách 5 tài liệu có hoạt động mới nhất</p>
          </div>
          <Link
            to="/documents"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            Xem tất cả
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats.recentDocuments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Chưa có tài liệu nào"
              description="Hãy bắt đầu tải lên tài liệu đầu tiên để quản lý."
              action={
                <Link to="/upload" className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Tải lên tài liệu
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3.5">Tên tài liệu</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5">Chữ ký số</th>
                  <th className="px-6 py-3.5">Phiên bản</th>
                  <th className="px-6 py-3.5">Cập nhật</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentDocuments.map((doc) => (
                  <tr key={doc.id} className="transition-colors hover:bg-gray-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                          <FileTypeIcon fileName={doc.fileName} mimeType={doc.mimeType} />
                        </div>
                        <div className="min-w-0 max-w-md">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="font-medium text-gray-900 hover:text-primary-600 transition-colors block truncate"
                          >
                            {doc.title}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                            <span className="truncate">{doc.fileName}</span>
                            <span>•</span>
                            <span>{formatBytes(doc.fileSize)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4">
                      <SignatureBadge status={doc.signatureStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        v{doc.version}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatRelativeTime(doc.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                        <Link
                          to={`/documents/${doc.id}`}
                          className="btn-secondary py-1 px-2.5 text-xs font-medium"
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
      </div>

      {/* Feature Highlight / Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-gray-900">Bảo mật SHA-256</h4>
          </div>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            Mỗi tài liệu tải lên được tạo một mã băm SHA-256 duy nhất để xác minh tính toàn vẹn, chống can thiệp trái phép.
          </p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-purple-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-2.5 text-purple-700">
              <Clock className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-gray-900">Kiểm soát Phiên bản</h4>
          </div>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            Hỗ trợ lưu trữ nhiều phiên bản liên tiếp. Khi văn bản cập nhật, phiên bản mới sẽ được lưu kèm ghi chú thay đổi.
          </p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-emerald-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
              <Upload className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-gray-900">Ký số Điện tử</h4>
          </div>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            Ký số trực tiếp trên web với chứng thư số CA, ghi nhận chính xác thời gian và danh tính người ký duyệt.
          </p>
        </div>
      </div>
    </div>
  )
}
