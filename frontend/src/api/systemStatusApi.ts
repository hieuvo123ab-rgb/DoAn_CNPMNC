import apiClient from './client';

export interface ComponentStatus {
  status: string;
  message?: string;
  [key: string]: any;
}

export interface DatabaseComponentStatus extends ComponentStatus {
  database?: string;
  latencyMs?: number;
}

export interface StorageComponentStatus extends ComponentStatus {
  readable?: boolean;
  writable?: boolean;
}

export interface SigningComponentStatus extends ComponentStatus {
  subject?: string;
  serial?: string;
  validFrom?: string;
  validUntil?: string;
  expirationStatus?: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NOT_YET_VALID';
}

export interface OcrComponentStatus extends ComponentStatus {
  version?: string;
}

export interface SystemStatusData {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  readiness: 'READY' | 'DEGRADED' | 'NOT_READY';
  uptimeSeconds: number;
  timestamp: string;
  components: {
    database: DatabaseComponentStatus;
    storage: StorageComponentStatus;
    signing: SigningComponentStatus;
    ocr: OcrComponentStatus;
    notifications: ComponentStatus;
  };
}

export interface SystemMetricsData {
  uptimeSeconds: number;
  timestamp: string;
  memory: {
    usedMb: number;
    totalMb: number;
    maxMb: number;
  };
  requests: {
    totalCount: number;
    averageResponseTimeMs: number;
  };
  businessCounts: {
    documents: number;
    versions: number;
    pendingReviews: number;
    pendingDispositions: number;
    unreadNotifications: number;
  };
}

export const systemStatusApi = {
  getSystemStatus: async (): Promise<SystemStatusData> => {
    const response = await apiClient.get<SystemStatusData>('/admin/system/status');
    return response.data;
  },

  getSystemMetrics: async (): Promise<SystemMetricsData> => {
    const response = await apiClient.get<SystemMetricsData>('/admin/system/metrics');
    return response.data;
  },
};
