import apiClient from './client';

export interface DocumentStatistics {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  totalStorageBytes: number;
}

export interface UsageStatistics {
  totalUploads: number;
  totalPreviews: number;
  totalDownloads: number;
  totalUpdates: number;
  activeUsers: number;
}

export interface RecentActivity {
  id: number;
  username: string;
  action: string;
  resourceType: string;
  resourceId: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
}

export interface DashboardData {
  documentStats: DocumentStatistics;
  usageStats: UsageStatistics;
  totalUsers: number;
  recentActivities: RecentActivity[];
}

export const getDashboard = async (): Promise<DashboardData> => {
  const response = await apiClient.get<DashboardData>('/admin/dashboard');
  return response.data;
};

export const getDocumentStatistics = async (): Promise<DocumentStatistics> => {
  const response = await apiClient.get<DocumentStatistics>('/admin/statistics/documents');
  return response.data;
};

export const getUsageStatistics = async (): Promise<UsageStatistics> => {
  const response = await apiClient.get<UsageStatistics>('/admin/statistics/usage');
  return response.data;
};
