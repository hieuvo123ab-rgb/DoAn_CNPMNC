import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { documentService } from '@/services/documentService'
import type { Document } from '@/types'
import { formatBytes, formatDate } from '@/utils/formatters'
import StatusBadge from '@/components/ui/StatusBadge'
import SignatureBadge from '@/components/ui/SignatureBadge'
import LoadingState from '@/components/common/LoadingState'
import EmptyState from '@/components/common/EmptyState'

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 2
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    const loadDoc = async () => {
      if (!id) return
      setIsLoading(true)
      try {
        const doc = await documentService.getDocument(id)
        setDocument(doc)
      } finally {
        setIsLoading(false)
      }
    }
    loadDoc()
  }, [id])

  if (isLoading) {
    return <LoadingState message="Đang kết xuất bản xem trước tài liệu..." />
  }

  if (!document) {
    return (
      <div className="py-12">
        <EmptyState
          title="Không tìm thấy tài liệu"
          description="Tài liệu yêu cầu xem trước không tồn tại trong hệ thống."
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

  const handleZoomIn = () => setZoom((z) => Math.min(160, z + 15))
  const handleZoomOut = () => setZoom((z) => Math.max(60, z - 15))
  const handlePrint = () => window.print()

  return (
    <div className="flex flex-col space-y-4">
      {/* Top control bar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to={`/documents/${document.id}`}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Quay lại chi tiết"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="border-l border-gray-200 pl-3">
            <h2 className="text-sm font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
              {document.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{document.fileName}</span>
              <span>•</span>
              <span>v{document.version}</span>
            </div>
          </div>
        </div>

        {/* Center Viewer Controls */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg p-1 text-gray-600 hover:bg-white disabled:opacity-30"
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-gray-700 px-1">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg p-1 text-gray-600 hover:bg-white disabled:opacity-30"
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-gray-300 mx-1" />

          <button
            onClick={handleZoomOut}
            className="rounded-lg p-1 text-gray-600 hover:bg-white"
            title="Thu nhỏ"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-gray-700 min-w-[42px] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="rounded-lg p-1 text-gray-600 hover:bg-white"
            title="Phóng to"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => documentService.downloadMockFile(document)}
            className="btn-secondary py-1.5 px-3 text-xs"
            title="Tải tệp"
          >
            <Download className="h-4 w-4" />
            Tải về
          </button>
          <button
            onClick={handlePrint}
            className="btn-secondary py-1.5 px-3 text-xs"
            title="In ấn tài liệu"
          >
            <Printer className="h-4 w-4" />
            In
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            title={showSidebar ? 'Ẩn thông tin' : 'Hiện thông tin'}
          >
            {showSidebar ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRightOpen className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex gap-4 min-h-[75vh]">
        {/* Document Canvas */}
        <div className="flex-1 overflow-auto rounded-2xl bg-gray-200/80 p-6 flex justify-center items-start shadow-inner">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-[800px] min-h-[1050px] bg-white p-12 shadow-2xl transition-transform duration-200 rounded-sm relative text-gray-800 font-serif leading-relaxed"
          >
            {/* Watermark for draft or archived */}
            {document.status === 'draft' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-35deg] text-8xl font-black text-gray-500 uppercase select-none">
                BẢN THẢO DRAFT
              </div>
            )}
            {document.status === 'archived' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-35deg] text-8xl font-black text-indigo-500 uppercase select-none">
                ĐÃ LƯU TRỮ
              </div>
            )}

            {currentPage === 1 ? (
              <div className="space-y-6">
                {/* Formal Header */}
                <div className="flex justify-between items-start border-b pb-6 font-sans">
                  <div className="text-xs">
                    <p className="font-bold uppercase tracking-wider text-primary-900">
                      TẬP ĐOÀN CÔNG NGHỆ & DỊCH VỤ SỐ
                    </p>
                    <p className="text-gray-500">HỆ THỐNG QUẢN LÝ VĂN BẢN ĐIỆN TỬ</p>
                    <p className="text-gray-400 mt-1 font-mono">Số: {document.id.toUpperCase()}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold uppercase tracking-wider text-gray-900">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p className="italic text-gray-600">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="text-gray-400 mt-1">
                      Hà Nội, ngày {new Date(document.createdAt).getDate()} tháng{' '}
                      {new Date(document.createdAt).getMonth() + 1} năm{' '}
                      {new Date(document.createdAt).getFullYear()}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-6 font-sans">
                  <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                    {document.title}
                  </h1>
                  <p className="text-xs text-gray-500 mt-2 font-mono">
                    Tệp đính kèm: {document.fileName} • Phiên bản: v{document.version}
                  </p>
                </div>

                {/* Content body */}
                <div className="space-y-4 text-sm leading-relaxed text-justify">
                  <p className="indent-8">
                    Căn cứ vào kế hoạch công tác và quy chế quản lý điều hành doanh nghiệp; Căn cứ vào
                    yêu cầu thực tiễn trong công tác quản lý tài liệu và số hóa quy trình nghiệp vụ;
                    Hôm nay, ngày {formatDate(document.createdAt)}, các bên thống nhất thông qua văn bản
                    với các nội dung chi tiết như sau:
                  </p>

                  <div>
                    <h3 className="font-bold font-sans text-gray-900 text-base mb-1">
                      Điều 1: Mục đích và Phạm vi áp dụng
                    </h3>
                    <p>
                      {document.description ||
                        'Văn bản này quy định đầy đủ các điều kiện, quyền hạn, nghĩa vụ và quy chuẩn kỹ thuật bắt buộc nhằm bảo đảm tính an toàn, bảo mật và tính toàn vẹn của dữ liệu trong toàn bộ hệ thống thông tin của đơn vị.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold font-sans text-gray-900 text-base mb-1">
                      Điều 2: Nguyên tắc Toàn vẹn và Xác thực
                    </h3>
                    <p>
                      Mọi dữ liệu phát sinh được tự động kiểm chứng qua thuật toán hàm băm mật mã học
                      SHA-256. Mọi hành vi sửa đổi không thông qua quy trình phê chuẩn phiên bản sẽ làm vô
                      hiệu chứng nhận kiểm định chữ ký điện tử.
                    </p>
                  </div>

                  {/* Sample Data Table */}
                  <div className="my-4 font-sans text-xs">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700">
                          <th className="border border-gray-300 p-2 text-left">Hạng mục</th>
                          <th className="border border-gray-300 p-2 text-left">Quy chuẩn kỹ thuật</th>
                          <th className="border border-gray-300 p-2 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">Tính toàn vẹn</td>
                          <td className="border border-gray-300 p-2 font-mono">SHA-256 Hash Algorithm</td>
                          <td className="border border-gray-300 p-2 text-right text-emerald-600 font-bold">
                            Đạt chuẩn
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Chữ ký số</td>
                          <td className="border border-gray-300 p-2 font-mono">RSA 2048-bit / SHA-256</td>
                          <td className="border border-gray-300 p-2 text-right text-emerald-600 font-bold">
                            {document.signatureStatus === 'verified' ? 'Hợp lệ' : 'Chờ xác thực'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Lưu trữ phân tán</td>
                          <td className="border border-gray-300 p-2 font-mono">DMS Storage Engine v2.0</td>
                          <td className="border border-gray-300 p-2 text-right text-emerald-600 font-bold">
                            Đã đồng bộ
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-8 text-center text-xs text-gray-400 font-sans border-t">
                  --- Trang 1 / 2 ---
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b pb-4 text-xs font-sans text-gray-400 flex justify-between">
                  <span>Văn bản: {document.title}</span>
                  <span>Trang 2 / 2</span>
                </div>

                <div className="space-y-4 text-sm leading-relaxed text-justify">
                  <div>
                    <h3 className="font-bold font-sans text-gray-900 text-base mb-1">
                      Điều 3: Điều khoản thi hành và Trách nhiệm
                    </h3>
                    <p>
                      Văn bản có hiệu lực kể từ ngày ban hành. Các phòng ban, cá nhân liên quan chịu trách
                      nhiệm thực hiện nghiêm túc các quy định nêu trên. Trong trường hợp có bất kỳ vướng
                      mắc nào, các bên cần phối hợp với Ban Quản trị để được giải quyết kịp thời.
                    </p>
                  </div>
                </div>

                {/* Official Signatures Section */}
                <div className="pt-16 grid grid-cols-2 gap-8 font-sans">
                  <div className="text-center">
                    <p className="font-bold text-gray-800 uppercase text-xs">NGƯỜI LẬP BIỂU</p>
                    <p className="text-xs text-gray-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                    <div className="h-20" />
                    <p className="font-bold text-xs text-gray-900">{document.createdBy?.fullName}</p>
                    <p className="text-[11px] text-gray-500">{document.createdBy?.role}</p>
                  </div>

                  <div className="text-center relative">
                    <p className="font-bold text-gray-800 uppercase text-xs">ĐẠI DIỆN PHÊ DUYỆT</p>
                    <p className="text-xs text-gray-500 italic mt-0.5">(Ký điện tử & Đóng dấu)</p>

                    {/* Stamp / Digital Signature Badge Visual */}
                    {document.signatureStatus === 'verified' && (
                      <div className="my-2 inline-flex flex-col items-center justify-center rounded-2xl border-2 border-emerald-600 bg-emerald-50/80 p-3 text-emerald-800 shadow-md transform rotate-[-3deg]">
                        <ShieldCheck className="h-7 w-7 text-emerald-600 mb-1" />
                        <span className="font-black text-xs uppercase tracking-wider">
                          ĐÃ KÝ SỐ HỢP LỆ
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                          {document.signatureDetails?.signedBy || 'Quản trị viên'}
                        </span>
                        <span className="text-[9px] text-emerald-600">
                          {formatDate(document.signatureDetails?.signedAt || document.updatedAt)}
                        </span>
                      </div>
                    )}

                    <div className={document.signatureStatus === 'verified' ? 'h-2' : 'h-20'} />
                    <p className="font-bold text-xs text-gray-900">Ban Giám Đốc</p>
                  </div>
                </div>

                <div className="pt-16 text-center text-xs text-gray-400 font-sans border-t">
                  Mã băm kiểm định SHA-256: {document.integrityHash}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Collapsible Metadata Sidebar */}
        {showSidebar && (
          <aside className="w-80 shrink-0 space-y-4">
            <div className="card p-5 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
                Thông tin tài liệu
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Trạng thái:</span>
                  <StatusBadge status={document.status} />
                </div>

                <div>
                  <span className="text-gray-400 block mb-0.5">Chữ ký số:</span>
                  <SignatureBadge status={document.signatureStatus} />
                </div>

                <div>
                  <span className="text-gray-400 block mb-0.5">Kích thước tệp:</span>
                  <span className="font-semibold text-gray-800">{formatBytes(document.fileSize)}</span>
                </div>

                <div>
                  <span className="text-gray-400 block mb-0.5">Định dạng MIME:</span>
                  <span className="font-mono text-gray-700 break-all">{document.mimeType}</span>
                </div>

                <div>
                  <span className="text-gray-400 block mb-0.5">Khởi tạo bởi:</span>
                  <span className="font-semibold text-gray-800">{document.createdBy?.fullName}</span>
                </div>

                <div>
                  <span className="text-gray-400 block mb-0.5">Cập nhật lần cuối:</span>
                  <span className="text-gray-700">{formatDate(document.updatedAt)}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <span className="text-gray-400 text-xs block mb-1">Mã toàn vẹn SHA-256:</span>
                <p className="font-mono text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg break-all border border-gray-200">
                  {document.integrityHash}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to={`/documents/${document.id}`}
                  className="btn-primary w-full text-xs font-semibold"
                >
                  Mở trang chi tiết & quản lý
                </Link>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
