import apiClient from './client';

export interface DocumentItem {
  id: number;
  title: string;
  description: string;
  documentType: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  createdBy: string;
  accessMode?: 'INTERNAL' | 'PRIVATE' | string;
  userPermission?: string;
  currentVersionNumber?: number;
  currentReviewStatus?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  reviewStatus?: string;
  lifecycleStatus?: 'ACTIVE' | 'ARCHIVED' | 'DISPOSED' | string;
  archivedAt?: string | null;
  archivedBy?: string | null;
  retentionUntil?: string | null;
  legalHold?: boolean;
  legalHoldReason?: string | null;
  legalHoldSetAt?: string | null;
  legalHoldSetBy?: string | null;
  disposedAt?: string | null;
  disposedBy?: string | null;
  eligibleForDisposition?: boolean;
  matchSnippet?: string;
  contentMatched?: boolean;
  contentSource?: 'NATIVE' | 'OCR' | 'NONE' | string;
  ocrStatus?: 'NOT_REQUIRED' | 'PENDING' | 'READY' | 'FAILED' | 'SKIPPED' | string;
  ocrCharacterCount?: number | null;
  ocrAt?: string | null;
  extractionStatus?: 'PENDING' | 'READY' | 'UNSUPPORTED' | 'FAILED' | string;
  createdAt: string;
  updatedAt: string;
  // Phase 12: Semantic search result fields
  semanticMatched?: boolean;
  semanticScore?: number;   // cosine similarity (SEMANTIC/HYBRID modes)
  searchMode?: 'LEXICAL' | 'SEMANTIC' | 'HYBRID' | string;
}

export interface OcrIndexRebuildResponse {
  total: number;
  eligible: number;
  queued: number;
  ready: number;
  failed: number;
  skipped: number;
}

export interface DispositionItem {
  requestId: number;
  documentId: number;
  documentTitle?: string;
  currentVersion?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  disposedAt?: string | null;
  disposedBy?: string | null;
  retentionUntil?: string | null;
  legalHold?: boolean;
  eligibleForDisposition?: boolean;
}

export interface ReviewItem {
  reviewId: number;
  documentId: number;
  documentTitle?: string;
  versionNumber: number;
  originalFileName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED' | string;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
}

export interface DocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  originalFileName: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  createdAt: string;
  changeNote?: string;
  isCurrent: boolean;
  // Phase 13: Integrity hash
  fileHash?: string;
  hashAlgorithm?: string;
  hashComputedAt?: string;
  // Phase 13: Signature (signatureBytes intentionally excluded)
  signatureStatus?: 'UNSIGNED' | 'VALID' | 'INVALID';
  signerUsername?: string;
  signedAt?: string;
  signatureAlgorithm?: string;
  certSerialNumber?: string;
}

export interface DocumentPermissionItem {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  permission: 'READ' | 'EDIT';
  createdAt: string;
}

export interface DocumentPermissionsResponse {
  documentId: number;
  documentTitle: string;
  accessMode: 'INTERNAL' | 'PRIVATE' | string;
  owner: string;
  permissions: DocumentPermissionItem[];
}

