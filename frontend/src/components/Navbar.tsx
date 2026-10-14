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
  Activity
} from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import { NotificationPanel } from './NotificationPanel';

export type AppView = 'dashboard' | 'documents' | 'users' | 'audit' | 'review-queue' | 'disposition-queue' | 'tasks' | 'system-status';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<AppView>('documents');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    const handleUpdate = () => fetchUnread();
    window.addEventListener('notifications-updated', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, [fetchUnread]);

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

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="navbar-logo-icon">
            <FileText size={22} />
          </div>
          <div className="navbar-title-wrap">
            <h1>EDMS Hệ Thống Lưu Trữ Điện Tử</h1>
            <p>Phase 14 — Notifications & User Task Center</p>
          </div>
        </div>

        {user && (
          <nav className="navbar-nav-links">
            <button
              type="button"
              className={`nav-link-btn ${activeView === 'documents' ? 'active' : ''}`}
              onClick={() => navigateTo('documents')}
              id="nav-docs-btn"
            >
              <FileText size={16} />
              <span>Tài liệu</span>
            </button>

            <button
              type="button"
              className={`nav-link-btn ${activeView === 'tasks' ? 'active' : ''}`}
              onClick={() => navigateTo('tasks')}
              id="nav-tasks-btn"
            >
              <ListTodo size={16} />
              <span>Công việc</span>
            </button>

            {user?.role === 'ROLE_ADMIN' && (
              <>
                <button
                  type="button"
                  className={`nav-link-btn ${activeView === 'users' ? 'active' : ''}`}
                  onClick={() => navigateTo('users')}
                  id="nav-users-btn"
                >
                  <Users size={16} />
                  <span>Quản lý người dùng</span>
                </button>

                <button
                  type="button"
                  className={`nav-link-btn ${activeView === 'review-queue' ? 'active' : ''}`}
                  onClick={() => navigateTo('review-queue')}
                  id="nav-review-queue-btn"
                >
                  <CheckSquare size={16} />
                  <span>Hàng đợi duyệt</span>
                </button>

                <button
                  type="button"
                  className={`nav-link-btn ${activeView === 'disposition-queue' ? 'active' : ''}`}
                  onClick={() => navigateTo('disposition-queue')}
                  id="nav-disposition-queue-btn"
                >
                  <Archive size={16} />
                  <span>Hàng đợi tiêu hủy</span>
                </button>

                <button
                  type="button"
                  className={`nav-link-btn ${activeView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => navigateTo('dashboard')}
                  id="nav-dashboard-btn"
                >
                  <LayoutDashboard size={16} />
                  <span>Bảng điều khiển</span>
                </button>

                <button
                  type="button"
                  className={`nav-link-btn ${activeView === 'audit' ? 'active' : ''}`}
                  onClick={() => navigateTo('audit')}
                  id="nav-audit-btn"
                >
                  <ShieldAlert size={16} />
                  <span>Nhật ký & Kiểm toán</span>
                </button>

                <button
                  type="button"
                  className={`nav-link-btn ${activeView === 'system-status' ? 'active' : ''}`}
                  onClick={() => navigateTo('system-status')}
                  id="nav-system-status-btn"
                  data-route="/system-status"
                >
                  <Activity size={16} />
                  <span>Trạng thái hệ thống</span>
                </button>
              </>
            )}
          </nav>
        )}

        {user && (
          <div className="navbar-user-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowNotifications(prev => !prev)}
                title="Thông báo"
                id="nav-notification-bell-btn"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: showNotifications ? 'var(--color-bg-hover, #e2e8f0)' : 'transparent',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  color: '#334155'
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    id="notification-unread-badge"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                  >
                    {unreadCount >= 100 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationPanel
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  onCountChange={setUnreadCount}
                  onNavigate={handleActionNavigation}
                />
              )}
            </div>

            <div className="user-badge">
              <UserIcon size={16} className="text-muted" />
              <span><strong>{user.fullName || user.username}</strong> ({user.username})</span>
              <span className={`role-pill ${user.role === 'ROLE_ADMIN' ? 'role-admin' : 'role-staff'}`}>
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="btn btn-outline-danger btn-sm"
              title="Đăng xuất khỏi hệ thống"
              id="logout-btn"
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
