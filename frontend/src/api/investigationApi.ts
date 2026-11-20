import apiClient from './client';

export type InvestigationReason =
  | 'PAYMENT_TERMS_DISCREPANCY'
  | 'UNAUTHORIZED_MODIFICATION'
  | 'HASH_MISMATCH'
  | 'VDR_SECURITY_ALERT'
  | 'COMPLIANCE_AUDIT'
  | 'OTHER';

export type InvestigationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type InvestigationStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'REVIEW_PENDING'
  | 'CLOSED'
  | 'REOPENED';

export interface InvestigationCaseItem {
  id: number;
  caseNumber: string;
  title: string;
  description?: string;
  reason: InvestigationReason;
  severity: InvestigationSeverity;
  status: InvestigationStatus;
  assignedTo: string;
  assignedToFullName?: string;
  createdBy: string;
  dueDate?: string;
  overdue: boolean;
  targetDocumentId?: number;
  targetDocumentTitle?: string;
  vdrEventId?: number;
  conclusion?: string;
  conclusionSubmittedAt?: string;
  conclusionApprovedBy?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
  findingsCount: number;
  eventsCount: number;
}

export interface InvestigationSummary {
  total: number;
  open: number;
  investigating: number;
  reviewPending: number;
  closed: number;
  reopened: number;
  critical: number;
  overdue: number;
}

export interface InvestigationEvidenceItem {
  id: number;
  caseId: number;
  documentId: number;
  versionNumber: number;
  originalFileName: string;
  storedFileName: string;
  contentType?: string;
  fileSize: number;
  fileHash: string;
  legalHoldApplied: boolean;
  collectedBy: string;
  collectedAt: string;
  notes?: string;
}

export interface DiffLine {
  type: 'EQUAL' | 'INSERT' | 'DELETE';
  lineNumberA?: number;
  lineNumberB?: number;
  text: string;
}

export interface VersionDiffResult {
  documentId: number;
  documentTitle: string;
  versionA: number;
  versionB: number;
  hashA: string;
  hashB: string;
  hashMatch: boolean;
  createdAtA: string;
  createdAtB: string;
  createdByA: string;
  createdByB: string;
  fileSizeA: number;
  fileSizeB: number;
  fileNameA: string;
  fileNameB: string;
  metaDiff: Record<string, any>;
  diffLines: DiffLine[];
}

export interface InvestigationEventItem {
  id: number;
  caseId: number;
  eventType: string;
  description: string;
  actor: string;
  source: string;
  timestamp: string;
}

export interface InvestigationFindingItem {
  id: number;
  caseId: number;
  title: string;
  details: string;
  category?: string;
  reportedBy: string;
  createdAt: string;
}

export interface CreateCasePayload {
  title: string;
  description?: string;
  reason: InvestigationReason;
  severity: InvestigationSeverity;
  assignedTo: string;
  dueDate?: string;
  targetDocumentId?: number;
  vdrEventId?: number;
}

export interface UpdateCasePayload {
  title?: string;
  description?: string;
  severity?: InvestigationSeverity;
  assignedTo?: string;
  dueDate?: string;
}

export interface PreserveEvidencePayload {
  documentId: number;
  versionNumber: number;
  notes?: string;
  applyLegalHold: boolean;
}

export const investigationApi = {
  listCases: async (params?: {
    status?: InvestigationStatus;
    severity?: InvestigationSeverity;
    assignedTo?: string;
    search?: string;
  }): Promise<InvestigationCaseItem[]> => {
    const res = await apiClient.get<InvestigationCaseItem[]>('/investigations', { params });
    return res.data;
  },

  getSummary: async (): Promise<InvestigationSummary> => {
    const res = await apiClient.get<InvestigationSummary>('/investigations/summary');
    return res.data;
  },

  getCaseById: async (id: number): Promise<InvestigationCaseItem> => {
    const res = await apiClient.get<InvestigationCaseItem>(`/investigations/${id}`);
    return res.data;
  },

  createCase: async (payload: CreateCasePayload): Promise<InvestigationCaseItem> => {
    const res = await apiClient.post<InvestigationCaseItem>('/investigations', payload);
    return res.data;
  },

  updateCase: async (id: number, payload: UpdateCasePayload): Promise<InvestigationCaseItem> => {
    const res = await apiClient.put<InvestigationCaseItem>(`/investigations/${id}`, payload);
    return res.data;
  },

  updateStatus: async (id: number, status: InvestigationStatus, note?: string): Promise<InvestigationCaseItem> => {
    const res = await apiClient.put<InvestigationCaseItem>(`/investigations/${id}/status`, { status, note });
    return res.data;
  },

  listEvidence: async (caseId: number): Promise<InvestigationEvidenceItem[]> => {
    const res = await apiClient.get<InvestigationEvidenceItem[]>(`/investigations/${caseId}/evidence`);
    return res.data;
  },

  preserveEvidence: async (caseId: number, payload: PreserveEvidencePayload): Promise<InvestigationEvidenceItem> => {
    const res = await apiClient.post<InvestigationEvidenceItem>(`/investigations/${caseId}/evidence`, payload);
    return res.data;
  },

  computeDiff: async (documentId: number, versionA: number, versionB: number): Promise<VersionDiffResult> => {
    const res = await apiClient.get<VersionDiffResult>('/investigations/diff', {
      params: { documentId, versionA, versionB }
    });
    return res.data;
  },

  getTimeline: async (caseId: number): Promise<InvestigationEventItem[]> => {
    const res = await apiClient.get<InvestigationEventItem[]>(`/investigations/${caseId}/timeline`);
    return res.data;
  },

  listFindings: async (caseId: number): Promise<InvestigationFindingItem[]> => {
    const res = await apiClient.get<InvestigationFindingItem[]>(`/investigations/${caseId}/findings`);
    return res.data;
  },

  addFinding: async (
    caseId: number,
    payload: { title: string; details: string; category?: string }
  ): Promise<InvestigationFindingItem> => {
    const res = await apiClient.post<InvestigationFindingItem>(`/investigations/${caseId}/findings`, payload);
    return res.data;
  },

  submitConclusion: async (caseId: number, conclusion: string): Promise<InvestigationCaseItem> => {
    const res = await apiClient.post<InvestigationCaseItem>(`/investigations/${caseId}/conclusion`, { conclusion });
    return res.data;
  },

  approveConclusion: async (caseId: number): Promise<InvestigationCaseItem> => {
    const res = await apiClient.post<InvestigationCaseItem>(`/investigations/${caseId}/approve`);
    return res.data;
  },

  createFromVdrEvent: async (payload: {
    vdrEventId: number;
    assignedTo?: string;
    title?: string;
  }): Promise<InvestigationCaseItem> => {
    const res = await apiClient.post<InvestigationCaseItem>('/investigations/from-vdr-event', payload);
    return res.data;
  },

  exportManifest: async (caseId: number): Promise<Blob> => {
    const res = await apiClient.get(`/investigations/${caseId}/export-manifest`, {
      responseType: 'blob'
    });
    return res.data;
  }
};
