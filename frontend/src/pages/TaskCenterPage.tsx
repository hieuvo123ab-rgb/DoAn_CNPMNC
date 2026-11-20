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
  ManualTaskWorkloadDto,
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
  MessageSquare,
  BarChart2,
  Bell,
  ExternalLink,
} from 'lucide-react';

export type TaskSourceType = 'ALL' | 'MANUAL' | 'SYSTEM';

export interface UnifiedTask {
  key: string;
  id: number;
  source: 'MANUAL' | 'SYSTEM';
  title: string;
  description?: string;
  assignee?: string;
  assigneeFullName?: string;
  assigneeRole?: string;
  createdBy?: string;
  createdByFullName?: string;
  createdByRole?: string;
  priority: ManualTaskPriority;
  status: string;
  kanbanCol: ManualTaskStatus;
  dueDate?: string;
  overdue: boolean;
  documentId?: number;
  documentTitle?: string;
  createdAt: string;
  notes?: string;
  manualTaskRef?: ManualTaskItem;
  systemTaskRef?: TaskDto;
}

export const TaskCenterPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isStaff = user?.role === 'ROLE_STAFF';
  const canManageTasks = isAdmin || isStaff;

  // View Mode: 'kanban' or 'list'
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filter States
  const [sourceFilter, setSourceFilter] = useState<TaskSourceType>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  // Pagination for List View
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Data States
  const [manualTasks, setManualTasks] = useState<ManualTaskItem[]>([]);
  const [systemTasks, setSystemTasks] = useState<TaskDto[]>([]);
  const [manualSummary, setManualSummary] = useState<ManualTaskSummary>({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    cancelled: 0,
    overdue: 0,
  });
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<DocumentItem[]>([]);
  const [workloads, setWorkloads] = useState<ManualTaskWorkloadDto[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEscalating, setIsEscalating] = useState<boolean>(false);

  // Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Modal / Drawer States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState<boolean>(false);

  // Selected Task in Drawer
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null);
  const [drawerCommentText, setDrawerCommentText] = useState<string>('');
  const [statusUpdateNote, setStatusUpdateNote] = useState<string>('');

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ManualTaskStatus | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState<{
    id?: number;
    title: string;
    description: string;
    assignee: string;
    priority: ManualTaskPriority;
    status: ManualTaskStatus;
    dueDate: string;
    documentId?: number;
    notes: string;
  }>({
    title: '',
    description: '',
    assignee: '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '',
    documentId: undefined,
    notes: '',
  });

  const showNotification = (type: 'success' | 'error' | 'warning', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  // ---------------------------------------------------------------------------
  // Load Data
  // ---------------------------------------------------------------------------
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [manualRes, summaryRes, derivedRes, assigneesRes, docsRes] = await Promise.allSettled([
        taskApi.getManualTasks({ size: 200, sortBy: 'createdAt', sortDirection: 'desc' }),
        taskApi.getManualTaskSummary(),
        taskApi.getDerivedTasks(),
        taskApi.getAssigneeOptions(),
        documentApi.getAllDocuments(),
      ]);

      if (manualRes.status === 'fulfilled') {
        setManualTasks(manualRes.value.content || []);
      }
      if (summaryRes.status === 'fulfilled') {
        setManualSummary(summaryRes.value);
      }
      if (derivedRes.status === 'fulfilled') {
        setSystemTasks(derivedRes.value || []);
      }
      if (assigneesRes.status === 'fulfilled') {
        setAssigneeOptions(assigneesRes.value || []);
      }
      if (docsRes.status === 'fulfilled') {
        const rawDocs = docsRes.value;
        const docsArray: DocumentItem[] = Array.isArray(rawDocs)
          ? rawDocs
          : (rawDocs as any)?.content || [];
        setAvailableDocuments(docsArray);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu Task Center:', err);
      showNotification('error', 'Không thể tải dữ liệu công việc. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Load Workload data when opening Workload Modal
  const loadWorkloadData = async () => {
    try {
      const res = await taskApi.getWorkload();
      setWorkloads(res || []);
    } catch (err) {
      console.error('Lỗi khi tải phân tích tải công việc:', err);
    }
  };

  const handleOpenWorkloadModal = () => {
    loadWorkloadData();
    setIsWorkloadModalOpen(true);
  };

  const handleCheckEscalation = async () => {
    setIsEscalating(true);
    try {
      const res = await taskApi.checkEscalation();
      showNotification('success', res.message || 'Đã quét và gửi thông báo nhắc hạn thành công.');
      fetchAllData();
      loadWorkloadData();
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Không thể thực hiện kiểm tra nhắc hạn.');
    } finally {
      setIsEscalating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Build Unified Tasks List
  // ---------------------------------------------------------------------------
  const unifiedTasks = useMemo<UnifiedTask[]>(() => {
    const list: UnifiedTask[] = [];

    // 1. Map Manual Tasks
    manualTasks.forEach((m) => {
      list.push({
        key: `manual-${m.id}`,
        id: m.id,
        source: 'MANUAL',
        title: m.title,
        description: m.description,
        assignee: m.assignee,
        assigneeFullName: m.assigneeFullName || m.assignee,
        assigneeRole: m.assigneeRole,
        createdBy: m.createdBy,
        createdByFullName: m.createdByFullName || m.createdBy,
        createdByRole: m.createdByRole,
        priority: m.priority,
        status: m.status,
        kanbanCol: m.status,
        dueDate: m.dueDate,
        overdue: m.overdue,
        documentId: m.documentId,
        documentTitle: m.documentTitle,
        createdAt: m.createdAt,
        notes: m.notes,
        manualTaskRef: m,
      });
    });

    // 2. Map System Derived Tasks
    systemTasks.forEach((s, idx) => {
      let priority: ManualTaskPriority = 'HIGH';
      let title = s.documentTitle || 'Tác vụ quy trình hệ thống';
      let desc = '';

      if (s.taskType === 'REVIEW_PENDING') {
        title = `Phê duyệt tài liệu: ${s.documentTitle}`;
        desc = `Hồ sơ phiên bản v${s.versionNumber || 1} đang chờ xét duyệt theo thẩm quyền.`;
        priority = 'HIGH';
      } else if (s.taskType === 'DISPOSITION_PENDING') {
        title = `Phê duyệt tiêu hủy: ${s.documentTitle}`;
        desc = `Tài liệu đã hết thời hạn lưu trữ quy định, cần kiểm tra và phê duyệt tiêu hủy.`;
        priority = 'URGENT';
      } else if (s.taskType === 'REVISION_REQUIRED') {
        title = `Yêu cầu hiệu chỉnh: ${s.documentTitle}`;
        desc = `Tài liệu bị từ chối duyệt. Cần tải lên bản sửa đổi để tiếp tục quy trình.`;
        priority = 'MEDIUM';
      }

      list.push({
        key: `system-${s.taskType}-${s.documentId}-${idx}`,
        id: s.documentId,
        source: 'SYSTEM',
        title,
        description: desc,
        assignee: 'Hệ thống EDMS',
        assigneeFullName: 'Hệ thống quy trình',
        createdBy: 'Hệ thống',
        createdByFullName: 'Tự động phát sinh',
        priority,
        status: s.taskType,
        kanbanCol: 'TODO', // System pending tasks sit in TODO column
        dueDate: undefined,
        overdue: false,
        documentId: s.documentId,
        documentTitle: s.documentTitle,
        createdAt: s.createdAt,
        notes: s.actionKey,
        systemTaskRef: s,
      });
    });

    return list;
  }, [manualTasks, systemTasks]);

  // ---------------------------------------------------------------------------
  // Filtering & Search
  // ---------------------------------------------------------------------------
  const filteredTasks = useMemo(() => {
    return unifiedTasks.filter((t) => {
      // Source filter
      if (sourceFilter !== 'ALL' && t.source !== sourceFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'TODO' && t.kanbanCol !== 'TODO') return false;
        if (statusFilter === 'IN_PROGRESS' && t.kanbanCol !== 'IN_PROGRESS') return false;
        if (statusFilter === 'DONE' && t.kanbanCol !== 'DONE') return false;
        if (statusFilter === 'CANCELLED' && t.kanbanCol !== 'CANCELLED') return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter !== 'ALL') {
        if (assigneeFilter === 'SYSTEM') {
          if (t.source !== 'SYSTEM') return false;
        } else {
          if (t.assignee !== assigneeFilter) return false;
        }
      }

      // Overdue filter
      if (overdueOnly && !t.overdue) {
        return false;
      }

      // Search keyword filter
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchAssignee = (t.assigneeFullName || t.assignee || '').toLowerCase().includes(q);
        const matchDoc = (t.documentTitle || '').toLowerCase().includes(q);
        const matchId = String(t.id).includes(q);
        if (!matchTitle && !matchDesc && !matchAssignee && !matchDoc && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedTasks, sourceFilter, statusFilter, priorityFilter, assigneeFilter, overdueOnly, searchKeyword]);

  // Paginated tasks for List View
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));

  // ---------------------------------------------------------------------------
  // KPI Summary Calculation
  // ---------------------------------------------------------------------------
  const kpiStats = useMemo(() => {
    const total = filteredTasks.length;
    const todo = filteredTasks.filter((t) => t.kanbanCol === 'TODO').length;
    const inProgress = filteredTasks.filter((t) => t.kanbanCol === 'IN_PROGRESS').length;
    const done = filteredTasks.filter((t) => t.kanbanCol === 'DONE').length;
    const overdue = filteredTasks.filter((t) => t.overdue).length;
    return { total, todo, inProgress, done, overdue };
  }, [filteredTasks]);

  // ---------------------------------------------------------------------------
  // Drawer & Selection Helpers
  // ---------------------------------------------------------------------------
  const openDrawer = async (task: UnifiedTask) => {
    setSelectedTask(task);
    setDrawerCommentText('');
    setStatusUpdateNote('');
    setIsDrawerOpen(true);

    // If manual task, refresh fresh details & activities
    if (task.source === 'MANUAL') {
      try {
        const fresh = await taskApi.getManualTaskById(task.id);
        setSelectedTask((prev) => (prev ? { ...prev, manualTaskRef: fresh } : prev));
      } catch (err) {
        console.error('Không thể tải chi tiết hoạt động công việc:', err);
      }
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTask(null);
    setDrawerCommentText('');
    setStatusUpdateNote('');
  };

  // ---------------------------------------------------------------------------
  // Status Changes & Drag-and-Drop
  // ---------------------------------------------------------------------------
  const handleStatusChange = async (task: UnifiedTask, newStatus: ManualTaskStatus, note?: string) => {
    if (task.source === 'SYSTEM') {
      showNotification('warning', 'Tác vụ hệ thống quy trình không thể chuyển trạng thái tự do. Vui lòng mở trang xét duyệt hoặc tiêu hủy.');
      return;
    }

    try {
      const updated = await taskApi.updateManualTaskStatus(task.id, {
        status: newStatus,
        note: note || undefined,
      });

      // Update state
      setManualTasks((prev) => prev.map((m) => (m.id === task.id ? updated : m)));
      if (selectedTask?.id === task.id && selectedTask.source === 'MANUAL') {
        setSelectedTask({
          ...selectedTask,
          status: updated.status,
          kanbanCol: updated.status,
          overdue: updated.overdue,
          manualTaskRef: updated,
        });
      }

      showNotification('success', `Đã cập nhật công việc #${task.id} sang trạng thái: ${formatStatusText(newStatus)}`);
      taskApi.getManualTaskSummary().then(setManualSummary).catch(console.error);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Không thể cập nhật trạng thái.');
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, task: UnifiedTask) => {
    if (task.source === 'SYSTEM') {
      e.preventDefault();
      showNotification('warning', 'Tác vụ xét duyệt và tiêu hủy không được phép kéo thả qua các cột trạng thái.');
      return;
    }
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colStatus: ManualTaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colStatus) {
      setDragOverCol(colStatus);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCol: ManualTaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = Number(taskIdStr);
    setDraggedTaskId(null);

    if (!taskId) return;

    const targetTask = unifiedTasks.find((t) => t.id === taskId && t.source === 'MANUAL');
    if (!targetTask) return;

    if (targetTask.kanbanCol === targetCol) return;

    // Execute status transition
    await handleStatusChange(targetTask, targetCol, `Kéo thả thẻ sang cột ${formatStatusText(targetCol)} trên Kanban`);
  };

  // ---------------------------------------------------------------------------
  // Comments inside Task Drawer
  // ---------------------------------------------------------------------------
  const handleAddComment = async () => {
    if (!selectedTask || selectedTask.source !== 'MANUAL' || !drawerCommentText.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await taskApi.addComment(selectedTask.id, drawerCommentText.trim());
      setDrawerCommentText('');
      setManualTasks((prev) => prev.map((m) => (m.id === selectedTask.id ? updated : m)));
      setSelectedTask((prev) => (prev ? { ...prev, manualTaskRef: updated } : prev));
      showNotification('success', 'Đã thêm bình luận mới vào công việc.');
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Không thể gửi bình luận.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Create & Edit Task Handlers
  // ---------------------------------------------------------------------------
  const openCreateModal = () => {
    const defaultAssignee = assigneeOptions.find((a) => a.username !== user?.username)?.username || user?.username || '';
    setFormData({
      title: '',
      description: '',
      assignee: defaultAssignee,
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: '',
      documentId: undefined,
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (task: UnifiedTask) => {
    if (task.source !== 'MANUAL' || !task.manualTaskRef) return;
    const m = task.manualTaskRef;

    let formattedDueDate = '';
    if (m.dueDate) {
      try {
        const d = new Date(m.dueDate);
        formattedDueDate = d.toISOString().slice(0, 16);
      } catch {
        formattedDueDate = '';
      }
    }

    setFormData({
      id: m.id,
      title: m.title,
      description: m.description || '',
      assignee: m.assignee || '',
      priority: m.priority,
      status: m.status,
      dueDate: formattedDueDate,
      documentId: m.documentId,
      notes: m.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('error', 'Vui lòng nhập tiêu đề công việc.');
      return;
    }
    if (!formData.assignee) {
      showNotification('error', 'Vui lòng chọn người phụ trách.');
      return;
    }

    setIsSubmitting(true);
    try {
      let isoDueDate: string | undefined = undefined;
      if (formData.dueDate) {
        isoDueDate = new Date(formData.dueDate).toISOString();
      }

      const created = await taskApi.createManualTask({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        assignee: formData.assignee,
        priority: formData.priority,
        dueDate: isoDueDate,
        documentId: formData.documentId || undefined,
        notes: formData.notes.trim() || undefined,
      });

      setManualTasks((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      showNotification('success', `Đã tạo thành công công việc #${created.id} và gửi thông báo.`);
      taskApi.getManualTaskSummary().then(setManualSummary).catch(console.error);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Không thể tạo công việc mới.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;
    if (!formData.title.trim()) {
      showNotification('error', 'Vui lòng nhập tiêu đề công việc.');
      return;
    }

    setIsSubmitting(true);
    try {
      let isoDueDate: string | undefined = undefined;
      if (formData.dueDate) {
        isoDueDate = new Date(formData.dueDate).toISOString();
      }

      const updated = await taskApi.updateManualTask(formData.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        assignee: formData.assignee,
        priority: formData.priority,
        status: formData.status,
        dueDate: isoDueDate,
        documentId: formData.documentId || undefined,
        notes: formData.notes.trim() || undefined,
      });

      setManualTasks((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      if (selectedTask?.id === updated.id && selectedTask.source === 'MANUAL') {
        setSelectedTask((prev) => (prev ? { ...prev, manualTaskRef: updated, title: updated.title } : prev));
      }
      setIsEditModalOpen(false);
      showNotification('success', `Đã cập nhật thông tin công việc #${updated.id}.`);
      taskApi.getManualTaskSummary().then(setManualSummary).catch(console.error);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Không thể cập nhật công việc.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (task: UnifiedTask) => {
    if (task.source !== 'MANUAL') return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn công việc #${task.id} không?`)) {
      return;
    }

    try {
      await taskApi.deleteManualTask(task.id);
      setManualTasks((prev) => prev.filter((m) => m.id !== task.id));
      if (selectedTask?.id === task.id) {
        closeDrawer();
      }
      showNotification('success', `Đã xóa công việc #${task.id} thành công.`);
      taskApi.getManualTaskSummary().then(setManualSummary).catch(console.error);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.message || 'Không thể xóa công việc.');
    }
  };

  // ---------------------------------------------------------------------------
  // Helper Formatters
  // ---------------------------------------------------------------------------
  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatStatusText = (st: string) => {
    switch (st) {
      case 'TODO':
        return 'Cần làm';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'DONE':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'REVIEW_PENDING':
        return 'Chờ duyệt tài liệu';
      case 'DISPOSITION_PENDING':
        return 'Chờ duyệt tiêu hủy';
      case 'REVISION_REQUIRED':
        return 'Cần hiệu chỉnh lại';
      default:
        return st;
    }
  };

  const renderStatusBadge = (st: string, source: 'MANUAL' | 'SYSTEM') => {
    if (source === 'SYSTEM') {
      if (st === 'REVIEW_PENDING') {
        return (
          <span className="task-status-badge task-status-badge--todo" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <Clock size={12} /> Chờ duyệt tài liệu
          </span>
        );
      }
      if (st === 'DISPOSITION_PENDING') {
        return (
          <span className="task-status-badge task-status-badge--todo" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#DC2626', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <Archive size={12} /> Chờ duyệt tiêu hủy
          </span>
        );
      }
      return (
        <span className="task-status-badge task-status-badge--todo" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563EB', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <AlertCircle size={12} /> Cần hiệu chỉnh lại
        </span>
      );
    }

    switch (st) {
      case 'TODO':
        return (
          <span className="task-status-badge task-status-badge--todo">
            <Clock size={12} /> Cần làm
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="task-status-badge task-status-badge--inprogress">
            <RefreshCw size={12} /> Đang thực hiện
          </span>
        );
      case 'DONE':
        return (
          <span className="task-status-badge task-status-badge--done">
            <Check size={12} /> Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="task-status-badge task-status-badge--cancelled">
            <X size={12} /> Đã hủy
          </span>
        );
      default:
        return <span className="task-status-badge">{st}</span>;
    }
  };

  const renderPriorityPill = (p: ManualTaskPriority) => {
    switch (p) {
      case 'URGENT':
        return <span className="task-priority-pill task-priority-pill--urgent">Khẩn cấp</span>;
      case 'HIGH':
        return <span className="task-priority-pill task-priority-pill--high">Cao</span>;
      case 'MEDIUM':
        return <span className="task-priority-pill task-priority-pill--medium">Trung bình</span>;
      case 'LOW':
        return <span className="task-priority-pill task-priority-pill--low">Thấp</span>;
      default:
        return <span className="task-priority-pill">{p}</span>;
    }
  };

  const navigateToSystemWorkflow = (actionKey?: string) => {
    if (actionKey === 'OPEN_REVIEW_QUEUE') {
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'review-queue' }));
    } else if (actionKey === 'OPEN_DISPOSITION_QUEUE') {
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'disposition-queue' }));
    } else {
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'documents' }));
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="app-container">
      <Navbar currentView="tasks" />

      <main className="main-content">
        {/* Top Header */}
        <div className="ent-page-header">
          <div className="ent-page-header__left">
            <div className="ent-page-header__title-row">
              <div className="ent-page-header__icon-badge">
                <ListTodo size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="ent-page-header__title">Trung tâm công việc 2.0</h1>
                <p className="ent-page-header__subtitle">
                  Điều phối thống nhất công việc phân công và các nhiệm vụ quy trình tài liệu EDMS
                </p>
              </div>
            </div>
          </div>

          <div className="ent-page-header__actions">
            <button
              type="button"
              className="ent-btn ent-btn--secondary ent-btn--md"
              onClick={handleOpenWorkloadModal}
              id="btn-workload-analytics"
              title="Xem phân tích tải công việc và báo cáo tồn đọng"
            >
              <BarChart2 size={16} />
              <span>Phân tích tải & Tồn đọng</span>
            </button>

            {canManageTasks && (
              <button
                type="button"
                className="ent-btn ent-btn--primary ent-btn--md"
                onClick={openCreateModal}
                id="btn-create-task"
              >
                <Plus size={16} />
                <span>Giao công việc mới</span>
              </button>
            )}

            <button
              type="button"
              className="ent-btn ent-btn--secondary ent-btn--md"
              onClick={fetchAllData}
              disabled={isLoading}
              title="Làm mới dữ liệu công việc"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              backgroundColor:
                notification.type === 'success'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : notification.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(239, 68, 68, 0.12)',
              color:
                notification.type === 'success'
                  ? '#065F46'
                  : notification.type === 'warning'
                  ? '#92400E'
                  : '#991B1B',
              border: `1px solid ${
                notification.type === 'success'
                  ? '#10B981'
                  : notification.type === 'warning'
                  ? '#F59E0B'
                  : '#EF4444'
              }`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {notification.type === 'success' && <CheckCircle2 size={18} />}
              {notification.type === 'warning' && <AlertTriangle size={18} />}
              {notification.type === 'error' && <AlertCircle size={18} />}
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* 5 KPI Summary Counters */}
        <div className="dash-stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-stat-card" style={{ borderLeft: '4px solid #2563EB' }}>
            <div className="dash-stat-card__header">
              <span className="dash-stat-card__title">TỔNG CÔNG VIỆC</span>
              <Layers size={16} className="text-primary" />
            </div>
            <div className="dash-stat-card__value" style={{ color: '#2563EB' }}>
              {kpiStats.total}
            </div>
            <div className="dash-stat-card__subtext">Toàn bộ tác vụ trong bộ lọc</div>
          </div>

          <div className="dash-stat-card" style={{ borderLeft: '4px solid #475569' }}>
            <div className="dash-stat-card__header">
              <span className="dash-stat-card__title">CẦN LÀM</span>
              <Clock size={16} className="text-secondary" />
            </div>
            <div className="dash-stat-card__value">{kpiStats.todo}</div>
            <div className="dash-stat-card__subtext">Đang chờ tiếp nhận xử lý</div>
          </div>

          <div className="dash-stat-card" style={{ borderLeft: '4px solid #0284C7' }}>
            <div className="dash-stat-card__header">
              <span className="dash-stat-card__title">ĐANG THỰC HIỆN</span>
              <RefreshCw size={16} style={{ color: '#0284C7' }} />
            </div>
            <div className="dash-stat-card__value" style={{ color: '#0284C7' }}>
              {kpiStats.inProgress}
            </div>
            <div className="dash-stat-card__subtext">Đang trong tiến trình giải quyết</div>
          </div>

          <div className="dash-stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
            <div className="dash-stat-card__header">
              <span className="dash-stat-card__title">QUÁ THỜI HẠN</span>
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <div className="dash-stat-card__value" style={{ color: '#EF4444' }}>
              {kpiStats.overdue}
            </div>
            <div className="dash-stat-card__subtext">Đã vượt mốc thời hạn quy định</div>
          </div>

          <div className="dash-stat-card" style={{ borderLeft: '4px solid #10B981' }}>
            <div className="dash-stat-card__header">
              <span className="dash-stat-card__title">HOÀN THÀNH</span>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <div className="dash-stat-card__value" style={{ color: '#10B981' }}>
              {kpiStats.done}
            </div>
            <div className="dash-stat-card__subtext">Nhiệm vụ đã kết thúc tốt đẹp</div>
          </div>
        </div>

        {/* Filter and View Switcher Toolbar */}
        <div className="ent-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Left Filter Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', flex: 1 }}>
              {/* Search input */}
              <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.2rem', fontSize: '0.85rem', height: '38px' }}
                  placeholder="Tìm theo tiêu đề, mô tả, ID..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  id="task-search-input"
                />
              </div>

              {/* Source Filter */}
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '155px', fontSize: '0.85rem', height: '38px' }}
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value as TaskSourceType);
                  setCurrentPage(1);
                }}
                id="filter-source-select"
              >
                <option value="ALL">Tất cả nguồn ({unifiedTasks.length})</option>
                <option value="MANUAL">Công việc phân công ({manualTasks.length})</option>
                <option value="SYSTEM">Nhiệm vụ hệ thống ({systemTasks.length})</option>
              </select>

              {/* Status Filter */}
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '145px', fontSize: '0.85rem', height: '38px' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                id="filter-status-select"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="TODO">Cần làm</option>
                <option value="IN_PROGRESS">Đang thực hiện</option>
                <option value="DONE">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>

              {/* Priority Filter */}
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '135px', fontSize: '0.85rem', height: '38px' }}
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                id="filter-priority-select"
              >
                <option value="ALL">Tất cả mức ưu tiên</option>
                <option value="URGENT">Khẩn cấp</option>
                <option value="HIGH">Cao</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="LOW">Thấp</option>
              </select>

              {/* Assignee Filter */}
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '160px', fontSize: '0.85rem', height: '38px' }}
                value={assigneeFilter}
                onChange={(e) => {
                  setAssigneeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                id="filter-assignee-select"
              >
                <option value="ALL">Tất cả người phụ trách</option>
                <option value="SYSTEM">Hệ thống EDMS</option>
                {assigneeOptions.map((a) => (
                  <option key={a.username} value={a.username}>
                    {a.fullName} (@{a.username})
                  </option>
                ))}
              </select>

              {/* Overdue Toggle */}
              <button
                type="button"
                className={`ent-btn ent-btn--sm ${overdueOnly ? 'ent-btn--danger' : 'ent-btn--secondary'}`}
                style={{ height: '38px' }}
                onClick={() => {
                  setOverdueOnly(!overdueOnly);
                  setCurrentPage(1);
                }}
                id="filter-overdue-toggle"
              >
                <AlertTriangle size={14} />
                <span>Quá hạn</span>
              </button>
            </div>

            {/* Right: View Switcher (Kanban vs List) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                className={`ent-btn ent-btn--sm ${viewMode === 'kanban' ? 'ent-btn--primary' : 'ent-btn--secondary'}`}
                style={{ height: '38px' }}
                onClick={() => setViewMode('kanban')}
                id="btn-view-kanban"
                title="Xem dưới dạng bảng Kanban"
              >
                <LayoutGrid size={15} />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                className={`ent-btn ent-btn--sm ${viewMode === 'list' ? 'ent-btn--primary' : 'ent-btn--secondary'}`}
                style={{ height: '38px' }}
                onClick={() => setViewMode('list')}
                id="btn-view-list"
                title="Xem dưới dạng danh sách bảng dữ liệu"
              >
                <List size={15} />
                <span>Danh sách</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Kanban or List View */}
        {isLoading ? (
          <div className="ent-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin text-primary" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Đang đồng bộ dữ liệu công việc...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="ent-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <CheckCircle2 size={44} className="text-success" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
              Không có công việc nào thỏa mãn bộ lọc
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Hãy thử xóa bộ lọc tìm kiếm hoặc tạo công việc mới để bắt đầu theo dõi tiến độ.
            </p>
          </div>
        ) : viewMode === 'kanban' ? (
          /* ================================================================= */
          /* KANBAN BOARD VIEW (WITH TRUE DRAG AND DROP)                       */
          /* ================================================================= */
          <div className="kanban-grid">
            {(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as ManualTaskStatus[]).map((colStatus) => {
              const colTasks = filteredTasks.filter((t) => t.kanbanCol === colStatus);
              const isDragOver = dragOverCol === colStatus;

              return (
                <div
                  key={colStatus}
                  className={`kanban-col ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, colStatus)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, colStatus)}
                >
                  <div className="kanban-col__header">
                    <div className="kanban-col__title-row">
                      {colStatus === 'TODO' && <Clock size={16} className="text-secondary" />}
                      {colStatus === 'IN_PROGRESS' && <RefreshCw size={16} style={{ color: '#0284C7' }} />}
                      {colStatus === 'DONE' && <CheckCircle2 size={16} className="text-success" />}
                      {colStatus === 'CANCELLED' && <X size={16} className="text-muted" />}
                      <span className="kanban-col__title">{formatStatusText(colStatus)}</span>
                    </div>
                    <span className="kanban-col__count">{colTasks.length}</span>
                  </div>

                  <div className="kanban-col__body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {colTasks.length === 0 ? (
                      <div
                        style={{
                          padding: '2rem 1rem',
                          textAlign: 'center',
                          color: 'var(--color-text-muted)',
                          fontSize: '0.85rem',
                          border: '1px dashed var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        Kéo thả công việc vào đây
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const isDragging = draggedTaskId === task.id;
                        const canDrag = task.source === 'MANUAL';

                        return (
                          <div
                            key={task.key}
                            className={`kanban-card ${isDragging ? 'is-dragging' : ''}`}
                            draggable={canDrag}
                            onDragStart={(e) => handleDragStart(e, task)}
                            onClick={() => openDrawer(task)}
                            style={{ cursor: canDrag ? 'grab' : 'pointer' }}
                          >
                            {/* Card Source and Priority Badges */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                              <span className={`task-source-tag ${task.source === 'MANUAL' ? 'task-source-tag--manual' : 'task-source-tag--system'}`}>
                                {task.source === 'MANUAL' ? 'Thủ công' : 'Quy trình'}
                              </span>
                              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                {renderPriorityPill(task.priority)}
                                {task.overdue && (
                                  <span className="task-overdue-tag">
                                    <AlertTriangle size={11} /> Trễ hạn
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Title */}
                            <h4 className="kanban-card__title">
                              <span style={{ color: 'var(--color-primary)', marginRight: '0.35rem' }}>
                                #{task.id}
                              </span>
                              {task.title}
                            </h4>

                            {/* Card Description */}
                            {task.description && (
                              <p className="kanban-card__desc">{task.description}</p>
                            )}

                            {/* Linked Document Tag if exists */}
                            {task.documentTitle && (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  fontSize: '0.75rem',
                                  color: 'var(--color-text-secondary)',
                                  backgroundColor: 'var(--color-surface-hover)',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: 'var(--radius-sm)',
                                  marginBottom: '0.65rem',
                                  maxWidth: '100%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <FileText size={12} className="text-primary" />
                                <span>{task.documentTitle}</span>
                              </div>
                            )}

                            {/* Card Footer: Assignee & Date */}
                            <div className="kanban-card__footer">
                              <div className="kanban-card__assignee" title={`Người phụ trách: ${task.assigneeFullName}`}>
                                <User size={13} />
                                <span>{task.assigneeFullName}</span>
                              </div>

                              {task.dueDate && (
                                <div
                                  className={`kanban-card__due ${task.overdue ? 'kanban-card__due--overdue' : ''}`}
                                  title={`Hạn xử lý: ${formatDateTime(task.dueDate)}`}
                                >
                                  <Calendar size={13} />
                                  <span>{formatDate(task.dueDate)}</span>
                                </div>
                              )}
                            </div>

                            {/* Card Quick Action Bar */}
                            <div
                              style={{
                                marginTop: '0.75rem',
                                paddingTop: '0.65rem',
                                borderTop: '1px solid var(--color-border-subtle)',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.4rem',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {task.source === 'SYSTEM' ? (
                                <button
                                  type="button"
                                  className="ent-btn ent-btn--secondary ent-btn--sm"
                                  onClick={() => navigateToSystemWorkflow(task.notes)}
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                >
                                  <span>Xử lý ngay</span>
                                  <ArrowRight size={12} />
                                </button>
                              ) : (
                                <>
                                  {task.kanbanCol === 'TODO' && (
                                    <button
                                      type="button"
                                      className="ent-btn ent-btn--primary ent-btn--sm"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                      onClick={() => handleStatusChange(task, 'IN_PROGRESS', 'Bắt đầu xử lý công việc')}
                                    >
                                      Bắt đầu làm
                                    </button>
                                  )}
                                  {task.kanbanCol === 'IN_PROGRESS' && (
                                    <button
                                      type="button"
                                      className="ent-btn ent-btn--primary ent-btn--sm"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: '#10B981', borderColor: '#10B981' }}
                                      onClick={() => handleStatusChange(task, 'DONE', 'Đã hoàn thành công việc')}
                                    >
                                      Hoàn thành
                                    </button>
                                  )}
                                  {task.kanbanCol === 'DONE' && (
                                    <button
                                      type="button"
                                      className="ent-btn ent-btn--secondary ent-btn--sm"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                      onClick={() => handleStatusChange(task, 'IN_PROGRESS', 'Mở lại công việc')}
                                    >
                                      Mở lại
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================================================================= */
          /* LIST VIEW: MODERN ENTERPRISE SAAS DATA TABLE                      */
          /* ================================================================= */
          <div className="ent-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: '80px', padding: '0.9rem 1rem' }}>MÃ ID</th>
                    <th style={{ width: '110px' }}>NGUỒN</th>
                    <th>TIÊU ĐỀ & NỘI DUNG</th>
                    <th style={{ width: '170px' }}>NGƯỜI PHỤ TRÁCH</th>
                    <th style={{ width: '120px' }}>MỨC ƯU TIÊN</th>
                    <th style={{ width: '130px' }}>HẠN XỬ LÝ</th>
                    <th style={{ width: '150px' }}>TRẠNG THÁI</th>
                    <th style={{ width: '160px' }}>TÀI LIỆU LIÊN KẾT</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.map((task) => (
                    <tr
                      key={task.key}
                      onClick={() => openDrawer(task)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        #{task.id}
                      </td>

                      <td>
                        <span className={`task-source-tag ${task.source === 'MANUAL' ? 'task-source-tag--manual' : 'task-source-tag--system'}`}>
                          {task.source === 'MANUAL' ? 'Thủ công' : 'Quy trình'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.2rem' }}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', maxWidth: '420px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.description}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
                          <User size={14} className="text-secondary" />
                          <span style={{ fontWeight: 500 }}>{task.assigneeFullName}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                          Bởi: @{task.createdBy}
                        </div>
                      </td>

                      <td>{renderPriorityPill(task.priority)}</td>

                      <td>
                        {task.dueDate ? (
                          <div>
                            <div style={{ fontSize: '0.825rem', color: task.overdue ? '#EF4444' : 'inherit', fontWeight: task.overdue ? 600 : 400 }}>
                              {formatDate(task.dueDate)}
                            </div>
                            {task.overdue && (
                              <span className="task-overdue-tag" style={{ marginTop: '0.2rem' }}>
                                Trễ hạn
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                        )}
                      </td>

                      <td>{renderStatusBadge(task.status, task.source)}</td>

                      <td>
                        {task.documentTitle ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--color-primary)' }}>
                            <FileText size={13} />
                            <span style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {task.documentTitle}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="ent-btn ent-btn--secondary ent-btn--sm"
                            onClick={() => openDrawer(task)}
                            title="Xem chi tiết"
                          >
                            <Eye size={13} />
                          </button>

                          {task.source === 'MANUAL' && (isAdmin || task.createdBy === user?.username) && (
                            <button
                              type="button"
                              className="ent-btn ent-btn--secondary ent-btn--sm"
                              onClick={() => openEditModal(task)}
                              title="Chỉnh sửa công việc"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1.25rem',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-card-muted)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ color: 'var(--color-text-secondary)' }}>
                Hiển thị <strong>{paginatedTasks.length}</strong> / <strong>{filteredTasks.length}</strong> công việc
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="ent-btn ent-btn--secondary ent-btn--sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  type="button"
                  className="ent-btn ent-btn--secondary ent-btn--sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ padding: '0 0.5rem', fontWeight: 600 }}>
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="ent-btn ent-btn--secondary ent-btn--sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="ent-btn ent-btn--secondary ent-btn--sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TASK DETAIL DRAWER (SLIDES IN FROM THE RIGHT EDGE)                 */}
        {/* ================================================================= */}
        {isDrawerOpen && selectedTask && (
          <div className="task-drawer-overlay" onClick={closeDrawer}>
            <div className="task-drawer" onClick={(e) => e.stopPropagation()}>
              {/* Drawer Header */}
              <div className="task-drawer__header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.15rem' }}>
                      #{selectedTask.id}
                    </span>
                    <span className={`task-source-tag ${selectedTask.source === 'MANUAL' ? 'task-source-tag--manual' : 'task-source-tag--system'}`}>
                      {selectedTask.source === 'MANUAL' ? 'Công việc phân công' : 'Quy trình hệ thống'}
                    </span>
                    {renderStatusBadge(selectedTask.status, selectedTask.source)}
                    {renderPriorityPill(selectedTask.priority)}
                    {selectedTask.overdue && (
                      <span className="task-overdue-tag">
                        <AlertTriangle size={12} /> Quá hạn
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {selectedTask.title}
                  </h3>
                </div>

                <button
                  type="button"
                  className="ent-modal__close-btn"
                  onClick={closeDrawer}
                  aria-label="Đóng ngăn chi tiết"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="task-drawer__body">
                {/* Metadata Details Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.85rem',
                    background: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>NGƯỜI PHỤ TRÁCH</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.15rem', color: 'var(--color-text-main)' }}>
                      {selectedTask.assigneeFullName}
                    </div>
                    {selectedTask.assignee && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        @{selectedTask.assignee}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>NGƯỜI GIAO VIỆC</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.15rem', color: 'var(--color-text-main)' }}>
                      {selectedTask.createdByFullName}
                    </div>
                    {selectedTask.createdBy && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        @{selectedTask.createdBy}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>HẠN HOÀN THÀNH (DEADLINE)</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.15rem', color: selectedTask.overdue ? '#EF4444' : 'var(--color-text-main)' }}>
                      {formatDateTime(selectedTask.dueDate)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>NGÀY TẠO TÁC VỤ</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.15rem', color: 'var(--color-text-main)' }}>
                      {formatDateTime(selectedTask.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 0.4rem', color: 'var(--color-text-main)' }}>
                      Mô tả nội dung công việc:
                    </h4>
                    <div
                      style={{
                        padding: '0.75rem',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        color: 'var(--color-text-main)',
                      }}
                    >
                      {selectedTask.description}
                    </div>
                  </div>
                )}

                {/* Linked Document Card */}
                {selectedTask.documentTitle && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'rgba(37, 99, 235, 0.05)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <FileText size={20} className="text-primary" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TÀI LIỆU LIÊN QUAN</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                          {selectedTask.documentTitle}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ent-btn ent-btn--secondary ent-btn--sm"
                      onClick={() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'documents' }))}
                      title="Mở quản lý tài liệu"
                    >
                      <ExternalLink size={13} />
                      <span>Xem tài liệu</span>
                    </button>
                  </div>
                )}

                {/* Quick Status Update Section (for Manual tasks) */}
                {selectedTask.source === 'MANUAL' ? (
                  <div
                    style={{
                      background: 'var(--color-surface-hover)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.65rem', color: 'var(--color-text-main)' }}>
                      Cập nhật tiến độ & Trạng thái:
                    </h4>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      {(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as ManualTaskStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={`ent-btn ent-btn--sm ${selectedTask.kanbanCol === st ? 'ent-btn--primary' : 'ent-btn--secondary'}`}
                          onClick={() => handleStatusChange(selectedTask, st, statusUpdateNote)}
                        >
                          {selectedTask.kanbanCol === st && <Check size={13} />}
                          <span>{formatStatusText(st)}</span>
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{ fontSize: '0.85rem' }}
                        placeholder="Thêm ghi chú kèm theo thay đổi trạng thái..."
                        value={statusUpdateNote}
                        onChange={(e) => setStatusUpdateNote(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  /* Action routing for System Tasks */
                  <div
                    style={{
                      padding: '1rem',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#92400E', fontSize: '0.9rem' }}>
                        Tác vụ xử lý theo quy trình bắt buộc
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '0.15rem' }}>
                        Cần thực hiện thao tác nghiệp vụ trực tiếp trong hàng đợi tương ứng.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ent-btn ent-btn--primary ent-btn--sm"
                      onClick={() => navigateToSystemWorkflow(selectedTask.notes)}
                    >
                      <span>Mở hàng đợi xử lý</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* Comments & Discussion Section (for Manual Tasks) */}
                {selectedTask.source === 'MANUAL' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                      <MessageSquare size={16} className="text-primary" />
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
                        Bình luận & Trao đổi:
                      </h4>
                    </div>

                    {/* New Comment Input */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <textarea
                        className="form-control"
                        rows={2}
                        style={{ fontSize: '0.85rem', resize: 'vertical' }}
                        placeholder="Nhập bình luận hoặc trao đổi tiến độ..."
                        value={drawerCommentText}
                        onChange={(e) => setDrawerCommentText(e.target.value)}
                      />
                      <button
                        type="button"
                        className="ent-btn ent-btn--primary ent-btn--md"
                        onClick={handleAddComment}
                        disabled={isSubmitting || !drawerCommentText.trim()}
                        style={{ alignSelf: 'flex-end', height: '42px' }}
                      >
                        {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                        <span>Gửi</span>
                      </button>
                    </div>

                    {/* Comment list */}
                    {selectedTask.manualTaskRef?.activities?.filter((a) => a.action === 'COMMENT_ADDED').length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        Chưa có bình luận nào cho công việc này.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedTask.manualTaskRef?.activities
                          ?.filter((a) => a.action === 'COMMENT_ADDED')
                          .map((com) => (
                            <div key={com.id} className="task-comment-item">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--color-text-main)' }}>
                                  {com.userFullName} (@{com.username})
                                </span>
                                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                                  {formatDateTime(com.createdAt)}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                                {com.comment}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Activity History Timeline */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <History size={16} className="text-secondary" />
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
                      Dòng thời gian hoạt động ({selectedTask.manualTaskRef?.activities?.length || 0}):
                    </h4>
                  </div>

                  {!selectedTask.manualTaskRef?.activities || selectedTask.manualTaskRef.activities.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Chưa có ghi nhận hoạt động nào.
                    </div>
                  ) : (
                    <div className="task-timeline">
                      {selectedTask.manualTaskRef.activities.map((act) => (
                        <div key={act.id} className="task-timeline-item">
                          <div className="task-timeline-dot" />
                          <div className="task-timeline-header">
                            <span className="task-timeline-user">
                              {act.userFullName} (@{act.username})
                            </span>
                            <span className="task-timeline-date">{formatDateTime(act.createdAt)}</span>
                          </div>

                          <div className="task-timeline-desc">
                            {act.action === 'CREATED' && 'Khởi tạo công việc'}
                            {act.action === 'STATUS_CHANGED' && (
                              <span>
                                Đổi trạng thái từ <strong>{formatStatusText(act.oldValue || '')}</strong> sang{' '}
                                <strong>{formatStatusText(act.newValue || '')}</strong>
                              </span>
                            )}
                            {act.action === 'ASSIGNED' && (
                              <span>
                                Chuyển người phụ trách từ <strong>@{act.oldValue}</strong> sang{' '}
                                <strong>@{act.newValue}</strong>
                              </span>
                            )}
                            {act.action === 'PRIORITY_CHANGED' && (
                              <span>
                                Đổi mức ưu tiên sang <strong>{act.newValue}</strong>
                              </span>
                            )}
                            {act.action === 'COMMENT_ADDED' && 'Đã đăng một bình luận'}
                            {act.action === 'UPDATED' && 'Chỉnh sửa thông tin công việc'}
                          </div>

                          {act.comment && act.action !== 'COMMENT_ADDED' && (
                            <div className="task-timeline-comment">{act.comment}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="task-drawer__footer">
                <div>
                  {selectedTask.source === 'MANUAL' && (isAdmin || selectedTask.createdBy === user?.username) && (
                    <button
                      type="button"
                      className="ent-btn ent-btn--danger ent-btn--sm"
                      onClick={() => handleDeleteTask(selectedTask)}
                    >
                      <Trash2 size={14} />
                      <span>Xóa công việc</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {selectedTask.source === 'MANUAL' && (isAdmin || selectedTask.createdBy === user?.username) && (
                    <button
                      type="button"
                      className="ent-btn ent-btn--secondary ent-btn--md"
                      onClick={() => {
                        closeDrawer();
                        openEditModal(selectedTask);
                      }}
                    >
                      <Edit2 size={14} />
                      <span>Chỉnh sửa</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="ent-btn ent-btn--primary ent-btn--md"
                    onClick={closeDrawer}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* WORKLOAD & BACKLOG ANALYTICS MODAL                                */}
        {/* ================================================================= */}
        {isWorkloadModalOpen && (
          <div className="ent-modal-overlay" onClick={() => setIsWorkloadModalOpen(false)}>
            <div className="ent-modal ent-modal--lg" onClick={(e) => e.stopPropagation()}>
              <div className="ent-modal__header">
                <div className="ent-modal__title-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart2 size={20} className="text-primary" />
                    <h3 className="ent-modal__title">Phân tích tải công việc & Báo cáo tồn đọng</h3>
                  </div>
                  <p className="ent-modal__subtitle">
                    Theo dõi tỷ lệ hoàn thành, phân bổ công việc theo nhân sự và gửi cảnh báo nhắc hạn
                  </p>
                </div>
                <button
                  type="button"
                  className="ent-modal__close-btn"
                  onClick={() => setIsWorkloadModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="ent-modal__body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {/* Metric Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="workload-card" style={{ borderLeft: '3px solid #2563EB' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TỔNG CÔNG VIỆC MỞ</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2563EB', margin: '0.2rem 0' }}>
                      {manualSummary.todo + manualSummary.inProgress}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {manualSummary.todo} Cần làm | {manualSummary.inProgress} Đang thực hiện
                    </div>
                  </div>

                  <div className="workload-card" style={{ borderLeft: '3px solid #10B981' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TỶ LỆ HOÀN THÀNH</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10B981', margin: '0.2rem 0' }}>
                      {manualSummary.total > 0
                        ? Math.round((manualSummary.done / manualSummary.total) * 100)
                        : 0}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {manualSummary.done} / {manualSummary.total} nhiệm vụ kết thúc
                    </div>
                  </div>

                  <div className="workload-card" style={{ borderLeft: '3px solid #EF4444' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TỒN ĐỌNG QUÁ HẠN</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#EF4444', margin: '0.2rem 0' }}>
                      {manualSummary.overdue}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      Chiếm {manualSummary.total > 0 ? Math.round((manualSummary.overdue / manualSummary.total) * 100) : 0}% tổng việc
                    </div>
                  </div>
                </div>

                {/* Escalation Trigger Button */}
                {isAdmin && (
                  <div
                    style={{
                      padding: '1rem',
                      background: 'rgba(37, 99, 235, 0.05)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.875rem' }}>
                        Cơ chế quét & Nhắc hạn chót (Escalation)
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                        Tự động rà soát các công việc quá hạn hoặc sắp đến hạn (trong 24 giờ) và phát thông báo nhắc nhở không trùng lặp.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ent-btn ent-btn--primary ent-btn--md"
                      onClick={handleCheckEscalation}
                      disabled={isEscalating}
                      id="btn-trigger-escalation"
                    >
                      {isEscalating ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
                      <span>Quét & Gửi nhắc nhở</span>
                    </button>
                  </div>
                )}

                {/* Team Workload Breakdown List */}
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 0.85rem' }}>
                  Phân bổ tải công việc theo nhân sự:
                </h4>

                {workloads.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>
                    Chưa có số liệu phân bổ công việc.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {workloads.map((w) => {
                      const total = Math.max(1, w.total);
                      const pctTodo = (w.todo / total) * 100;
                      const pctProgress = (w.inProgress / total) * 100;
                      const pctDone = (w.done / total) * 100;
                      const pctOverdue = (w.overdue / total) * 100;

                      return (
                        <div key={w.username} className="workload-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                                {w.fullName}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '0.4rem' }}>
                                (@{w.username})
                              </span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                              {w.total} công việc
                            </span>
                          </div>

                          {/* Workload Progress Bar */}
                          <div className="workload-bar-track">
                            <div className="workload-bar-segment workload-bar-segment--todo" style={{ width: `${pctTodo}%` }} title={`Cần làm: ${w.todo}`} />
                            <div className="workload-bar-segment workload-bar-segment--progress" style={{ width: `${pctProgress}%` }} title={`Đang làm: ${w.inProgress}`} />
                            <div className="workload-bar-segment workload-bar-segment--done" style={{ width: `${pctDone}%` }} title={`Hoàn thành: ${w.done}`} />
                            <div className="workload-bar-segment workload-bar-segment--overdue" style={{ width: `${pctOverdue}%` }} title={`Quá hạn: ${w.overdue}`} />
                          </div>

                          {/* Workload Pills */}
                          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.775rem', flexWrap: 'wrap' }}>
                            <span style={{ color: '#2563EB' }}>Cần làm: <strong>{w.todo}</strong></span>
                            <span style={{ color: '#0284C7' }}>Đang thực hiện: <strong>{w.inProgress}</strong></span>
                            <span style={{ color: '#10B981' }}>Hoàn thành: <strong>{w.done}</strong></span>
                            {w.overdue > 0 && (
                              <span style={{ color: '#EF4444', fontWeight: 600 }}>Quá hạn: <strong>{w.overdue}</strong></span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="ent-modal__footer">
                <button
                  type="button"
                  className="ent-btn ent-btn--primary ent-btn--md"
                  onClick={() => setIsWorkloadModalOpen(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: CREATE NEW TASK                                            */}
        {/* ================================================================= */}
        {isCreateModalOpen && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--md">
              <div className="ent-modal__header">
                <div className="ent-modal__title-group">
                  <h3 className="ent-modal__title">Giao công việc mới</h3>
                  <p className="ent-modal__subtitle">Nhập thông tin nhiệm vụ và phân công cho nhân viên trong hệ thống</p>
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
                  <div className="form-group">
                    <label className="form-label">Tiêu đề công việc *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: Kiểm tra tính pháp lý của hồ sơ hợp đồng"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mô tả chi tiết</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Mô tả các yêu cầu cần hoàn thành..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Người phụ trách *</label>
                      <select
                        className="form-control"
                        value={formData.assignee}
                        onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                        required
                      >
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

                  <div className="grid grid-2" style={{ gap: '1rem' }}>
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
                        value={formData.documentId || ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          setFormData({ ...formData, documentId: val });
                        }}
                      >
                        <option value="">-- Không liên kết --</option>
                        {availableDocuments.map((d) => (
                          <option key={d.id} value={d.id}>
                            #{d.id} - {d.title}
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
        {/* MODAL: EDIT TASK                                                  */}
        {/* ================================================================= */}
        {isEditModalOpen && formData.id && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--md">
              <div className="ent-modal__header">
                <div className="ent-modal__title-group">
                  <h3 className="ent-modal__title">Chỉnh sửa công việc #{formData.id}</h3>
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
                  <div className="form-group">
                    <label className="form-label">Tiêu đề công việc *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mô tả chi tiết</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Người phụ trách *</label>
                      <select
                        className="form-control"
                        value={formData.assignee}
                        onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                        required
                      >
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

                  <div className="grid grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Trạng thái công việc</label>
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

                  <div className="form-group">
                    <label className="form-label">Tài liệu liên quan (Tùy chọn)</label>
                    <select
                      className="form-control"
                      value={formData.documentId || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        setFormData({ ...formData, documentId: val });
                      }}
                    >
                      <option value="">-- Không liên kết --</option>
                      {availableDocuments.map((d) => (
                        <option key={d.id} value={d.id}>
                          #{d.id} - {d.title}
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
