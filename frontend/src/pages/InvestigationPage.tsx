import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  investigationApi,
  InvestigationCaseItem,
  InvestigationSummary,
  InvestigationEvidenceItem,
  InvestigationEventItem,
  InvestigationFindingItem,
  VersionDiffResult,
  InvestigationStatus,
  InvestigationSeverity,
  InvestigationReason
} from '../api/investigationApi';
import {
  Search,
  Plus,
  FileText,
  ShieldAlert,
  Lock,
  Download,
  Eye,
  RefreshCw,
  GitCompare,
  History,
  X,
  CheckCircle,
  FileCheck
} from 'lucide-react';

export const InvestigationPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  // Data states
  const [cases, setCases] = useState<InvestigationCaseItem[]>([]);
  const [summary, setSummary] = useState<InvestigationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Case Detail Drawer
  const [selectedCase, setSelectedCase] = useState<InvestigationCaseItem | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'diff' | 'timeline' | 'conclusion'>('evidence');

  // Detail sub-states
  const [evidenceList, setEvidenceList] = useState<InvestigationEvidenceItem[]>([]);
  const [timeline, setTimeline] = useState<InvestigationEventItem[]>([]);
  const [findings, setFindings] = useState<InvestigationFindingItem[]>([]);
  const [diffResult, setDiffResult] = useState<VersionDiffResult | null>(null);
  const [diffVersionA, setDiffVersionA] = useState<number>(1);
  const [diffVersionB, setDiffVersionB] = useState<number>(2);
  const [diffLoading, setDiffLoading] = useState<boolean>(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [showFindingModal, setShowFindingModal] = useState<boolean>(false);

  // Form states
  const [createForm, setCreateForm] = useState<{
    title: string;
    description: string;
    reason: InvestigationReason;
    severity: InvestigationSeverity;
    assignedTo: string;
    dueDate: string;
    targetDocumentId: string;
  }>({
    title: '',
    description: '',
    reason: 'OTHER',
    severity: 'MEDIUM',
    assignedTo: user?.username || 'admin',
    dueDate: '',
    targetDocumentId: ''
  });

  const [evidenceForm, setEvidenceForm] = useState<{
    documentId: string;
    versionNumber: string;
    notes: string;
    applyLegalHold: boolean;
  }>({
    documentId: '',
    versionNumber: '1',
    notes: '',
    applyLegalHold: true
  });

  const [findingForm, setFindingForm] = useState<{
    title: string;
    details: string;
    category: string;
  }>({
    title: '',
    details: '',
    category: 'Bất thường phiên bản'
  });

  const [conclusionText, setConclusionText] = useState<string>('');
  const [statusChangeNote, setStatusChangeNote] = useState<string>('');

  // Load cases and summary
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [caseData, sumData] = await Promise.all([
        investigationApi.listCases({
          status: statusFilter !== 'ALL' ? (statusFilter as InvestigationStatus) : undefined,
          severity: severityFilter !== 'ALL' ? (severityFilter as InvestigationSeverity) : undefined,
          search: searchTerm.trim() ? searchTerm.trim() : undefined
        }),
        investigationApi.getSummary()
      ]);
      setCases(caseData);
      setSummary(sumData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách hồ sơ điều tra');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load details when a case is selected
  const loadCaseDetails = useCallback(async (c: InvestigationCaseItem) => {
    try {
      const [evs, tl, fnds] = await Promise.all([
        investigationApi.listEvidence(c.id),
        investigationApi.getTimeline(c.id),
        investigationApi.listFindings(c.id)
      ]);
      setEvidenceList(evs);
      setTimeline(tl);
      setFindings(fnds);
      setConclusionText(c.conclusion || '');

      // Preload diff if targetDocumentId exists and evidence has versions
      if (c.targetDocumentId) {
        setEvidenceForm(prev => ({ ...prev, documentId: String(c.targetDocumentId) }));
        if (evs.length >= 2) {
          setDiffVersionA(evs[evs.length - 1].versionNumber);
          setDiffVersionB(evs[0].versionNumber);
          fetchDiff(c.targetDocumentId, evs[evs.length - 1].versionNumber, evs[0].versionNumber);
        } else if (evs.length === 1) {
          setDiffVersionA(1);
          setDiffVersionB(evs[0].versionNumber);
        }
      }
    } catch (err) {
      console.error('Error loading case details:', err);
    }
  }, []);

  const handleSelectCase = (c: InvestigationCaseItem) => {
    setSelectedCase(c);
    loadCaseDetails(c);
  };

  const fetchDiff = async (docId: number, vA: number, vB: number) => {
    try {
      setDiffLoading(true);
      const result = await investigationApi.computeDiff(docId, vA, vB);
      setDiffResult(result);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể tính toán khác biệt phiên bản');
      setDiffResult(null);
    } finally {
      setDiffLoading(false);
    }
  };

  // Actions
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await investigationApi.createCase({
        title: createForm.title,
        description: createForm.description,
        reason: createForm.reason,
        severity: createForm.severity,
        assignedTo: createForm.assignedTo,
        dueDate: createForm.dueDate ? new Date(createForm.dueDate).toISOString() : undefined,
        targetDocumentId: createForm.targetDocumentId ? Number(createForm.targetDocumentId) : undefined
      });
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        reason: 'OTHER',
        severity: 'MEDIUM',
        assignedTo: user?.username || 'admin',
        dueDate: '',
        targetDocumentId: ''
      });
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi tạo hồ sơ điều tra');
    }
  };

  const handlePreserveEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      await investigationApi.preserveEvidence(selectedCase.id, {
        documentId: Number(evidenceForm.documentId),
        versionNumber: Number(evidenceForm.versionNumber),
        notes: evidenceForm.notes,
        applyLegalHold: evidenceForm.applyLegalHold
      });
      setShowEvidenceModal(false);
      setEvidenceForm({ documentId: '', versionNumber: '1', notes: '', applyLegalHold: true });
      loadCaseDetails(selectedCase);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi bảo toàn chứng cứ');
    }
  };

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      await investigationApi.addFinding(selectedCase.id, {
        title: findingForm.title,
        details: findingForm.details,
        category: findingForm.category
      });
      setShowFindingModal(false);
      setFindingForm({ title: '', details: '', category: 'Bất thường phiên bản' });
      loadCaseDetails(selectedCase);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi thêm phát hiện');
    }
  };

  const handleStatusChange = async (newStatus: InvestigationStatus) => {
    if (!selectedCase) return;
    try {
      const updated = await investigationApi.updateStatus(selectedCase.id, newStatus, statusChangeNote);
      setSelectedCase(updated);
      setStatusChangeNote('');
      loadCaseDetails(updated);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể đổi trạng thái');
    }
  };

  const handleSubmitConclusion = async () => {
    if (!selectedCase || !conclusionText.trim()) {
      alert('Vui lòng nhập nội dung kết luận trước khi trình duyệt');
      return;
    }
    try {
      const updated = await investigationApi.submitConclusion(selectedCase.id, conclusionText);
      setSelectedCase(updated);
      alert('Đã trình kết luận điều tra sang cấp quản trị xét duyệt.');
      loadCaseDetails(updated);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi trình kết luận');
    }
  };

  const handleApproveConclusion = async () => {
    if (!selectedCase) return;
    if (!window.confirm('Xác nhận phê duyệt kết luận điều tra và chính thức ĐÓNG hồ sơ?')) return;
    try {
      const updated = await investigationApi.approveConclusion(selectedCase.id);
      setSelectedCase(updated);
      alert('Đã phê duyệt kết luận và đóng hồ sơ điều tra thành công.');
      loadCaseDetails(updated);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi phê duyệt kết luận');
    }
  };

  const handleExportManifest = async () => {
    if (!selectedCase) return;
    try {
      const blob = await investigationApi.exportManifest(selectedCase.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manifest-${selectedCase.caseNumber}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Không thể xuất biên bản toàn vẹn');
    }
  };

  // Badges & render helpers
  const getSeverityBadge = (s: InvestigationSeverity) => {
    switch (s) {
      case 'CRITICAL':
        return <span className="ent-badge ent-badge--danger">Nghiêm trọng</span>;
      case 'HIGH':
        return <span className="ent-badge ent-badge--warning">Cao</span>;
      case 'MEDIUM':
        return <span className="ent-badge ent-badge--info">Trung bình</span>;
      case 'LOW':
      default:
        return <span className="ent-badge ent-badge--neutral">Thấp</span>;
    }
  };

  const getStatusBadge = (st: InvestigationStatus) => {
    switch (st) {
      case 'OPEN':
        return <span className="ent-badge ent-badge--info">Mới mở</span>;
      case 'INVESTIGATING':
        return <span className="ent-badge ent-badge--warning">Đang điều tra</span>;
      case 'REVIEW_PENDING':
        return <span className="ent-badge ent-badge--purple">Chờ duyệt kết luận</span>;
      case 'CLOSED':
        return <span className="ent-badge ent-badge--success">Đã đóng</span>;
      case 'REOPENED':
        return <span className="ent-badge ent-badge--danger">Mở lại</span>;
    }
  };

  return (
    <div className="app-container">
      <Navbar currentView="investigations" />

      <main className="main-content" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={26} className="text-primary" />
              Điều tra sai lệch tài liệu (Document Investigation)
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
              Bảo toàn chứng cứ SHA-256, so sánh khác biệt phiên bản và quản lý hồ sơ điều tra gian lận/sai lệch
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadData}
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
              <Plus size={16} /> Mở hồ sơ điều tra mới
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        {summary && (
          <div className="dash-stats-grid" style={{ marginBottom: '24px' }}>
            <div className="dash-stat-card">
              <div className="dash-stat-label">Tổng hồ sơ</div>
              <div className="dash-stat-value">{summary.total}</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-label">Đang điều tra</div>
              <div className="dash-stat-value" style={{ color: '#d97706' }}>{summary.investigating}</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-label">Chờ duyệt kết luận</div>
              <div className="dash-stat-value" style={{ color: '#7c3aed' }}>{summary.reviewPending}</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-label">Đã đóng</div>
              <div className="dash-stat-value" style={{ color: '#16a34a' }}>{summary.closed}</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-label">Quá hạn / Khẩn cấp</div>
              <div className="dash-stat-value" style={{ color: '#dc2626' }}>{summary.overdue + summary.critical}</div>
            </div>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="ent-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Tìm theo mã INV, tiêu đề, tài liệu..."
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
              <option value="OPEN">Mới mở (OPEN)</option>
              <option value="INVESTIGATING">Đang điều tra</option>
              <option value="REVIEW_PENDING">Chờ duyệt kết luận</option>
              <option value="CLOSED">Đã đóng</option>
              <option value="REOPENED">Mở lại</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Mức độ:</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="form-control"
              style={{ width: '140px' }}
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="CRITICAL">Nghiêm trọng</option>
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>
          </div>
        </div>

        {/* Cases Table */}
        <div className="ent-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách hồ sơ điều tra...</div>
          ) : error ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#dc2626' }}>{error}</div>
          ) : cases.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
              <ShieldAlert size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Chưa có hồ sơ điều tra nào phù hợp bộ lọc.</p>
            </div>
          ) : (
            <table className="ent-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Mã hồ sơ</th>
                  <th>Tiêu đề & Tài liệu</th>
                  <th>Mức độ</th>
                  <th>Phụ trách</th>
                  <th>Hạn xử lý</th>
                  <th>Chứng cứ / Phát hiện</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => handleSelectCase(c)}>
                    <td style={{ fontWeight: 600, color: 'var(--color-navy)' }}>
                      {c.caseNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.title}</div>
                      {c.targetDocumentTitle && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={12} /> {c.targetDocumentTitle}
                        </div>
                      )}
                    </td>
                    <td>{getSeverityBadge(c.severity)}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {c.assignedTo === 'admin' || c.assignedTo === 'hieu' ? 'Quản trị viên' : (c.assignedTo === 'tin' ? 'Chuyên viên giám định' : (c.assignedTo ? 'Chuyên viên xử lý' : 'Chưa phân công'))}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Yêu cầu: {c.createdBy === 'admin' || c.createdBy === 'hieu' ? 'Ban Quản trị' : 'Bộ phận Nghiệp vụ'}
                      </div>
                    </td>
                    <td>
                      {c.dueDate ? (
                        <span style={{ fontSize: '0.85rem', color: c.overdue ? '#dc2626' : 'inherit', fontWeight: c.overdue ? 600 : 'normal' }}>
                          {new Date(c.dueDate).toLocaleDateString('vi-VN')}
                          {c.overdue && ' (Quá hạn)'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Không có</span>
                      )}
                    </td>
                    <td>
                      <span className="ent-badge ent-badge--neutral">
                        {c.evidenceCount} chứng cứ • {c.findingsCount} phát hiện
                      </span>
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectCase(c);
                        }}
                      >
                        <Eye size={14} style={{ marginRight: '4px' }} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Case Detail Drawer / Modal */}
        {selectedCase && (
          <div className="ent-modal-overlay" style={{ zIndex: 1100 }}>
            <div className="ent-modal ent-modal--xl" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
              <div className="ent-modal__header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                      {selectedCase.caseNumber} : {selectedCase.title}
                    </span>
                    {getStatusBadge(selectedCase.status)}
                    {getSeverityBadge(selectedCase.severity)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Mục tiêu: {selectedCase.targetDocumentTitle || 'Không xác định'} | Phụ trách: {selectedCase.assignedTo === 'admin' || selectedCase.assignedTo === 'hieu' ? 'Quản trị viên' : (selectedCase.assignedTo === 'tin' ? 'Chuyên viên giám định' : (selectedCase.assignedTo ? 'Chuyên viên xử lý' : 'Chưa phân công'))} | Ngày mở: {new Date(selectedCase.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={handleExportManifest}
                    title="Xuất biên bản toàn vẹn JSON"
                  >
                    <Download size={14} /> Xuất biên bản
                  </button>
                  <button
                    type="button"
                    className="ent-modal__close-btn"
                    onClick={() => setSelectedCase(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Status Action Bar */}
              <div style={{ padding: '10px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>Chuyển trạng thái vụ việc:</span>
                  {selectedCase.status === 'OPEN' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleStatusChange('INVESTIGATING')}
                    >
                      Bắt đầu điều tra
                    </button>
                  )}
                  {selectedCase.status === 'INVESTIGATING' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setActiveTab('conclusion')}
                    >
                      Viết kết luận điều tra
                    </button>
                  )}
                  {selectedCase.status === 'CLOSED' && isAdmin && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleStatusChange('REOPENED')}
                    >
                      Mở lại hồ sơ (Reopen)
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {selectedCase.closedAt && (
                    <span>Đã đóng lúc: {new Date(selectedCase.closedAt).toLocaleString('vi-VN')}</span>
                  )}
                </div>
              </div>

              {/* Tabs Navigation */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 24px', backgroundColor: '#fff' }}>
                <button
                  type="button"
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    borderBottom: activeTab === 'evidence' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'none',
                    color: activeTab === 'evidence' ? 'var(--color-primary)' : '#64748b',
                    fontWeight: activeTab === 'evidence' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setActiveTab('evidence')}
                >
                  <Lock size={15} /> Chứng cứ & Toàn vẹn ({evidenceList.length})
                </button>
                <button
                  type="button"
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    borderBottom: activeTab === 'diff' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'none',
                    color: activeTab === 'diff' ? 'var(--color-primary)' : '#64748b',
                    fontWeight: activeTab === 'diff' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setActiveTab('diff')}
                >
                  <GitCompare size={15} /> So sánh phiên bản
                </button>
                <button
                  type="button"
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    borderBottom: activeTab === 'timeline' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'none',
                    color: activeTab === 'timeline' ? 'var(--color-primary)' : '#64748b',
                    fontWeight: activeTab === 'timeline' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setActiveTab('timeline')}
                >
                  <History size={15} /> Dòng thời gian ({timeline.length})
                </button>
                <button
                  type="button"
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    borderBottom: activeTab === 'conclusion' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'none',
                    color: activeTab === 'conclusion' ? 'var(--color-primary)' : '#64748b',
                    fontWeight: activeTab === 'conclusion' ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setActiveTab('conclusion')}
                >
                  <FileCheck size={15} /> Phát hiện ({findings.length}) & Kết luận
                </button>
              </div>

              {/* Tab 1: Evidence */}
              <div className="ent-modal__body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {activeTab === 'evidence' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                        Danh sách chứng cứ đã bảo toàn
                      </h3>
                      {selectedCase.status !== 'CLOSED' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowEvidenceModal(true)}
                        >
                          <Plus size={14} /> Bảo toàn chứng cứ mới
                        </button>
                      )}
                    </div>

                    {evidenceList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Chưa có chứng cứ nào được bảo toàn trong hồ sơ này.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {evidenceList.map(ev => (
                          <div
                            key={ev.id}
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '14px',
                              backgroundColor: '#fff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {ev.originalFileName} (Phiên bản v{ev.versionNumber})
                                </span>
                                {ev.legalHoldApplied && (
                                  <span className="ent-badge ent-badge--danger" style={{ marginLeft: '8px' }}>
                                    <Lock size={12} style={{ marginRight: '3px' }} /> Legal Hold Active
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Thu thập: {new Date(ev.collectedAt).toLocaleString('vi-VN')} bởi {ev.collectedBy}
                              </span>
                            </div>

                            <div style={{ marginTop: '8px', fontSize: '0.8rem', fontFamily: 'monospace', backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '4px', wordBreak: 'break-all' }}>
                              <strong>SHA-256:</strong> {ev.fileHash}
                            </div>

                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                              <div>Dung lượng: {(ev.fileSize / 1024).toFixed(1)} KB | Loại: {ev.contentType || 'N/A'}</div>
                              {ev.notes && <div><em>Ghi chú: {ev.notes}</em></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Diff */}
                {activeTab === 'diff' && (
                  <div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                          Phiên bản gốc (A):
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={diffVersionA}
                          onChange={e => setDiffVersionA(Number(e.target.value))}
                          style={{ width: '100px' }}
                          min={1}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                          Phiên bản so sánh (B):
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={diffVersionB}
                          onChange={e => setDiffVersionB(Number(e.target.value))}
                          style={{ width: '100px' }}
                          min={1}
                        />
                      </div>
                      <div style={{ alignSelf: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            if (selectedCase.targetDocumentId) {
                              fetchDiff(selectedCase.targetDocumentId, diffVersionA, diffVersionB);
                            }
                          }}
                          disabled={diffLoading || !selectedCase.targetDocumentId}
                        >
                          <GitCompare size={14} style={{ marginRight: '6px' }} /> So sánh khác biệt
                        </button>
                      </div>
                    </div>

                    {diffLoading ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang so sánh hai phiên bản...</div>
                    ) : diffResult ? (
                      <div>
                        {/* Summary metadata card */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: diffResult.hashMatch ? '#f0fdf4' : '#fef2f2' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Toàn vẹn SHA-256</div>
                            <div style={{ fontWeight: 600, color: diffResult.hashMatch ? '#16a34a' : '#dc2626' }}>
                              {diffResult.hashMatch ? 'Trùng khớp (Unchanged)' : 'Sai lệch phát hiện (Modified)'}
                            </div>
                          </div>
                          <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Thay đổi dung lượng</div>
                            <div style={{ fontWeight: 600 }}>
                              {diffResult.metaDiff.sizeDifferenceBytes > 0 ? `+${diffResult.metaDiff.sizeDifferenceBytes} bytes` : `${diffResult.metaDiff.sizeDifferenceBytes} bytes`}
                            </div>
                          </div>
                          <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Người tạo v{diffResult.versionA} / v{diffResult.versionB}</div>
                            <div style={{ fontWeight: 600 }}>
                              {diffResult.createdByA} / {diffResult.createdByB}
                            </div>
                          </div>
                        </div>

                        {/* Diff Lines Table */}
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          <div style={{ backgroundColor: '#f1f5f9', padding: '8px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 600 }}>
                            So sánh nội dung văn bản (v{diffResult.versionA} vs v{diffResult.versionB})
                          </div>
                          <div style={{ maxHeight: '420px', overflowY: 'auto', backgroundColor: '#fff' }}>
                            {diffResult.diffLines.map((line, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  padding: '2px 8px',
                                  backgroundColor:
                                    line.type === 'INSERT'
                                      ? '#dcfce7'
                                      : line.type === 'DELETE'
                                      ? '#fee2e2'
                                      : 'transparent',
                                  borderBottom: '1px solid #f8fafc'
                                }}
                              >
                                <span style={{ width: '40px', color: '#94a3b8', textAlign: 'right', paddingRight: '8px' }}>
                                  {line.lineNumberA || ''}
                                </span>
                                <span style={{ width: '40px', color: '#94a3b8', textAlign: 'right', paddingRight: '8px' }}>
                                  {line.lineNumberB || ''}
                                </span>
                                <span style={{ width: '20px', fontWeight: 700, color: line.type === 'INSERT' ? '#16a34a' : line.type === 'DELETE' ? '#dc2626' : '#94a3b8' }}>
                                  {line.type === 'INSERT' ? '+' : line.type === 'DELETE' ? '-' : ' '}
                                </span>
                                <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                  {line.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Nhấn nút "So sánh khác biệt" để phân tích nội dung giữa 2 phiên bản.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Timeline */}
                {activeTab === 'timeline' && (
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
                      Nhật ký sự kiện điều tra & Kiểm toán tài liệu
                    </h3>
                    <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e2e8f0', marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {timeline.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <div
                            style={{
                              position: 'absolute',
                              left: '-31px',
                              top: '2px',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: item.source === 'DOCUMENT_AUDIT' ? '#3b82f6' : '#10b981',
                              border: '2px solid #fff'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {item.eventType}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {new Date(item.timestamp).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px' }}>
                            {item.description}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            Bởi: <strong>{item.actor}</strong> • Nguồn: {item.source}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 4: Findings & Conclusion */}
                {activeTab === 'conclusion' && (
                  <div>
                    {/* Findings list */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                        Các phát hiện điều tra (Findings)
                      </h3>
                      {selectedCase.status !== 'CLOSED' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setShowFindingModal(true)}
                        >
                          <Plus size={14} /> Thêm phát hiện
                        </button>
                      )}
                    </div>

                    {findings.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '24px' }}>
                        Chưa ghi nhận phát hiện cụ thể nào.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                        {findings.map(f => (
                          <div key={f.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', backgroundColor: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 600 }}>{f.title}</span>
                              <span className="ent-badge ent-badge--neutral">{f.category || 'Chung'}</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '6px 0 0' }}>{f.details}</p>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
                              Báo cáo bởi {f.reportedBy} lúc {new Date(f.createdAt).toLocaleString('vi-VN')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0' }} />

                    {/* Conclusion Section */}
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
                        Kết luận chính thức của hồ sơ
                      </h3>
                      {selectedCase.status === 'CLOSED' ? (
                        <div style={{ padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                          <div style={{ fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <CheckCircle size={18} /> Hồ sơ đã được phê duyệt và đóng
                          </div>
                          <p style={{ whiteSpace: 'pre-wrap', color: '#1e293b', fontSize: '0.9rem' }}>
                            {selectedCase.conclusion}
                          </p>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>
                            Phê duyệt bởi: <strong>{selectedCase.conclusionApprovedBy}</strong> lúc {new Date(selectedCase.closedAt!).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <textarea
                            className="form-control"
                            rows={5}
                            placeholder="Nhập nội dung kết luận điều tra, trách nhiệm sai lệch và đề xuất biện pháp xử lý..."
                            value={conclusionText}
                            onChange={e => setConclusionText(e.target.value)}
                          />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleSubmitConclusion}
                            >
                              Trình kết luận sang cấp xét duyệt
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleApproveConclusion}
                                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                              >
                                <CheckCircle size={15} style={{ marginRight: '6px' }} /> Phê duyệt kết luận & Đóng hồ sơ
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Case */}
        {showCreateModal && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--md">
              <div className="ent-modal__header">
                <h3 className="ent-modal__title">Mở hồ sơ điều tra mới</h3>
                <button type="button" className="ent-modal__close-btn" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateCase}>
                <div className="ent-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Tiêu đề hồ sơ điều tra *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="VD: Điều tra sai lệch điều khoản thanh toán Hợp đồng #338"
                      value={createForm.title}
                      onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Lý do mở điều tra *
                    </label>
                    <select
                      className="form-control"
                      value={createForm.reason}
                      onChange={e => setCreateForm({ ...createForm, reason: e.target.value as InvestigationReason })}
                    >
                      <option value="PAYMENT_TERMS_DISCREPANCY">Sai lệch điều khoản thanh toán</option>
                      <option value="UNAUTHORIZED_MODIFICATION">Chỉnh sửa ngoài quy trình</option>
                      <option value="HASH_MISMATCH">Sai lệch mã băm SHA-256</option>
                      <option value="VDR_SECURITY_ALERT">Cảnh báo bảo mật Virtual Data Room</option>
                      <option value="COMPLIANCE_AUDIT">Kiểm toán tuân thủ định kỳ</option>
                      <option value="OTHER">Lý do khác</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                        Mức độ nghiêm trọng *
                      </label>
                      <select
                        className="form-control"
                        value={createForm.severity}
                        onChange={e => setCreateForm({ ...createForm, severity: e.target.value as InvestigationSeverity })}
                      >
                        <option value="LOW">Thấp (Low)</option>
                        <option value="MEDIUM">Trung bình (Medium)</option>
                        <option value="HIGH">Cao (High)</option>
                        <option value="CRITICAL">Nghiêm trọng (Critical)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                        Người phụ trách *
                      </label>
                      <select
                        className="form-control"
                        required
                        value={createForm.assignedTo}
                        onChange={e => setCreateForm({ ...createForm, assignedTo: e.target.value })}
                      >
                        <option value="tin">Chuyên viên giám định (tin)</option>
                        <option value="hieu">Quản trị viên pháp chế (hieu)</option>
                        <option value="admin">Quản trị viên an ninh (admin)</option>
                        <option value="user">Chuyên viên phối hợp (user)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                        Mã tài liệu mục tiêu (Document ID)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="VD: 338"
                        value={createForm.targetDocumentId}
                        onChange={e => setCreateForm({ ...createForm, targetDocumentId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                        Hạn hoàn thành
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={createForm.dueDate}
                        onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Mô tả chi tiết sự việc
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Mô tả dấu hiệu sai lệch, nguồn tin hoặc bằng chứng ban đầu..."
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
                    Khởi tạo hồ sơ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Preserve Evidence */}
        {showEvidenceModal && selectedCase && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--md">
              <div className="ent-modal__header">
                <h3 className="ent-modal__title">Bảo toàn chứng cứ mới</h3>
                <button type="button" className="ent-modal__close-btn" onClick={() => setShowEvidenceModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handlePreserveEvidence}>
                <div className="ent-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                        Mã tài liệu (Document ID) *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        value={evidenceForm.documentId}
                        onChange={e => setEvidenceForm({ ...evidenceForm, documentId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                        Số phiên bản (Version Number) *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        min={1}
                        value={evidenceForm.versionNumber}
                        onChange={e => setEvidenceForm({ ...evidenceForm, versionNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Ghi chú chứng cứ
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="VD: Phiên bản hợp đồng có điều khoản thanh toán 7 ngày bị nghi sửa đổi trái phép"
                      value={evidenceForm.notes}
                      onChange={e => setEvidenceForm({ ...evidenceForm, notes: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      id="applyLegalHoldCheck"
                      checked={evidenceForm.applyLegalHold}
                      onChange={e => setEvidenceForm({ ...evidenceForm, applyLegalHold: e.target.checked })}
                    />
                    <label htmlFor="applyLegalHoldCheck" style={{ fontSize: '0.85rem', color: '#991b1b', cursor: 'pointer', margin: 0 }}>
                      <strong>Kích hoạt Legal Hold:</strong> Ngăn chặn hoàn toàn việc tiêu hủy tài liệu qua hàng đợi tiêu hủy cho đến khi kết thúc điều tra.
                    </label>
                  </div>
                </div>
                <div className="ent-modal__footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEvidenceModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Bảo toàn chứng cứ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Finding */}
        {showFindingModal && selectedCase && (
          <div className="ent-modal-overlay">
            <div className="ent-modal ent-modal--md">
              <div className="ent-modal__header">
                <h3 className="ent-modal__title">Ghi nhận phát hiện điều tra</h3>
                <button type="button" className="ent-modal__close-btn" onClick={() => setShowFindingModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddFinding}>
                <div className="ent-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Tiêu đề phát hiện *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="VD: Phát hiện thời hạn thanh toán bị sửa từ 30 ngày thành 7 ngày tại v2"
                      value={findingForm.title}
                      onChange={e => setFindingForm({ ...findingForm, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Phân loại phát hiện
                    </label>
                    <select
                      className="form-control"
                      value={findingForm.category}
                      onChange={e => setFindingForm({ ...findingForm, category: e.target.value })}
                    >
                      <option value="Bất thường phiên bản">Bất thường phiên bản</option>
                      <option value="Sai lệch SHA-256">Sai lệch SHA-256</option>
                      <option value="Truy cập trái phép">Truy cập trái phép</option>
                      <option value="Chữ ký không hợp lệ">Chữ ký không hợp lệ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                      Chi tiết chứng minh & Diễn giải *
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      required
                      placeholder="Trình bày các căn cứ, dòng diff, thời điểm tải tệp hoặc tài khoản liên quan..."
                      value={findingForm.details}
                      onChange={e => setFindingForm({ ...findingForm, details: e.target.value })}
                    />
                  </div>
                </div>
                <div className="ent-modal__footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowFindingModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Lưu phát hiện
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