export const documentApi = {
  uploadDocument: async (formData: FormData): Promise<DocumentItem> => {
    const res = await apiClient.post<DocumentItem>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getAllDocuments: async (params?: {
    q?: string;
    searchScope?: string;
    searchMode?: 'LEXICAL' | 'SEMANTIC' | 'HYBRID' | string;
    topK?: number;
    documentType?: string;
    lifecycleStatus?: string;
  }): Promise<DocumentItem[]> => {
    const res = await apiClient.get<DocumentItem[]>('/documents', { params });
    return res.data;
  },

  getMyDocuments: async (params?: { q?: string; searchScope?: string; documentType?: string; lifecycleStatus?: string }): Promise<DocumentItem[]> => {
    const res = await apiClient.get<DocumentItem[]>('/documents/mine', { params });
    return res.data;
  },

  getSharedWithMeDocuments: async (params?: { q?: string; searchScope?: string; documentType?: string; lifecycleStatus?: string }): Promise<DocumentItem[]> => {
    const res = await apiClient.get<DocumentItem[]>('/documents/shared-with-me', { params });
    return res.data;
  },

  updateDocument: async (
    id: number,
    data: { title: string; description?: string; documentType: string; accessMode?: string }
  ): Promise<DocumentItem> => {
    const res = await apiClient.put<DocumentItem>(`/documents/${id}`, data);
    return res.data;
  },

  updateAccessMode: async (id: number, accessMode: 'INTERNAL' | 'PRIVATE'): Promise<DocumentItem> => {
    const res = await apiClient.put<DocumentItem>(`/documents/${id}/access-mode`, { accessMode });
    return res.data;
  },

  getPermissions: async (id: number): Promise<DocumentPermissionsResponse> => {
    const res = await apiClient.get<DocumentPermissionsResponse>(`/documents/${id}/permissions`);
    return res.data;
  },

  shareDocument: async (
    id: number,
    data: { userId?: number; username?: string; permission: 'READ' | 'EDIT' }
  ): Promise<DocumentPermissionItem> => {
    const res = await apiClient.post<DocumentPermissionItem>(`/documents/${id}/permissions`, data);
    return res.data;
  },

  revokePermission: async (id: number, userId: number): Promise<void> => {
    await apiClient.delete(`/documents/${id}/permissions/${userId}`);
  },

  getDocumentById: async (id: number): Promise<DocumentItem> => {
    const res = await apiClient.get<DocumentItem>(`/documents/${id}`);
    return res.data;
  },

  downloadDocument: async (id: number, fileName: string): Promise<void> => {
    const res = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    const headerType = res.headers['content-type'];
    const contentType = typeof headerType === 'string' ? headerType : 'application/octet-stream';
    const blob = new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  previewDocument: async (id: number): Promise<{ blob: Blob; url: string; contentType: string }> => {
    const res = await apiClient.get(`/documents/${id}/preview`, {
      responseType: 'blob',
    });
    const headerType = res.headers['content-type'];
    const contentType = typeof headerType === 'string' ? headerType : 'application/octet-stream';
    const blob = new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    return { blob, url, contentType };
  },

  getDocumentVersions: async (id: number): Promise<DocumentVersion[]> => {
    const res = await apiClient.get<DocumentVersion[]>(`/documents/${id}/versions`);
    return res.data;
  },

  uploadDocumentVersion: async (id: number, file: File, changeNote?: string): Promise<DocumentVersion> => {
    const formData = new FormData();
    formData.append('file', file);
    if (changeNote) {
      formData.append('changeNote', changeNote);
    }
    const res = await apiClient.post<DocumentVersion>(`/documents/${id}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  restoreDocumentVersion: async (id: number, versionNumber: number): Promise<DocumentVersion> => {
    const res = await apiClient.post<DocumentVersion>(`/documents/${id}/versions/${versionNumber}/restore`);
    return res.data;
  },

  downloadDocumentVersion: async (id: number, versionNumber: number, fileName: string): Promise<void> => {
    const res = await apiClient.get(`/documents/${id}/versions/${versionNumber}/download`, {
      responseType: 'blob',
    });
    const headerType = res.headers['content-type'];
    const contentType = typeof headerType === 'string' ? headerType : 'application/octet-stream';
    const blob = new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  previewDocumentVersion: async (id: number, versionNumber: number): Promise<{ blob: Blob; url: string; contentType: string }> => {
    const res = await apiClient.get(`/documents/${id}/versions/${versionNumber}/preview`, {
      responseType: 'blob',
    });
    const headerType = res.headers['content-type'];
    const contentType = typeof headerType === 'string' ? headerType : 'application/octet-stream';
    const blob = new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    return { blob, url, contentType };
  },

  submitDocumentReview: async (id: number): Promise<ReviewItem> => {
    const res = await apiClient.post<ReviewItem>(`/documents/${id}/review`);
    return res.data;
  },

  getDocumentReviewHistory: async (id: number): Promise<ReviewItem[]> => {
    const res = await apiClient.get<ReviewItem[]>(`/documents/${id}/reviews`);
    return res.data;
  },

  getAdminReviewQueue: async (params?: { status?: string; username?: string; documentId?: number }): Promise<ReviewItem[]> => {
    const res = await apiClient.get<ReviewItem[]>('/admin/reviews', { params });
    return res.data;
  },

  approveReview: async (reviewId: number, comment?: string): Promise<ReviewItem> => {
    const res = await apiClient.post<ReviewItem>(`/admin/reviews/${reviewId}/approve`, { comment });
    return res.data;
  },

  rejectReview: async (reviewId: number, comment: string): Promise<ReviewItem> => {
    const res = await apiClient.post<ReviewItem>(`/admin/reviews/${reviewId}/reject`, { comment });
    return res.data;
  },

  previewReviewVersion: async (reviewId: number): Promise<{ blob: Blob; url: string; contentType: string }> => {
    const res = await apiClient.get(`/admin/reviews/${reviewId}/preview`, {
      responseType: 'blob',
    });
    const headerType = res.headers['content-type'];
    const contentType = typeof headerType === 'string' ? headerType : 'application/octet-stream';
    const blob = new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    return { blob, url, contentType };
  },

  archiveDocument: async (id: number, data?: { retentionUntil?: string }): Promise<DocumentItem> => {
    const res = await apiClient.post<DocumentItem>(`/documents/${id}/archive`, data || {});
    return res.data;
  },

  unarchiveDocument: async (id: number): Promise<DocumentItem> => {
    const res = await apiClient.post<DocumentItem>(`/documents/${id}/unarchive`);
    return res.data;
  },

  updateRetention: async (id: number, retentionUntil?: string): Promise<DocumentItem> => {
    const res = await apiClient.put<DocumentItem>(`/documents/${id}/retention`, { retentionUntil });
    return res.data;
  },

  updateLegalHold: async (id: number, enabled: boolean, reason?: string): Promise<DocumentItem> => {
    const res = await apiClient.put<DocumentItem>(`/documents/${id}/legal-hold`, { enabled, reason });
    return res.data;
  },

  requestDisposition: async (id: number, reason: string): Promise<DispositionItem> => {
    const res = await apiClient.post<DispositionItem>(`/documents/${id}/disposition`, { reason });
    return res.data;
  },

  cancelDisposition: async (id: number): Promise<DispositionItem> => {
    const res = await apiClient.post<DispositionItem>(`/documents/${id}/disposition/cancel`);
    return res.data;
  },

  getDispositionHistory: async (id: number): Promise<DispositionItem[]> => {
    const res = await apiClient.get<DispositionItem[]>(`/documents/${id}/dispositions`);
    return res.data;
  },

  getAdminDispositionQueue: async (params?: { status?: string }): Promise<DispositionItem[]> => {
    const res = await apiClient.get<DispositionItem[]>('/admin/dispositions', { params });
    return res.data;
  },

  approveDisposition: async (requestId: number, comment?: string): Promise<DispositionItem> => {
    const res = await apiClient.post<DispositionItem>(`/admin/dispositions/${requestId}/approve`, { comment });
    return res.data;
  },

  rejectDisposition: async (requestId: number, comment: string): Promise<DispositionItem> => {
    const res = await apiClient.post<DispositionItem>(`/admin/dispositions/${requestId}/reject`, { comment });
    return res.data;
  },

  rebuildContentIndex: async (force?: boolean): Promise<{
    total: number;
    processed: number;
    ready: number;
    failed: number;
    unsupported: number;
    skipped: number;
  }> => {
    const res = await apiClient.post('/admin/content-index/rebuild', null, {
      params: force !== undefined ? { force } : undefined,
    });
    return res.data;
  },

  rebuildOcrIndex: async (force?: boolean): Promise<OcrIndexRebuildResponse> => {
    const res = await apiClient.post<OcrIndexRebuildResponse>('/admin/ocr/rebuild', null, {
      params: force !== undefined ? { force } : undefined,
    });
    return res.data;
  },

  // Phase 13: Digital Signature & Integrity
  signDocumentVersion: async (docId: number, versionNumber: number): Promise<{
    documentId: number;
    versionNumber: number;
    signatureAlgorithm: string;
    signerUsername: string;
    signedAt: string;
    certSerialNumber: string;
    certSubject: string;
    certValidFrom: string;
    certValidUntil: string;
    message: string;
  }> => {
    const res = await apiClient.post(`/documents/${docId}/versions/${versionNumber}/sign`);
    return res.data;
  },

  verifyDocumentIntegrity: async (docId: number, versionNumber: number): Promise<{
    documentId: number;
    versionNumber: number;
    integrityStatus: 'INTACT' | 'TAMPERED' | 'UNKNOWN';
    fileHash?: string;
    hashAlgorithm?: string;
    hashComputedAt?: string;
    signatureStatus: 'UNSIGNED' | 'VALID' | 'INVALID';
    signerUsername?: string;
    signedAt?: string;
    signatureAlgorithm?: string;
    certSerialNumber?: string;
    certSubject?: string;
    certValidFrom?: string;
    certValidUntil?: string;
  }> => {
    const res = await apiClient.get(`/documents/${docId}/versions/${versionNumber}/integrity`);
    return res.data;
  },

  getSigningCertificate: async (): Promise<{
    algorithm: string;
    serialNumber: string;
    subject: string;
    issuer: string;
    validFrom: string;
    validUntil: string;
    publicKeyAlgorithm: string;
    pemCertificate: string;
  }> => {
    const res = await apiClient.get('/admin/signature/certificate');
    return res.data;
  },
};
