import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import {
  taskApi,
  TaskDto,
  ManualTaskItem,
  ManualTaskSummary,
  AssigneeOption,
  ManualTaskPriority,
  ManualTaskStatus,
} from '../api/taskApi';
import { documentApi, DocumentItem } from '../api/documentApi';
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
  Plus,
  LayoutGrid,
  List,
  Calendar,
  User,
  AlertTriangle,
  History,
  Edit2,
  Trash2,
  Eye,
  Check,
  Send,
} from 'lucide-react';

export const TaskCenterPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isStaff = user?.role === 'ROLE_STAFF';
  const canManageTasks = isAdmin || isStaff;

  // Active Main Tab: 'manual' or 'system'
  const [activeTab, setActiveTab] = useState<'manual' | 'system'>('manual');

  // View Mode for Manual Tasks: 'list' or 'kanban'
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  // -------------------------------------------------------------------------
  // State: System Derived Tasks
  // -------------------------------------------------------------------------
  const [systemTasks, setSystemTasks] = useState<TaskDto[]>([]);
  const [isSystemLoading, setIsSystemLoading] = useState<boolean>(true);
  const [systemFilterType, setSystemFilterType] = useState<string>('ALL');
  const [systemSearchKeyword, setSystemSearchKeyword] = useState<string>('');
  const [systemCurrentPage, setSystemCurrentPage] = useState<number>(1);
  const [systemPageSize, setSystemPageSize] = useState<number>(10);

  // -------------------------------------------------------------------------
  // State: Manual Tasks
  // -------------------------------------------------------------------------
  const [manualTasks, setManualTasks] = useState<ManualTaskItem[]>([]);
  const [manualSummary, setManualSummary] = useState<ManualTaskSummary>({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    cancelled: 0,
    overdue: 0,
  });
  const [isManualLoading, setIsManualLoading] = useState<boolean>(true);
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<DocumentItem[]>([]);

  // Manual Filter state
  const [manualSearch, setManualSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  // Notification alert state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // -------------------------------------------------------------------------
  // Modal States
  // -------------------------------------------------------------------------
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected Task for Detail or Edit
  const [selectedTask, setSelectedTask] = useState<ManualTaskItem | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState<{
    id?: number;
    title: string;
    description: string;
    assignee: string;
    priority: ManualTaskPriority;
    status?: ManualTaskStatus;
    dueDate: string;
    documentId: string;
    notes: string;
  }>({
    title: '',
    description: '',
    assignee: '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '',
    documentId: '',
    notes: '',
  });

  // Quick Status Update comment
  const [statusUpdateNote, setStatusUpdateNote] = useState<string>('');

  // -------------------------------------------------------------------------
  // Fetch System Tasks
  // -------------------------------------------------------------------------
  const fetchSystemTasks = useCallback(async () => {
    try {
      setIsSystemLoading(true);
      const data = await taskApi.getDerivedTasks();
      setSystemTasks(data);
    } catch (err: any) {
      console.error('Failed to load system tasks:', err);
    } finally {
      setIsSystemLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Fetch Manual Tasks & Metadata
  // -------------------------------------------------------------------------
  const fetchManualTasks = useCallback(async () => {
    try {
      setIsManualLoading(true);
      const [tasksRes, summaryRes] = await Promise.all([
        taskApi.getManualTasks({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
          assignee: assigneeFilter !== 'ALL' ? assigneeFilter : undefined,
          search: manualSearch.trim() || undefined,
          overdue: overdueOnly ? true : undefined,
          size: 100,
        }),
        taskApi.getManualTaskSummary(),
      ]);
      setManualTasks(tasksRes.content || []);
      setManualSummary(summaryRes);
    } catch (err: any) {
      console.error('Failed to load manual tasks:', err);
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể tải danh sách công việc',
      });
    } finally {
      setIsManualLoading(false);
    }
  }, [statusFilter, priorityFilter, assigneeFilter, manualSearch, overdueOnly]);

  // Load assignees and documents once
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [assignees, docs] = await Promise.all([
          taskApi.getAssigneeOptions(),
          documentApi.getAllDocuments(),
        ]);
        setAssigneeOptions(assignees);
        setAvailableDocuments(docs || []);
      } catch (err) {
        console.warn('Failed to load assignees or documents:', err);
      }
    };
    loadMetadata();
  }, []);

  // Refresh tasks on mount and notification events
  useEffect(() => {
    fetchSystemTasks();
    fetchManualTasks();

    const handleUpdate = () => {
      fetchSystemTasks();
      fetchManualTasks();
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, [fetchSystemTasks, fetchManualTasks]);

  // Handle System Task Actions
  const handleSystemAction = (task: TaskDto) => {
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

  // -------------------------------------------------------------------------
  // Manual Task CRUD Handlers
  // -------------------------------------------------------------------------
  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      assignee: assigneeOptions.length > 0 ? assigneeOptions[0].username : (user?.username || ''),
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: '',
      documentId: '',
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setNotification({ type: 'error', text: 'Vui lòng nhập tiêu đề công việc.' });
      return;
    }
    if (!formData.assignee) {
      setNotification({ type: 'error', text: 'Vui lòng chọn người phụ trách công việc.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await taskApi.createManualTask({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        assignee: formData.assignee,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        documentId: formData.documentId ? Number(formData.documentId) : undefined,
        notes: formData.notes.trim() || undefined,
      });

      setNotification({ type: 'success', text: 'Tạo công việc mới thành công!' });
      setIsCreateModalOpen(false);
      fetchManualTasks();
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể tạo công việc. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetailModal = async (task: ManualTaskItem) => {
    try {
      const detailed = await taskApi.getManualTaskById(task.id);
      setSelectedTask(detailed);
      setStatusUpdateNote('');
      setIsDetailModalOpen(true);
    } catch {
      setSelectedTask(task);
      setStatusUpdateNote('');
      setIsDetailModalOpen(true);
    }
  };

  const openEditModal = (task: ManualTaskItem) => {
    setSelectedTask(task);
    setFormData({
      id: task.id,
      title: task.title,
      description: task.description || '',
      assignee: task.assignee || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.substring(0, 16) : '',
      documentId: task.documentId ? String(task.documentId) : '',
      notes: task.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!formData.title.trim()) {
      setNotification({ type: 'error', text: 'Vui lòng nhập tiêu đề công việc.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await taskApi.updateManualTask(selectedTask.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        assignee: formData.assignee,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        documentId: formData.documentId ? Number(formData.documentId) : undefined,
        notes: formData.notes.trim() || undefined,
      });

      setNotification({ type: 'success', text: 'Cập nhật công việc thành công!' });
      setIsEditModalOpen(false);
      fetchManualTasks();
      if (isDetailModalOpen) {
        const refreshed = await taskApi.getManualTaskById(selectedTask.id);
        setSelectedTask(refreshed);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể cập nhật công việc.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (task: ManualTaskItem, newStatus: ManualTaskStatus, note?: string) => {
    try {
      const updated = await taskApi.updateManualTaskStatus(task.id, {
        status: newStatus,
        note: note || undefined,
      });
      setNotification({
        type: 'success',
        text: `Đã đổi trạng thái công việc #${task.id} sang ${getStatusLabel(newStatus)}`,
      });
      fetchManualTasks();
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask(updated);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể cập nhật trạng thái.',
      });
    }
  };

  const handleDeleteTask = async (task: ManualTaskItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa công việc "${task.title}" (Mã #${task.id})?`)) {
      return;
    }

    try {
      await taskApi.deleteManualTask(task.id);
      setNotification({ type: 'success', text: `Đã xóa công việc #${task.id}` });
      if (isDetailModalOpen) setIsDetailModalOpen(false);
      fetchManualTasks();
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể xóa công việc.',
      });
    }
  };

  // Helper Labels & Badges
  const getPriorityLabel = (priority: ManualTaskPriority) => {
    switch (priority) {
      case 'LOW':
        return 'Thấp';
      case 'MEDIUM':
        return 'Trung bình';
      case 'HIGH':
        return 'Cao';
      case 'URGENT':
        return 'Khẩn cấp';
      default:
        return priority;
    }
  };

  const renderPriorityPill = (priority: ManualTaskPriority) => {
    const pClass = `task-priority-pill task-priority-pill--${priority.toLowerCase()}`;
    return <span className={pClass}>{getPriorityLabel(priority)}</span>;
  };

  const getStatusLabel = (status: ManualTaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'Cần làm';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'DONE':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const renderStatusBadge = (status: ManualTaskStatus) => {
    const sClass = `task-status-badge task-status-badge--${status.toLowerCase()}`;
    return <span className={sClass}>{getStatusLabel(status)}</span>;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // -------------------------------------------------------------------------
  // Filtering & Grouping for Kanban
  // -------------------------------------------------------------------------
  const kanbanColumns = useMemo(() => {
    const cols: Record<ManualTaskStatus, ManualTaskItem[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      CANCELLED: [],
    };
    manualTasks.forEach((t) => {
      if (cols[t.status]) {
        cols[t.status].push(t);
      } else {
        cols.TODO.push(t);
      }
    });
    return cols;
  }, [manualTasks]);

  // System Derived Tasks Filter & Pagination
  const reviewPendingCount = useMemo(
    () => systemTasks.filter((t) => t.taskType === 'REVIEW_PENDING').length,
    [systemTasks]
  );
  const dispositionPendingCount = useMemo(
    () => systemTasks.filter((t) => t.taskType === 'DISPOSITION_PENDING').length,
    [systemTasks]
  );
  const revisionRequiredCount = useMemo(
    () => systemTasks.filter((t) => t.taskType === 'REVISION_REQUIRED').length,
    [systemTasks]
  );

  const filteredSystemTasks = useMemo(() => {
    return systemTasks.filter((t) => {
      if (systemFilterType !== 'ALL' && t.taskType !== systemFilterType) {
        return false;
      }
      if (systemSearchKeyword.trim()) {
        const kw = systemSearchKeyword.toLowerCase();
        const docTitle = (t.documentTitle || '').toLowerCase();
        const docId = String(t.documentId || '');
        const entityId = String(t.relatedEntityId || '');
        if (!docTitle.includes(kw) && !docId.includes(kw) && !entityId.includes(kw)) {
          return false;
        }
      }
      return true;
    });
  }, [systemTasks, systemFilterType, systemSearchKeyword]);

  const totalSystemTasks = filteredSystemTasks.length;
  const totalSystemPages = Math.max(1, Math.ceil(totalSystemTasks / systemPageSize));
  const safeSystemPage = Math.min(systemCurrentPage, totalSystemPages);
  const systemStartIndex = (safeSystemPage - 1) * systemPageSize;
  const paginatedSystemTasks = filteredSystemTasks.slice(systemStartIndex, systemStartIndex + systemPageSize);

  return (
    <div className="page-layout">
      <Navbar currentView="tasks" />

      <main className="container" style={{ padding: '1.75rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Main Page Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ListTodo size={22} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--color-text-main)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Trung tâm công việc
                </h2>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  Quản lý công việc phân công và theo dõi các nhiệm vụ quy trình tài liệu EDMS
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {activeTab === 'manual' && canManageTasks && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreateModal}
                id="btn-create-task"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Plus size={16} />
                <span>Giao công việc mới</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (activeTab === 'manual') fetchManualTasks();
                else fetchSystemTasks();
              }}
              disabled={isManualLoading || isSystemLoading}
              id="refresh-tasks-btn"
              title="Làm mới danh sách"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              {isManualLoading || isSystemLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`ent-alert ${
              notification.type === 'error' ? 'ent-alert--danger' : 'ent-alert--success'
            }`}
            style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>{notification.text}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tab Navigation Strip */}
        <div className="ent-tabs-nav">
          <button
            type="button"
            className={`ent-tab-button ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
            id="tab-manual-tasks"
          >
            <ListTodo size={17} />
            <span>Công việc phân công</span>
            <span className="ent-tab-badge">{manualSummary.total}</span>
          </button>

          <button
            type="button"
            className={`ent-tab-button ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
            id="tab-system-tasks"
          >
            <Clock size={17} />
            <span>Nhiệm vụ hệ thống (Tài liệu & Tiêu hủy)</span>
            <span className="ent-tab-badge">{systemTasks.length}</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: MANUAL TASKS (QUẢN LÝ CÔNG VIỆC THỦ CÔNG)                 */}
        {/* ================================================================= */}
        {activeTab === 'manual' && (
          <div>
            {/* KPI Summary Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              {/* Card 1: Tổng cộng */}
              <div
                className="task-kpi-card"
                onClick={() => setStatusFilter('ALL')}
                style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-primary)' }}
              >
                <div className="task-kpi-card__top">
                  <span className="task-kpi-card__label">Tổng công việc</span>
                  <div className="task-kpi-card__icon-wrap">
                    <Layers size={15} />
                  </div>
                </div>
                <div className="task-kpi-card__value">{manualSummary.total}</div>
                <div className="task-kpi-card__desc">Toàn bộ công việc trong phạm vi</div>
              </div>

              {/* Card 2: Cần làm */}
              <div
                className="task-kpi-card"
                onClick={() => setStatusFilter('TODO')}
                style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-secondary)' }}
              >
                <div className="task-kpi-card__top">
                  <span className="task-kpi-card__label">Cần làm</span>
                  <div className="task-kpi-card__icon-wrap">
                    <Clock size={15} />
                  </div>
                </div>
                <div className="task-kpi-card__value" style={{ color: 'var(--color-secondary)' }}>
                  {manualSummary.todo}
                </div>
                <div className="task-kpi-card__desc">Đang chờ tiếp nhận xử lý</div>
              </div>

              {/* Card 3: Đang thực hiện */}
              <div
                className="task-kpi-card"
                onClick={() => setStatusFilter('IN_PROGRESS')}
                style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-info)' }}
              >
                <div className="task-kpi-card__top">
                  <span className="task-kpi-card__label">Đang thực hiện</span>
                  <div className="task-kpi-card__icon-wrap">
                    <RefreshCw size={15} />
                  </div>
                </div>
                <div className="task-kpi-card__value" style={{ color: 'var(--color-info)' }}>
                  {manualSummary.inProgress}
                </div>
                <div className="task-kpi-card__desc">Đang trong tiến trình giải quyết</div>
              </div>

              {/* Card 4: Quá hạn */}
              <div
                className="task-kpi-card"
                onClick={() => setOverdueOnly((prev) => !prev)}
                style={{
                  cursor: 'pointer',
                  borderLeft: '4px solid var(--color-danger)',
                  backgroundColor: overdueOnly ? 'var(--color-danger-bg)' : undefined,
                }}
              >
                <div className="task-kpi-card__top">
                  <span className="task-kpi-card__label">Quá thời hạn</span>
                  <div className="task-kpi-card__icon-wrap" style={{ color: 'var(--color-danger)' }}>
                    <AlertTriangle size={15} />
                  </div>
                </div>
                <div className="task-kpi-card__value" style={{ color: 'var(--color-danger)' }}>
                  {manualSummary.overdue}
                </div>
                <div className="task-kpi-card__desc">
                  {overdueOnly ? 'Đang bật bộ lọc quá hạn' : 'Đã vượt mốc thời hạn quy định'}
                </div>
              </div>

              {/* Card 5: Hoàn thành */}
              <div
                className="task-kpi-card"
                onClick={() => setStatusFilter('DONE')}
                style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-success)' }}
              >
                <div className="task-kpi-card__top">
                  <span className="task-kpi-card__label">Hoàn thành</span>
                  <div className="task-kpi-card__icon-wrap" style={{ color: 'var(--color-success)' }}>
                    <CheckCircle2 size={15} />
                  </div>
                </div>
                <div className="task-kpi-card__value" style={{ color: 'var(--color-success)' }}>
                  {manualSummary.done}
                </div>
                <div className="task-kpi-card__desc">Nhiệm vụ đã kết thúc tốt đẹp</div>
              </div>
            </div>

            {/* Filter and View Toolbar */}
            <div
              className="card"
              style={{
                padding: '0.85rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              {/* Left: Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', flex: 1 }}>
                {/* Search */}
                <div className="search-input-wrap" style={{ minWidth: '220px', maxWidth: '300px' }}>
                  <Search size={14} className="search-icon-inside" />
                  <input
                    type="text"
                    className="search-input-field"
                    placeholder="Tìm theo tiêu đề, mô tả, ID..."
                    value={manualSearch}
                    onChange={(e) => setManualSearch(e.target.value)}
                    style={{ padding: '0.35rem 1.8rem 0.35rem 2.1rem', fontSize: '0.825rem' }}
                  />
                  {manualSearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setManualSearch('')}
                      aria-label="Xóa từ khóa"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <select
                  className="form-control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.825rem' }}
                  aria-label="Lọc theo trạng thái"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="TODO">Cần làm (TODO)</option>
                  <option value="IN_PROGRESS">Đang làm (IN_PROGRESS)</option>
                  <option value="DONE">Hoàn thành (DONE)</option>
                  <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                </select>

                {/* Priority Filter */}
                <select
                  className="form-control"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.825rem' }}
                  aria-label="Lọc theo mức ưu tiên"
                >
                  <option value="ALL">Tất cả mức ưu tiên</option>
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HIGH">Cao</option>
                  <option value="URGENT">Khẩn cấp</option>
                </select>

                {/* Assignee Filter (Admins see all accounts, Staff/Users see self + all) */}
                <select
                  className="form-control"
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.825rem' }}
                  aria-label="Lọc theo người phụ trách"
                >
                  <option value="ALL">Tất cả người phụ trách</option>
                  {user && <option value={user.username}>Giao cho tôi ({user.username})</option>}
                  {assigneeOptions
                    .filter((a) => a.username !== user?.username)
                    .map((a) => (
                      <option key={a.username} value={a.username}>
                        {a.fullName} (@{a.username})
                      </option>
                    ))}
                </select>

                {/* Overdue quick toggle */}
                <button
                  type="button"
                  className={`btn btn-sm ${overdueOnly ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setOverdueOnly((prev) => !prev)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                >
                  <AlertTriangle size={13} />
                  <span>Quá hạn</span>
                </button>
              </div>

              {/* Right: View Switcher (List vs Kanban) */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'var(--color-surface-hover)',
                  padding: '3px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  id="btn-view-kanban"
                  title="Hiển thị dạng Bảng Kanban"
                >
                  <LayoutGrid size={14} />
                  <span>Kanban</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  id="btn-view-list"
                  title="Hiển thị dạng Danh sách"
                >
                  <List size={14} />
                  <span>Danh sách</span>
                </button>
              </div>
            </div>

            {/* Task Content: Kanban View or List View */}
            {isManualLoading ? (
              <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--color-primary)' }} />
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Đang tải dữ liệu công việc...</p>
              </div>
            ) : manualTasks.length === 0 ? (
              <div className="card" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <CheckCircle2 size={44} style={{ color: 'var(--color-success)', margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 0.35rem 0' }}>
                  Không tìm thấy công việc nào
                </h3>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                  Chưa có công việc nào khớp với các bộ lọc hoặc chưa có nhiệm vụ nào được giao.
                </p>
                {canManageTasks && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={openCreateModal}
                    style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Plus size={15} /> Giao công việc đầu tiên
                  </button>
                )}
              </div>
            ) : viewMode === 'kanban' ? (
              /* ============================================================= */
              /* KANBAN VIEW                                                   */
              /* ============================================================= */
              <div className="kanban-grid">
                {(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as ManualTaskStatus[]).map((statusKey) => {
                  const tasksInCol = kanbanColumns[statusKey] || [];
                  return (
                    <div key={statusKey} className="kanban-col">
                      <div className="kanban-col__header">
                        <div className="kanban-col__title">
                          {statusKey === 'TODO' && <Clock size={16} style={{ color: 'var(--color-secondary)' }} />}
                          {statusKey === 'IN_PROGRESS' && <RefreshCw size={16} style={{ color: 'var(--color-info)' }} />}
                          {statusKey === 'DONE' && <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />}
                          {statusKey === 'CANCELLED' && <X size={16} style={{ color: 'var(--color-text-muted)' }} />}
                          <span>{getStatusLabel(statusKey)}</span>
                        </div>
                        <span className="kanban-col__counter">{tasksInCol.length}</span>
                      </div>

                      <div className="kanban-col__body">
                        {tasksInCol.map((task) => (
                          <div
                            key={task.id}
                            className="kanban-card"
                            onClick={() => openDetailModal(task)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="kanban-card__title">
                              #{task.id} - {task.title}
                            </div>

                            {task.description && (
                              <div className="kanban-card__desc">{task.description}</div>
                            )}

                            <div className="kanban-card__meta">
                              {renderPriorityPill(task.priority)}

                              {task.overdue && (
                                <span className="task-overdue-tag">
                                  <AlertTriangle size={11} /> Quá hạn
                                </span>
                              )}

                              {task.documentId && (
                                <span
                                  className="ent-badge ent-badge--info"
                                  style={{ fontSize: '0.7rem' }}
                                  title={task.documentTitle || `Tài liệu #${task.documentId}`}
                                >
                                  <FileText size={11} /> #{task.documentId}
                                </span>
                              )}
                            </div>

                            <div className="kanban-card__footer">
                              <div className="kanban-card__assignee" title={`Người phụ trách: ${task.assigneeFullName || task.assignee}`}>
                                <User size={13} />
                                <span>{task.assigneeFullName || task.assignee || 'Chưa giao'}</span>
                              </div>

                              {task.dueDate && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem' }}>
                                  <Calendar size={12} />
                                  <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                              )}
                            </div>

                            {/* Kanban Quick Status Action Buttons */}
                            <div
                              style={{
                                marginTop: '0.5rem',
                                paddingTop: '0.4rem',
                                borderTop: '1px dashed var(--color-border-subtle)',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.35rem',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {task.status === 'TODO' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                                  onClick={() => handleQuickStatusChange(task, 'IN_PROGRESS')}
                                >
                                  Bắt đầu làm
                                </button>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                                  onClick={() => handleQuickStatusChange(task, 'DONE')}
                                >
                                  Hoàn thành
                                </button>
                              )}
                              {task.status === 'DONE' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                                  onClick={() => handleQuickStatusChange(task, 'IN_PROGRESS')}
                                >
                                  Mở lại
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {tasksInCol.length === 0 && (
                          <div
                            style={{
                              padding: '2rem 1rem',
                              textAlign: 'center',
                              color: 'var(--color-text-muted)',
                              fontSize: '0.8rem',
                              border: '1px dashed var(--color-border)',
                              borderRadius: 'var(--radius-md)',
                            }}
                          >
                            Không có công việc ở mục này
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ============================================================= */
              /* LIST VIEW                                                     */
              /* ============================================================= */
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Mã ID</th>
                        <th>Tiêu đề & Nội dung</th>
                        <th>Người phụ trách</th>
                        <th>Mức ưu tiên</th>
                        <th>Hạn xử lý</th>
                        <th>Trạng thái</th>
                        <th>Tài liệu liên kết</th>
                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualTasks.map((task) => (
                        <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => openDetailModal(task)}>
                          <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            #{task.id}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.875rem' }}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div
                                style={{
                                  fontSize: '0.775rem',
                                  color: 'var(--color-text-muted)',
                                  maxWidth: '360px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}>
                              <User size={14} style={{ color: 'var(--color-text-muted)' }} />
                              <span style={{ fontWeight: 500 }}>{task.assigneeFullName || task.assignee}</span>
                            </div>
                            <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                              Bởi: @{task.createdBy}
                            </span>
                          </td>
                          <td>{renderPriorityPill(task.priority)}</td>
                          <td>
                            {task.dueDate ? (
                              <div style={{ fontSize: '0.8rem' }}>
                                <div>{formatDate(task.dueDate)}</div>
                                {task.overdue && (
                                  <span className="task-overdue-tag" style={{ marginTop: '2px' }}>
                                    <AlertTriangle size={11} /> Quá hạn
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Không có</span>
                            )}
                          </td>
                          <td>{renderStatusBadge(task.status)}</td>
                          <td>
                            {task.documentId ? (
                              <span
                                className="ent-badge ent-badge--info"
                                style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                title={task.documentTitle || `Mã #${task.documentId}`}
                              >
                                <FileText size={12} />
                                <span>{task.documentTitle ? task.documentTitle.substring(0, 20) + '...' : `#${task.documentId}`}</span>
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>-</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => openDetailModal(task)}
                                title="Xem chi tiết & lịch sử"
                              >
                                <Eye size={14} />
                              </button>

                              {(isAdmin || task.createdBy === user?.username) && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openEditModal(task)}
                                  title="Chỉnh sửa công việc"
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}

                              {(isAdmin || task.createdBy === user?.username) && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteTask(task)}
                                  title="Xóa công việc"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: SYSTEM DERIVED TASKS (GIỮ NGUYÊN 100% CƠ CHẾ CŨ)           */}
        {/* ================================================================= */}
        {activeTab === 'system' && (
          <div>
            {/* System Derived KPI Cards Grid */}
            <div className="task-kpi-grid">
              <div
                className={`task-kpi-card task-kpi-card--all ${systemFilterType === 'ALL' ? 'active' : ''}`}
                onClick={() => setSystemFilterType('ALL')}
                role="button"
                tabIndex={0}
                title="Hiển thị tất cả nhiệm vụ hệ thống"
              >
                <div className="task-kpi-card__top">
                  <span className="task-kpi-card__label">Tất cả nhiệm vụ</span>
                  <div className="task-kpi-card__icon-wrap">
                    <Layers size={15} />
                  </div>
                </div>
                <div className="task-kpi-card__value">{systemTasks.length}</div>
                <div className="task-kpi-card__desc">Toàn bộ tác vụ quy trình</div>
              </div>

              {isAdmin && (
                <>
                  <div
                    className={`task-kpi-card task-kpi-card--review ${systemFilterType === 'REVIEW_PENDING' ? 'active' : ''}`}
                    onClick={() => setSystemFilterType('REVIEW_PENDING')}
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
                    className={`task-kpi-card task-kpi-card--disposition ${systemFilterType === 'DISPOSITION_PENDING' ? 'active' : ''}`}
                    onClick={() => setSystemFilterType('DISPOSITION_PENDING')}
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

              <div
                className={`task-kpi-card task-kpi-card--revision ${systemFilterType === 'REVISION_REQUIRED' ? 'active' : ''}`}
                onClick={() => setSystemFilterType('REVISION_REQUIRED')}
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

            {/* System Tasks List Container Card */}
            <div className="task-list-card">
              <div className="task-list-card__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
                    Danh sách nhiệm vụ quy trình
                  </span>
                  <span className="badge-role badge-role--staff" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                    {totalSystemTasks} nhiệm vụ
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <div className="search-input-wrap" style={{ minWidth: '220px', maxWidth: '320px' }}>
                    <Search size={15} className="search-icon-inside" />
                    <input
                      type="text"
                      className="search-input-field"
                      placeholder="Tìm theo tiêu đề, mã ID..."
                      value={systemSearchKeyword}
                      onChange={(e) => setSystemSearchKeyword(e.target.value)}
                      style={{ padding: '0.4rem 2rem 0.4rem 2.2rem', fontSize: '0.825rem' }}
                    />
                    {systemSearchKeyword && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => setSystemSearchKeyword('')}
                        aria-label="Xóa từ khóa tìm kiếm"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isSystemLoading ? (
                <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--color-primary)' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Đang tải danh sách nhiệm vụ...</p>
                </div>
              ) : totalSystemTasks === 0 ? (
                <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <CheckCircle2 size={44} style={{ color: 'var(--color-success)', margin: '0 auto 0.75rem' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 0.35rem 0' }}>
                    Không có nhiệm vụ quy trình nào đang chờ xử lý
                  </h3>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    Tất cả các tác vụ quy trình hiện tại đã được giải quyết xong.
                  </p>
                </div>
              ) : (
                <div>
                  {paginatedSystemTasks.map((task, idx) => (
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
                            {task.taskType === 'REVIEW_PENDING' && (
                              <span className="ent-badge ent-badge--info">
                                <Clock size={12} /> Chờ duyệt tài liệu
                              </span>
                            )}
                            {task.taskType === 'DISPOSITION_PENDING' && (
                              <span className="ent-badge ent-badge--warning">
                                <Archive size={12} /> Chờ duyệt tiêu hủy
                              </span>
                            )}
                            {task.taskType === 'REVISION_REQUIRED' && (
                              <span className="ent-badge ent-badge--danger">
                                <AlertCircle size={12} /> Cần hiệu chỉnh lại
                              </span>
                            )}

                            <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.925rem' }}>
                              {task.documentTitle || `Tài liệu #${task.documentId}`}
                            </span>
                            {task.versionNumber && (
                              <span className="ent-badge ent-badge--neutral" style={{ fontSize: '0.72rem' }}>
                                v{task.versionNumber}
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.85rem',
                              fontSize: '0.8rem',
                              color: 'var(--color-text-muted)',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span>
                              Mã tài liệu: <strong>#{task.documentId}</strong>
                            </span>
                            {task.createdAt && <span>Thời gian: {formatDate(task.createdAt)}</span>}
                            {task.status && (
                              <span>
                                Trạng thái: <strong>{task.status}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSystemAction(task)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            whiteSpace: 'nowrap',
                            padding: '0.45rem 0.95rem',
                          }}
                        >
                          <span>
                            {task.taskType === 'REVIEW_PENDING'
                              ? 'Xử lý xét duyệt'
                              : task.taskType === 'DISPOSITION_PENDING'
                              ? 'Xử lý tiêu hủy'
                              : 'Tải phiên bản mới'}
                          </span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* System Tasks Pagination Bar */}
                  {totalSystemTasks > systemPageSize && (
                    <div className="ent-pagination">
                      <div className="ent-pagination__info">
                        Hiển thị <strong>{systemStartIndex + 1}</strong> -{' '}
                        <strong>{Math.min(systemStartIndex + systemPageSize, totalSystemTasks)}</strong> trên tổng số{' '}
                        <strong>{totalSystemTasks}</strong> nhiệm vụ
                      </div>

                      <div className="ent-pagination__controls">
                        <select
                          className="ent-pagination__select"
                          value={systemPageSize}
                          onChange={(e) => setSystemPageSize(Number(e.target.value))}
                          aria-label="Chọn số nhiệm vụ mỗi trang"
                        >
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                          <option value={25}>25</option>
                        </select>

                        <button
                          type="button"
                          className="ent-pagination__btn"
                          onClick={() => setSystemCurrentPage(1)}
                          disabled={safeSystemPage === 1}
                          title="Trang đầu"
                        >
                          <ChevronsLeft size={16} />
                        </button>
                        <button
                          type="button"
                          className="ent-pagination__btn"
                          onClick={() => setSystemCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={safeSystemPage === 1}
                          title="Trang trước"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        <span style={{ fontSize: '0.85rem', margin: '0 0.5rem', fontWeight: 600 }}>
                          Trang {safeSystemPage} / {totalSystemPages}
                        </span>

                        <button
                          type="button"
                          className="ent-pagination__btn"
                          onClick={() => setSystemCurrentPage((p) => Math.min(totalSystemPages, p + 1))}
                          disabled={safeSystemPage === totalSystemPages}
                          title="Trang sau"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <button
                          type="button"
                          className="ent-pagination__btn"
                          onClick={() => setSystemCurrentPage(totalSystemPages)}
                          disabled={safeSystemPage === totalSystemPages}
                          title="Trang cuối"
                        >
                          <ChevronsRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL 1: TẠO CÔNG VIỆC MỚI (CREATE TASK)                         */}
        {/* ================================================================= */}
        {isCreateModalOpen && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--md">
              <div className="ent-modal__header">
                <div className="ent-modal__title-group">
                  <h3 className="ent-modal__title">Giao công việc mới</h3>
                  <p className="ent-modal__subtitle">
                    Nhập thông tin nhiệm vụ và phân công cho nhân viên trong hệ thống
                  </p>
                </div>
                <button
                  type="button"
                  className="ent-modal__close-btn"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="ent-modal__body">
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">
                      Tiêu đề công việc <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: Kiểm tra tính pháp lý của hồ sơ hợp đồng"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Mô tả chi tiết</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Mô tả các yêu cầu cần hoàn thành..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Người phụ trách <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <select
                        className="form-control"
                        value={formData.assignee}
                        onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                        required
                      >
                        <option value="">-- Chọn nhân viên --</option>
                        {assigneeOptions.map((a) => (
                          <option key={a.username} value={a.username}>
                            {a.fullName} (@{a.username} - {a.role.replace('ROLE_', '')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mức ưu tiên</label>
                      <select
                        className="form-control"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as ManualTaskPriority })}
                      >
                        <option value="LOW">Thấp (LOW)</option>
                        <option value="MEDIUM">Trung bình (MEDIUM)</option>
                        <option value="HIGH">Cao (HIGH)</option>
                        <option value="URGENT">Khẩn cấp (URGENT)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Hạn hoàn thành (Deadline)</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tài liệu liên quan (Tùy chọn)</label>
                      <select
                        className="form-control"
                        value={formData.documentId}
                        onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                      >
                        <option value="">-- Không liên kết --</option>
                        {availableDocuments.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            #{doc.id} - {doc.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ghi chú bổ sung</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ghi chú thêm cho người nhận việc..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="ent-modal__footer">
                  <button
                    type="button"
                    className="ent-btn ent-btn--secondary ent-btn--md"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="ent-btn ent-btn--primary ent-btn--md"
                    disabled={isSubmitting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>Giao việc ngay</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL 2: XEM CHI TIẾT & LỊCH SỬ HOẠT ĐỘNG (DETAIL & TIMELINE)   */}
        {/* ================================================================= */}
        {isDetailModalOpen && selectedTask && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--lg">
              <div className="ent-modal__header">
                <div className="ent-modal__title-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                      #{selectedTask.id}
                    </span>
                    {renderStatusBadge(selectedTask.status)}
                    {renderPriorityPill(selectedTask.priority)}
                    {selectedTask.overdue && (
                      <span className="task-overdue-tag">
                        <AlertTriangle size={12} /> Quá hạn
                      </span>
                    )}
                  </div>
                  <h3 className="ent-modal__title">{selectedTask.title}</h3>
                </div>
                <button
                  type="button"
                  className="ent-modal__close-btn"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="ent-modal__body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Task Metadata Box */}
                <div
                  style={{
                    background: 'var(--color-surface-hover)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    border: '1px solid var(--color-border)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.825rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Người phụ trách: </span>
                    <strong>{selectedTask.assigneeFullName || selectedTask.assignee || 'Chưa phân công'}</strong>
                    {selectedTask.assignee && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                        {' '}(@{selectedTask.assignee})
                      </span>
                    )}
                  </div>

                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Người giao việc: </span>
                    <strong>{selectedTask.createdByFullName || selectedTask.createdBy}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Thời hạn xử lý: </span>
                    {selectedTask.dueDate ? (
                      <strong style={{ color: selectedTask.overdue ? 'var(--color-danger)' : undefined }}>
                        {formatDate(selectedTask.dueDate)}
                      </strong>
                    ) : (
                      <span>Không có</span>
                    )}
                  </div>

                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Ngày tạo: </span>
                    <span>{formatDate(selectedTask.createdAt)}</span>
                  </div>

                  {selectedTask.documentId && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Tài liệu liên quan: </span>
                      <span className="ent-badge ent-badge--info">
                        <FileText size={12} /> #{selectedTask.documentId} - {selectedTask.documentTitle || 'Tài liệu'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.4rem', color: 'var(--color-text-main)' }}>
                      Mô tả công việc:
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                {/* Latest Notes */}
                {selectedTask.notes && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.4rem', color: 'var(--color-text-main)' }}>
                      Ghi chú hiện tại:
                    </h4>
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--color-surface-hover)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '3px solid var(--color-primary)',
                        fontSize: '0.825rem',
                      }}
                    >
                      {selectedTask.notes}
                    </div>
                  </div>
                )}

                {/* Quick Status Update Section */}
                <div
                  style={{
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.65rem', color: 'var(--color-text-main)' }}>
                    Cập nhật trạng thái & Thêm ghi chú:
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                    {(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as ManualTaskStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        className={`btn btn-sm ${selectedTask.status === st ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleQuickStatusChange(selectedTask, st, statusUpdateNote)}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        {selectedTask.status === st && <Check size={12} style={{ marginRight: '0.25rem' }} />}
                        <span>{getStatusLabel(st)}</span>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập ghi chú hoặc lý do thay đổi trạng thái..."
                      value={statusUpdateNote}
                      onChange={(e) => setStatusUpdateNote(e.target.value)}
                      style={{ fontSize: '0.825rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        if (statusUpdateNote.trim()) {
                          handleQuickStatusChange(selectedTask, selectedTask.status, statusUpdateNote);
                          setStatusUpdateNote('');
                        }
                      }}
                      disabled={!statusUpdateNote.trim()}
                    >
                      Lưu ghi chú
                    </button>
                  </div>
                </div>

                {/* Activity History Timeline */}
                <div>
                  <h4
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      margin: '0 0 0.75rem',
                      color: 'var(--color-text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <History size={16} /> Lịch sử hoạt động ({selectedTask.activities?.length || 0})
                  </h4>

                  {selectedTask.activities && selectedTask.activities.length > 0 ? (
                    <div className="task-timeline">
                      {selectedTask.activities.map((act) => (
                        <div key={act.id} className="task-timeline-item">
                          <div className="task-timeline-line" />
                          <div className="task-timeline-dot" />

                          <div className="task-timeline-header">
                            <span className="task-timeline-author">
                              {act.userFullName || act.username}
                              <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}> (@{act.username})</span>
                            </span>
                            <span className="task-timeline-date">{formatDate(act.createdAt)}</span>
                          </div>

                          <div className="task-timeline-desc">
                            {act.action === 'CREATED' && 'Đã khởi tạo công việc'}
                            {act.action === 'STATUS_CHANGED' && (
                              <span>
                                Đổi trạng thái từ <strong>{act.oldValue}</strong> sang <strong>{act.newValue}</strong>
                              </span>
                            )}
                            {act.action === 'ASSIGNED' && (
                              <span>
                                Giao cho: <strong>@{act.newValue}</strong>
                              </span>
                            )}
                            {act.action === 'PRIORITY_CHANGED' && (
                              <span>
                                Đổi mức ưu tiên sang <strong>{act.newValue}</strong>
                              </span>
                            )}
                            {act.action === 'UPDATED' && 'Đã chỉnh sửa thông tin công việc'}
                          </div>

                          {act.comment && <div className="task-timeline-comment">{act.comment}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      Chưa có hoạt động nào được ghi nhận.
                    </div>
                  )}
                </div>
              </div>

              <div className="ent-modal__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {(isAdmin || selectedTask.createdBy === user?.username) && (
                    <button
                      type="button"
                      className="ent-btn ent-btn--danger ent-btn--sm"
                      onClick={() => handleDeleteTask(selectedTask)}
                    >
                      <Trash2 size={14} style={{ marginRight: '0.35rem' }} /> Xóa công việc
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {(isAdmin || selectedTask.createdBy === user?.username) && (
                    <button
                      type="button"
                      className="ent-btn ent-btn--secondary ent-btn--md"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        openEditModal(selectedTask);
                      }}
                    >
                      <Edit2 size={14} style={{ marginRight: '0.35rem' }} /> Chỉnh sửa
                    </button>
                  )}
                  <button
                    type="button"
                    className="ent-btn ent-btn--primary ent-btn--md"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL 3: CHỈNH SỬA CÔNG VIỆC (EDIT TASK)                          */}
        {/* ================================================================= */}
        {isEditModalOpen && selectedTask && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--md">
              <div className="ent-modal__header">
                <div className="ent-modal__title-group">
                  <h3 className="ent-modal__title">Chỉnh sửa công việc #{selectedTask.id}</h3>
                  <p className="ent-modal__subtitle">Cập nhật nội dung, người nhận và trạng thái công việc</p>
                </div>
                <button
                  type="button"
                  className="ent-modal__close-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="ent-modal__body">
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">
                      Tiêu đề công việc <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Mô tả chi tiết</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">
                        Người phụ trách <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <select
                        className="form-control"
                        value={formData.assignee}
                        onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                        required
                      >
                        {assigneeOptions.map((a) => (
                          <option key={a.username} value={a.username}>
                            {a.fullName} (@{a.username})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Trạng thái</label>
                      <select
                        className="form-control"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as ManualTaskStatus })}
                      >
                        <option value="TODO">Cần làm (TODO)</option>
                        <option value="IN_PROGRESS">Đang thực hiện (IN_PROGRESS)</option>
                        <option value="DONE">Hoàn thành (DONE)</option>
                        <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Mức ưu tiên</label>
                      <select
                        className="form-control"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as ManualTaskPriority })}
                      >
                        <option value="LOW">Thấp (LOW)</option>
                        <option value="MEDIUM">Trung bình (MEDIUM)</option>
                        <option value="HIGH">Cao (HIGH)</option>
                        <option value="URGENT">Khẩn cấp (URGENT)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Hạn hoàn thành (Deadline)</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Tài liệu liên quan</label>
                    <select
                      className="form-control"
                      value={formData.documentId}
                      onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                    >
                      <option value="">-- Không liên kết --</option>
                      {availableDocuments.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          #{doc.id} - {doc.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ghi chú tiến độ</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="ent-modal__footer">
                  <button
                    type="button"
                    className="ent-btn ent-btn--secondary ent-btn--md"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="ent-btn ent-btn--primary ent-btn--md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
