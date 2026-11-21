import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Users,
  LayoutDashboard,
  ShieldAlert,
  CheckSquare,
  Archive,
  ListTodo,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  X
} from 'lucide-react';
import { AppView } from '../Navbar';

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  unreadTasksCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  unreadTasksCount = 0
}) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const handleNav = (view: AppView) => {
    onNavigate(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="ent-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`ent-sidebar ${isCollapsed ? 'ent-sidebar--collapsed' : ''} ${
          isMobileOpen ? 'ent-sidebar--mobile-open' : ''
        }`}
        aria-label="Thanh điều hướng chính"
      >
        {/* Brand Header */}
        <div className="ent-sidebar__header">
          <div className="ent-sidebar__brand" onClick={() => handleNav('documents')}>
            <div className="ent-sidebar__logo">
              <FileText size={22} className="text-white" />
            </div>
            {!isCollapsed && (
              <div className="ent-sidebar__brand-text">
                <span className="ent-sidebar__brand-title">EDMS</span>
                <span className="ent-sidebar__brand-desc">Lưu trữ & Quản lý tài liệu</span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            className="ent-sidebar__mobile-close"
            onClick={onCloseMobile}
            aria-label="Đóng thanh điều hướng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="ent-sidebar__nav-container">
          {/* Group 1: Kho Tài Liệu */}
          <div className="ent-sidebar__group">
            {!isCollapsed && <div className="ent-sidebar__group-title">Kho tài liệu</div>}
            <button
              type="button"
              className={`ent-sidebar__nav-item ${activeView === 'documents' ? 'active' : ''}`}
              onClick={() => handleNav('documents')}
              id="nav-docs-btn"
              title="Quản lý tài liệu"
            >
              <FileText size={18} className="ent-sidebar__nav-icon" />
              {!isCollapsed && <span className="ent-sidebar__nav-label">Tài liệu</span>}
            </button>
          </div>

          {/* Group 2: Quy Trình & Tác Vụ */}
          <div className="ent-sidebar__group">
            {!isCollapsed && <div className="ent-sidebar__group-title">Quy trình & Tác vụ</div>}
            <button
              type="button"
              className={`ent-sidebar__nav-item ${activeView === 'tasks' ? 'active' : ''}`}
              onClick={() => handleNav('tasks')}
              id="nav-tasks-btn"
              title="Trung tâm công việc"
            >
              <ListTodo size={18} className="ent-sidebar__nav-icon" />
              {!isCollapsed && <span className="ent-sidebar__nav-label">Công việc</span>}
              {unreadTasksCount > 0 && (
                <span className="ent-sidebar__nav-badge">{unreadTasksCount}</span>
              )}
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  className={`ent-sidebar__nav-item ${activeView === 'review-queue' ? 'active' : ''}`}
                  onClick={() => handleNav('review-queue')}
                  id="nav-review-queue-btn"
                  title="Hàng đợi duyệt tài liệu"
                >
                  <CheckSquare size={18} className="ent-sidebar__nav-icon" />
                  {!isCollapsed && <span className="ent-sidebar__nav-label">Hàng đợi duyệt</span>}
                </button>

                <button
                  type="button"
                  className={`ent-sidebar__nav-item ${activeView === 'disposition-queue' ? 'active' : ''}`}
                  onClick={() => handleNav('disposition-queue')}
                  id="nav-disposition-queue-btn"
                  title="Hàng đợi tiêu hủy"
                >
                  <Archive size={18} className="ent-sidebar__nav-icon" />
                  {!isCollapsed && <span className="ent-sidebar__nav-label">Hàng đợi tiêu hủy</span>}
                </button>
              </>
            )}
          </div>

          {/* Group 3: Quản Trị Hệ Thống (Admin Only) */}
          {isAdmin && (
            <div className="ent-sidebar__group">
              {!isCollapsed && <div className="ent-sidebar__group-title">Quản trị hệ thống</div>}
              <button
                type="button"
                className={`ent-sidebar__nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNav('dashboard')}
                id="nav-dashboard-btn"
                title="Bảng điều khiển"
              >
                <LayoutDashboard size={18} className="ent-sidebar__nav-icon" />
                {!isCollapsed && <span className="ent-sidebar__nav-label">Bảng điều khiển</span>}
              </button>

              <button
                type="button"
                className={`ent-sidebar__nav-item ${activeView === 'users' ? 'active' : ''}`}
                onClick={() => handleNav('users')}
                id="nav-users-btn"
                title="Quản lý người dùng"
              >
                <Users size={18} className="ent-sidebar__nav-icon" />
                {!isCollapsed && <span className="ent-sidebar__nav-label">Người dùng</span>}
              </button>

              <button
                type="button"
                className={`ent-sidebar__nav-item ${activeView === 'audit' ? 'active' : ''}`}
                onClick={() => handleNav('audit')}
                id="nav-audit-btn"
                title="Nhật ký kiểm toán"
              >
                <ShieldAlert size={18} className="ent-sidebar__nav-icon" />
                {!isCollapsed && <span className="ent-sidebar__nav-label">Nhật ký kiểm toán</span>}
              </button>

              <button
                type="button"
                className={`ent-sidebar__nav-item ${activeView === 'system-status' ? 'active' : ''}`}
                onClick={() => handleNav('system-status')}
                id="nav-system-status-btn"
                data-route="/system-status"
                title="Trạng thái hệ thống"
              >
                <Activity size={18} className="ent-sidebar__nav-icon" />
                {!isCollapsed && <span className="ent-sidebar__nav-label">Trạng thái hệ thống</span>}
              </button>
            </div>
          )}
        </div>

        {/* Footer: User profile & Collapse toggle */}
        <div className="ent-sidebar__footer">
          <div className="ent-sidebar__user">
            <div className="ent-sidebar__user-avatar">
              <UserIcon size={16} />
            </div>
            {!isCollapsed && (
              <div className="ent-sidebar__user-info">
                <span className="ent-sidebar__user-name">{user?.username}</span>
                <span className="ent-sidebar__user-role">
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
              className="ent-sidebar__logout-btn"
              onClick={logout}
              title="Đăng xuất khỏi hệ thống"
              aria-label="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            className="ent-sidebar__collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
};
