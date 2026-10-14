import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="mt-4 text-lg font-medium text-gray-900">Trang không tồn tại</p>
      <p className="mt-1 text-sm text-gray-500">
        Đường dẫn bạn truy cập không đúng hoặc đã bị xóa.
      </p>
      <Link to="/dashboard" className="btn-primary mt-8">
        <Home className="h-4 w-4" />
        Về Dashboard
      </Link>
    </div>
  )
}
