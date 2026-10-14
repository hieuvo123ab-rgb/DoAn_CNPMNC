import apiClient from './client';

export interface UserItem {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  role: string;
  enabled: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  role: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  role?: string;
  enabled?: boolean;
}

export interface PermissionItem {
  code: string;
  name: string;
  description: string;
  granted: boolean;
}

export interface RolePermissionMatrix {
  matrix: Record<string, PermissionItem[]>;
}

export const adminUserApi = {
  getUsers: async (): Promise<UserItem[]> => {
    const response = await apiClient.get<UserItem[]>('/admin/users');
    return response.data;
  },

  getUserById: async (id: number): Promise<UserItem> => {
    const response = await apiClient.get<UserItem>(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (payload: CreateUserPayload): Promise<UserItem> => {
    const response = await apiClient.post<UserItem>('/admin/users', payload);
    return response.data;
  },

  updateUser: async (id: number, payload: UpdateUserPayload): Promise<UserItem> => {
    const response = await apiClient.put<UserItem>(`/admin/users/${id}`, payload);
    return response.data;
  },

  setUserStatus: async (id: number, enabled: boolean): Promise<UserItem> => {
    const response = await apiClient.patch<UserItem>(`/admin/users/${id}/status`, null, {
      params: { enabled },
    });
    return response.data;
  },

  getRolePermissions: async (): Promise<RolePermissionMatrix> => {
    const response = await apiClient.get<RolePermissionMatrix>('/admin/roles/permissions');
    return response.data;
  },
};
