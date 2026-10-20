import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { taskApi, TaskDto } from '../api/taskApi';
import { useAuth } from '../context/AuthContext';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
  Loader2,
  ArrowRight,
  Archive
} from 'lucide-react';

export const TaskCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await taskApi.getTasks();
      setTasks(data);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể tải danh sách công việc'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const handleUpdate = () => {
      fetchTasks();
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, [fetchTasks]);

  const handleAction = (task: TaskDto) => {
    if (!task.actionKey) return;
    switch (task.actionKey) {
      case 'OPEN_REVIEW_QUEUE':
        window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'review-queue' }));
        break;
      case 'OPEN_DISPOSITION_QUEUE':
        window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'disposition-queue' }));
        break;
      case 'OPEN_VERSION_HISTORY':
      case 'OPEN_DOCUMENT':
      default:
        // Navigate to documents page
        window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'documents' }));
        break;
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterType === 'ALL') return true;
    return t.taskType === filterType;
  });

  const reviewPendingCount = tasks.filter(t => t.taskType === 'REVIEW_PENDING').length;
  const dispositionPendingCount = tasks.filter(t => t.taskType === 'DISPOSITION_PENDING').length;
  const revisionRequiredCount = tasks.filter(t => t.taskType === 'REVISION_REQUIRED').length;

  const renderBadge = (taskType: string) => {
    switch (taskType) {
      case 'REVIEW_PENDING':
        return (
          <span className="ent-badge ent-badge--info">
            <Clock size={13} /> Chờ duyệt tài liệu
          </span>
        );
      case 'DISPOSITION_PENDING':
        return (
          <span className="ent-badge ent-badge--warning">
            <Archive size={13} /> Chờ duyệt tiêu hủy
          </span>
        );
      case 'REVISION_REQUIRED':
        return (
          <span className="ent-badge ent-badge--danger">
            <AlertCircle size={13} /> Cần hiệu chỉnh lại
          </span>
        );
      default:
        return (
          <span className="ent-badge ent-badge--neutral">
            {taskType}
          </span>
        );
    }
  };

  const getActionLabel = (taskType: string) => {
    switch (taskType) {
      case 'REVIEW_PENDING':
        return 'Xử lý xét duyệt';
      case 'DISPOSITION_PENDING':
        return 'Xử lý tiêu hủy';
      case 'REVISION_REQUIRED':
        return 'Tải phiên bản mới';
      default:
        return 'Xem chi tiết';
    }
  };

  return (
    <div className="page-layout">
      <Navbar />
      <main className="container" style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '8px' }}>
                <ListTodo size={24} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main, #1e293b)' }}>
                Trung Tâm Công Việc (User Task Center)
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted, #64748b)', fontSize: '0.9rem' }}>
              Các tác vụ phát sinh trực tiếp từ quy trình xét duyệt, tiêu hủy và vòng đời tài liệu của bạn.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchTasks}
            disabled={isLoading}
            id="refresh-tasks-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isLoading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
            <span>Làm mới</span>
          </button>
        </div>

        {notification && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4', color: notification.type === 'error' ? '#b91c1c' : '#15803d', border: `1px solid ${notification.type === 'error' ? '#fecaca' : '#bbf7d0'}`, fontSize: '0.9rem' }}>
            {notification.text}
          </div>
        )}

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div
            onClick={() => setFilterType('ALL')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: filterType === 'ALL' ? '2px solid #2563eb' : '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>TẤT CẢ CÔNG VIỆC</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>{tasks.length}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Đang chờ xử lý</div>
          </div>

          {user?.role === 'ROLE_ADMIN' && (
            <>
              <div
                onClick={() => setFilterType('REVIEW_PENDING')}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: filterType === 'REVIEW_PENDING' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#1d4ed8', fontWeight: 600 }}>CHỜ DUYỆT TÀI LIỆU</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1d4ed8', marginTop: '4px' }}>{reviewPendingCount}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Yêu cầu gửi bởi nhân viên</div>
              </div>

              <div
                onClick={() => setFilterType('DISPOSITION_PENDING')}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: filterType === 'DISPOSITION_PENDING' ? '2px solid #c2410c' : '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#c2410c', fontWeight: 600 }}>CHỜ DUYỆT TIÊU HỦY</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#c2410c', marginTop: '4px' }}>{dispositionPendingCount}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Tài liệu hết hạn lưu trữ</div>
              </div>
            </>
          )}

          <div
            onClick={() => setFilterType('REVISION_REQUIRED')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: filterType === 'REVISION_REQUIRED' ? '2px solid #b91c1c' : '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 600 }}>CẦN HIỆU CHỈNH LẠI</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#b91c1c', marginTop: '4px' }}>{revisionRequiredCount}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Tài liệu bị từ chối duyệt</div>
          </div>
        </div>

        {/* Task List */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>
              Danh sách tác vụ ({filteredTasks.length})
            </span>
          </div>

          {isLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
              <p>Đang tải danh sách công việc...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                Không có công việc nào đang chờ xử lý!
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
                Tuyệt vời, tất cả các tác vụ quy trình hiện tại đã được giải quyết hoặc không có yêu cầu mới.
              </p>
            </div>
          ) : (
            <div>
              {filteredTasks.map((task, idx) => (
                <div
                  key={`${task.taskType}-${task.relatedEntityId || task.documentId}-${idx}`}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: idx < filteredTasks.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background-color 0.15s',
                    gap: '16px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    <div style={{ marginTop: '2px' }}>
                      <FileText size={20} style={{ color: '#64748b' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        {renderBadge(task.taskType)}
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>
                          {task.documentTitle || `Tài liệu #${task.documentId}`}
                        </span>
                        {task.versionNumber && (
                          <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                            v{task.versionNumber}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.82rem', color: '#64748b' }}>
                        <span>Mã tài liệu: #{task.documentId}</span>
                        {task.createdAt && (
                          <span>Thời gian tạo: {new Date(task.createdAt).toLocaleString('vi-VN')}</span>
                        )}
                        {task.status && (
                          <span>Trạng thái: <strong>{task.status}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAction(task)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '6px 14px' }}
                    >
                      <span>{getActionLabel(task.taskType)}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
