import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
} from 'lucide-react';

export const TaskCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchKeyword, pageSize]);

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

  const reviewPendingCount = useMemo(() => tasks.filter((t) => t.taskType === 'REVIEW_PENDING').length, [tasks]);
  const dispositionPendingCount = useMemo(() => tasks.filter((t) => t.taskType === 'DISPOSITION_PENDING').length, [tasks]);
  const revisionRequiredCount = useMemo(() => tasks.filter((t) => t.taskType === 'REVISION_REQUIRED').length, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Task Type filter
      if (filterType !== 'ALL' && t.taskType !== filterType) {
        return false;
      }
      // 2. Keyword Search
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const docTitle = (t.documentTitle || '').toLowerCase();
        const docId = String(t.documentId || '');
        const entityId = String(t.relatedEntityId || '');
        if (!docTitle.includes(kw) && !docId.includes(kw) && !entityId.includes(kw)) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, filterType, searchKeyword]);

  // Pagination calculation
  const totalTasks = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize);

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

      <main className="container" style={{ padding: '1.75rem 1.5rem', maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ListTodo size={20} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)', letterSpacing: '-0.01em' }}>
                Trung tâm công việc
              </h2>
            </div>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Nhiệm vụ phát sinh từ quy trình xét duyệt, tiêu hủy và vòng đời tài liệu của bạn
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchTasks}
            disabled={isLoading}
            id="refresh-tasks-btn"
            title="Làm mới danh sách công việc"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
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

        {/* Modern Aurora KPI Cards Grid */}
        <div className="task-kpi-grid">
          {/* Card: Tất cả công việc */}
          <div
            className={`task-kpi-card task-kpi-card--all ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterType('ALL')}
            role="button"
            tabIndex={0}
            title="Hiển thị tất cả công việc"
          >
            <div className="task-kpi-card__top">
              <span className="task-kpi-card__label">Tất cả công việc</span>
              <div className="task-kpi-card__icon-wrap">
                <Layers size={15} />
              </div>
            </div>
            <div className="task-kpi-card__value">{tasks.length}</div>
            <div className="task-kpi-card__desc">Toàn bộ nhiệm vụ trong hệ thống</div>
          </div>

          {/* Card: Chờ duyệt tài liệu */}
          {user?.role === 'ROLE_ADMIN' && (
            <>
              <div
                className={`task-kpi-card task-kpi-card--review ${filterType === 'REVIEW_PENDING' ? 'active' : ''}`}
                onClick={() => setFilterType('REVIEW_PENDING')}
                role="button"
                tabIndex={0}
                title="Lọc công việc chờ duyệt tài liệu"
              >
                <div className="task-kpi-card__top">
                  <span className="task-kpi-card__label">Chờ duyệt tài liệu</span>
                  <div className="task-kpi-card__icon-wrap">
                    <Clock size={15} />
                  </div>
                </div>
                <div className="task-kpi-card__value" style={{ color: 'var(--color-primary)' }}>
                  {reviewPendingCount}
                </div>
                <div className="task-kpi-card__desc">Yêu cầu phát sinh từ nhân viên</div>
              </div>

              <div
                className={`task-kpi-card task-kpi-card--disposition ${filterType === 'DISPOSITION_PENDING' ? 'active' : ''}`}
                onClick={() => setFilterType('DISPOSITION_PENDING')}
                role="button"
                tabIndex={0}
                title="Lọc công việc chờ duyệt tiêu hủy"
              >
                <div className="task-kpi-card__top">
                  <span className="task-kpi-card__label">Chờ duyệt tiêu hủy</span>
                  <div className="task-kpi-card__icon-wrap">
                    <Archive size={15} />
                  </div>
                </div>
                <div className="task-kpi-card__value" style={{ color: 'var(--color-warning)' }}>
                  {dispositionPendingCount}
                </div>
                <div className="task-kpi-card__desc">Hồ sơ đã hết thời hạn lưu trữ</div>
              </div>
            </>
          )}

          {/* Card: Cần hiệu chỉnh lại */}
          <div
            className={`task-kpi-card task-kpi-card--revision ${filterType === 'REVISION_REQUIRED' ? 'active' : ''}`}
            onClick={() => setFilterType('REVISION_REQUIRED')}
            role="button"
            tabIndex={0}
            title="Lọc tài liệu bị từ chối cần cập nhật phiên bản"
          >
            <div className="task-kpi-card__top">
              <span className="task-kpi-card__label">Cần hiệu chỉnh lại</span>
              <div className="task-kpi-card__icon-wrap">
                <AlertCircle size={15} />
              </div>
            </div>
            <div className="task-kpi-card__value" style={{ color: 'var(--color-danger)' }}>
              {revisionRequiredCount}
            </div>
            <div className="task-kpi-card__desc">Tài liệu bị từ chối yêu cầu bản mới</div>
          </div>
        </div>

        {/* Task List Container Card */}
        <div className="task-list-card">
          <div className="task-list-card__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
                Danh sách công việc
              </span>
              <span className="badge-role badge-role--staff" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                {totalTasks} nhiệm vụ
              </span>
            </div>

            {/* Toolbar Filter / Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div className="search-input-wrap" style={{ minWidth: '220px', maxWidth: '320px' }}>
                <Search size={15} className="search-icon-inside" />
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="Tìm theo tiêu đề, mã ID..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{ padding: '0.4rem 2rem 0.4rem 2.2rem', fontSize: '0.825rem' }}
                />
                {searchKeyword && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchKeyword('')}
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--color-primary)' }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Đang tải danh sách công việc...</p>
            </div>
          ) : totalTasks === 0 ? (
            <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <CheckCircle2 size={44} style={{ color: 'var(--color-success)', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 0.35rem 0' }}>
                Không có công việc nào đang chờ xử lý
              </h3>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                {searchKeyword || filterType !== 'ALL'
                  ? 'Không tìm thấy nhiệm vụ nào khớp với bộ lọc hiện tại.'
                  : 'Tất cả các tác vụ quy trình hiện tại đã được giải quyết xong.'}
              </p>
            </div>
          ) : (
            <div>
              {paginatedTasks.map((task, idx) => (
                <div
                  key={`${task.taskType}-${task.relatedEntityId || task.documentId}-${idx}`}
                  className="task-item-row"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: '260px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-bg)',
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <FileText size={18} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {renderBadge(task.taskType)}
                        <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.925rem' }}>
                          {task.documentTitle || `Tài liệu #${task.documentId}`}
                        </span>
                        {task.versionNumber && (
                          <span className="ent-badge ent-badge--neutral" style={{ fontSize: '0.72rem' }}>
                            v{task.versionNumber}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                        <span>Mã tài liệu: <strong>#{task.documentId}</strong></span>
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
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap', padding: '0.45rem 0.95rem' }}
                    >
                      <span>{getActionLabel(task.taskType)}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Tasks Pagination Bar */}
              {totalTasks > pageSize && (
                <div className="ent-pagination">
                  <div className="ent-pagination__info">
                    Hiển thị <strong>{startIndex + 1}</strong> -{' '}
                    <strong>{Math.min(startIndex + pageSize, totalTasks)}</strong> trên tổng số{' '}
                    <strong>{totalTasks}</strong> công việc
                  </div>

                  <div className="ent-pagination__controls">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Mỗi trang:</span>
                      <select
                        className="ent-pagination__select"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        aria-label="Chọn số công việc mỗi trang"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="ent-pagination__btn"
                      onClick={() => setCurrentPage(1)}
                      disabled={safePage === 1}
                      title="Trang đầu"
                      aria-label="Trang đầu"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      type="button"
                      className="ent-pagination__btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      title="Trang trước"
                      aria-label="Trang trước"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <span style={{ fontSize: '0.85rem', margin: '0 0.5rem', color: 'var(--color-text-main)', fontWeight: 600 }}>
                      Trang {safePage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      className="ent-pagination__btn"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      title="Trang sau"
                      aria-label="Trang sau"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      type="button"
                      className="ent-pagination__btn"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={safePage === totalPages}
                      title="Trang cuối"
                      aria-label="Trang cuối"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
