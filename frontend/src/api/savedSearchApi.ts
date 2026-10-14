import apiClient from './client';

export interface SavedSearchItem {
  id: number;
  name: string;
  query: string | null;
  documentType: string | null;
  searchScope?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CreateSavedSearchPayload {
  name: string;
  query?: string | null;
  documentType?: string | null;
  searchScope?: string | null;
}

export const savedSearchApi = {
  getSavedSearches: async (): Promise<SavedSearchItem[]> => {
    const response = await apiClient.get<SavedSearchItem[]>('/saved-searches');
    return response.data;
  },

  createSavedSearch: async (payload: CreateSavedSearchPayload): Promise<SavedSearchItem> => {
    const response = await apiClient.post<SavedSearchItem>('/saved-searches', payload);
    return response.data;
  },

  deleteSavedSearch: async (id: number): Promise<void> => {
    await apiClient.delete(`/saved-searches/${id}`);
  },
};
