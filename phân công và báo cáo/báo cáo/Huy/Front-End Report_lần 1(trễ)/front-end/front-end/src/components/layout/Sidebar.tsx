import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Upload,
  Search,
  LogOut,
  RotateCcw,
  Shield,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { documentService } from '@/services/documentService'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', label: 'Tổng quan (Dashboard)', icon: LayoutDashboard },
  { to: '/documents', label: 'Tài liệu (Documents)', icon: FileText },
  { to: '/upload', label: 'Tải lên (Upload)', icon: Upload },
  { to: '/search', label: 'Tìm kiếm (Search)', icon: Search },
]

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore()
  const { showToast } = useToast()

  const handleResetData = () => {
    if (window.confirm('Khôi phục dữ liệu mẫu ban đầu của hệ thống?')) {
      documentService.resetDemoData()
      showToast('Đã khôi phục dữ liệu mẫu ban đầu!', 'info')
      window.location.reload()
    }
  }

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white select-none">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm shadow-primary-200">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <span className="text-base font-bold text-gray-900 block leading-tight">DocManager</span>
          <span className="text-[11px] font-medium text-gray-400">Enterprise DMS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Chức năng chính
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-50 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'h-4 w-4 transition-transform group-hover:scale-110',
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                  )}
                />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Demo helper */}
      <div className="px-3 py-2">
        <button
          onClick={handleResetData}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          title="Đặt lại dữ liệu tài liệu mẫu về ban đầu"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Khôi phục dữ liệu mẫu
        </button>
      </div>

      {/* User & Logout */}
      <div className="border-t border-gray-200 p-4 bg-gray-50/50">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 font-bold text-primary-700 ring-2 ring-primary-50">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 leading-tight">
              {user?.fullName || 'Quản trị viên'}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
              <Shield className="h-3 w-3 text-primary-600" />
              <span className="capitalize">{user?.role || 'admin'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={clearAuth}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
        >
          <LogOut className="h-3.5 w-3.5 text-gray-500" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
