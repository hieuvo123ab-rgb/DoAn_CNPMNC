import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  LogOut,
  User as UserIcon,
  Users,
  LayoutDashboard,
  ShieldAlert,
  CheckSquare,
  Archive,
  Bell,
  ListTodo,
  Activity,
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import { NotificationPanel } from './NotificationPanel';
import { webSocketService } from '../services/websocket';

export type AppView =
  | 'dashboard'
  | 'documents'
  | 'users'
  | 'audit'
  | 'review-queue'
  | 'disposition-queue'
  | 'tasks'
  | 'system-status';

export interface NavbarProps {
  currentView?: AppView;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView: initialView }) => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<AppView>(initialView || 'documents');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(() => webSocketService.isConnected());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('edms_sidebar_collapsed') === 'true';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('edms_theme') === 'dark';
  });
  const notifRef = useRef<HTMLDivElement>(null);

  // Sync propView if passed or updated
  useEffect(() => {
    if (initialView && initialView !== activeView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  // Sync real WebSocket connection status
  useEffect(() => {
    const handleWs = (e: any) => {
      setIsWsConnected(Boolean(e.detail?.connected));
    };
    window.addEventListener('websocket-status', handleWs);
    return () => window.removeEventListener('websocket-status', handleWs);
  }, []);

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('edms_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('edms_theme', 'light');
    }
  }, [isDarkMode]);

  // Sync sidebar collapse state to <html> attribute for CSS grid layout
  useEffect(() => {
    if (isSidebarCollapsed) {
      document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
      localStorage.setItem('edms_sidebar_collapsed', 'true');
    } else {
      document.documentElement.removeAttribute('data-sidebar-collapsed');
      localStorage.setItem('edms_sidebar_collapsed', 'false');
    }
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail) {
        setActiveView(e.detail);
      }
    };
    window.addEventListener('app-navigate', handleNav);
    return () => window.removeEventListener('app-navigate', handleNav);
  }, []);

  const navigateTo = (view: AppView) => {
    setActiveView(view);
    setIsMobileDrawerOpen(false);
    window.dispatchEvent(new CustomEvent('app-navigate', { detail: view }));
  };

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // quiet fail
    }
  }, [user]);

  // Connect WebSocket STOMP push channel
  useEffect(() => {
    if (user) {
      webSocketService.connect(user.username, user.role);
      fetchUnread();
    } else {
      webSocketService.disconnect();
      setUnreadCount(0);
    }

    const handleUpdate = () => fetchUnread();
    window.addEventListener('notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, [user, fetchUnread]);

  // Click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleActionNavigation = (actionKey?: string, _documentId?: number) => {
    setShowNotifications(false);
    if (!actionKey) return;
    switch (actionKey) {
      case 'OPEN_REVIEW_QUEUE':
        navigateTo('review-queue');
        break;
      case 'OPEN_DISPOSITION_QUEUE':
        navigateTo('disposition-queue');
        break;
      case 'OPEN_VERSION_HISTORY':
      case 'OPEN_INTEGRITY':
      case 'OPEN_DOCUMENT':
      default:
        navigateTo('documents');
        break;
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return { name: 'Bảng điều khiển', icon: <LayoutDashboard size={18} /> };
      case 'users':
        return { name: 'Quản lý người dùng', icon: <Users size={18} /> };
      case 'review-queue':
        return { name: 'Hàng đợi duyệt', icon: <CheckSquare size={18} /> };
      case 'disposition-queue':
        return { name: 'Hàng đợi tiêu hủy', icon: <Archive size={18} /> };
      case 'tasks':
        return { name: 'Trung tâm công việc', icon: <ListTodo size={18} /> };
      case 'audit':
        return { name: 'Nhật ký kiểm toán', icon: <ShieldAlert size={18} /> };
      case 'system-status':
        return { name: 'Trạng thái hệ thống', icon: <Activity size={18} /> };
      case 'documents':
      default:
        return { name: 'Quản lý tài liệu', icon: <FileText size={18} /> };
    }
  };

  const currentView = getViewTitle();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileDrawerOpen && (
        <div
          className="ent-mobile-backdrop"
          onClick={() => setIsMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modern Collapsible Enterprise Sidebar */}
      <aside
        className={`ent-sidebar ${isSidebarCollapsed ? 'ent-sidebar--collapsed' : ''} ${
          isMobileDrawerOpen ? 'ent-sidebar--mobile-open' : ''
        }`}
        id="ent-main-sidebar"
        aria-label="Thanh điều hướng chính"
      >
        {/* Brand Header */}
        <div className="ent-sidebar__brand-row">
          <div className="ent-sidebar__brand" onClick={() => navigateTo('documents')}>
            <div className="ent-sidebar__logo-badge">
              <FileText size={20} className="text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div className="ent-sidebar__brand-info">
                <span className="ent-sidebar__brand-title">EDMS</span>
                <span className="ent-sidebar__brand-subtitle">Quản lý tài liệu</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="ent-sidebar__mobile-close"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-label="Đóng thanh điều hướng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="ent-sidebar__nav-scroll">
          {/* Section: Kho Lưu Trữ */}
          <div className="ent-sidebar__section">
            {!isSidebarCollapsed && <div className="ent-sidebar__section-title">Kho tài liệu</div>}
            <button
              type="button"
              className={`ent-sidebar__link ${activeView === 'documents' ? 'active' : ''}`}
              onClick={() => navigateTo('documents')}
              id="nav-docs-btn"
              title="Quản lý tài liệu"
            >
              <FileText size={18} className="ent-sidebar__link-icon" />
              {!isSidebarCollapsed && <span className="ent-sidebar__link-text">Tài liệu</span>}
            </button>
          </div>

          {/* Section: Quy Trình & Tác Vụ */}
          <div className="ent-sidebar__section">
            {!isSidebarCollapsed && (
              <div className="ent-sidebar__section-title">Quy trình & Tác vụ</div>
            )}
            <button
              type="button"
              className={`ent-sidebar__link ${activeView === 'tasks' ? 'active' : ''}`}
              onClick={() => navigateTo('tasks')}
              id="nav-tasks-btn"
              title="Trung tâm công việc cần xử lý"
            >
              <ListTodo size={18} className="ent-sidebar__link-icon" />
              {!isSidebarCollapsed && <span className="ent-sidebar__link-text">Công việc</span>}
              {unreadCount > 0 && (
                <span className="ent-sidebar__badge">{unreadCount}</span>
              )}
            </button>

            {user?.role === 'ROLE_ADMIN' && (
              <>
                <button
                  type="button"
                  className={`ent-sidebar__link ${activeView === 'review-queue' ? 'active' : ''}`}
                  onClick={() => navigateTo('review-queue')}
                  id="nav-review-queue-btn"
                  title="Hàng đợi xét duyệt tài liệu"
                >
                  <CheckSquare size={18} className="ent-sidebar__link-icon" />
                  {!isSidebarCollapsed && (
                    <span className="ent-sidebar__link-text">Hàng đợi duyệt</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`ent-sidebar__link ${
                    activeView === 'disposition-queue' ? 'active' : ''
                  }`}
                  onClick={() => navigateTo('disposition-queue')}
                  id="nav-disposition-queue-btn"
                  title="Hàng đợi tiêu hủy tài liệu hết hạn"
                >
                  <Archive size={18} className="ent-sidebar__link-icon" />
                  {!isSidebarCollapsed && (
                    <span className="ent-sidebar__link-text">Hàng đợi tiêu hủy</span>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Section: Quản Trị Hệ Thống (ROLE_ADMIN) */}
          {user?.role === 'ROLE_ADMIN' && (
            <div className="ent-sidebar__section">
              {!isSidebarCollapsed && (
                <div className="ent-sidebar__section-title">Quản trị hệ thống</div>
              )}
              <button
                type="button"
                className={`ent-sidebar__link ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => navigateTo('dashboard')}
                id="nav-dashboard-btn"
                title="Bảng điều khiển"
              >
                <LayoutDashboard size={18} className="ent-sidebar__link-icon" />
                {!isSidebarCollapsed && (
                  <span className="ent-sidebar__link-text">Bảng điều khiển</span>
                )}
              </button>

              <button
                type="button"
                className={`ent-sidebar__link ${activeView === 'users' ? 'active' : ''}`}
                onClick={() => navigateTo('users')}
                id="nav-users-btn"
                title="Quản lý người dùng"
              >
                <Users size={18} className="ent-sidebar__link-icon" />
                {!isSidebarCollapsed && (
                  <span className="ent-sidebar__link-text">Người dùng</span>
                )}
              </button>

              <button
                type="button"
                className={`ent-sidebar__link ${activeView === 'audit' ? 'active' : ''}`}
                onClick={() => navigateTo('audit')}
                id="nav-audit-btn"
                title="Nhật ký kiểm toán"
              >
                <ShieldAlert size={18} className="ent-sidebar__link-icon" />
                {!isSidebarCollapsed && (
                  <span className="ent-sidebar__link-text">Nhật ký kiểm toán</span>
                )}
              </button>

              <button
                type="button"
                className={`ent-sidebar__link ${activeView === 'system-status' ? 'active' : ''}`}
                onClick={() => navigateTo('system-status')}
                id="nav-system-status-btn"
                data-route="/system-status"
                title="Trạng thái hệ thống"
              >
                <Activity size={18} className="ent-sidebar__link-icon" />
                {!isSidebarCollapsed && (
                  <span className="ent-sidebar__link-text">Trạng thái hệ thống</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer: User Card & Collapse Action */}
        <div className="ent-sidebar__footer">
          <div className="ent-sidebar__user-card">
            <div className="ent-sidebar__avatar">
              <UserIcon size={16} />
            </div>
            {!isSidebarCollapsed && (
              <div className="ent-sidebar__user-meta">
                <span className="ent-sidebar__username">{user?.username}</span>
                <span className="ent-sidebar__user-badge">
                  {user?.role === 'ROLE_ADMIN'
                    ? 'Quản trị viên'
                    : user?.role === 'ROLE_STAFF'
                    ? 'Chuyên viên'
                    : 'Người dùng'}
                </span>
              </div>
            )}
            <button
              type="button"
              className="ent-sidebar__logout-action"
              onClick={logout}
              title="Đăng xuất khỏi hệ thống"
              aria-label="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>

          <button
            type="button"
            className="ent-sidebar__collapse-toggle"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            title={isSidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
            id="sidebar-collapse-btn"
          >
            {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </aside>

      {/* Modern Sticky Enterprise Topbar */}
      <header className="ent-topbar">
        <div className="ent-topbar__inner">
          <div className="ent-topbar__left">
            <button
              type="button"
              className="ent-topbar__hamburger"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Mở menu điều hướng"
              id="mobile-menu-toggle-btn"
            >
              <Menu size={20} />
            </button>

            <div className="ent-topbar__breadcrumb">
              <span className="ent-topbar__breadcrumb-icon">{currentView.icon}</span>
              <h2 className="ent-topbar__breadcrumb-title">{currentView.name}</h2>
            </div>
          </div>

          <div className="ent-topbar__right">
            {/* Live STOMP Indicator */}
            <div
              className={`ent-topbar__live-indicator ${
                isWsConnected
                  ? 'ent-topbar__live-indicator--online'
                  : 'ent-topbar__live-indicator--offline'
              }`}
              title={
                isWsConnected
                  ? 'Kết nối thời gian thực WebSocket STOMP đang hoạt động'
                  : 'Mất kết nối thời gian thực WebSocket (Đang tự động kết nối lại...)'
              }
            >
              <span
                className={`ent-topbar__live-dot ${
                  isWsConnected
                    ? 'ent-topbar__live-dot--online'
                    : 'ent-topbar__live-dot--offline'
                }`}
              />
              <span className="ent-topbar__live-label">
                {isWsConnected ? 'Trực tuyến' : 'Ngoại tuyến'}
              </span>
            </div>

            {/* Dark/Light Theme Switcher */}
            <button
              type="button"
              className="ent-topbar__action-btn"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              title={isDarkMode ? 'Giao diện Sáng' : 'Giao diện Tối'}
              id="theme-toggle-btn"
            >
              {isDarkMode ? <Sun size={17} className="text-warning" /> : <Moon size={17} />}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="ent-topbar__notif-box" ref={notifRef}>
              <button
                type="button"
                className="ent-topbar__action-btn ent-topbar__bell-btn"
                onClick={() => setShowNotifications((prev) => !prev)}
                aria-label={`Thông báo (${unreadCount} chưa đọc)`}
                title="Thông báo hệ thống"
                id="nav-notifications-btn"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="ent-topbar__bell-count">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="ent-topbar__notif-popover">
                  <NotificationPanel
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    onNavigate={handleActionNavigation}
                    onCountChange={setUnreadCount}
                  />
                </div>
              )}
            </div>

            {/* Profile Avatar Capsule */}
            <div className="ent-topbar__profile-capsule">
              <div className="ent-topbar__profile-avatar">
                <UserIcon size={14} />
              </div>
              <span className="ent-topbar__profile-username">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
