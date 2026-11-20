import apiClient from './client';

export type DataRoomStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
export type DataRoomRole = 'ROOM_OWNER' | 'ROOM_MANAGER' | 'ROOM_VIEWER' | 'ROOM_GUEST';
export type DataRoomMemberStatus = 'ACTIVE' | 'INVITED' | 'REVOKED' | 'EXPIRED';

export interface DataRoomItem {
  id: number;
  roomCode: string;
  name: string;
  purpose?: string;
  description?: string;
  ownerUsername: string;
  status: DataRoomStatus;
  watermarkEnabled: boolean;
  watermarkPattern: string;
  allowDownload: boolean;
  startDate?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  expired: boolean;
  accessible: boolean;
  documentCount: number;
  memberCount: number;
  currentUserRole?: DataRoomRole;
  currentUserCanDownload: boolean;
}

export interface DataRoomSummary {
  totalRooms: number;
  activeRooms: number;
  draftRooms: number;
  suspendedRooms: number;
  closedRooms: number;
  totalDocuments: number;
  totalMembers: number;
  totalEvents: number;
  suspiciousEventsCount: number;
}

export interface DataRoomDocumentItem {
  id: number;
  roomId: number;
  documentId: number;
  versionNumber?: number;
  title: string;
  description?: string;
  documentType?: string;
  originalFileName?: string;
  contentType?: string;
  fileSize?: number;
  fileHash?: string;
  folderPath: string;
  addedBy: string;
  addedAt: string;
}

export interface DataRoomMemberItem {
  id: number;
  roomId: number;
  username?: string;
  email: string;
  fullName?: string;
  role: DataRoomRole;
  status: DataRoomMemberStatus;
  canDownload: boolean;
  canViewMetadata: boolean;
  invitedAt: string;
  joinedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
}

export interface DataRoomInvitationItem {
  id: number;
  roomId: number;
  roomName: string;
  email: string;
  token: string;
  role: DataRoomRole;
  status: string;
  expiresAt: string;
  createdBy: string;
  createdAt: string;
  acceptedAt?: string;
  expired: boolean;
  valid: boolean;
}

export interface DataRoomEventItem {
  id: number;
  roomId: number;
  documentId?: number;
  documentTitle?: string;
  username?: string;
  email?: string;
  eventType: string;
  description: string;
  ipAddress?: string;
  suspicious: boolean;
  investigationCaseId?: number;
  timestamp: string;
}

export interface CreateDataRoomPayload {
  name: string;
  purpose?: string;
  description?: string;
  watermarkEnabled?: boolean;
  watermarkPattern?: string;
  allowDownload?: boolean;
  expiresAt?: string;
}

export interface UpdateDataRoomPayload {
  name: string;
  purpose?: string;
  description?: string;
  watermarkEnabled: boolean;
  watermarkPattern: string;
  allowDownload: boolean;
  expiresAt?: string;
}

export interface AddDocumentPayload {
  documentId: number;
  versionNumber?: number;
  folderPath?: string;
}

export interface AddMemberPayload {
  username?: string;
  email: string;
  fullName?: string;
  role: DataRoomRole;
  canDownload: boolean;
  canViewMetadata: boolean;
}

export interface InviteMemberPayload {
  email: string;
  role: DataRoomRole;
  expiresInDays: number;
}

