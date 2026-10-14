import apiClient from './client';

export interface AuditItem {
  id: number;
  username: string;
  action: string;
  resourceType: string;
  resourceId: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
}

export interface AuditLogPageResponse {
  content: AuditItem[];
  currentPage: number;
  totalElements: number;
  totalPages: number;
  pageSize: number;
}

export interface AuditFilterParams {
  username?: string;
  action?: string;
  resourceType?: string;
  page?: number;
  size?: number;
}

export const getActivityHistory = async (limit: number = 20): Promise<AuditItem[]> => {
  const response = await apiClient.get<AuditItem[]>('/admin/activity', {
    params: { limit },
  });
  return response.data;
};

export const getAuditLogs = async (params?: AuditFilterParams): Promise<AuditLogPageResponse> => {
  const response = await apiClient.get<AuditLogPageResponse>('/admin/audit-logs', {
    params,
  });
  return response.data;
};
