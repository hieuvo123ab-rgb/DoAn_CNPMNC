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
  Archive,
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
        text: err?.response?.data?.message || 'Không thể tải danh sách công việc',
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
        window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'documents' }));
        break;
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.taskType === filterType;
  });

  const reviewPendingCount = tasks.filter((t) => t.taskType === 'REVIEW_PENDING').length;
  const dispositionPendingCount = tasks.filter((t) => t.taskType === 'DISPOSITION_PENDING').length;
  const revisionRequiredCount = tasks.filter((t) => t.taskType === 'REVISION_REQUIRED').length;

  const renderBadge = (taskType: string) => {
    switch (taskType) {
      case 'REVIEW_PENDING':
        return (
          <span className="ent-badge ent-badge--info">
            <Clock size={12} /> Chờ duyệt tài liệu
          </span>
        );
      case 'DISPOSITION_PENDING':
        return (
          <span className="ent-badge ent-badge--warning">
            <Archive size={12} /> Chờ duyệt tiêu hủy
          </span>
        );
      case 'REVISION_REQUIRED':
        return (
          <span className="ent-badge ent-badge--danger">
            <AlertCircle size={12} /> Cần hiệu chỉnh lại
          </span>
        );
      default:
        return <span className="ent-badge ent-badge--neutral">{taskType}</span>;
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
      <Navbar currentView="tasks" />
      <main className="container" style={{ padding: '1.5rem 0', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ListTodo size={22} />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>
                Công việc
              </h2>
            </div>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Nhiệm vụ phát sinh từ quy trình xét duyệt, tiêu hủy và vòng đời tài liệu của bạn.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchTasks}
            disabled={isLoading}
            id="refresh-tasks-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            <span>Làm mới</span>
          </button>
        </div>

        {notification && (
          <div
            className={`ent-alert ${
              notification.type === 'error' ? 'ent-alert--danger' : 'ent-alert--success'
            }`}
            style={{ marginBottom: '1.25rem' }}
          >
            <span>{notification.text}</span>
          </div>
        )}

        {/* Stats Filter Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            onClick={() => setFilterType('ALL')}
            style={{
              padding: '1rem',
              borderRadius: '10px',
              border: filterType === 'ALL' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>TẤT CẢ CÔNG VIỆC</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '0.25rem' }}>
              {tasks.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>Đang chờ xử lý</div>
          </div>

          {user?.role === 'ROLE_ADMIN' && (
            <>
              <div
                onClick={() => setFilterType('REVIEW_PENDING')}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border:
                    filterType === 'REVIEW_PENDING'
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  CHỜ DUYỆT TÀI LIỆU
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                  {reviewPendingCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                  Yêu cầu từ nhân viên
                </div>
              </div>

              <div
                onClick={() => setFilterType('DISPOSITION_PENDING')}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border:
                    filterType === 'DISPOSITION_PENDING'
                      ? '2px solid var(--color-warning)'
                      : '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                  CHỜ DUYỆT TIÊU HỦY
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '0.25rem' }}>
                  {dispositionPendingCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                  Hết hạn lưu trữ
                </div>
              </div>
            </>
          )}

          <div
            onClick={() => setFilterType('REVISION_REQUIRED')}
            style={{
              padding: '1rem',
              borderRadius: '10px',
              border:
                filterType === 'REVISION_REQUIRED'
                  ? '2px solid var(--color-danger)'
                  : '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 600 }}>
              CẦN HIỆU CHỈNH LẠI
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '0.25rem' }}>
              {revisionRequiredCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
              Tài liệu bị từ chối
            </div>
          </div>
        </div>

        {/* Task List */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--color-card-muted)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.875rem' }}>
              Danh sách công việc ({filteredTasks.length})
            </span>
          </div>

          {isLoading ? (
            <div style={{ padding: '3.5rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--color-primary)' }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Đang tải danh sách công việc...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <CheckCircle2 size={40} style={{ color: 'var(--color-success)', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 0.4rem 0' }}>
                Không có công việc nào đang chờ xử lý
              </h3>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Tất cả các tác vụ quy trình hiện tại đã được giải quyết xong.
              </p>
            </div>
          ) : (
            <div>
              {filteredTasks.map((task, idx) => (
                <div
                  key={`${task.taskType}-${task.relatedEntityId || task.documentId}-${idx}`}
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: idx < filteredTasks.length - 1 ? '1px solid var(--color-border)' : 'none',
                    transition: 'background-color 0.15s',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                    <div style={{ marginTop: '0.15rem' }}>
                      <FileText size={18} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        {renderBadge(task.taskType)}
                        <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                          {task.documentTitle || `Tài liệu #${task.documentId}`}
                        </span>
                        {task.versionNumber && (
                          <span className="ent-badge ent-badge--neutral" style={{ fontSize: '0.75rem' }}>
                            v{task.versionNumber}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                        <span>Mã tài liệu: #{task.documentId}</span>
                        {task.createdAt && (
                          <span>Thời gian: {new Date(task.createdAt).toLocaleString('vi-VN')}</span>
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
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
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
