import React, { useEffect, useState, useMemo } from 'react';
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

interface DisplayTypeItem {
  key: string;
  label: string;
  rawType: string;
  count: number;
  percent: number;
  colorClass: string;
}

interface ActionInfo {
  label: string;
  badgeClass: string;
}

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
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  const getActionInfo = (action: string): ActionInfo => {
    const upper = (action || '').toUpperCase();

    if (upper === 'DOCUMENT_UPLOAD') {
      return { label: 'Tải lên tài liệu', badgeClass: 'dash-badge--success' };
    }
    if (upper === 'DOCUMENT_VERSION_UPLOAD') {
      return { label: 'Tải lên phiên bản', badgeClass: 'dash-badge--success' };
    }
    if (upper === 'DOCUMENT_DOWNLOAD') {
      return { label: 'Tải xuống tài liệu', badgeClass: 'dash-badge--purple' };
    }
    if (upper === 'DOCUMENT_VERSION_DOWNLOAD') {
      return { label: 'Tải xuống phiên bản', badgeClass: 'dash-badge--purple' };
    }
    if (upper === 'DOCUMENT_PREVIEW') {
      return { label: 'Xem trước tài liệu', badgeClass: 'dash-badge--info' };
    }
    if (upper === 'DOCUMENT_VERSION_PREVIEW') {
      return { label: 'Xem trước phiên bản', badgeClass: 'dash-badge--info' };
    }
    if (upper === 'DOCUMENT_VIEW') {
      return { label: 'Xem tài liệu', badgeClass: 'dash-badge--info' };
    }
    if (upper === 'DOCUMENT_UPDATE') {
      return { label: 'Cập nhật tài liệu', badgeClass: 'dash-badge--warning' };
    }
    if (upper === 'DOCUMENT_RETENTION_UPDATE') {
      return { label: 'Cập nhật hạn lưu trữ', badgeClass: 'dash-badge--warning' };
    }
    if (upper === 'DOCUMENT_ACCESS_MODE_CHANGE') {
      return { label: 'Đổi chế độ quyền', badgeClass: 'dash-badge--warning' };
    }
    if (upper === 'DOCUMENT_REVIEW_SUBMIT') {
      return { label: 'Trình duyệt tài liệu', badgeClass: 'dash-badge--primary' };
    }
    if (upper === 'DOCUMENT_REVIEW_APPROVE') {
      return { label: 'Phê duyệt tài liệu', badgeClass: 'dash-badge--success' };
    }
    if (upper === 'DOCUMENT_REVIEW_REJECT') {
      return { label: 'Từ chối duyệt', badgeClass: 'dash-badge--danger' };
    }
    if (upper === 'DOCUMENT_DISPOSITION_REQUEST') {
      return { label: 'Yêu cầu tiêu hủy', badgeClass: 'dash-badge--danger' };
    }
    if (upper === 'DOCUMENT_SIGNED') {
      return { label: 'Ký số điện tử', badgeClass: 'dash-badge--purple' };
    }
    if (upper === 'DOCUMENT_INTEGRITY_VERIFIED') {
      return { label: 'Kiểm tra toàn vẹn', badgeClass: 'dash-badge--info' };
    }
    if (upper === 'DOCUMENT_SHARE') {
      return { label: 'Chia sẻ quyền', badgeClass: 'dash-badge--primary' };
    }
    if (upper === 'DOCUMENT_ARCHIVE') {
      return { label: 'Lưu trữ tài liệu', badgeClass: 'dash-badge--warning' };
    }
    if (upper === 'DOCUMENT_VERSION_RESTORE') {
      return { label: 'Khôi phục phiên bản', badgeClass: 'dash-badge--info' };
    }
    if (upper === 'LOGIN_SUCCESS') {
      return { label: 'Đăng nhập thành công', badgeClass: 'dash-badge--success' };
    }
    if (upper === 'LOGIN_FAILED') {
      return { label: 'Đăng nhập thất bại', badgeClass: 'dash-badge--danger' };
    }
    if (upper === 'USER_ROLE_CHANGE') {
      return { label: 'Thay đổi vai trò', badgeClass: 'dash-badge--purple' };
    }

    if (upper.includes('UPLOAD')) return { label: 'Tải lên', badgeClass: 'dash-badge--success' };
    if (upper.includes('DELETE') || upper.includes('DISABLE') || upper.includes('REJECT') || upper.includes('FAILED')) {
      return { label: action, badgeClass: 'dash-badge--danger' };
    }
    if (upper.includes('UPDATE') || upper.includes('ROLE')) {
      return { label: action, badgeClass: 'dash-badge--warning' };
    }
    if (upper.includes('PREVIEW') || upper.includes('VIEW')) {
      return { label: action, badgeClass: 'dash-badge--info' };
    }
    if (upper.includes('DOWNLOAD')) return { label: action, badgeClass: 'dash-badge--purple' };

    return { label: action, badgeClass: 'dash-badge--neutral' };
  };

  const processedTypes = useMemo<DisplayTypeItem[]>(() => {
    if (!data?.documentStats?.documentsByType) return [];
    const entries = Object.entries(data.documentStats.documentsByType);
    if (entries.length === 0) return [];

    const total = data.documentStats.totalDocuments || 0;
    // Sort descending by count
    entries.sort((a, b) => b[1] - a[1]);

    const palette = [
      'dash-progress-bar--blue',
      'dash-progress-bar--lavender',
      'dash-progress-bar--mint',
      'dash-progress-bar--orange',
      'dash-progress-bar--slate',
      'dash-progress-bar--blue',
      'dash-progress-bar--lavender'
    ];

    const maxCategories = 6;
    const topEntries = entries.slice(0, maxCategories);
    const remainder = entries.slice(maxCategories);

    const items: DisplayTypeItem[] = topEntries.map(([type, count], idx) => {
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      let displayLabel = type;
      if (type.startsWith("b'") || type.startsWith('b"')) {
        displayLabel = type.length > 26 ? `${type.substring(0, 23)}...` : type;
      } else if (type.length > 30) {
        displayLabel = `${type.substring(0, 27)}...`;
      }

      return {
        key: `type-${idx}-${type}`,
        label: displayLabel,
        rawType: type,
        count,
        percent,
        colorClass: palette[idx % palette.length],
      };
    });

    if (remainder.length > 0) {
      const remainderCount = remainder.reduce((sum, [, cnt]) => sum + cnt, 0);
      const remainderPercent = total > 0 ? Math.round((remainderCount / total) * 100) : 0;
      const remainderNames = remainder.map(([t]) => t).join(', ');

      items.push({
        key: 'type-remainder-group',
        label: 'Khác (hệ thống / khác)',
        rawType: `Bao gồm: ${remainderNames}`,
        count: remainderCount,
        percent: remainderPercent,
        colorClass: 'dash-progress-bar--slate',
      });
    }

    return items;
  }, [data]);

  return (
    <div className="dashboard-page">
      <Navbar currentView="dashboard" />
      <main className="dashboard-container">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h2 className="dash-title">Bảng điều khiển</h2>
            <p className="dash-subtitle">
              Tổng hợp tình hình sử dụng và hoạt động của hệ thống
            </p>
          </div>
          <button 
            className="dash-refresh-btn" 
            onClick={fetchDashboard} 
            disabled={loading}
            aria-label="Làm mới dữ liệu bảng điều khiển"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>

        {loading ? (
          <div className="dash-state-center">
            <div className="dash-spinner" role="status" aria-label="Đang tải"></div>
            <p className="dash-state-text">Đang tải bảng điều khiển tổng quan...</p>
          </div>
        ) : error || !data ? (
          <div className="dash-alert dash-alert--danger" role="alert">
            <span>{error || 'Không có dữ liệu'}</span>
            <button className="dash-alert-btn" onClick={fetchDashboard}>
              Thử lại
            </button>
          </div>
        ) : (
          <div className="dash-content-body">
            {/* Row 1 — Overview (4 KPI Cards) */}
            <section className="dash-kpi-grid" aria-label="Chỉ số tổng quan">
              {/* Card 1: Tổng số tài liệu */}
              <div className="dash-kpi-card dash-kpi-card--blue">
                <div className="dash-kpi-icon" aria-hidden="true">
                  <FileText size={24} />
                </div>
                <div className="dash-kpi-content">
                  <div className="dash-kpi-value">
                    {data.documentStats.totalDocuments.toLocaleString('vi-VN')}
                  </div>
                  <div className="dash-kpi-label">Tổng số tài liệu</div>
                  <div className="dash-kpi-sub" title={`${formatBytes(data.documentStats.totalStorageBytes)} dung lượng`}>
                    {formatBytes(data.documentStats.totalStorageBytes)} dung lượng
                  </div>
                </div>
              </div>

              {/* Card 2: Tổng người dùng */}
              <div className="dash-kpi-card dash-kpi-card--green">
                <div className="dash-kpi-icon" aria-hidden="true">
                  <Users size={24} />
                </div>
                <div className="dash-kpi-content">
                  <div className="dash-kpi-value">
                    {data.totalUsers.toLocaleString('vi-VN')}
                  </div>
                  <div className="dash-kpi-label">Tổng người dùng</div>
                  <div className="dash-kpi-sub">
                    {data.usageStats.activeUsers} tài khoản đang hoạt động
                  </div>
                </div>
              </div>

              {/* Card 3: Lượt tải lên */}
              <div className="dash-kpi-card dash-kpi-card--orange">
                <div className="dash-kpi-icon" aria-hidden="true">
                  <Upload size={24} />
                </div>
                <div className="dash-kpi-content">
                  <div className="dash-kpi-value">
                    {data.usageStats.totalUploads.toLocaleString('vi-VN')}
                  </div>
                  <div className="dash-kpi-label">Lượt tải lên</div>
                  <div className="dash-kpi-sub">
                    {data.usageStats.totalUpdates.toLocaleString('vi-VN')} lượt cập nhật
                  </div>
                </div>
              </div>

              {/* Card 4: Lượt tải xuống */}
              <div className="dash-kpi-card dash-kpi-card--purple">
                <div className="dash-kpi-icon" aria-hidden="true">
                  <Download size={24} />
                </div>
                <div className="dash-kpi-content">
                  <div className="dash-kpi-value">
                    {data.usageStats.totalDownloads.toLocaleString('vi-VN')}
                  </div>
                  <div className="dash-kpi-label">Lượt tải xuống</div>
                  <div className="dash-kpi-sub">
                    {data.usageStats.totalPreviews.toLocaleString('vi-VN')} lượt xem trước
                  </div>
                </div>
              </div>
            </section>

            {/* Row 2 — Analytics Section */}
            <section className="dash-analytics-row" aria-label="Phân tích và tần suất">
              {/* Card 1 (45%): Phân loại tài liệu */}
              <div className="dash-analytics-col-45">
                <div className="dash-card">
                  <div className="dash-card-header">
                    <div className="dash-card-title-wrap">
                      <FolderCheck size={20} className="dash-card-icon" />
                      <h3 className="dash-card-title">Phân loại tài liệu</h3>
                    </div>
                    <p className="dash-card-subtitle">
                      Cơ cấu và tỷ trọng các phân loại tài liệu đang lưu trữ trong hệ thống
                    </p>
                  </div>

                  {processedTypes.length === 0 ? (
                    <div className="dash-empty-state">
                      <p>Chưa có tài liệu phân loại nào</p>
                    </div>
                  ) : (
                    <div className="dash-type-list">
                      {processedTypes.map((item) => (
                        <div key={item.key} className="dash-type-item">
                          <div className="dash-type-header">
                            <span 
                              className="dash-type-name" 
                              title={`Tên phân loại: ${item.rawType}`}
                            >
                              {item.label}
                            </span>
                            <span className="dash-type-count">
                              {item.count.toLocaleString('vi-VN')} tài liệu ({item.percent}%)
                            </span>
                          </div>
                          <div className="dash-progress-track">
                            <div 
                              className={`dash-progress-bar ${item.colorClass}`} 
                              role="progressbar" 
                              style={{ width: `${Math.min(Math.max(item.percent, item.count > 0 ? 3 : 0), 100)}%` }}
                              aria-valuenow={item.percent} 
                              aria-valuemin={0} 
                              aria-valuemax={100}
                              title={`${item.label}: ${item.count} (${item.percent}%)`}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2 (55%): Thống kê tần suất sử dụng */}
              <div className="dash-analytics-col-55">
                <div className="dash-card">
                  <div className="dash-card-header">
                    <div className="dash-card-title-wrap">
                      <Activity size={20} className="dash-card-icon" />
                      <h3 className="dash-card-title">Thống kê tần suất sử dụng</h3>
                    </div>
                    <p className="dash-card-subtitle">
                      Tần suất các thao tác xử lý tài liệu được ghi nhận thực tế từ hệ thống kiểm toán
                    </p>
                  </div>

                  <div className="dash-usage-grid">
                    <div className="dash-usage-tile dash-usage-tile--upload">
                      <div className="dash-usage-icon-wrap" aria-hidden="true">
                        <Upload size={22} />
                      </div>
                      <div className="dash-usage-val">
                        {data.usageStats.totalUploads.toLocaleString('vi-VN')}
                      </div>
                      <div className="dash-usage-lbl">Tải lên</div>
                    </div>

                    <div className="dash-usage-tile dash-usage-tile--download">
                      <div className="dash-usage-icon-wrap" aria-hidden="true">
                        <Download size={22} />
                      </div>
                      <div className="dash-usage-val">
                        {data.usageStats.totalDownloads.toLocaleString('vi-VN')}
                      </div>
                      <div className="dash-usage-lbl">Tải xuống</div>
                    </div>

                    <div className="dash-usage-tile dash-usage-tile--preview">
                      <div className="dash-usage-icon-wrap" aria-hidden="true">
                        <Eye size={22} />
                      </div>
                      <div className="dash-usage-val">
                        {data.usageStats.totalPreviews.toLocaleString('vi-VN')}
                      </div>
                      <div className="dash-usage-lbl">Xem trước</div>
                    </div>

                    <div className="dash-usage-tile dash-usage-tile--update">
                      <div className="dash-usage-icon-wrap" aria-hidden="true">
                        <Edit size={22} />
                      </div>
                      <div className="dash-usage-val">
                        {data.usageStats.totalUpdates.toLocaleString('vi-VN')}
                      </div>
                      <div className="dash-usage-lbl">Cập nhật</div>
                    </div>
                  </div>

                  <div className="dash-usage-footer">
                    <span className="dash-usage-footer-item">
                      <HardDrive size={15} />
                      <span>Tổng dung lượng lưu trữ: <strong>{formatBytes(data.documentStats.totalStorageBytes)}</strong></span>
                    </span>
                    <span className="dash-usage-footer-item">
                      <Users size={15} />
                      <span>Người dùng đã tương tác: <strong>{data.usageStats.activeUsers}</strong></span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Row 3 — Recent Activity Card */}
            <section className="dash-activity-card" aria-label="Hoạt động gần đây">
              <div className="dash-activity-header">
                <div className="dash-card-title-wrap">
                  <Activity size={20} className="dash-card-icon" />
                  <h3 className="dash-card-title">Hoạt động gần đây</h3>
                </div>
                <span className="dash-activity-badge-count">10 sự kiện mới nhất</span>
              </div>

              {data.recentActivities.length === 0 ? (
                <div className="dash-empty-state">
                  <p>Chưa có hoạt động nào được ghi nhận</p>
                </div>
              ) : (
                <div className="dash-table-wrapper">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th style={{ width: '180px' }}>Thời gian</th>
                        <th style={{ width: '140px' }}>Tài khoản</th>
                        <th style={{ width: '200px' }}>Hành động</th>
                        <th>Mô tả chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentActivities.map((act) => {
                        const actionInfo = getActionInfo(act.action);
                        return (
                          <tr key={act.id}>
                            <td className="dash-cell-time">{formatDate(act.timestamp)}</td>
                            <td>
                              <span className="dash-user-pill">{act.username}</span>
                            </td>
                            <td>
                              <span 
                                className={`dash-badge ${actionInfo.badgeClass}`}
                                title={`Mã hành động hệ thống: ${act.action}`}
                              >
                                {actionInfo.label}
                              </span>
                            </td>
                            <td className="dash-cell-desc">{act.description}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
