import React, { useEffect, useState } from 'react';
import { getAuditLogs, getActivityHistory, AuditItem } from '../api/auditApi';
import { 
  ShieldAlert, 
  History, 
  Search, 
  RefreshCw, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const AuditLogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'activity'>('audit');
  
  // State for Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // State for Activity History
  const [activities, setActivities] = useState<AuditItem[]>([]);

  const fetchAuditData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'audit') {
        const res = await getAuditLogs({
          username: filterUser || undefined,
          action: filterAction || undefined,
          page,
          size: 20,
        });
        setAuditLogs(res.content || []);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.totalElements || 0);
      } else {
        const res = await getActivityHistory(30);
        setActivities(res || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải nhật ký kiểm toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [activeTab, page, filterAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchAuditData();
  };

  const handleResetFilters = () => {
    setFilterUser('');
    setFilterAction('');
    setPage(0);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN');
    } catch {
      return isoString;
    }
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes('UPLOAD')) return 'badge-success';
    if (action.includes('DELETE') || action.includes('DISABLE') || action.includes('FAILED')) return 'badge-danger';
    if (action.includes('UPDATE') || action.includes('ROLE')) return 'badge-warning';
    if (action.includes('PREVIEW') || action.includes('VIEW')) return 'badge-info';
    if (action.includes('DOWNLOAD')) return 'badge-purple';
    return 'badge-primary';
  };

  return (
    <div className="audit-page">
      <Navbar />
      <main className="audit-container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="audit-title">Nhật ký & Kiểm toán hệ thống</h2>
          <p className="audit-subtitle text-secondary mb-0">
            Truy vết hoạt động, kiểm tra an ninh và lịch sử thao tác của các tài khoản trên hệ thống
          </p>
        </div>
        <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={fetchAuditData}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="audit-tabs mb-4">
        <button 
          className={`audit-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => { setActiveTab('audit'); setPage(0); }}
        >
          <ShieldAlert size={18} /> Nhật ký kiểm toán chi tiết (Audit Log)
        </button>
        <button 
          className={`audit-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => { setActiveTab('activity'); setPage(0); }}
        >
          <History size={18} /> Lịch sử hoạt động người dùng (Activity History)
        </button>
      </div>

      {/* Filter Bar (Only for Audit Log) */}
      {activeTab === 'audit' && (
        <div className="card shadow-sm border-0 p-3 mb-4">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light"><Search size={16} /></span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Tìm theo tên đăng nhập..."
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light"><Filter size={16} /></span>
                <select 
                  className="form-select"
                  value={filterAction}
                  onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
                >
                  <option value="">Tất cả loại hành động</option>
                  <option value="LOGIN_SUCCESS">Đăng nhập thành công</option>
                  <option value="LOGIN_FAILED">Đăng nhập thất bại</option>
                  <option value="LOGOUT">Đăng xuất</option>
                  <option value="DOCUMENT_UPLOAD">Tải lên tài liệu</option>
                  <option value="DOCUMENT_PREVIEW">Xem trước tài liệu</option>
                  <option value="DOCUMENT_DOWNLOAD">Tải xuống tài liệu</option>
                  <option value="DOCUMENT_UPDATE">Cập nhật tài liệu</option>
                  <option value="SAVED_SEARCH_CREATE">Tạo bộ lọc</option>
                  <option value="SAVED_SEARCH_DELETE">Xóa bộ lọc</option>
                  <option value="USER_CREATE">Tạo tài khoản</option>
                  <option value="USER_UPDATE">Cập nhật người dùng</option>
                  <option value="USER_ROLE_CHANGE">Đổi quyền vai trò</option>
                  <option value="USER_ENABLE">Kích hoạt tài khoản</option>
                  <option value="USER_DISABLE">Khóa tài khoản</option>
                </select>
              </div>
            </div>

            <div className="col-12 col-md-4 d-flex gap-2">
              <button type="submit" className="btn btn-primary flex-fill">
                Lọc dữ liệu
              </button>
              {(filterUser || filterAction) && (
                <button type="button" className="btn btn-outline-secondary" onClick={handleResetFilters}>
                  Xóa lọc
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Table Content */}
      <div className="card shadow-sm border-0 p-3">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-secondary">Đang tải bản ghi nhật ký...</p>
          </div>
        ) : activeTab === 'audit' ? (
          // Audit Log Table
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small">
                Hiển thị <strong>{auditLogs.length}</strong> / <strong>{totalElements}</strong> sự kiện kiểm toán
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-secondary text-center py-5">Không tìm thấy bản ghi kiểm toán nào phù hợp</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '70px' }}>ID</th>
                      <th style={{ width: '170px' }}>Thời gian</th>
                      <th style={{ width: '130px' }}>Tài khoản</th>
                      <th style={{ width: '190px' }}>Hành động</th>
                      <th style={{ width: '140px' }}>Đối tượng</th>
                      <th>Mô tả chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="small text-muted">#{log.id}</td>
                        <td className="small text-secondary">{formatDate(log.timestamp)}</td>
                        <td>
                          <span className="fw-medium text-dark">{log.username}</span>
                        </td>
                        <td>
                          <span className={`badge ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="small">
                          {log.resourceType ? (
                            <span className="badge bg-light text-dark border">
                              {log.resourceType} {log.resourceId ? `#${log.resourceId}` : ''}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="small text-muted">{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                <span className="text-secondary small">
                  Trang {page + 1} / {totalPages}
                </span>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft size={16} /> Trang trước
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    Trang sau <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          // Activity History View
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small">
                30 hoạt động người dùng mới nhất (Sắp xếp theo thời gian mới nhất trước)
              </span>
            </div>

            {activities.length === 0 ? (
              <p className="text-secondary text-center py-5">Chưa có lịch sử hoạt động nào</p>
            ) : (
              <div className="activity-timeline">
                {activities.map((act) => (
                  <div key={act.id} className="activity-item d-flex gap-3 py-3 border-bottom">
                    <div className="activity-icon-wrapper">
                      <UserCheck size={18} className="text-primary" />
                    </div>
                    <div className="flex-fill">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div>
                          <strong className="text-dark me-2">{act.username}</strong>
                          <span className={`badge ${getActionBadgeClass(act.action)} me-2`}>
                            {act.action}
                          </span>
                        </div>
                        <span className="text-secondary small">{formatDate(act.timestamp)}</span>
                      </div>
                      <div className="text-muted small">{act.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      </main>
    </div>
  );
};
