import { useState, useEffect, useRef } from 'react'
import { Bell, Search, Check, ExternalLink, X } from 'lucide-react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { documentService } from '@/services/documentService'
import type { AppNotification } from '@/types'
import { formatRelativeTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard & Thống kê',
  '/documents': 'Danh sách tài liệu',
  '/upload': 'Tải lên tài liệu',
  '/search': 'Tìm kiếm & Tra cứu',
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/documents/')
      ? 'Chi tiết tài liệu'
      : location.pathname.startsWith('/preview/')
      ? 'Xem trước tài liệu'
      : 'DocManager')

  const loadNotifications = async () => {
    const list = await documentService.getNotifications()
    setNotifications(list)
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = async () => {
    await documentService.markAllNotificationsAsRead()
    await loadNotifications()
  }

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await documentService.markNotificationAsRead(notif.id)
      await loadNotifications()
    }
    setShowNotifMenu(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-6 backdrop-blur-md">
      <h1 className="text-xl font-bold tracking-tight text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Quick search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Tìm kiếm nhanh... (Enter)"
            className="input w-72 pl-9 pr-3 py-1.5 text-sm"
          />
        </form>

        {/* Notification dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Thông báo"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Đọc tất cả
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifMenu(false)}
                    className="text-gray-400 hover:text-gray-600 rounded p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-500">Không có thông báo nào</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        'flex cursor-pointer gap-3 p-3.5 text-left transition-colors hover:bg-gray-50',
                        !n.read ? 'bg-primary-50/40' : 'bg-white'
                      )}
                    >
                      <div className="mt-1">
                        <span
                          className={cn(
                            'block h-2.5 w-2.5 rounded-full',
                            n.type === 'success' && 'bg-emerald-500',
                            n.type === 'warning' && 'bg-rose-500',
                            n.type === 'error' && 'bg-red-500',
                            n.type === 'info' && 'bg-blue-500'
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-xs font-semibold', !n.read ? 'text-gray-900' : 'text-gray-700')}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-[11px] text-gray-400">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      {n.link && (
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400 self-center" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-100 p-2 text-center">
                <Link
                  to="/documents"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs font-medium text-primary-600 hover:underline"
                >
                  Xem tất cả tài liệu &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
