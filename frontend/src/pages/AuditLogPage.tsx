import React, { useEffect, useState, useCallback } from 'react';
import { getAuditLogs, getActivityHistory, AuditItem } from '../api/auditApi';
import {
  ShieldAlert,
  History,
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  User,
  Clock,
  Info,
  X
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { EnterpriseModal } from '../components/common/EnterpriseModal';

// Action code to friendly Vietnamese label and badge variant mapping
interface ActionMeta {
  label: string;
  variant: 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'neutral';
}

const ACTION_MAP: Record<string, ActionMeta> = {
  LOGIN_SUCCESS: { label: 'Đăng nhập thành công', variant: 'success' },
  LOGIN_FAILED: { label: 'Đăng nhập thất bại', variant: 'danger' },
  LOGOUT: { label: 'Đăng xuất', variant: 'neutral' },
  DOCUMENT_UPLOAD: { label: 'Tải lên tài liệu', variant: 'success' },
  DOCUMENT_PREVIEW: { label: 'Xem trước tài liệu', variant: 'info' },
  DOCUMENT_DOWNLOAD: { label: 'Tải xuống tài liệu', variant: 'primary' },
  DOCUMENT_UPDATE: { label: 'Cập nhật tài liệu', variant: 'warning' },
  DOCUMENT_REVIEW_SUBMIT: { label: 'Gửi duyệt tài liệu', variant: 'warning' },
  DOCUMENT_REVIEW_APPROVE: { label: 'Phê duyệt tài liệu', variant: 'success' },
  DOCUMENT_REVIEW_REJECT: { label: 'Từ chối tài liệu', variant: 'danger' },
  DOCUMENT_SIGN: { label: 'Ký số điện tử', variant: 'primary' },
  DOCUMENT_DISPOSITION_REQUEST: { label: 'Yêu cầu tiêu hủy', variant: 'warning' },
  DOCUMENT_DISPOSITION_APPROVE: { label: 'Duyệt tiêu hủy', variant: 'danger' },
  DOCUMENT_DISPOSITION_REJECT: { label: 'Hủy yêu cầu tiêu hủy', variant: 'neutral' },
  SAVED_SEARCH_CREATE: { label: 'Lưu bộ lọc tìm kiếm', variant: 'info' },
  SAVED_SEARCH_DELETE: { label: 'Xóa bộ lọc tìm kiếm', variant: 'neutral' },
  USER_CREATE: { label: 'Khởi tạo người dùng', variant: 'success' },
  USER_UPDATE: { label: 'Cập nhật người dùng', variant: 'warning' },
  USER_ROLE_CHANGE: { label: 'Thay đổi quyền vai trò', variant: 'warning' },
  USER_ENABLE: { label: 'Mở khóa tài khoản', variant: 'success' },
  USER_DISABLE: { label: 'Khóa tài khoản', variant: 'danger' },
  RATE_LIMIT_EXCEEDED: { label: 'Vượt tần suất yêu cầu', variant: 'danger' },
};

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

  // State for Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditItem | null>(null);

  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'audit') {
        const res = await getAuditLogs({
          username: filterUser.trim() || undefined,
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
      setError(err?.response?.data?.message || 'Không thể kết nối đến máy chủ để tải nhật ký kiểm toán.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, filterAction, filterUser]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

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

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getActionMeta = (action: string): ActionMeta => {
    if (ACTION_MAP[action]) {
      return ACTION_MAP[action];
    }
    // Fallback heuristic
    if (action.includes('UPLOAD') || action.includes('SUCCESS') || action.includes('ENABLE') || action.includes('APPROVE')) {
      return { label: action, variant: 'success' };
    }
    if (action.includes('DELETE') || action.includes('DISABLE') || action.includes('FAILED') || action.includes('REJECT') || action.includes('EXCEEDED')) {
      return { label: action, variant: 'danger' };
    }
    if (action.includes('UPDATE') || action.includes('ROLE') || action.includes('REQUEST')) {
      return { label: action, variant: 'warning' };
    }
    if (action.includes('PREVIEW') || action.includes('VIEW')) {
      return { label: action, variant: 'info' };
    }
    return { label: action, variant: 'neutral' };
  };

  return (
    <div className="audit-page">
      {/* Topbar & Sidebar automatically synchronized to 'audit' */}
      <Navbar currentView="audit" />

      <main className="audit-container">
        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: 'var(--color-text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                margin: 0,
              }}
            >
              <ShieldAlert size={22} style={{ color: 'var(--color-primary)' }} />
              Nhật ký kiểm toán & An ninh hệ thống
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.3rem',
                marginBottom: 0,
              }}
            >
              Truy vết hoạt động, kiểm tra tính toàn vẹn và lịch sử thao tác của các tài khoản trên hệ thống
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchAuditData()}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="audit-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'audit'}
            className={`audit-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('audit');
              setPage(0);
            }}
          >
            <ShieldAlert size={17} />
            <span>Nhật ký kiểm toán chi tiết (Audit Logs)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'activity'}
            className={`audit-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('activity');
              setPage(0);
            }}
          >
            <History size={17} />
            <span>Lịch sử 30 hoạt động mới nhất</span>
          </button>
        </div>

        {/* Unified Filter Toolbar (Only for Audit Log tab) */}
        {activeTab === 'audit' && (
          <form onSubmit={handleSearchSubmit} className="audit-toolbar" role="search">
            {/* Search by username input */}
            <div className="audit-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Tìm kiếm theo tên tài khoản..."
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                aria-label="Tìm theo tên người dùng"
              />
              {filterUser && (
                <button
                  type="button"
                  onClick={() => setFilterUser('')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                  }}
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter by action select */}
            <div className="audit-action-select">
              <select
                className="form-select"
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setPage(0);
                }}
                aria-label="Lọc theo loại hành động"
              >
                <option value="">Tất cả loại hành động</option>
                <option value="LOGIN_SUCCESS">Đăng nhập thành công</option>
                <option value="LOGIN_FAILED">Đăng nhập thất bại</option>
                <option value="LOGOUT">Đăng xuất</option>
                <option value="DOCUMENT_UPLOAD">Tải lên tài liệu</option>
                <option value="DOCUMENT_PREVIEW">Xem trước tài liệu</option>
                <option value="DOCUMENT_DOWNLOAD">Tải xuống tài liệu</option>
                <option value="DOCUMENT_UPDATE">Cập nhật tài liệu</option>
                <option value="DOCUMENT_REVIEW_SUBMIT">Gửi duyệt tài liệu</option>
                <option value="DOCUMENT_REVIEW_APPROVE">Phê duyệt tài liệu</option>
                <option value="DOCUMENT_REVIEW_REJECT">Từ chối tài liệu</option>
                <option value="DOCUMENT_SIGN">Ký số điện tử</option>
                <option value="DOCUMENT_DISPOSITION_REQUEST">Yêu cầu tiêu hủy</option>
                <option value="DOCUMENT_DISPOSITION_APPROVE">Duyệt tiêu hủy</option>
                <option value="SAVED_SEARCH_CREATE">Lưu bộ lọc tìm kiếm</option>
                <option value="SAVED_SEARCH_DELETE">Xóa bộ lọc tìm kiếm</option>
                <option value="USER_CREATE">Khởi tạo người dùng</option>
                <option value="USER_UPDATE">Cập nhật người dùng</option>
                <option value="USER_ROLE_CHANGE">Đổi quyền vai trò</option>
                <option value="USER_ENABLE">Mở khóa tài khoản</option>
                <option value="USER_DISABLE">Khóa tài khoản</option>
                <option value="RATE_LIMIT_EXCEEDED">Vượt tần suất yêu cầu</option>
              </select>
            </div>

            {/* Submit & Reset actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" id="audit-filter-btn">
                <Filter size={15} />
                <span>Lọc</span>
              </button>
              {(filterUser || filterAction) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetFilters}
                  id="audit-reset-filter-btn"
                >
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Error Alert */}
        {error && (
          <div className="ent-alert ent-alert--danger" role="alert" style={{ marginBottom: '1.25rem' }}>
            <ShieldAlert size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Table Card */}
        <div className="card-table">
          {loading ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ margin: 0 }}>Đang tải bản ghi nhật ký kiểm toán...</p>
            </div>
          ) : activeTab === 'audit' ? (
            /* TAB 1: AUDIT LOGS */
            <>
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--color-card-muted)',
                }}
              >
                <span style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  Hiển thị <strong>{auditLogs.length}</strong> / <strong>{totalElements}</strong> sự kiện kiểm toán
                  {filterUser && ` • Tài khoản: "${filterUser}"`}
                  {filterAction && ` • Hành động: ${filterAction}`}
                </span>
                {totalPages > 1 && (
                  <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Trang {page + 1} / {totalPages}
                  </span>
                )}
              </div>

              {auditLogs.length === 0 ? (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <ShieldAlert size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                    Không tìm thấy bản ghi kiểm toán nào
                  </p>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Thử thay đổi từ khóa tài khoản hoặc xóa bộ lọc hành động để hiển thị thêm kết quả.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table" id="audit-logs-table">
                    <thead>
                      <tr>
                        <th style={{ width: '75px' }} className="td-nowrap">ID</th>
                        <th style={{ width: '165px' }} className="td-nowrap">Thời gian</th>
                        <th style={{ width: '140px' }} className="td-nowrap">Tài khoản</th>
                        <th style={{ width: '190px' }} className="td-nowrap">Hành động</th>
                        <th style={{ width: '140px' }} className="td-nowrap">Đối tượng</th>
                        <th style={{ minWidth: '280px' }}>Mô tả chi tiết</th>
                        <th style={{ width: '90px', textAlign: 'center' }} className="td-nowrap">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => {
                        const actionMeta = getActionMeta(log.action);
                        return (
                          <tr
                            key={log.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedLog(log)}
                            title="Nhấp để xem đầy đủ thông tin chi tiết sự kiện"
                          >
                            <td className="td-nowrap" style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                              #{log.id}
                            </td>
                            <td className="td-nowrap" style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Clock size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                                <span>{formatDate(log.timestamp)}</span>
                              </div>
                            </td>
                            <td className="td-nowrap">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                                <User size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                <span>{log.username}</span>
                              </div>
                            </td>
                            <td className="td-nowrap">
                              <span
                                className={`ent-badge ent-badge--${actionMeta.variant}`}
                                title={`Mã hệ thống: ${log.action}`}
                              >
                                {actionMeta.label}
                              </span>
                            </td>
                            <td className="td-nowrap" style={{ fontSize: '0.825rem' }}>
                              {log.resourceType ? (
                                <span className="ent-badge ent-badge--neutral">
                                  {log.resourceType} {log.resourceId ? `#${log.resourceId}` : ''}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                              )}
                            </td>
                            <td className="cell-wrap" style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
                              {log.description}
                            </td>
                            <td className="td-nowrap" style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLog(log);
                                }}
                                title="Xem chi tiết bản ghi"
                                aria-label={`Xem chi tiết sự kiện #${log.id}`}
                              >
                                <Info size={14} />
                                <span>Chi tiết</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    Trang <strong>{page + 1}</strong> trên tổng số <strong>{totalPages}</strong> trang ({totalElements} bản ghi)
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      id="audit-prev-page-btn"
                    >
                      <ChevronLeft size={15} />
                      <span>Trang trước</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(page + 1)}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      id="audit-next-page-btn"
                    >
                      <span>Trang sau</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* TAB 2: ACTIVITY TIMELINE */
            <>
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-card-muted)',
                }}
              >
                <span style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  30 hoạt động người dùng gần nhất (Sắp xếp theo thứ tự thời gian mới nhất)
                </span>
              </div>

              {activities.length === 0 ? (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <History size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Chưa có lịch sử hoạt động nào được ghi nhận</p>
                </div>
              ) : (
                <div style={{ padding: '0.5rem 1.25rem' }}>
                  {activities.map((act) => {
                    const actionMeta = getActionMeta(act.action);
                    return (
                      <div
                        key={act.id}
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          padding: '1rem 0',
                          borderBottom: '1px solid var(--color-border)',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-card-muted)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'var(--color-primary)',
                          }}
                        >
                          <UserCheck size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.35rem',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong style={{ color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                                {act.username}
                              </strong>
                              <span className={`ent-badge ent-badge--${actionMeta.variant}`}>
                                {actionMeta.label}
                              </span>
                              {act.resourceType && (
                                <span className="ent-badge ent-badge--neutral">
                                  {act.resourceType} {act.resourceId ? `#${act.resourceId}` : ''}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              {formatDate(act.timestamp)}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            {act.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Audit Detail Modal (Preserving full data fidelity without truncation) */}
      {selectedLog && (
        <EnterpriseModal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Chi tiết sự kiện kiểm toán #${selectedLog.id}`}
          subtitle="Toàn bộ thông số ghi nhận thực tế từ hệ thống audit log"
          icon={<ShieldAlert size={20} className="text-primary" />}
          size="md"
          footer={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setSelectedLog(null)}
            >
              Đóng
            </button>
          }
        >
          <div className="audit-detail-grid">
            <div className="audit-detail-label">Mã bản ghi:</div>
            <div className="audit-detail-value">#{selectedLog.id}</div>

            <div className="audit-detail-label">Thời gian:</div>
            <div className="audit-detail-value">{formatDate(selectedLog.timestamp)}</div>

            <div className="audit-detail-label">Tài khoản:</div>
            <div className="audit-detail-value" style={{ fontWeight: 600 }}>{selectedLog.username}</div>

            <div className="audit-detail-label">Hành động:</div>
            <div className="audit-detail-value">
              <span className={`ent-badge ent-badge--${getActionMeta(selectedLog.action).variant}`} style={{ marginRight: '0.5rem' }}>
                {getActionMeta(selectedLog.action).label}
              </span>
              <code style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                ({selectedLog.action})
              </code>
            </div>

            <div className="audit-detail-label">Đối tượng:</div>
            <div className="audit-detail-value">
              {selectedLog.resourceType ? (
                <span>
                  {selectedLog.resourceType} {selectedLog.resourceId ? `(ID: #${selectedLog.resourceId})` : ''}
                </span>
              ) : (
                'Không gắn đối tượng cụ thể'
              )}
            </div>

            <div className="audit-detail-label">Nội dung chi tiết:</div>
            <div
              className="audit-detail-value"
              style={{
                backgroundColor: 'var(--color-card-muted)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                lineHeight: 1.5,
              }}
            >
              {selectedLog.description}
            </div>
          </div>
        </EnterpriseModal>
      )}
    </div>
  );
};

export default AuditLogPage;
