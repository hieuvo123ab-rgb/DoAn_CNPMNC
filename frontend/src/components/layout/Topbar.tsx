import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  FileText,
  ListTodo,
  CheckSquare,
  Archive,
  LayoutDashboard,
  Users,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { AppView } from '../Navbar';
import { NotificationPanel } from '../NotificationPanel';
import { useWebSocketStatus } from '../../hooks/useWebSocketStatus';

interface TopbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenMobileSidebar: () => void;
  unreadNotificationsCount: number;
  onRefreshNotifications?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeView,
  onNavigate,
  onOpenMobileSidebar,
  unreadNotificationsCount,
  onRefreshNotifications
}) => {
  const { user } = useAuth();
  const websocketConnected = useWebSocketStatus();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('edms_theme') === 'dark';
  });
  const notifRef = useRef<HTMLDivElement>(null);

  // Sync theme attribute on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('edms_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('edms_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Click outside notification panel
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

  const getViewDetails = () => {
    switch (activeView) {
      case 'dashboard':
        return { title: 'Bảng điều khiển', icon: <LayoutDashboard size={18} /> };
      case 'users':
        return { title: 'Quản lý người dùng', icon: <Users size={18} /> };
      case 'review-queue':
        return { title: 'Hàng đợi duyệt', icon: <CheckSquare size={18} /> };
      case 'disposition-queue':
        return { title: 'Hàng đợi tiêu hủy', icon: <Archive size={18} /> };
      case 'tasks':
        return { title: 'Trung tâm công việc', icon: <ListTodo size={18} /> };
      case 'audit':
        return { title: 'Nhật ký kiểm toán', icon: <ShieldAlert size={18} /> };
      case 'system-status':
        return { title: 'Trạng thái hệ thống', icon: <Activity size={18} /> };
      case 'documents':
      default:
        return { title: 'Quản lý tài liệu', icon: <FileText size={18} /> };
    }
  };

  const { title, icon } = getViewDetails();

  return (
    <header className="ent-topbar">
      <div className="ent-topbar__left">
        {/* Mobile menu trigger */}
        <button
          type="button"
          className="ent-topbar__hamburger"
          onClick={onOpenMobileSidebar}
          aria-label="Mở thanh điều hướng"
        >
          <Menu size={20} />
        </button>

        {/* Current view breadcrumb */}
        <div className="ent-topbar__breadcrumb">
          <span className="ent-topbar__breadcrumb-icon">{icon}</span>
          <h2 className="ent-topbar__breadcrumb-title">{title}</h2>
        </div>
      </div>

      <div className="ent-topbar__right">
        <div
          className={`ent-topbar__ws-badge ${websocketConnected ? '' : 'ent-topbar__ws-badge--offline'}`}
          title={websocketConnected ? 'Thông báo đang được cập nhật trực tiếp' : 'Kênh thông báo đang kết nối lại'}
          aria-live="polite"
        >
          <span className="ent-topbar__ws-dot" />
          <span className="ent-topbar__ws-text">{websocketConnected ? 'Trực tuyến' : 'Đang kết nối'}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="ent-topbar__icon-btn"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {isDarkMode ? <Sun size={18} className="text-warning" /> : <Moon size={18} />}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="ent-topbar__notif-wrapper" ref={notifRef}>
          <button
            type="button"
            className="ent-topbar__icon-btn ent-topbar__notif-btn"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label={`Thông báo (${unreadNotificationsCount} chưa đọc)`}
            title="Thông báo"
            id="nav-notifications-btn"
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && (
              <span className="ent-topbar__notif-badge">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="ent-topbar__notif-dropdown">
              <NotificationPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onCountChange={() => onRefreshNotifications?.()}
                onNavigate={(actionKey?: string) => {
                  setShowNotifications(false);
                  if (actionKey === 'OPEN_REVIEW_QUEUE') onNavigate('review-queue');
                  else if (actionKey === 'OPEN_DISPOSITION_QUEUE') onNavigate('disposition-queue');
                  else onNavigate('documents');
                }}
              />
            </div>
          )}
        </div>

        {/* User profile capsule */}
        <div className="ent-topbar__profile">
          <div className="ent-topbar__profile-avatar">
            <UserIcon size={16} />
          </div>
          <span className="ent-topbar__profile-name">{user?.username}</span>
        </div>
      </div>
    </header>
  );
};
