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
  Trash2,
  ChevronDown,
  ChevronUp,
  Info
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

  // Accordion open/close state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    memory: true,
    entities: true,
    diagnostics: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchStatusAndMetrics = useCallback(async (manual: boolean = false) => {
    if (manual) setIsRefreshing(true);
    setError(null);
    try {
      const [statusData, metricsData] = await Promise.all([
        systemStatusApi.getSystemStatus(),
        systemStatusApi.getSystemMetrics().catch(() => null),
      ]);
      setStatus(statusData);
      setMetrics(metricsData);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Không thể kết nối đến dịch vụ giám sát hệ thống. Vui lòng kiểm tra quyền quản trị và kết nối mạng.'
      );
    } finally {
      setIsLoading(false);
      if (manual) setIsRefreshing(false);
    }
  }, []);

  // Periodic auto-refresh every 30 seconds with strict interval cleanup
  useEffect(() => {
    fetchStatusAndMetrics(false);
    const intervalId = setInterval(() => {
      fetchStatusAndMetrics(false);
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchStatusAndMetrics]);

  const formatUptime = (seconds: number): string => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d} ngày`);
    if (h > 0 || d > 0) parts.push(`${h} giờ`);
    if (m > 0 || h > 0 || d > 0) parts.push(`${m} phút`);
    parts.push(`${s} giây`);
    return parts.join(' ');
  };

  const getStatusBadge = (st?: string) => {
    switch (st?.toUpperCase()) {
      case 'UP':
      case 'READY':
      case 'AVAILABLE':
      case 'VALID':
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
      case 'NOT_YET_VALID':
      default:
        return (
          <span className="ent-badge ent-badge--danger">
            <XCircle size={13} /> {st || 'UNKNOWN'}
          </span>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Topbar & Sidebar synchronized to 'system-status' */}
      <Navbar currentView="system-status" />

      <main className="main-content">
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
              <Activity size={22} style={{ color: 'var(--color-primary)' }} />
              Trạng thái hệ thống
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.3rem',
                marginBottom: 0,
              }}
            >
              Giám sát sức khỏe hạ tầng, dịch vụ lưu trữ và tính sẵn sàng vận hành của các dịch vụ EDMS
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Cập nhật lúc: {lastRefreshedAt.toLocaleTimeString('vi-VN')}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fetchStatusAndMetrics(true)}
              disabled={isRefreshing || isLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              id="system-status-refresh-btn"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="ent-alert ent-alert--danger" role="alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 0.85rem' }} />
            <p style={{ margin: 0, fontSize: '0.95rem' }}>Đang kiểm tra trạng thái sức khỏe toàn bộ hệ thống...</p>
          </div>
        ) : status ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 1. TOP OVERVIEW KPI CARDS */}
            <div className="status-kpi-grid">
              {/* Card 1: Tổng thể hệ thống */}
              <div className="status-card">
                <div className="status-card-header">
                  <span className="status-card-title">Máy chủ ứng dụng</span>
                  <Server size={18} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="status-card-value">{status.status}</span>
                  {getStatusBadge(status.status)}
                </div>
              </div>

              {/* Card 2: Uptime */}
              <div className="status-card">
                <div className="status-card-header">
                  <span className="status-card-title">Thời gian hoạt động</span>
                  <Clock size={18} style={{ color: '#6366f1' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {formatUptime(status.uptimeSeconds)}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    ({(status.uptimeSeconds ?? 0).toLocaleString('vi-VN')} giây)
                  </span>
                </div>
              </div>

              {/* Card 3: Sẵn sàng phục vụ (Readiness) */}
              <div className="status-card">
                <div className="status-card-header">
                  <span className="status-card-title">Tính sẵn sàng</span>
                  <ShieldCheck size={18} style={{ color: '#10b981' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="status-card-value">{status.readiness}</span>
                  {getStatusBadge(status.readiness)}
                </div>
              </div>

              {/* Card 4: Requests & Latency */}
              <div className="status-card">
                <div className="status-card-header">
                  <span className="status-card-title">Lưu lượng & Độ trễ</span>
                  <Activity size={18} style={{ color: '#ec4899' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {(metrics?.requests?.totalCount ?? 0).toLocaleString('vi-VN')} reqs
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Độ trễ trung bình: <strong>{metrics?.requests?.averageResponseTimeMs ?? 0} ms</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. CORE SUBSYSTEM COMPONENTS (6 PRIMARY SERVICES) */}
            <div>
              <h2
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--color-text-main)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Các dịch vụ thành phần cốt lõi</span>
              </h2>

              <div className="status-components-grid">
                {/* 1. Máy chủ (Server & JVM) */}
                <div className="component-status-card">
                  <div className="component-status-header">
                    <div className="component-status-title">
                      <Server size={17} style={{ color: 'var(--color-primary)' }} />
                      <span>Máy chủ ứng dụng</span>
                    </div>
                    {getStatusBadge(status.status)}
                  </div>
                  <div className="component-status-body">
                    <div className="component-status-row">
                      <span className="component-status-key">Nền tảng chạy:</span>
                      <span className="component-status-val">Spring Boot • Java 21</span>
                    </div>
                    <div className="component-status-row">
                      <span className="component-status-key">Kiểm tra sống (Liveness):</span>
                      <span className="component-status-val" style={{ color: 'var(--color-success)' }}>
                        Đạt chuẩn
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Cơ sở dữ liệu (PostgreSQL) */}
                <div className="component-status-card">
                  <div className="component-status-header">
                    <div className="component-status-title">
                      <Database size={17} style={{ color: 'var(--color-primary)' }} />
                      <span>Cơ sở dữ liệu</span>
                    </div>
                    {getStatusBadge(status.components.database.status)}
                  </div>
                  <div className="component-status-body">
                    <div className="component-status-row">
                      <span className="component-status-key">Hệ quản trị:</span>
                      <span className="component-status-val">
                        {status.components.database.database || 'PostgreSQL'}
                      </span>
                    </div>
                    <div className="component-status-row">
                      <span className="component-status-key">Độ trễ truy vấn:</span>
                      <span className="component-status-val">
                        {status.components.database.latencyMs != null
                          ? `${status.components.database.latencyMs} ms`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Lưu trữ tài liệu (Storage) */}
                <div className="component-status-card">
                  <div className="component-status-header">
                    <div className="component-status-title">
                      <HardDrive size={17} style={{ color: '#059669' }} />
                      <span>Lưu trữ tệp</span>
                    </div>
                    {getStatusBadge(status.components.storage.status)}
                  </div>
                  <div className="component-status-body">
                    <div className="component-status-row">
                      <span className="component-status-key">Khả năng đọc (Read):</span>
                      <span
                        className="component-status-val"
                        style={{
                          color: status.components.storage.readable ? 'var(--color-success)' : 'var(--color-danger)',
                        }}
                      >
                        {status.components.storage.readable ? 'Sẵn sàng' : 'Không khả dụng'}
                      </span>
                    </div>
                    <div className="component-status-row">
                      <span className="component-status-key">Khả năng ghi (Write):</span>
                      <span
                        className="component-status-val"
                        style={{
                          color: status.components.storage.writable ? 'var(--color-success)' : 'var(--color-danger)',
                        }}
                      >
                        {status.components.storage.writable ? 'Sẵn sàng' : 'Không khả dụng'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Chữ ký số & KeyStore */}
                <div className="component-status-card">
                  <div className="component-status-header">
                    <div className="component-status-title">
                      <KeyRound size={17} style={{ color: '#d97706' }} />
                      <span>Chữ ký số & Khóa</span>
                    </div>
                    {getStatusBadge(status.components.signing.status)}
                  </div>
                  <div className="component-status-body">
                    <div className="component-status-row">
                      <span className="component-status-key">Thuật toán ký:</span>
                      <span className="component-status-val">RSA-2048 • SHA-256</span>
                    </div>
                    <div className="component-status-row">
                      <span className="component-status-key">Cấp độ tin cậy:</span>
                      <span className="component-status-val" style={{ color: 'var(--color-warning)' }}>
                        Chứng thư thử nghiệm (Self-Signed)
                      </span>
                    </div>
                    <div className="component-status-row">
                      <span className="component-status-key">Hiệu lực chứng chỉ:</span>
                      <span className="component-status-val">
                        {getStatusBadge(status.components.signing.expirationStatus || 'VALID')}
                      </span>
                    </div>
                    <div className="component-status-row">
                      <span className="component-status-key">Số sê-ri:</span>
                      <span className="component-status-val" style={{ fontSize: '0.75rem' }}>
                        {status.components.signing.serial || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Nhận dạng ký tự (OCR Engine) */}
                <div className="component-status-card">
                  <div className="component-status-header">
                    <div className="component-status-title">
                      <Eye size={17} style={{ color: '#6366f1' }} />
                      <span>Nhận dạng OCR</span>
                    </div>
                    {getStatusBadge(status.components.ocr.status)}
                  </div>
                  <div className="component-status-body">
                    <div className="component-status-row">
                      <span className="component-status-key">Bộ nhận dạng:</span>
                      <span className="component-status-val">
                        {status.components.ocr.version || 'Tesseract OCR'}
                      </span>
                    </div>
                    <div className="component-status-row">
                      <span className="component-status-key">Vai trò luồng:</span>
                      <span className="component-status-val">Dịch vụ bổ trợ (Không chặn tiến trình chính)</span>
                    </div>
                  </div>
                </div>

                {/* 6. Hệ thống thông báo (Notifications & WebSocket) */}
                <div className="component-status-card">
                  <div className="component-status-header">
                    <div className="component-status-title">
                      <Bell size={17} style={{ color: '#ec4899' }} />
                      <span>Thông báo & Kết nối</span>
                    </div>
                    {getStatusBadge(status.components.notifications.status)}
                  </div>
                  <div className="component-status-body">
                    <div className="component-status-row">
                      <span className="component-status-key">Kênh đẩy trực tiếp:</span>
                      <span className="component-status-val">WebSocket STOMP / SockJS</span>
                    </div>
                    <div className="component-status-row">
                      <span className="component-status-key">Lưu trữ sự kiện:</span>
                      <span className="component-status-val">PostgreSQL Database</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. TECHNICAL METRICS & DIAGNOSTICS (COLLAPSIBLE ACCORDIONS) */}
            {metrics && (
              <div>
                <h2
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--color-text-main)',
                    marginBottom: '1rem',
                  }}
                >
                  Thông số kỹ thuật chi tiết
                </h2>

                {/* Accordion 1: JVM Heap Memory */}
                <div className="ent-accordion">
                  <button
                    type="button"
                    className="ent-accordion-header"
                    onClick={() => toggleAccordion('memory')}
                    aria-expanded={openAccordions.memory}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Cpu size={17} style={{ color: 'var(--color-primary)' }} />
                      <span>Phân bổ bộ nhớ JVM Heap</span>
                    </div>
                    {openAccordions.memory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {openAccordions.memory && (
                    <div className="ent-accordion-body">
                      <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                        Đang sử dụng:{' '}
                        <strong>{((metrics.memory?.usedMb) ?? 0).toLocaleString('vi-VN')} MB</strong> /{' '}
                        {((metrics.memory?.totalMb) ?? 0).toLocaleString('vi-VN')} MB (Tối đa cấu hình:{' '}
                        <strong>{((metrics.memory?.maxMb) ?? 0).toLocaleString('vi-VN')} MB</strong>)
                      </div>
                      <div
                        style={{
                          height: '10px',
                          backgroundColor: 'var(--color-border)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (((metrics.memory?.usedMb) ?? 0) / Math.max(1, (metrics.memory?.maxMb) ?? 1)) * 100
                              )
                            )}%`,
                            height: '100%',
                            backgroundColor:
                              ((metrics.memory?.usedMb) ?? 0) / Math.max(1, (metrics.memory?.maxMb) ?? 1) > 0.85
                                ? 'var(--color-danger)'
                                : 'var(--color-primary)',
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <span>0 MB</span>
                        <span>
                          Tỷ lệ sử dụng:{' '}
                          {Math.round((((metrics.memory?.usedMb) ?? 0) / Math.max(1, (metrics.memory?.maxMb) ?? 1)) * 100)}%
                        </span>
                        <span>{((metrics.memory?.maxMb) ?? 0).toLocaleString('vi-VN')} MB</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 2: Business Entity Volume */}
                <div className="ent-accordion">
                  <button
                    type="button"
                    className="ent-accordion-header"
                    onClick={() => toggleAccordion('entities')}
                    aria-expanded={openAccordions.entities}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Layers size={17} style={{ color: '#10b981' }} />
                      <span>Quy mô dữ liệu nghiệp vụ lưu trữ</span>
                    </div>
                    {openAccordions.entities ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {openAccordions.entities && (
                    <div className="ent-accordion-body">
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '1rem',
                        }}
                      >
                        <div
                          style={{
                            padding: '1rem',
                            backgroundColor: 'var(--color-card-muted)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <FileText size={14} />
                            <span>Tài liệu</span>
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                            {((metrics.businessCounts?.documents) ?? 0).toLocaleString('vi-VN')}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '1rem',
                            backgroundColor: 'var(--color-card-muted)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <Layers size={14} />
                            <span>Phiên bản tài liệu</span>
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                            {((metrics.businessCounts?.versions) ?? 0).toLocaleString('vi-VN')}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '1rem',
                            backgroundColor: 'var(--color-card-muted)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <Inbox size={14} />
                            <span>Hàng đợi chờ duyệt</span>
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                            {((metrics.businessCounts?.pendingReviews) ?? 0).toLocaleString('vi-VN')}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '1rem',
                            backgroundColor: 'var(--color-card-muted)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <Trash2 size={14} />
                            <span>Hàng đợi tiêu hủy</span>
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                            {((metrics.businessCounts?.pendingDispositions) ?? 0).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 3: Raw JSON Diagnostic Probes */}
                <div className="ent-accordion">
                  <button
                    type="button"
                    className="ent-accordion-header"
                    onClick={() => toggleAccordion('diagnostics')}
                    aria-expanded={openAccordions.diagnostics}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Info size={17} style={{ color: 'var(--color-text-muted)' }} />
                      <span>Dữ liệu chẩn đoán thô (JSON Diagnostics)</span>
                    </div>
                    {openAccordions.diagnostics ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {openAccordions.diagnostics && (
                    <div className="ent-accordion-body">
                      <pre
                        style={{
                          backgroundColor: 'var(--color-card-muted)',
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          color: 'var(--color-text-main)',
                          overflowX: 'auto',
                          margin: 0,
                          lineHeight: 1.45,
                        }}
                      >
                        {JSON.stringify({ status, metrics }, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default SystemStatusPage;
