import React, { useEffect, useState, useRef } from 'react';
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

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, onCountChange, onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterUnread, setFilterUnread] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications(0, 30, filterUnread ? true : undefined);
      setNotifications(res.content || []);
      const unreadCount = await notificationApi.getUnreadCount();
      if (onCountChange) {
        onCountChange(unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filterUnread]);

  // Real-time WebSocket push updates
  useEffect(() => {
    const handlePushNotification = (e: any) => {
      if (e.detail) {
        setNotifications(prev => [e.detail, ...prev.filter(n => n.id !== e.detail.id)]);
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
  }, [isOpen]);

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
      const newCount = await notificationApi.getUnreadCount();
      if (onCountChange) onCountChange(newCount);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })));
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
        const newCount = await notificationApi.getUnreadCount();
        if (onCountChange) onCountChange(newCount);
      } catch (err) {
        console.error('Failed to mark read on click:', err);
      }
    }

    // Controlled ActionKey navigation (Section 29)
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

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel-dropdown" ref={panelRef} id="notification-panel">
      <div className="notification-panel-header">
        <div className="header-title-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Thông báo</h3>
          </div>
          <button 
            className="btn-icon-close" 
            onClick={onClose} 
            title="Đóng"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        <div className="header-actions-row">
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${!filterUnread ? 'active' : ''}`}
              onClick={() => setFilterUnread(false)}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`filter-pill ${filterUnread ? 'active' : ''}`}
              onClick={() => setFilterUnread(true)}
            >
              Chưa đọc
            </button>
          </div>
          <button
            type="button"
            className="btn-mark-all"
            onClick={handleMarkAllAsRead}
            title="Đánh dấu tất cả đã đọc"
            id="mark-all-read-btn"
          >
            <CheckCheck size={14} />
            <span>Đã đọc tất cả</span>
          </button>
        </div>
      </div>

      <div className="notification-panel-body">
        {loading ? (
          <div className="notification-empty-state">
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty-state">
            <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          <ul className="notification-list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`notification-item ${!n.read ? 'unread' : 'read'}`}
                onClick={() => handleItemClick(n)}
                id={`notification-item-${n.id}`}
              >
                <div className="notification-icon-col">
                  {getIconForType(n.type)}
                </div>
                <div className="notification-content-col">
                  <div className="notification-title-row">
                    <span className="notification-title">{n.title}</span>
                    {!n.read && <span className="unread-dot" title="Chưa đọc" />}
                  </div>
                  <p className="notification-message">{n.message}</p>
                  <div className="notification-footer-row">
                    <span className="notification-time">
                      <Clock size={12} style={{ marginRight: '4px' }} />
                      {formatTimestamp(n.createdAt)}
                    </span>
                    {!n.read && (
                      <button
                        type="button"
                        className="btn-mark-single-read"
                        onClick={(e) => handleMarkAsRead(e, n)}
                        title="Đánh dấu đã đọc"
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
