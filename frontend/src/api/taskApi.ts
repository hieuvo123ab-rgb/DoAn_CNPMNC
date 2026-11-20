import apiClient from './client';

// ---------------------------------------------------------------------------
// 1. System Derived Tasks (Unchanged from original business logic)
// ---------------------------------------------------------------------------
export type TaskType = 'REVIEW_PENDING' | 'DISPOSITION_PENDING' | 'REVISION_REQUIRED';

export interface TaskItem {
  taskType: TaskType;
  documentId: number;
  documentTitle: string;
  versionNumber?: number;
  relatedEntityId?: number;
  status: string;
  createdAt: string;
  actionKey?: string;
  priority?: string;
}

export type TaskDto = TaskItem;

// ---------------------------------------------------------------------------
// 2. Manual Task Management Subsystem
// ---------------------------------------------------------------------------
export type ManualTaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type ManualTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ManualTaskActivityItem {
  id: number;
  taskId: number;
  username: string;
  userFullName: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  createdAt: string;
}

export interface ManualTaskItem {
  id: number;
  title: string;
  description?: string;
  assignee?: string;
  assigneeFullName?: string;
  assigneeRole?: string;
  createdBy: string;
  createdByFullName?: string;
  createdByRole?: string;
  priority: ManualTaskPriority;
  status: ManualTaskStatus;
  dueDate?: string;
  overdue: boolean;
  documentId?: number;
  documentTitle?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  activities?: ManualTaskActivityItem[];
}

export interface ManualTaskSummary {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  cancelled: number;
  overdue: number;
}

export interface AssigneeOption {
  username: string;
  fullName: string;
  email?: string;
  role: string;
}

export interface ManualTaskCreateParams {
  title: string;
  description?: string;
  assignee: string;
  priority?: ManualTaskPriority;
  dueDate?: string;
  documentId?: number;
  notes?: string;
}

export interface ManualTaskUpdateParams {
  title: string;
  description?: string;
  assignee: string;
  priority?: ManualTaskPriority;
  status?: ManualTaskStatus;
  dueDate?: string;
  documentId?: number;
  notes?: string;
}

export interface ManualTaskStatusParams {
  status: ManualTaskStatus;
  note?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ---------------------------------------------------------------------------
// 3. API Client Methods
// ---------------------------------------------------------------------------
export const taskApi = {
  // Original Derived Tasks endpoint (preserves 100% backward compatibility)
  getTasks: async (): Promise<TaskItem[]> => {
    const res = await apiClient.get<TaskItem[]>('/tasks');
    return res.data;
  },

  getDerivedTasks: async (): Promise<TaskItem[]> => {
    const res = await apiClient.get<TaskItem[]>('/tasks');
    return res.data;
  },

  // Manual Tasks endpoints
  getManualTasks: async (params?: {
    status?: string;
    priority?: string;
    assignee?: string;
    search?: string;
    overdue?: boolean;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
  }): Promise<PageResponse<ManualTaskItem>> => {
    const res = await apiClient.get<PageResponse<ManualTaskItem>>('/manual-tasks', { params });
    return res.data;
  },

  getManualTaskSummary: async (): Promise<ManualTaskSummary> => {
    const res = await apiClient.get<ManualTaskSummary>('/manual-tasks/summary');
    return res.data;
  },

  getAssigneeOptions: async (): Promise<AssigneeOption[]> => {
    const res = await apiClient.get<AssigneeOption[]>('/manual-tasks/assignees');
    return res.data;
  },

  getManualTaskById: async (id: number): Promise<ManualTaskItem> => {
    const res = await apiClient.get<ManualTaskItem>(`/manual-tasks/${id}`);
    return res.data;
  },

  createManualTask: async (data: ManualTaskCreateParams): Promise<ManualTaskItem> => {
    const res = await apiClient.post<ManualTaskItem>('/manual-tasks', data);
    return res.data;
  },

  updateManualTask: async (id: number, data: ManualTaskUpdateParams): Promise<ManualTaskItem> => {
    const res = await apiClient.put<ManualTaskItem>(`/manual-tasks/${id}`, data);
    return res.data;
  },

  updateManualTaskStatus: async (id: number, data: ManualTaskStatusParams): Promise<ManualTaskItem> => {
    const res = await apiClient.patch<ManualTaskItem>(`/manual-tasks/${id}/status`, data);
    return res.data;
  },

  deleteManualTask: async (id: number): Promise<void> => {
    await apiClient.delete(`/manual-tasks/${id}`);
  },
};
