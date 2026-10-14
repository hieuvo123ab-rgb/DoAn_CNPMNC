import type {
  Document,
  DocumentVersion,
  DocumentStatus,
  SearchFilters,
  SavedSearch,
  DashboardStats,
  PaginatedResponse,
  AppNotification,
} from '@/types'
import {
  initialDocuments,
  initialVersions,
  initialSavedSearches,
  initialNotifications,
  mockCurrentUser,
} from './mockData'

const DOCS_KEY = 'docmanager_documents'
const VERSIONS_KEY = 'docmanager_versions'
const SAVED_SEARCHES_KEY = 'docmanager_saved_searches'
const NOTIFS_KEY = 'docmanager_notifications'

// LocalStorage helpers
function loadStorage<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultVal
    return JSON.parse(raw) as T
  } catch {
    return defaultVal
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Lỗi khi lưu localStorage:', e)
  }
}

function getStoredDocuments(): Document[] {
  return loadStorage<Document[]>(DOCS_KEY, initialDocuments)
}

function getStoredVersions(): Record<string, DocumentVersion[]> {
  return loadStorage<Record<string, DocumentVersion[]>>(VERSIONS_KEY, initialVersions)
}

function generateRandomHash(): string {
  const chars = '0123456789abcdef'
  let hash = ''
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)]
  }
  return hash
}

