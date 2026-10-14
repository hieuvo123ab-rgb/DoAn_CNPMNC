import apiClient from './client';

export interface NotificationItem {
  id: number;
  recipientUsername: string;
  type: string;
  title: string;
  message: string;
  documentId?: number;
  versionNumber?: number;
  relatedEntityType?: string;
  relatedEntityId?: number;
  read: boolean;
  createdAt: string;
  readAt?: string;
  actionKey?: string;
}

export interface NotificationPage {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const notificationApi = {
  getNotifications: async (page = 0, size = 20, unreadOnly?: boolean): Promise<NotificationPage> => {
    const params: Record<string, any> = { page, size };
    if (unreadOnly !== undefined) {
      params.unreadOnly = unreadOnly;
    }
    const res = await apiClient.get<NotificationPage>('/notifications', { params });
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    return res.data.unreadCount;
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    const res = await apiClient.put<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ markedCount: number }> => {
    const res = await apiClient.put<{ markedCount: number }>('/notifications/read-all');
    return res.data;
  },
};
