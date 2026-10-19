import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AppView } from '../Navbar';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/notificationApi';
import { webSocketService } from '../../services/websocket';

interface AppLayoutProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeView,
  onNavigate,
  children
}) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('edms_sidebar_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('edms_sidebar_collapsed', String(next));
      return next;
    });
  };

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadNotifications(count);
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
      setUnreadNotifications(0);
    }

    const handleUpdate = () => fetchUnread();
    window.addEventListener('notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, [user, fetchUnread]);

  return (
    <div className={`ent-app-shell ${isCollapsed ? 'ent-app-shell--collapsed' : ''}`}>
      {/* Collapsible Modern Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        unreadTasksCount={unreadNotifications}
      />

      {/* Main Content Area */}
      <div className="ent-main-wrapper">
        <Topbar
          activeView={activeView}
          onNavigate={onNavigate}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          unreadNotificationsCount={unreadNotifications}
          onRefreshNotifications={fetchUnread}
        />

        <main className="ent-main-content">
          <div className="ent-page-container">{children}</div>
        </main>
      </div>
    </div>
  );
};