export const documentService = {
  // 1. Get documents with pagination, filters and sorting
  async getDocuments(params: {
    page?: number
    pageSize?: number
    query?: string
    status?: DocumentStatus | 'all'
    tag?: string
    sortBy?: 'updatedAt' | 'createdAt' | 'title' | 'fileSize'
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<PaginatedResponse<Document>> {
    // Giả lập network delay ngắn cho trải nghiệm mượt mà
    await new Promise((r) => setTimeout(r, 120))

    const {
      page = 1,
      pageSize = 10,
      query = '',
      status = 'all',
      tag = '',
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = params

    let docs = getStoredDocuments()

    // Lọc theo query (tiêu đề, tên file, mô tả, tags)
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Lọc theo trạng thái
    if (status && status !== 'all') {
      docs = docs.filter((d) => d.status === status)
    }

    // Lọc theo tag
    if (tag.trim()) {
      docs = docs.filter((d) => d.tags?.includes(tag))
    }

    // Sắp xếp
    docs.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title, 'vi')
      } else if (sortBy === 'fileSize') {
        comparison = a.fileSize - b.fileSize
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    const total = docs.length
    const totalPages = Math.ceil(total / pageSize) || 1
    const startIndex = (page - 1) * pageSize
    const paginatedDocs = docs.slice(startIndex, startIndex + pageSize)

    return {
      data: paginatedDocs,
      total,
      page,
      pageSize,
      totalPages,
    }
  },

  // 2. Get document detail by id
  async getDocument(id: string): Promise<Document | null> {
    await new Promise((r) => setTimeout(r, 80))
    const docs = getStoredDocuments()
    const doc = docs.find((d) => d.id === id)
    if (!doc) return null

    const allVersions = getStoredVersions()
    const docVersions = allVersions[id] || [
      {
        id: `ver-${doc.id}-1`,
        documentId: doc.id,
        version: doc.version,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt,
        createdBy: doc.createdBy,
        changeNote: 'Phiên bản ban đầu',
        integrityHash: doc.integrityHash || generateRandomHash(),
      },
    ]

    return {
      ...doc,
      versions: docVersions,
    }
  },

  // 3. Create document
  async createDocument(input: {
    title: string
    description?: string
    fileName: string
    fileSize: number
    mimeType?: string
    tags?: string[]
    status?: DocumentStatus
  }): Promise<Document> {
    await new Promise((r) => setTimeout(r, 200))
    const docs = getStoredDocuments()
    const allVersions = getStoredVersions()

    const now = new Date().toISOString()
    const id = `doc-${String(docs.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`
    const integrityHash = generateRandomHash()

    const newDoc: Document = {
      id,
      title: input.title,
      description: input.description || '',
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType || 'application/octet-stream',
      status: input.status || 'pending',
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: mockCurrentUser,
      tags: input.tags || ['Mới tải lên'],
      integrityHash,
      signatureStatus: 'unsigned',
    }

    const firstVersion: DocumentVersion = {
      id: `ver-${id}-1`,
      documentId: id,
      version: 1,
      fileName: input.fileName,
      fileSize: input.fileSize,
      createdAt: now,
      createdBy: mockCurrentUser,
      changeNote: 'Tải lên tài liệu lần đầu',
      integrityHash,
    }

    docs.unshift(newDoc)
    allVersions[id] = [firstVersion]

    saveStorage(DOCS_KEY, docs)
    saveStorage(VERSIONS_KEY, allVersions)

    // Tạo thông báo
    this.addNotification({
      title: 'Tải lên tài liệu thành công',
      message: `Tài liệu "${newDoc.title}" đã được thêm vào hệ thống.`,
      link: `/documents/${newDoc.id}`,
      type: 'success',
    })

    return newDoc
  },

  // 4. Update document metadata
  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    await new Promise((r) => setTimeout(r, 100))
    const docs = getStoredDocuments()
    const index = docs.findIndex((d) => d.id === id)
    if (index === -1) throw new Error('Không tìm thấy tài liệu')

    docs[index] = {
      ...docs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveStorage(DOCS_KEY, docs)
    return docs[index]
  },

  // 5. Delete document
  async deleteDocument(id: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 100))
    let docs = getStoredDocuments()
    const allVersions = getStoredVersions()

    const target = docs.find((d) => d.id === id)
    docs = docs.filter((d) => d.id !== id)
    delete allVersions[id]

    saveStorage(DOCS_KEY, docs)
    saveStorage(VERSIONS_KEY, allVersions)

    if (target) {
      this.addNotification({
        title: 'Đã xóa tài liệu',
        message: `Tài liệu "${target.title}" đã được gỡ khỏi hệ thống.`,
        type: 'warning',
      })
    }

    return true
  },

  // 6. Add new version to document
  async addDocumentVersion(
    documentId: string,
    file: { fileName: string; fileSize: number; changeNote: string }
  ): Promise<DocumentVersion> {
    await new Promise((r) => setTimeout(r, 150))
    const docs = getStoredDocuments()
    const docIndex = docs.findIndex((d) => d.id === documentId)
    if (docIndex === -1) throw new Error('Không tìm thấy tài liệu')

    const allVersions = getStoredVersions()
    const currentVersions = allVersions[documentId] || []
    const newVersionNumber = (docs[docIndex].version || currentVersions.length) + 1
    const newHash = generateRandomHash()
    const now = new Date().toISOString()

    const newVersion: DocumentVersion = {
      id: `ver-${documentId}-${newVersionNumber}`,
      documentId,
      version: newVersionNumber,
      fileName: file.fileName,
      fileSize: file.fileSize,
      createdAt: now,
      createdBy: mockCurrentUser,
      changeNote: file.changeNote || `Cập nhật phiên bản v${newVersionNumber}`,
      integrityHash: newHash,
    }

    currentVersions.unshift(newVersion)
    allVersions[documentId] = currentVersions

    docs[docIndex] = {
      ...docs[docIndex],
      version: newVersionNumber,
      fileName: file.fileName,
      fileSize: file.fileSize,
      integrityHash: newHash,
      updatedAt: now,
      // Khi có phiên bản mới, reset trạng thái chữ ký về unsigned để ký lại
      signatureStatus: 'unsigned',
      signatureDetails: undefined,
    }

    saveStorage(DOCS_KEY, docs)
    saveStorage(VERSIONS_KEY, allVersions)

    this.addNotification({
      title: 'Phiên bản mới đã được tải lên',
      message: `Tài liệu "${docs[docIndex].title}" đã được nâng cấp lên phiên bản v${newVersionNumber}.`,
      link: `/documents/${documentId}`,
      type: 'info',
    })

    return newVersion
  },

  // 7. Digital signature
  async signDocument(
    documentId: string,
    signerInfo: { signerName: string; certificateOrg?: string }
  ): Promise<Document> {
    await new Promise((r) => setTimeout(r, 180))
    const docs = getStoredDocuments()
    const docIndex = docs.findIndex((d) => d.id === documentId)
    if (docIndex === -1) throw new Error('Không tìm thấy tài liệu')

    const now = new Date().toISOString()
    docs[docIndex] = {
      ...docs[docIndex],
      signatureStatus: 'verified',
      signatureDetails: {
        signedBy: signerInfo.signerName,
        signedAt: now,
        certificateOrg: signerInfo.certificateOrg || 'Ban Cơ yếu Chính phủ - CA Root',
        algorithm: 'RSA-2048 with SHA-256',
        isValid: true,
      },
      updatedAt: now,
    }

    saveStorage(DOCS_KEY, docs)

    this.addNotification({
      title: 'Ký số thành công',
      message: `Tài liệu "${docs[docIndex].title}" đã được ký số điện tử hợp lệ.`,
      link: `/documents/${documentId}`,
      type: 'success',
    })

    return docs[docIndex]
  },

  // 8. Update status (Approve, Reject, Archive)
  async updateDocumentStatus(documentId: string, status: DocumentStatus): Promise<Document> {
    await new Promise((r) => setTimeout(r, 100))
    const docs = getStoredDocuments()
    const docIndex = docs.findIndex((d) => d.id === documentId)
    if (docIndex === -1) throw new Error('Không tìm thấy tài liệu')

    const now = new Date().toISOString()
    docs[docIndex] = {
      ...docs[docIndex],
      status,
      updatedAt: now,
    }

    saveStorage(DOCS_KEY, docs)

    const statusLabels: Record<DocumentStatus, string> = {
      approved: 'phê duyệt',
      rejected: 'từ chối',
      pending: 'chuyển sang chờ duyệt',
      draft: 'chuyển về bản nháp',
      archived: 'lưu trữ',
    }

    this.addNotification({
      title: 'Cập nhật trạng thái tài liệu',
      message: `Tài liệu "${docs[docIndex].title}" đã được ${statusLabels[status] || status}.`,
      link: `/documents/${documentId}`,
      type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
    })

    return docs[docIndex]
  },

  // 9. Dashboard stats calculation
  async getDashboardStats(): Promise<DashboardStats & { statusCounts: Record<DocumentStatus, number> }> {
    await new Promise((r) => setTimeout(r, 80))
    const docs = getStoredDocuments()

    const totalDocuments = docs.length
    const pendingApproval = docs.filter((d) => d.status === 'pending').length

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const uploadedThisMonth = docs.filter((d) => {
      const dDate = new Date(d.createdAt)
      return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear
    }).length

    const totalBytes = docs.reduce((acc, d) => acc + (d.fileSize || 0), 0)

    const recentDocuments = [...docs]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)

    const statusCounts: Record<DocumentStatus, number> = {
      approved: docs.filter((d) => d.status === 'approved').length,
      pending: docs.filter((d) => d.status === 'pending').length,
      draft: docs.filter((d) => d.status === 'draft').length,
      rejected: docs.filter((d) => d.status === 'rejected').length,
      archived: docs.filter((d) => d.status === 'archived').length,
    }

    return {
      totalDocuments,
      pendingApproval,
      uploadedThisMonth,
      storageUsed: totalBytes,
      recentDocuments,
      statusCounts,
    }
  },

  // 10. Saved searches
  async getSavedSearches(): Promise<SavedSearch[]> {
    return loadStorage<SavedSearch[]>(SAVED_SEARCHES_KEY, initialSavedSearches)
  },

  async saveSearch(name: string, filters: SearchFilters): Promise<SavedSearch> {
    const list = await this.getSavedSearches()
    const newItem: SavedSearch = {
      id: `save-${Date.now()}`,
      name,
      filters,
      createdAt: new Date().toISOString(),
    }
    list.unshift(newItem)
    saveStorage(SAVED_SEARCHES_KEY, list)
    return newItem
  },

  async deleteSavedSearch(id: string): Promise<boolean> {
    let list = await this.getSavedSearches()
    list = list.filter((item) => item.id !== id)
    saveStorage(SAVED_SEARCHES_KEY, list)
    return true
  },

  // 11. Notifications
  async getNotifications(): Promise<AppNotification[]> {
    return loadStorage<AppNotification[]>(NOTIFS_KEY, initialNotifications)
  },

  addNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
    const list = loadStorage<AppNotification[]>(NOTIFS_KEY, initialNotifications)
    const item: AppNotification = {
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...notif,
    }
    list.unshift(item)
    saveStorage(NOTIFS_KEY, list.slice(0, 20))
    return item
  },

  async markNotificationAsRead(id: string): Promise<void> {
    const list = await this.getNotifications()
    const item = list.find((n) => n.id === id)
    if (item) {
      item.read = true
      saveStorage(NOTIFS_KEY, list)
    }
  },

  async markAllNotificationsAsRead(): Promise<void> {
    const list = await this.getNotifications()
    list.forEach((n) => {
      n.read = true
    })
    saveStorage(NOTIFS_KEY, list)
  },

  // 12. Reset to default demo data
  resetDemoData(): void {
    saveStorage(DOCS_KEY, initialDocuments)
    saveStorage(VERSIONS_KEY, initialVersions)
    saveStorage(SAVED_SEARCHES_KEY, initialSavedSearches)
    saveStorage(NOTIFS_KEY, initialNotifications)
  },

  // 13. Download mock file
  downloadMockFile(doc: Document | { title: string; fileName: string; integrityHash?: string }) {
    const content = `========================================================
TÀI LIỆU QUẢN LÝ - DOCUMENT MANAGEMENT SYSTEM
========================================================
Tiêu đề: ${doc.title}
Tệp tin: ${doc.fileName}
Mã toàn vẹn SHA-256: ${doc.integrityHash || 'N/A'}
Ngày xuất file: ${new Date().toLocaleString('vi-VN')}
Đơn vị phát hành: Hệ thống Quản lý Tài liệu Doanh nghiệp
========================================================

Nội dung tài liệu được trích xuất thành công từ hệ thống.
Tài liệu này được bảo vệ bởi bản quyền nội bộ và quy chế an toàn thông tin.
`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = doc.fileName || 'tai-lieu.txt'
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}
