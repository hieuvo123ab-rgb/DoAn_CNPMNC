import React, { useEffect, useState } from 'react';
import { getDashboard, DashboardData } from '../api/dashboardApi';
import { Navbar } from '../components/Navbar';
import { 
  FileText, 
  Users, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  RefreshCw, 
  Activity, 
  FolderCheck,
  HardDrive
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu bảng điều khiển');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    <div className="dashboard-page">
      <Navbar />
      <main className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="dashboard-title">Bảng điều khiển & Giám sát</h2>
            <p className="dashboard-subtitle text-secondary mb-0">
              Dữ liệu giám sát hoạt động và thống kê tài nguyên hệ thống EDMS thời gian thực
            </p>
          </div>
          <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={fetchDashboard} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-secondary">Đang tải bảng điều khiển tổng quan...</p>
          </div>
        ) : error || !data ? (
          <div className="alert alert-danger" role="alert">
            {error || 'Không có dữ liệu'}
            <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchDashboard}>
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {/* Top Metrics Cards */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="metric-card card-blue">
                  <div className="metric-icon">
                    <FileText size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{data.documentStats.totalDocuments}</div>
                    <div className="metric-label">Tổng số tài liệu</div>
                    <div className="metric-sub">{formatBytes(data.documentStats.totalStorageBytes)} dung lượng</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="metric-card card-green">
                  <div className="metric-icon">
                    <Users size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{data.totalUsers}</div>
                    <div className="metric-label">Tổng người dùng</div>
                    <div className="metric-sub">{data.usageStats.activeUsers} tài khoản đang hoạt động</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="metric-card card-orange">
                  <div className="metric-icon">
                    <Upload size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{data.usageStats.totalUploads}</div>
                    <div className="metric-label">Lượt tải lên</div>
                    <div className="metric-sub">{data.usageStats.totalUpdates} lượt cập nhật</div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="metric-card card-purple">
                  <div className="metric-icon">
                    <Download size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{data.usageStats.totalDownloads}</div>
                    <div className="metric-label">Lượt tải xuống</div>
                    <div className="metric-sub">{data.usageStats.totalPreviews} lượt xem trước</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts & Distribution Section */}
            <div className="row g-4 mb-4">
              {/* Document Classification Distribution */}
              <div className="col-12 col-lg-5">
                <div className="card shadow-sm border-0 h-100 p-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <FolderCheck size={20} className="text-primary" />
                    <h5 className="mb-0 fw-semibold">Phân loại tài liệu</h5>
                  </div>
                  <p className="text-secondary small mb-3">
                    Cơ cấu và tỷ trọng các phân loại tài liệu đang lưu trữ trong hệ thống
                  </p>

                  {Object.entries(data.documentStats.documentsByType || {}).length === 0 ? (
                    <p className="text-muted small my-auto text-center py-4">Chưa có tài liệu phân loại nào</p>
                  ) : (
                    <div className="type-distribution-list">
                      {Object.entries(data.documentStats.documentsByType || {}).map(([type, count]) => {
                        const percent = data.documentStats.totalDocuments > 0 
                          ? Math.round((count / data.documentStats.totalDocuments) * 100) 
                          : 0;
                        return (
                          <div key={type} className="mb-3">
                            <div className="d-flex justify-content-between small fw-medium mb-1">
                              <span>{type}</span>
                              <span className="text-secondary">{count} tài liệu ({percent}%)</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div 
                                className="progress-bar bg-primary" 
                                role="progressbar" 
                                style={{ width: `${percent}%` }}
                                aria-valuenow={percent} 
                                aria-valuemin={0} 
                                aria-valuemax={100}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* System Usage Breakdown */}
              <div className="col-12 col-lg-7">
                <div className="card shadow-sm border-0 h-100 p-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <Activity size={20} className="text-primary" />
                    <h5 className="mb-0 fw-semibold">Thống kê tần suất sử dụng</h5>
                  </div>
                  <p className="text-secondary small mb-3">
                    Tần suất các thao tác xử lý tài liệu được ghi nhận thực tế từ hệ thống kiểm toán
                  </p>

                  <div className="row g-3 mt-1">
                    <div className="col-6 col-sm-3">
                      <div className="usage-stat-box text-center p-3 rounded-3 bg-light">
                        <Upload size={22} className="text-primary mb-2" />
                        <div className="fs-4 fw-bold">{data.usageStats.totalUploads}</div>
                        <div className="text-secondary small">Tải lên</div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-3">
                      <div className="usage-stat-box text-center p-3 rounded-3 bg-light">
                        <Download size={22} className="text-success mb-2" />
                        <div className="fs-4 fw-bold">{data.usageStats.totalDownloads}</div>
                        <div className="text-secondary small">Tải xuống</div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-3">
                      <div className="usage-stat-box text-center p-3 rounded-3 bg-light">
                        <Eye size={22} className="text-info mb-2" />
                        <div className="fs-4 fw-bold">{data.usageStats.totalPreviews}</div>
                        <div className="text-secondary small">Xem trước</div>
                      </div>
                    </div>
                    <div className="col-6 col-sm-3">
                      <div className="usage-stat-box text-center p-3 rounded-3 bg-light">
                        <Edit size={22} className="text-warning mb-2" />
                        <div className="fs-4 fw-bold">{data.usageStats.totalUpdates}</div>
                        <div className="text-secondary small">Cập nhật</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                    <span className="text-secondary small">
                      <HardDrive size={15} className="me-1 inline-block" />
                      Tổng dung lượng lưu trữ: <strong>{formatBytes(data.documentStats.totalStorageBytes)}</strong>
                    </span>
                    <span className="text-secondary small">
                      <Users size={15} className="me-1 inline-block" />
                      Người dùng đã tương tác: <strong>{data.usageStats.activeUsers}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Stream */}
            <div className="card shadow-sm border-0 p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Activity size={20} className="text-primary" />
                  <h5 className="mb-0 fw-semibold">Hoạt động gần đây</h5>
                </div>
                <span className="badge bg-secondary">10 sự kiện mới nhất</span>
              </div>

              {data.recentActivities.length === 0 ? (
                <p className="text-secondary small text-center py-4">Chưa có hoạt động nào được ghi nhận</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '180px' }}>Thời gian</th>
                        <th style={{ width: '130px' }}>Tài khoản</th>
                        <th style={{ width: '190px' }}>Hành động</th>
                        <th>Mô tả chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentActivities.map((act) => (
                        <tr key={act.id}>
                          <td className="small text-secondary">{formatDate(act.timestamp)}</td>
                          <td>
                            <span className="fw-medium text-dark">{act.username}</span>
                          </td>
                          <td>
                            <span className={`badge ${getActionBadgeClass(act.action)}`}>
                              {act.action}
                            </span>
                          </td>
                          <td className="small text-muted">{act.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