export const vdrApi = {
  listRooms: async (): Promise<DataRoomItem[]> => {
    const res = await apiClient.get<DataRoomItem[]>('/vdr/rooms');
    return res.data;
  },

  getSummary: async (): Promise<DataRoomSummary> => {
    const res = await apiClient.get<DataRoomSummary>('/vdr/rooms/summary');
    return res.data;
  },

  getRoomById: async (id: number): Promise<DataRoomItem> => {
    const res = await apiClient.get<DataRoomItem>(`/vdr/rooms/${id}`);
    return res.data;
  },

  createRoom: async (payload: CreateDataRoomPayload): Promise<DataRoomItem> => {
    const res = await apiClient.post<DataRoomItem>('/vdr/rooms', payload);
    return res.data;
  },

  updateRoom: async (id: number, payload: UpdateDataRoomPayload): Promise<DataRoomItem> => {
    const res = await apiClient.put<DataRoomItem>(`/vdr/rooms/${id}`, payload);
    return res.data;
  },

  updateStatus: async (id: number, status: DataRoomStatus, note?: string): Promise<DataRoomItem> => {
    const res = await apiClient.put<DataRoomItem>(`/vdr/rooms/${id}/status`, { status, note });
    return res.data;
  },

  listDocuments: async (roomId: number): Promise<DataRoomDocumentItem[]> => {
    const res = await apiClient.get<DataRoomDocumentItem[]>(`/vdr/rooms/${roomId}/documents`);
    return res.data;
  },

  addDocument: async (roomId: number, payload: AddDocumentPayload): Promise<DataRoomDocumentItem> => {
    const res = await apiClient.post<DataRoomDocumentItem>(`/vdr/rooms/${roomId}/documents`, payload);
    return res.data;
  },

  removeDocument: async (roomId: number, documentId: number): Promise<void> => {
    await apiClient.delete(`/vdr/rooms/${roomId}/documents/${documentId}`);
  },

  listMembers: async (roomId: number): Promise<DataRoomMemberItem[]> => {
    const res = await apiClient.get<DataRoomMemberItem[]>(`/vdr/rooms/${roomId}/members`);
    return res.data;
  },

  addMember: async (roomId: number, payload: AddMemberPayload): Promise<DataRoomMemberItem> => {
    const res = await apiClient.post<DataRoomMemberItem>(`/vdr/rooms/${roomId}/members`, payload);
    return res.data;
  },

  listInvitations: async (roomId: number): Promise<DataRoomInvitationItem[]> => {
    const res = await apiClient.get<DataRoomInvitationItem[]>(`/vdr/rooms/${roomId}/invitations`);
    return res.data;
  },

  inviteMember: async (roomId: number, payload: InviteMemberPayload): Promise<DataRoomInvitationItem> => {
    const res = await apiClient.post<DataRoomInvitationItem>(`/vdr/rooms/${roomId}/invitations`, payload);
    return res.data;
  },

  acceptInvitation: async (token: string): Promise<DataRoomMemberItem> => {
    const res = await apiClient.post<DataRoomMemberItem>('/vdr/invitations/accept', null, {
      params: { token }
    });
    return res.data;
  },

  revokeMember: async (roomId: number, memberId: number, reason?: string): Promise<DataRoomMemberItem> => {
    const res = await apiClient.delete<DataRoomMemberItem>(`/vdr/rooms/${roomId}/members/${memberId}`, {
      params: { reason }
    });
    return res.data;
  },

  viewDocumentBlob: async (roomId: number, documentId: number): Promise<{ blob: Blob; contentType: string }> => {
    const res = await apiClient.get(`/vdr/rooms/${roomId}/documents/${documentId}/view`, {
      responseType: 'blob'
    });
    const headerVal = res.headers['content-type'];
    const contentType = typeof headerVal === 'string' ? headerVal : 'application/pdf';
    return { blob: res.data, contentType };
  },

  downloadDocument: async (roomId: number, documentId: number): Promise<Blob> => {
    const res = await apiClient.get(`/vdr/rooms/${roomId}/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return res.data;
  },

  listEvents: async (roomId: number, suspiciousOnly?: boolean): Promise<DataRoomEventItem[]> => {
    const res = await apiClient.get<DataRoomEventItem[]>(`/vdr/rooms/${roomId}/events`, {
      params: { suspiciousOnly }
    });
    return res.data;
  },

  listAllSuspiciousEvents: async (): Promise<DataRoomEventItem[]> => {
    const res = await apiClient.get<DataRoomEventItem[]>('/vdr/suspicious-events');
    return res.data;
  }
};
