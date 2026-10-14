// ========== Auth ==========
export interface User {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'user' | 'viewer'
  avatarUrl?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// ========== Document ==========
export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived'

export interface SignatureDetails {
  signedBy: string
  signedAt: string
  certificateOrg: string
  algorithm: string
  isValid: boolean
}

export interface Document {
  id: string
  title: string
  description?: string
  fileName: string
  fileSize: number
  mimeType: string
  status: DocumentStatus
  version: number
  createdAt: string
  updatedAt: string
  createdBy: User
  tags?: string[]
  integrityHash?: string
  signatureStatus?: 'unsigned' | 'signed' | 'verified' | 'invalid'
  signatureDetails?: SignatureDetails
  versions?: DocumentVersion[]
}

export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  fileName: string
  fileSize: number
  createdAt: string
  createdBy: User
  changeNote?: string
  integrityHash: string
}

// ========== Search ==========
export interface SearchFilters {
  query?: string
  status?: DocumentStatus[]
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  createdBy?: string
}

export interface SavedSearch {
  id: string
  name: string
  filters: SearchFilters
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ========== Dashboard ==========
export interface DashboardStats {
  totalDocuments: number
  pendingApproval: number
  uploadedThisMonth: number
  storageUsed: number
  recentDocuments: Document[]
}

// ========== API ==========
export interface ApiError {
  message: string
  code?: string
  statusCode: number
}

// ========== Notification ==========
export interface AppNotification {
  id: string
  title: string
  message: string
  createdAt: string
  read: boolean
  link?: string
  type: 'info' | 'success' | 'warning' | 'error'
}
