import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { adminUserApi, UserItem, RolePermissionMatrix } from '../api/adminUserApi';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Edit3,
  ShieldCheck,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Loader2,
  Sliders,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [matrix, setMatrix] = useState<RolePermissionMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'matrix'>('list');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminUserApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMatrix = useCallback(async () => {
    try {
      const data = await adminUserApi.getRolePermissions();
      setMatrix(data);
    } catch (err) {
      console.error('Fetch permissions matrix error:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchMatrix();
  }, [fetchUsers, fetchMatrix]);

  const handleToggleStatus = async (targetUser: UserItem) => {
    const actionName = targetUser.enabled ? 'vô hiệu hóa (khóa)' : 'kích hoạt';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản '${targetUser.username}'?`)) {
      return;
    }

    try {
      setTogglingId(targetUser.id);
      setError(null);
      const updated = await adminUserApi.setUserStatus(targetUser.id, !targetUser.enabled);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setActionSuccess(`Đã ${actionName} tài khoản '${targetUser.username}' thành công.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      console.error('Toggle status error:', err);
      const msg = err.response?.data?.message || `Không thể ${actionName} tài khoản.`;
      setError(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const handleUserCreated = (newUser: UserItem) => {
    setUsers((prev) => [newUser, ...prev]);
    setActionSuccess(`Khởi tạo tài khoản '${newUser.username}' thành công.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleUserUpdated = (updatedUser: UserItem) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setActionSuccess(`Cập nhật thông tin tài khoản '${updatedUser.username}' thành công.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!filterKeyword.trim()) return true;
    const kw = filterKeyword.toLowerCase();
    return (
      u.username.toLowerCase().includes(kw) ||
      (u.fullName || '').toLowerCase().includes(kw) ||
      (u.email || '').toLowerCase().includes(kw) ||
      u.role.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h2>Quản Lý Người Dùng & Phân Quyền (US-21 to US-26)</h2>
            <p>Kiểm soát truy cập, phân định quyền hạn vai trò và bảo vệ an toàn tài nguyên hệ thống</p>
          </div>
          <div className="page-actions">
            <button
              className="btn btn-secondary"
              onClick={fetchUsers}
              disabled={isLoading}
              title="Làm mới danh sách"
              id="refresh-users-btn"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setIsCreateOpen(true)}
              id="open-create-user-btn"
            >
              <UserPlus size={18} />
              <span>Thêm người dùng (US-22)</span>
            </button>
          </div>
        </div>

        {/* Tab switcher: User list vs Role matrix */}
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
            id="tab-users-list"
          >
            <Users size={16} style={{ display: 'inline', marginRight: 6 }} />
            Danh sách tài khoản (US-21)
          </button>
          <button
            className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
            id="tab-roles-matrix"
          >
            <ShieldCheck size={16} style={{ display: 'inline', marginRight: 6 }} />
            Ma trận phân quyền (US-26)
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <span>{error}</span>
            <button
              type="button"
              className="close-alert-btn"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
            <span>{actionSuccess}</span>
          </div>
        )}

        {activeTab === 'list' ? (
          <>
            {/* Filter toolbar */}
            <div className="filter-toolbar" style={{ marginBottom: '1rem' }}>
              <div className="filter-left-group">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon-inside" />
                  <input
                    type="text"
                    className="search-input-field"
                    placeholder="Tìm theo tên đăng nhập, họ tên, email, vai trò..."
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                    id="user-search-input"
                  />
                </div>
              </div>
              <div className="filter-right-group">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Tổng cộng: <strong>{filteredUsers.length}</strong> tài khoản
                </span>
              </div>
            </div>

            {/* Users Table */}
            <div className="table-responsive-card">
              {isLoading ? (
                <div className="table-loading-wrap">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p>Đang tải danh sách tài khoản...</p>
                </div>
              ) : (
                <table className="data-table" id="users-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>ID</th>
                      <th>Tên đăng nhập</th>
                      <th>Họ và tên</th>
                      <th>Email</th>
                      <th>Vai trò (US-25)</th>
                      <th>Trạng thái (US-24)</th>
                      <th>Ngày tạo</th>
                      <th style={{ textAlign: 'center', width: '160px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="empty-table-cell">
                          Không tìm thấy người dùng nào phù hợp với điều kiện tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className={!u.enabled ? 'row-disabled' : ''}>
                          <td className="font-mono text-muted">{u.id}</td>
                          <td>
                            <strong>{u.username}</strong>
                            {currentUser?.username === u.username && (
                              <span className="badge badge-subtle ml-1">(Bạn)</span>
                            )}
                          </td>
                          <td>{u.fullName || '—'}</td>
                          <td className="text-muted">{u.email || '—'}</td>
                          <td>
                            <span
                              className={`badge ${
                                u.role === 'ROLE_ADMIN' ? 'badge-primary' : 'badge-secondary'
                              }`}
                            >
                              <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${
                                u.enabled ? 'status-active' : 'status-disabled'
                              }`}
                            >
                              {u.enabled ? (
                                <>
                                  <CheckCircle2 size={12} />
                                  <span>Hoạt động</span>
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} />
                                  <span>Đã khóa</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                            {formatDate(u.createdAt)}
                          </td>
                          <td>
                            <div className="action-buttons-group">
                              <button
                                className="btn-icon btn-icon-secondary"
                                onClick={() => {
                                  setEditingUser(u);
                                  setIsEditOpen(true);
                                }}
                                title="Chỉnh sửa & Gán vai trò (US-23 / US-25)"
                                id={`edit-user-btn-${u.id}`}
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                className={`btn-icon ${
                                  u.enabled ? 'btn-icon-danger' : 'btn-icon-success'
                                }`}
                                onClick={() => handleToggleStatus(u)}
                                disabled={togglingId === u.id}
                                title={
                                  u.enabled
                                    ? 'Khóa tài khoản (US-24)'
                                    : 'Kích hoạt lại tài khoản (US-24)'
                                }
                                id={`toggle-user-btn-${u.id}`}
                              >
                                {togglingId === u.id ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : u.enabled ? (
                                  <Lock size={15} />
                                ) : (
                                  <Unlock size={15} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          /* US-26: Role & Permission Matrix View */
          <div className="matrix-container-card">
            <div className="matrix-header">
              <div className="matrix-title-wrap">
                <Sliders size={20} className="text-primary" />
                <div>
                  <h3>Ma trận phân quyền vai trò (US-26 Manage Roles & Permissions)</h3>
                  <p className="text-muted">
                    Bảng đối chiếu quyền hạn chi tiết giữa các vai trò trong hệ thống EDMS
                  </p>
                </div>
              </div>
            </div>

            {matrix ? (
              <div className="matrix-table-wrap">
                <table className="data-table matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: '220px' }}>Quyền hạn / Chức năng</th>
                      <th>Mô tả chi tiết</th>
                      <th style={{ textAlign: 'center', width: '150px' }}>
                        <span className="badge badge-secondary">ROLE_STAFF</span>
                      </th>
                      <th style={{ textAlign: 'center', width: '150px' }}>
                        <span className="badge badge-primary">ROLE_ADMIN</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(matrix.matrix['ROLE_ADMIN'] || []).map((adminPerm) => {
                      const staffPerm = (matrix.matrix['ROLE_STAFF'] || []).find(
                        (p) => p.code === adminPerm.code
                      );
                      const isStaffGranted = staffPerm ? staffPerm.granted : false;

                      return (
                        <tr key={adminPerm.code}>
                          <td>
                            <strong>{adminPerm.name}</strong>
                            <div className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                              {adminPerm.code}
                            </div>
                          </td>
                          <td className="text-muted">{adminPerm.description}</td>
                          <td style={{ textAlign: 'center' }}>
                            {isStaffGranted ? (
                              <CheckCircle2 size={18} className="text-success" />
                            ) : (
                              <XCircle size={18} className="text-muted" style={{ opacity: 0.4 }} />
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {adminPerm.granted ? (
                              <CheckCircle2 size={18} className="text-success" />
                            ) : (
                              <XCircle size={18} className="text-muted" style={{ opacity: 0.4 }} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-loading-wrap">
                <Loader2 size={24} className="animate-spin text-primary" />
                <p>Đang tải ma trận phân quyền...</p>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <CreateUserModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onUserCreated={handleUserCreated}
        />

        <EditUserModal
          isOpen={isEditOpen}
          user={editingUser}
          onClose={() => {
            setIsEditOpen(false);
            setEditingUser(null);
          }}
          onUserUpdated={handleUserUpdated}
        />
      </main>
    </div>
  );
};
