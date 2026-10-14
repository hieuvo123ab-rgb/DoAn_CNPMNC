import apiClient from './client';

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

export const taskApi = {
  getTasks: async (): Promise<TaskItem[]> => {
    const res = await apiClient.get<TaskItem[]>('/tasks');
    return res.data;
  },
};
