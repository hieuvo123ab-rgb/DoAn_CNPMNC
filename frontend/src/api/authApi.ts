import apiClient from './client';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  tokenType: string;
  username: string;
  fullName: string;
  role: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponseData> => {
    const res = await apiClient.post<LoginResponseData>('/auth/login', payload);
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/logout');
    return res.data;
  },
};
