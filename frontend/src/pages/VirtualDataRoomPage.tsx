import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  vdrApi,
  DataRoomItem,
  DataRoomSummary,
  DataRoomDocumentItem,
  DataRoomMemberItem,
  DataRoomInvitationItem,
  DataRoomEventItem,
  DataRoomStatus,
  DataRoomRole
} from '../api/vdrApi';
import { investigationApi } from '../api/investigationApi';
import {
  Lock,
  Plus,
  Search,
  RefreshCw,
  FolderLock,
  FileText,
  Users,
  ShieldAlert,
  Download,
  Eye,
  AlertTriangle,
  Copy,
  UserPlus,
  Trash2,
  X,
  ShieldCheck
} from 'lucide-react';

export const VirtualDataRoomPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  // Data states
  const [rooms, setRooms] = useState<DataRoomItem[]>([]);
  const [summary, setSummary] = useState<DataRoomSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Room
  const [selectedRoom, setSelectedRoom] = useState<DataRoomItem | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'members' | 'audit'>('documents');

  // Room details
  const [roomDocs, setRoomDocs] = useState<DataRoomDocumentItem[]>([]);
  const [roomMembers, setRoomMembers] = useState<DataRoomMemberItem[]>([]);
  const [roomInvitations, setRoomInvitations] = useState<DataRoomInvitationItem[]>([]);
  const [roomEvents, setRoomEvents] = useState<DataRoomEventItem[]>([]);
  const [suspiciousOnly, setSuspiciousOnly] = useState<boolean>(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showAddDocModal, setShowAddDocModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showViewerModal, setShowViewerModal] = useState<boolean>(false);
  const [viewerDoc, setViewerDoc] = useState<DataRoomDocumentItem | null>(null);
  const [viewerBlobUrl, setViewerBlobUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState<boolean>(false);

  // Forms
  const [createForm, setCreateForm] = useState<{
    name: string;
    purpose: string;
    description: string;
    watermarkEnabled: boolean;
    watermarkPattern: string;
    allowDownload: boolean;
    expiresAt: string;
  }>({
    name: '',
    purpose: '',
    description: '',
    watermarkEnabled: true,
    watermarkPattern: 'CONFIDENTIAL - {user} - {date}',
    allowDownload: false,
    expiresAt: ''
  });

  const [addDocForm, setAddDocForm] = useState<{
    documentId: string;
    versionNumber: string;
    folderPath: string;
  }>({
    documentId: '',
    versionNumber: '1',
    folderPath: '/'
  });

  const [inviteForm, setInviteForm] = useState<{
    email: string;
    role: DataRoomRole;
    expiresInDays: number;
  }>({
    email: '',
    role: 'ROOM_GUEST',
    expiresInDays: 7
  });

  // Load rooms and summary
  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomList, sum] = await Promise.all([
        vdrApi.listRooms(),
        vdrApi.getSummary()
      ]);
      setRooms(roomList);
      setSummary(sum);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách phòng dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Load details of selected room
  const loadRoomDetails = useCallback(async (r: DataRoomItem) => {
    try {
      const [docs, mems, invs, evts] = await Promise.all([
        vdrApi.listDocuments(r.id),
        vdrApi.listMembers(r.id),
        vdrApi.listInvitations(r.id),
        vdrApi.listEvents(r.id, suspiciousOnly)
      ]);
      setRoomDocs(docs);
      setRoomMembers(mems);
      setRoomInvitations(invs);
      setRoomEvents(evts);
    } catch (err) {
      console.error('Error loading room details:', err);
    }
  }, [suspiciousOnly]);

  const handleSelectRoom = (r: DataRoomItem) => {
    setSelectedRoom(r);
    loadRoomDetails(r);
  };

  // Actions
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vdrApi.createRoom({
        name: createForm.name,
        purpose: createForm.purpose,
        description: createForm.description,
        watermarkEnabled: createForm.watermarkEnabled,
        watermarkPattern: createForm.watermarkPattern,
        allowDownload: createForm.allowDownload,
        expiresAt: createForm.expiresAt ? new Date(createForm.expiresAt).toISOString() : undefined
      });
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        purpose: '',
        description: '',
        watermarkEnabled: true,
        watermarkPattern: 'CONFIDENTIAL - {user} - {date}',
        allowDownload: false,
        expiresAt: ''
      });
      loadRooms();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi tạo phòng dữ liệu');
    }
  };

  const handleStatusChange = async (newStatus: DataRoomStatus) => {
    if (!selectedRoom) return;
    try {
      const updated = await vdrApi.updateStatus(selectedRoom.id, newStatus);
      setSelectedRoom(updated);
      loadRoomDetails(updated);
      loadRooms();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể đổi trạng thái phòng');
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    try {
      await vdrApi.addDocument(selectedRoom.id, {
        documentId: Number(addDocForm.documentId),
        versionNumber: addDocForm.versionNumber ? Number(addDocForm.versionNumber) : undefined,
        folderPath: addDocForm.folderPath
      });
      setShowAddDocModal(false);
      setAddDocForm({ documentId: '', versionNumber: '1', folderPath: '/' });
      loadRoomDetails(selectedRoom);
      loadRooms();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi thêm tài liệu vào VDR');
    }
  };

  const handleRemoveDocument = async (docId: number) => {
    if (!selectedRoom) return;
    if (!window.confirm('Xác nhận xóa tài liệu khỏi phòng dữ liệu?')) return;
    try {
      await vdrApi.removeDocument(selectedRoom.id, docId);
      loadRoomDetails(selectedRoom);
      loadRooms();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xóa tài liệu');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    try {
      await vdrApi.inviteMember(selectedRoom.id, {
        email: inviteForm.email,
        role: inviteForm.role,
        expiresInDays: inviteForm.expiresInDays
      });
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'ROOM_GUEST', expiresInDays: 7 });
      loadRoomDetails(selectedRoom);
      loadRooms();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi gửi lời mời');
    }
  };

  const handleRevokeMember = async (memberId: number) => {
    if (!selectedRoom) return;
    const reason = window.prompt('Nhập lý do thu hồi quyền truy cập của thành viên:');
    if (reason === null) return;
    try {
      await vdrApi.revokeMember(selectedRoom.id, memberId, reason);
      loadRoomDetails(selectedRoom);
      loadRooms();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể thu hồi quyền');
    }
  };

  // Secure document viewing
  const handleViewDocument = async (doc: DataRoomDocumentItem) => {
    if (!selectedRoom) return;
    try {
      setViewerLoading(true);
      setViewerDoc(doc);
      setShowViewerModal(true);

      const { blob } = await vdrApi.viewDocumentBlob(selectedRoom.id, doc.documentId);
      const url = window.URL.createObjectURL(blob);
      setViewerBlobUrl(url);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể mở tài liệu xem an toàn');
      setShowViewerModal(false);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewerModal = () => {
    if (viewerBlobUrl) {
      window.URL.revokeObjectURL(viewerBlobUrl);
      setViewerBlobUrl(null);
    }
    setShowViewerModal(false);
    setViewerDoc(null);
  };

  // Secure download enforcement
  const handleDownloadDocument = async (doc: DataRoomDocumentItem) => {
    if (!selectedRoom) return;
    try {
      const blob = await vdrApi.downloadDocument(selectedRoom.id, doc.documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalFileName || `vdr-doc-${doc.documentId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      loadRoomDetails(selectedRoom);
    } catch (err: any) {
      // 403 Forbidden is expected when anti-leak policy blocks download!
      alert(err?.response?.data?.message || 'Chính sách Anti-leak: Bạn không có quyền tải tệp này về máy!');
      loadRoomDetails(selectedRoom);
    }
  };

  // Cross-module action: Open investigation from VDR suspicious event
  const handleInvestigateEvent = async (event: DataRoomEventItem) => {
    if (!window.confirm(`Khởi tạo hồ sơ điều tra chính thức từ sự kiện bảo mật #${event.id} (${event.eventType})?`)) return;
    try {
      const newCase = await investigationApi.createFromVdrEvent({
        vdrEventId: event.id,
        assignedTo: user?.username || 'admin',
        title: `Điều tra vi phạm bảo mật VDR #${event.roomId}: ${event.eventType}`
      });
      alert(`Đã khởi tạo hồ sơ điều tra #${newCase.caseNumber} thành công!`);
      // Navigate to investigations view
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'investigations' }));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể mở hồ sơ điều tra');
    }
  };

  const getStatusBadge = (st: DataRoomStatus) => {
    switch (st) {
      case 'ACTIVE':
        return <span className="ent-badge ent-badge--success">Đang hoạt động</span>;
      case 'DRAFT':
        return <span className="ent-badge ent-badge--neutral">Bản nháp</span>;
      case 'SUSPENDED':
        return <span className="ent-badge ent-badge--warning">Tạm dừng</span>;
      case 'CLOSED':
        return <span className="ent-badge ent-badge--danger">Đã đóng</span>;
    }
  };

  const filteredRooms = rooms.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      return (
        r.roomCode.toLowerCase().includes(s) ||
        r.name.toLowerCase().includes(s) ||
        (r.purpose && r.purpose.toLowerCase().includes(s))
      );
    }
    return true;
  });

  return (
    <div className="app-container">
      <Navbar currentView="vdr" />

      <main className="main-content" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderLock size={26} className="text-primary" />
              Phòng dữ liệu bảo mật (Virtual Data Room - VDR)
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
              Không gian chia sẻ tài liệu bảo mật cho đối tác bên ngoài, watermark động và kiểm soát chống rò rỉ dữ liệu (Anti-leak)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadRooms}
              title="Làm mới dữ liệu"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={16} /> Làm mới
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Tạo phòng dữ liệu mới
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        {summary && (
          <div className="dash-stats-grid" style={{ marginBottom: '24px' }}>
            <div className="dash-stat-card">
              <div className="dash-stat-label">Tổng số phòng</div>
              <div className="dash-stat-value">{summary.totalRooms}</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-label">Đang hoạt động</div>
              <div className="dash-stat-value" style={{ color: '#16a34a' }}>{summary.activeRooms}</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-label">Tài liệu bảo mật</div>
              <div className="dash-stat-value" style={{ color: '#2563eb' }}>{summary.totalDocuments}</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-label">Thành viên & Đối tác</div>
              <div className="dash-stat-value">{summary.totalMembers}</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-label">Sự cố an ninh / Anti-leak</div>
              <div className="dash-stat-value" style={{ color: summary.suspiciousEventsCount > 0 ? '#dc2626' : '#16a34a' }}>
                {summary.suspiciousEventsCount}
              </div>
            </div>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="ent-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm theo mã phòng, tên phòng, mục đích..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: '160px' }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="SUSPENDED">Tạm dừng</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </div>
        </div>

        {/* Rooms Table */}
        <div className="ent-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách phòng dữ liệu...</div>
          ) : error ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#dc2626' }}>{error}</div>
          ) : filteredRooms.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
              <FolderLock size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Chưa có phòng dữ liệu nào phù hợp bộ lọc.</p>
            </div>
          ) : (
            <table className="ent-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Mã phòng</th>
                  <th>Tên phòng & Mục đích</th>
                  <th>Chủ phòng</th>
                  <th>Chính sách bảo mật</th>
                  <th>Tài liệu / Thành viên</th>
                  <th>Thời hạn</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => handleSelectRoom(r)}>
                    <td style={{ fontWeight: 600, color: 'var(--color-navy)' }}>
                      {r.roomCode}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      {r.purpose && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.purpose}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{r.ownerUsername === 'admin' || r.ownerUsername === 'hieu' ? 'Ban Quản trị VDR' : 'Quản trị viên phòng'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {r.watermarkEnabled && (
                          <span className="ent-badge ent-badge--info" title="Có phủ Watermark động">Watermark</span>
                        )}
                        {!r.allowDownload ? (
                          <span className="ent-badge ent-badge--warning" title="Chặn tải tệp về máy">Anti-leak</span>
                        ) : (
                          <span className="ent-badge ent-badge--neutral">Cho phép tải</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="ent-badge ent-badge--neutral">
                        {r.documentCount} tài liệu • {r.memberCount} thành viên
                      </span>
                    </td>
                    <td>
                      {r.expiresAt ? (
                        <span style={{ fontSize: '0.85rem', color: r.expired ? '#dc2626' : 'inherit' }}>
                          {new Date(r.expiresAt).toLocaleDateString('vi-VN')}
                          {r.expired && ' (Hết hạn)'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Vô thời hạn</span>
                      )}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectRoom(r);
                        }}
                      >
                        <Lock size={14} style={{ marginRight: '4px' }} /> Truy cập
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Selected Room Detail Drawer / Modal */}
        {selectedRoom && (
          <div className="ent-modal-overlay" style={{ zIndex: 1100 }}>
            <div className="ent-modal ent-modal--xl" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
              <div className="ent-modal__header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                      {selectedRoom.roomCode} : {selectedRoom.name}
                    </span>
                    {getStatusBadge(selectedRoom.status)}
                    {selectedRoom.watermarkEnabled && (
                      <span className="ent-badge ent-badge--info">Watermark Active</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Quản trị phòng: <strong>{selectedRoom.ownerUsername === 'admin' || selectedRoom.ownerUsername === 'hieu' ? 'Ban Quản trị VDR' : 'Quản trị viên phòng'}</strong> | Vai trò của bạn: <strong>{selectedRoom.currentUserRole || 'GUEST'}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="ent-modal__close-btn"
                  onClick={() => setSelectedRoom(null)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status & Lifecycle Action Bar */}
              {(isAdmin || selectedRoom.ownerUsername === user?.username) && (
                <div style={{ padding: '10px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Chuyển trạng thái phòng:</span>
                    {selectedRoom.status === 'DRAFT' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleStatusChange('ACTIVE')}
                      >
                        Kích hoạt phòng (ACTIVE)
                      </button>
                    )}
                    {selectedRoom.status === 'ACTIVE' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleStatusChange('SUSPENDED')}
                      >
                        Tạm dừng phòng
                      </button>
                    )}
                    {selectedRoom.status === 'SUSPENDED' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleStatusChange('ACTIVE')}
                      >
                        Kích hoạt lại
                      </button>
                    )}
                    {selectedRoom.status !== 'CLOSED' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        style={{ color: '#dc2626' }}
                        onClick={() => handleStatusChange('CLOSED')}
                      >
                        Đóng phòng vĩnh viễn
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Chính sách tải: <strong>{selectedRoom.allowDownload ? 'Cho phép' : 'Cấm tải (Anti-leak)'}</strong>
                  </div>
                </div>
              )}

              {/* Tabs Navigation */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 24px', backgroundColor: '#fff' }}>
                <button
                  type="button"
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    borderBottom: activeTab === 'documents' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'none',
                    color: activeTab === 'documents' ? 'var(--color-primary)' : '#64748b',
                    fontWeight: activeTab === 'documents' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setActiveTab('documents')}
                >
                  <FileText size={15} /> Tài liệu phòng ({roomDocs.length})
                </button>
                <button
                  type="button"
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    borderBottom: activeTab === 'members' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'none',
                    color: activeTab === 'members' ? 'var(--color-primary)' : '#64748b',
                    fontWeight: activeTab === 'members' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setActiveTab('members')}
                >
                  <Users size={15} /> Thành viên & Lời mời ({roomMembers.length})
                </button>
                <button
                  type="button"
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    borderBottom: activeTab === 'audit' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'none',
                    color: activeTab === 'audit' ? 'var(--color-primary)' : '#64748b',
                    fontWeight: activeTab === 'audit' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setActiveTab('audit')}
                >
                  <ShieldAlert size={15} /> Nhật ký an ninh & Vi phạm ({roomEvents.length})
                </button>
              </div>

              {/* Tab 1: Documents */}
              <div className="ent-modal__body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {activeTab === 'documents' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                        Danh sách tài liệu đã cấp phép vào phòng
                      </h3>
                      {selectedRoom.status === 'ACTIVE' && (isAdmin || selectedRoom.ownerUsername === user?.username) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowAddDocModal(true)}
                        >
                          <Plus size={14} /> Thêm tài liệu từ EDMS
                        </button>
                      )}
                    </div>

                    {roomDocs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Chưa có tài liệu nào trong phòng dữ liệu này.
                      </div>
                    ) : (
                      <table className="ent-table" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Tên tài liệu & Tệp</th>
                            <th>Phiên bản ghim</th>
                            <th>Thư mục</th>
                            <th>Mã băm SHA-256</th>
                            <th>Dung lượng</th>
                            <th style={{ textAlign: 'right' }}>Thao tác an toàn</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomDocs.map(d => (
                            <tr key={d.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{d.title}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.originalFileName}</div>
                              </td>
                              <td>
                                <span className="ent-badge ent-badge--info">v{d.versionNumber || 1}</span>
                              </td>
                              <td>{d.folderPath || '/'}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.fileHash}>
                                {d.fileHash || 'N/A'}
                              </td>
                              <td>{d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : 'N/A'}</td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleViewDocument(d)}
                                    title="Xem an toàn có Watermark"
                                  >
                                    <Eye size={13} style={{ marginRight: '4px' }} /> Xem an toàn
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleDownloadDocument(d)}
                                    title={selectedRoom.allowDownload ? 'Tải tệp tin' : 'Chính sách cấm tải (Anti-leak)'}
                                  >
                                    <Download size={13} />
                                  </button>
                                  {(isAdmin || selectedRoom.ownerUsername === user?.username) && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary"
                                      style={{ color: '#dc2626' }}
                                      onClick={() => handleRemoveDocument(d.documentId)}
                                      title="Xóa khỏi phòng"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Tab 2: Members & Invitations */}
                {activeTab === 'members' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                        Danh sách thành viên & Đối tác
                      </h3>
                      {(isAdmin || selectedRoom.ownerUsername === user?.username) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowInviteModal(true)}
                        >
                          <UserPlus size={14} /> Mời đối tác bên ngoài
                        </button>
                      )}
                    </div>

                    <table className="ent-table" style={{ width: '100%', marginBottom: '24px' }}>
                      <thead>
                        <tr>
                          <th>Thành viên</th>
                          <th>Email</th>
                          <th>Vai trò</th>
                          <th>Quyền tải tệp</th>
                          <th>Trạng thái</th>
                          <th>Ngày tham gia</th>
                          <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomMembers.map(m => (
                          <tr key={m.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>
                                {m.role === 'ROOM_MANAGER' ? 'Quản lý tài liệu' : (m.role === 'ROOM_VIEWER' ? 'Chuyên viên thẩm định' : 'Thành viên đối tác')}
                              </div>
                              {m.username && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tài khoản: {m.username}</div>}
                            </td>
                            <td>{m.email}</td>
                            <td>
                              <span className="ent-badge ent-badge--info">{m.role}</span>
                            </td>
                            <td>
                              {m.canDownload ? (
                                <span className="ent-badge ent-badge--success">Cho phép</span>
                              ) : (
                                <span className="ent-badge ent-badge--warning">Chặn (Anti-leak)</span>
                              )}
                            </td>
                            <td>
                              {m.status === 'ACTIVE' ? (
                                <span className="ent-badge ent-badge--success">Hoạt động</span>
                              ) : (
                                <span className="ent-badge ent-badge--danger">Đã thu hồi</span>
                              )}
                            </td>
                            <td>{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
                            <td style={{ textAlign: 'right' }}>
                              {m.role !== 'ROOM_OWNER' && m.status === 'ACTIVE' && (isAdmin || selectedRoom.ownerUsername === user?.username) && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  style={{ color: '#dc2626' }}
                                  onClick={() => handleRevokeMember(m.id)}
                                >
                                  Thu hồi quyền
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pending Invitations */}
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
                      Lời mời đang chờ chấp nhận ({roomInvitations.length})
                    </h3>
                    {roomInvitations.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Không có lời mời nào đang chờ.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {roomInvitations.map(inv => (
                          <div
                            key={inv.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              backgroundColor: '#f8fafc'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600 }}>{inv.email} (Vai trò: {inv.role})</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Khởi tạo bởi: Ban Quản trị VDR • Hạn chót: {new Date(inv.expiresAt).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                const inviteUrl = `${window.location.origin}/vdr/join?token=${inv.token}`;
                                navigator.clipboard.writeText(inviteUrl);
                                alert(`Đã sao chép link mời: ${inviteUrl}`);
                              }}
                            >
                              <Copy size={13} style={{ marginRight: '4px' }} /> Sao chép link mời
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Security & Activity Audit */}
                {activeTab === 'audit' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                        Nhật ký hoạt động & Cảnh báo an ninh
                      </h3>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={suspiciousOnly}
                          onChange={e => setSuspiciousOnly(e.target.checked)}
                        />
                        Chỉ hiện sự kiện khả nghi / vi phạm
                      </label>
                    </div>

                    {roomEvents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Chưa có sự kiện nào được ghi nhận.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {roomEvents.map(evt => (
                          <div
                            key={evt.id}
                            style={{
                              border: evt.suspicious ? '1px solid #fecaca' : '1px solid #e2e8f0',
                              backgroundColor: evt.suspicious ? '#fef2f2' : '#fff',
                              borderRadius: '6px',
                              padding: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <span style={{ fontWeight: 600, color: evt.suspicious ? '#991b1b' : 'inherit' }}>
                                  {evt.eventType}
                                </span>
                                {evt.suspicious && (
                                  <span className="ent-badge ent-badge--danger" style={{ marginLeft: '8px' }}>
                                    <AlertTriangle size={12} style={{ marginRight: '3px' }} /> Vi phạm an ninh Anti-leak
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {new Date(evt.timestamp).toLocaleString('vi-VN')}
                              </span>
                            </div>

                            <p style={{ fontSize: '0.85rem', color: '#334155', margin: '6px 0 0' }}>
                              {evt.description}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                              <div>
                                Người thực hiện: <strong>{evt.username || evt.email || 'N/A'}</strong> | IP: {evt.ipAddress || '127.0.0.1'}
                              </div>

                              {/* Cross Module Button: Open Investigation */}
                              {evt.suspicious && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  style={{ backgroundColor: '#991b1b', borderColor: '#991b1b', fontSize: '0.75rem', padding: '3px 8px' }}
                                  onClick={() => handleInvestigateEvent(evt)}
                                >
                                  <ShieldAlert size={12} style={{ marginRight: '4px' }} /> Mở hồ sơ điều tra từ sự cố này
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Room */}
        {showCreateModal && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--md">
              <div className="ent-modal__header">
                <h3 className="ent-modal__title">Tạo phòng dữ liệu bảo mật (VDR)</h3>
                <button type="button" className="ent-modal__close-btn" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateRoom}>
                <div className="ent-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Tên phòng dữ liệu *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="VD: Phòng thẩm định hồ sơ M&A - Đối tác TechCorp"
                      value={createForm.name}
                      onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Mục đích chia sẻ
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: Due Diligence kiểm toán tài chính và pháp lý"
                      value={createForm.purpose}
                      onChange={e => setCreateForm({ ...createForm, purpose: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Thời hạn truy cập (Expiration Date)
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={createForm.expiresAt}
                      onChange={e => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                    />
                  </div>

                  <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>Chính sách an ninh thông tin:</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '6px' }}>
                      <input
                        type="checkbox"
                        checked={createForm.watermarkEnabled}
                        onChange={e => setCreateForm({ ...createForm, watermarkEnabled: e.target.checked })}
                      />
                      Kích hoạt Watermark động (Phủ danh tính người xem & dấu thời gian trên tài liệu)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={createForm.allowDownload}
                        onChange={e => setCreateForm({ ...createForm, allowDownload: e.target.checked })}
                      />
                      Cho phép tải tài liệu về máy (Bỏ chọn để kích hoạt Anti-leak)
                    </label>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Mô tả chi tiết
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Ghi chú quy định bảo mật, phạm vi thẩm định..."
                      value={createForm.description}
                      onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="ent-modal__footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Khởi tạo phòng
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Document to VDR */}
        {showAddDocModal && selectedRoom && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--md">
              <div className="ent-modal__header">
                <h3 className="ent-modal__title">Thêm tài liệu vào phòng dữ liệu</h3>
                <button type="button" className="ent-modal__close-btn" onClick={() => setShowAddDocModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddDocument}>
                <div className="ent-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Mã tài liệu EDMS (Document ID) *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      placeholder="VD: 338"
                      value={addDocForm.documentId}
                      onChange={e => setAddDocForm({ ...addDocForm, documentId: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Số phiên bản ghim (Version Number)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min={1}
                      placeholder="Để trống sẽ tự động lấy phiên bản mới nhất"
                      value={addDocForm.versionNumber}
                      onChange={e => setAddDocForm({ ...addDocForm, versionNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Đường dẫn thư mục VDR (Folder Path)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: /Tai_chinh hoặc /Phap_ly"
                      value={addDocForm.folderPath}
                      onChange={e => setAddDocForm({ ...addDocForm, folderPath: e.target.value })}
                    />
                  </div>
                </div>
                <div className="ent-modal__footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddDocModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Thêm vào phòng
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Invite Partner */}
        {showInviteModal && selectedRoom && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--md">
              <div className="ent-modal__header">
                <h3 className="ent-modal__title">Mời đối tác tham gia VDR</h3>
                <button type="button" className="ent-modal__close-btn" onClick={() => setShowInviteModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleInviteMember}>
                <div className="ent-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Email đối tác nhận lời mời *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="auditor@partner-corp.com"
                      value={inviteForm.email}
                      onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Vai trò trong phòng *
                    </label>
                    <select
                      className="form-control"
                      value={inviteForm.role}
                      onChange={e => setInviteForm({ ...inviteForm, role: e.target.value as DataRoomRole })}
                    >
                      <option value="ROOM_GUEST">Khách thẩm định (ROOM_GUEST - Chỉ xem)</option>
                      <option value="ROOM_VIEWER">Người xem (ROOM_VIEWER - Xem & Metadata)</option>
                      <option value="ROOM_MANAGER">Điều phối viên (ROOM_MANAGER - Quản lý tệp)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Thời hạn hiệu lực của link mời (ngày)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min={1}
                      max={30}
                      value={inviteForm.expiresInDays}
                      onChange={e => setInviteForm({ ...inviteForm, expiresInDays: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="ent-modal__footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Tạo link mời
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Secure Document Viewer with Dynamic Watermark */}
        {showViewerModal && (
          <div className="ent-modal-overlay" style={{ zIndex: 1200 }}>
            <div className="ent-modal ent-modal--xl" style={{ height: '94vh', display: 'flex', flexDirection: 'column' }}>
              <div className="ent-modal__header">
                <div>
                  <h3 className="ent-modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} className="text-primary" />
                    Trình xem tài liệu bảo mật (VDR Secure Viewer)
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {viewerDoc?.title} (v{viewerDoc?.versionNumber}) • Phủ Watermark động chống rò rỉ
                  </div>
                </div>
                <button type="button" className="ent-modal__close-btn" onClick={closeViewerModal}>
                  <X size={20} />
                </button>
              </div>

              <div
                className="ent-modal__body"
                style={{
                  flex: 1,
                  padding: 0,
                  backgroundColor: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}
                onContextMenu={e => e.preventDefault()}
              >
                {viewerLoading ? (
                  <div style={{ color: '#fff' }}>Đang áp dụng Watermark động và tải tài liệu...</div>
                ) : viewerBlobUrl ? (
                  <iframe
                    src={viewerBlobUrl}
                    title="VDR Secure Document Viewer"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : (
                  <div style={{ color: '#fff' }}>Không thể hiển thị tài liệu.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
