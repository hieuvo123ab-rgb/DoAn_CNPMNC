import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Server,
  Database,
  HardDrive,
  KeyRound,
  Eye,
  Bell,
  RefreshCw,
  Clock,
  Cpu,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Layers,
  Inbox,
  Trash2
} from 'lucide-react';
import {
  systemStatusApi,
  SystemStatusData,
  SystemMetricsData
} from '../api/systemStatusApi';
import { Navbar } from '../components/Navbar';

export const SystemStatusPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [metrics, setMetrics] = useState<SystemMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchStatusAndMetrics = useCallback(async (manual: boolean = false) => {
    if (manual) setIsRefreshing(true);
    setError(null);
    try {
      const [statusData, metricsData] = await Promise.all([
        systemStatusApi.getSystemStatus(),
        systemStatusApi.getSystemMetrics().catch(() => null)
      ]);
      setStatus(statusData);
      setMetrics(metricsData);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể kết nối đến dịch vụ giám sát hệ thống');
    } finally {
      setIsLoading(false);
      if (manual) setIsRefreshing(false);
    }
  }, []);

  // Periodic auto-refresh every 30 seconds with strict React interval cleanup
  useEffect(() => {
    fetchStatusAndMetrics(false);
    const intervalId = setInterval(() => {
      fetchStatusAndMetrics(false);
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchStatusAndMetrics]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const getStatusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'UP':
      case 'READY':
      case 'AVAILABLE':
        return (
          <span className="ent-badge ent-badge--success">
            <CheckCircle2 size={13} /> {st}
          </span>
        );
      case 'DEGRADED':
      case 'EXPIRING_SOON':
        return (
          <span className="ent-badge ent-badge--warning">
            <AlertTriangle size={13} /> {st}
          </span>
        );
      case 'DOWN':
      case 'NOT_READY':
      case 'UNAVAILABLE':
      case 'EXPIRED':
      default:
        return (
          <span className="ent-badge ent-badge--danger">
            <XCircle size={13} /> {st}
          </span>
        );
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', width: '100%' }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <Activity style={{ color: 'var(--color-primary)' }} size={24} />
              Trạng thái & Giám sát vận hành hệ thống
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Production Readiness, Health Probes & Operational Observability
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Cập nhật lần cuối: {lastRefreshedAt.toLocaleTimeString()}
            </span>
            <button
              onClick={() => fetchStatusAndMetrics(true)}
              disabled={isRefreshing || isLoading}
              className="btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '0.85rem'
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Đang kiểm tra tình trạng các dịch vụ...</p>
          </div>
        ) : status && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Overview KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem'
            }}>
              {/* Card 1: Overall Status */}
              <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Tiến trình máy chủ (Liveness)
                  </span>
                  <Server size={18} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {status.status}
                  </span>
                  {getStatusBadge(status.status)}
                </div>
              </div>

              {/* Card 2: Readiness */}
              <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Sẵn sàng phục vụ (Readiness)
                  </span>
                  <ShieldCheck size={18} style={{ color: '#10b981' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {status.readiness}
                  </span>
                  {getStatusBadge(status.readiness)}
                </div>
              </div>

              {/* Card 3: Uptime */}
              <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Thời gian hoạt động (Uptime)
                  </span>
                  <Clock size={18} style={{ color: '#6366f1' }} />
                </div>
                <div>
                  <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {formatUptime(status.uptimeSeconds)}
                  </span>
                </div>
              </div>

              {/* Card 4: Requests & Latency */}
              <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Lưu lượng & Độ trễ TB
                  </span>
                  <Activity size={18} style={{ color: '#ec4899' }} />
                </div>
                <div>
                  <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {metrics?.requests?.totalCount ?? 0} reqs
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                    ({metrics?.requests?.averageResponseTimeMs ?? 0} ms)
                  </span>
                </div>
              </div>
            </div>

            {/* Subsystem Components Status Grid */}
            <div style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                Chi tiết chẩn đoán thành phần hạ tầng (Infrastructure Diagnostics)
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {/* 1. Database */}
                <div style={{
                  padding: '1rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-bg)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <Database size={16} style={{ color: 'var(--color-primary)' }} />
                      Cơ sở dữ liệu (PostgreSQL)
                    </div>
                    {getStatusBadge(status.components.database.status)}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    <div>Hệ quản trị: {status.components.database.database || 'PostgreSQL 16'}</div>
                    <div>Độ trễ truy vấn: {status.components.database.latencyMs != null ? `${status.components.database.latencyMs} ms` : 'N/A'}</div>
                  </div>
                </div>

                {/* 2. Storage */}
                <div style={{
                  padding: '1rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-bg)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <HardDrive size={16} style={{ color: '#059669' }} />
                      Lưu trữ tài liệu (Storage)
                    </div>
                    {getStatusBadge(status.components.storage.status)}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    <div>Khả năng đọc (Read): {status.components.storage.readable ? 'Sẵn sàng' : 'Lỗi'}</div>
                    <div>Khả năng ghi (Write probe): {status.components.storage.writable ? 'Sẵn sàng' : 'Lỗi'}</div>
                  </div>
                </div>

                {/* 3. Signing KeyStore */}
                <div style={{
                  padding: '1rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-bg)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <KeyRound size={16} style={{ color: '#d97706' }} />
                      Chữ ký số & KeyStore
                    </div>
                    {getStatusBadge(status.components.signing.status)}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    <div>Số sê-ri chứng chỉ: {status.components.signing.serial || 'N/A'}</div>
                    <div>Trạng thái hiệu lực: {getStatusBadge(status.components.signing.expirationStatus || 'VALID')}</div>
                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>
                      Chủ thể: {status.components.signing.subject || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* 4. OCR Engine */}
                <div style={{
                  padding: '1rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-bg)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <Eye size={16} style={{ color: '#6366f1' }} />
                      Nhận dạng OCR (Tesseract)
                    </div>
                    {getStatusBadge(status.components.ocr.status)}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    <div>Phiên bản: {status.components.ocr.version || 'Tesseract OCR binary'}</div>
                    <div>Tính chất: Tùy chọn (Degraded nếu không khả dụng)</div>
                  </div>
                </div>

                {/* 5. Notifications */}
                <div style={{
                  padding: '1rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-bg)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <Bell size={16} style={{ color: '#ec4899' }} />
                      Hệ thống thông báo
                    </div>
                    {getStatusBadge(status.components.notifications.status)}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                    <div>Trạng thái lưu trữ: Liên kết PostgreSQL</div>
                    <div>Kênh phân phối: In-App Event Bus</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics & Resource Usage (if available) */}
            {metrics && (
              <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-main)' }}>
                  Tài nguyên & Thống kê nghiệp vụ hệ thống (Operational Metrics)
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {/* Memory Usage */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <Cpu size={16} style={{ color: 'var(--color-primary)' }} />
                      Bộ nhớ JVM (Heap Allocation)
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      Đang sử dụng: <strong>{metrics.memory.usedMb} MB</strong> / {metrics.memory.totalMb} MB (Tối đa: {metrics.memory.maxMb} MB)
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: 'var(--color-border)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(100, Math.round((metrics.memory.usedMb / Math.max(1, metrics.memory.maxMb)) * 100))}%`,
                        height: '100%',
                        backgroundColor: 'var(--color-primary)',
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>

                  {/* Business Entity Counts */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <Layers size={16} style={{ color: '#10b981' }} />
                      Quy mô dữ liệu lưu trữ
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.825rem' }}>
                      <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                        <FileText size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Tài liệu: <strong>{metrics.businessCounts.documents}</strong>
                      </div>
                      <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                        <Layers size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Phiên bản: <strong>{metrics.businessCounts.versions}</strong>
                      </div>
                      <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                        <Inbox size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Chờ duyệt: <strong>{metrics.businessCounts.pendingReviews}</strong>
                      </div>
                      <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                        <Trash2 size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Chờ tiêu hủy: <strong>{metrics.businessCounts.pendingDispositions}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SystemStatusPage;
