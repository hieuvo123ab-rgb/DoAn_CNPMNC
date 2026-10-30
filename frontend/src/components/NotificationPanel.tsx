import React, { useEffect, useState, useRef, useCallback } from 'react';
import { notificationApi, NotificationItem } from '../api/notificationApi';
import { 
  Bell, Check, CheckCheck, FileText, Archive, 
  Share2, PenTool, AlertTriangle, X, Clock
} from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
  onNavigate?: (actionKey?: string, documentId?: number) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  isOpen, 
  onClose, 
  onCountChange, 
  onNavigate 
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadTotal, setUnreadTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterUnread, setFilterUnread] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications(0, 40, filterUnread ? true : undefined);
      setNotifications(res.content || []);
      const unreadCount = await notificationApi.getUnreadCount();
      setUnreadTotal(unreadCount);
      if (onCountChange) {
        onCountChange(unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [filterUnread, onCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Real-time WebSocket push updates
  useEffect(() => {
    const handlePushNotification = (e: any) => {
      if (e.detail) {
        setNotifications(prev => [e.detail, ...prev.filter(n => n.id !== e.detail.id)]);
        setUnreadTotal(prev => prev + 1);
        if (onCountChange) onCountChange(unreadTotal + 1);
      }
    };
    const handlePushRefresh = () => {
      if (isOpen) {
        fetchNotifications();
      }
    };
    window.addEventListener('notification-received', handlePushNotification);
    window.addEventListener('notifications-updated', handlePushRefresh);
    return () => {
      window.removeEventListener('notification-received', handlePushNotification);
      window.removeEventListener('notifications-updated', handlePushRefresh);
    };
  }, [isOpen, fetchNotifications, onCountChange, unreadTotal]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(item.id);
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true, readAt: new Date().toISOString() } : n));
      const newCount = Math.max(0, unreadTotal - 1);
      setUnreadTotal(newCount);
      if (onCountChange) onCountChange(newCount);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })));
      setUnreadTotal(0);
      if (onCountChange) onCountChange(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await notificationApi.markAsRead(item.id);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
        const newCount = Math.max(0, unreadTotal - 1);
        setUnreadTotal(newCount);
        if (onCountChange) onCountChange(newCount);
      } catch (err) {
        console.error('Failed to mark read on click:', err);
      }
    }

    if (onNavigate) {
      onNavigate(item.actionKey, item.documentId);
    } else if (item.actionKey) {
      switch (item.actionKey) {
        case 'OPEN_REVIEW_QUEUE':
          window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'review-queue' }));
          break;
        case 'OPEN_DISPOSITION_QUEUE':
          window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'disposition-queue' }));
          break;
        case 'OPEN_DOCUMENT':
        case 'OPEN_VERSION_HISTORY':
        case 'OPEN_INTEGRITY':
        default:
          window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'documents' }));
          break;
      }
    } else {
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'documents' }));
    }
    onClose();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'DOCUMENT_SHARED':
      case 'DOCUMENT_PERMISSION_UPDATED':
      case 'DOCUMENT_ACCESS_REVOKED':
        return <Share2 size={16} className="text-primary" />;
      case 'REVIEW_SUBMITTED':
      case 'REVIEW_APPROVED':
      case 'REVIEW_REJECTED':
        return <FileText size={16} className="text-warning" />;
      case 'DISPOSITION_REQUESTED':
      case 'DISPOSITION_APPROVED':
      case 'DISPOSITION_REJECTED':
        return <Archive size={16} className="text-danger" />;
      case 'DOCUMENT_SIGNED':
        return <PenTool size={16} className="text-success" />;
      case 'INTEGRITY_TAMPER_DETECTED':
        return <AlertTriangle size={16} className="text-danger" />;
      default:
        return <Bell size={16} className="text-secondary" />;
    }
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;

      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatFullDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  const hasUnread = unreadTotal > 0 || notifications.some(n => !n.read);

  return (
    <div className="notification-panel-dropdown" ref={panelRef} id="notification-panel">
      {/* Panel Header */}
      <div className="notification-panel-header">
        <div className="header-title-row">
          <div className="notif-title-group">
            <div className="notif-bell-icon-wrap">
              <Bell size={17} />
            </div>
            <h3 className="notif-heading">Thông báo</h3>
            {unreadTotal > 0 && (
              <span className="notif-unread-count-pill" title={`${unreadTotal} thông báo chưa đọc`}>
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </div>
          <button 
            className="btn-icon-close" 
            onClick={onClose} 
            title="Đóng bảng thông báo"
            aria-label="Đóng"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Pills & Mark All Actions */}
        <div className="header-actions-row">
          <div className="filter-pill-group" role="tablist" aria-label="Bộ lọc thông báo">
            <button
              type="button"
              role="tab"
              aria-selected={!filterUnread}
              className={`filter-pill ${!filterUnread ? 'active' : ''}`}
              onClick={() => setFilterUnread(false)}
            >
              Tất cả
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filterUnread}
              className={`filter-pill ${filterUnread ? 'active' : ''}`}
              onClick={() => setFilterUnread(true)}
            >
              Chưa đọc {unreadTotal > 0 ? `(${unreadTotal > 99 ? '99+' : unreadTotal})` : ''}
            </button>
          </div>
          <button
            type="button"
            className="btn-mark-all"
            onClick={handleMarkAllAsRead}
            disabled={!hasUnread}
            title={hasUnread ? "Đánh dấu tất cả thông báo là đã đọc" : "Không có thông báo chưa đọc"}
            aria-label="Đánh dấu tất cả đã đọc"
            id="mark-all-read-btn"
          >
            <CheckCheck size={14} />
            <span>Đã đọc tất cả</span>
          </button>
        </div>
      </div>

      {/* Panel Scrollable Body */}
      <div className="notification-panel-body">
        {loading ? (
          <div className="notification-empty-state">
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty-state">
            <Bell size={36} style={{ opacity: 0.25, marginBottom: '0.75rem', color: 'var(--color-primary)' }} />
            <p style={{ fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 0.25rem 0' }}>
              Không có thông báo nào
            </p>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              {filterUnread ? 'Bạn đã đọc tất cả thông báo.' : 'Hệ thống sẽ gửi cập nhật mới tại đây.'}
            </span>
          </div>
        ) : (
          <ul className="notification-list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`notification-item ${!n.read ? 'unread' : 'read'}`}
                onClick={() => handleItemClick(n)}
                id={`notification-item-${n.id}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(n);
                  }
                }}
              >
                <div className="notification-icon-col">
                  {getIconForType(n.type)}
                </div>
                <div className="notification-content-col">
                  <div className="notification-title-row">
                    <span className="notification-title" title={n.title}>
                      {n.title}
                    </span>
                    {!n.read && <span className="unread-dot" title="Chưa đọc" aria-label="Chưa đọc" />}
                  </div>
                  <p className="notification-message">
                    {n.message}
                  </p>
                  <div className="notification-footer-row">
                    <span className="notification-time" title={formatFullDateTime(n.createdAt)}>
                      <Clock size={12} style={{ marginRight: '4px', flexShrink: 0 }} />
                      {formatTimestamp(n.createdAt)}
                    </span>
                    {!n.read && (
                      <button
                        type="button"
                        className="btn-mark-single-read"
                        onClick={(e) => handleMarkAsRead(e, n)}
                        title="Đánh dấu thông báo này là đã đọc"
                        aria-label="Đánh dấu đã đọc"
                        id={`mark-read-btn-${n.id}`}
                      >
                        <Check size={12} />
                        <span>Đã đọc</span>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
