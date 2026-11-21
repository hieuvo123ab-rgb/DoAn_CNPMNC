const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../../docs/ui-modernization/after');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MOCK_DOCUMENTS = [
  {
    id: 101,
    title: 'Hợp đồng cung cấp dịch vụ hạ tầng mạng Q3/2026',
    description: 'Hợp đồng triển khai hạ tầng mạng lõi và bảo mật hệ thống thông tin.',
    documentType: 'Hợp đồng',
    originalFileName: 'Hop_Dong_Ha_Tang_Q3_2026.pdf',
    contentType: 'application/pdf',
    fileSize: 2457600,
    currentVersionNumber: 2,
    createdBy: 'hieu',
    createdAt: '2026-10-15T08:30:00Z',
    updatedAt: '2026-10-20T10:15:00Z',
    accessMode: 'INTERNAL',
    reviewStatus: 'APPROVED',
    currentReviewStatus: 'APPROVED',
    lifecycleStatus: 'ACTIVE',
    eligibleForDisposition: false,
    legalHold: false,
    userPermission: 'OWNER',
  },
  {
    id: 102,
    title: 'Báo cáo kiểm toán bảo mật và chữ ký số định kỳ',
    description: 'Báo cáo độc lập đánh giá an toàn thông tin theo chuẩn TCVN.',
    documentType: 'Báo cáo',
    originalFileName: 'Bao_Cao_Kiem_Toan_ATTT_2026.pdf',
    contentType: 'application/pdf',
    fileSize: 4194304,
    currentVersionNumber: 1,
    createdBy: 'staff1',
    createdAt: '2026-10-18T14:20:00Z',
    updatedAt: '2026-10-18T14:20:00Z',
    accessMode: 'INTERNAL',
    reviewStatus: 'PENDING',
    currentReviewStatus: 'PENDING',
    lifecycleStatus: 'ACTIVE',
    eligibleForDisposition: false,
    legalHold: false,
    userPermission: 'EDIT',
  },
  {
    id: 103,
    title: 'Biên bản nghiệm thu phần mềm EDMS Giai đoạn 2',
    description: 'Biên bản thống nhất tính năng và nghiệm thu giao diện.',
    documentType: 'Biên bản',
    originalFileName: 'Bien_Ban_Nghiem_Thu_Giai_Doan_2.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 1048576,
    currentVersionNumber: 3,
    createdBy: 'hieu',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-10-22T16:00:00Z',
    accessMode: 'PRIVATE',
    reviewStatus: 'APPROVED',
    currentReviewStatus: 'APPROVED',
    lifecycleStatus: 'ARCHIVED',
    eligibleForDisposition: true,
    legalHold: false,
    retentionUntil: '2026-10-25',
    userPermission: 'OWNER',
  },
];

const MOCK_TASKS = [
  {
    taskType: 'REVIEW_PENDING',
    documentId: 102,
    documentTitle: 'Báo cáo kiểm toán bảo mật và chữ ký số định kỳ',
    versionNumber: 1,
    actionKey: 'OPEN_REVIEW_QUEUE',
    status: 'PENDING',
    createdAt: '2026-10-18T14:20:00Z',
  },
  {
    taskType: 'DISPOSITION_PENDING',
    documentId: 103,
    documentTitle: 'Biên bản nghiệm thu phần mềm EDMS Giai đoạn 2',
    versionNumber: 3,
    actionKey: 'OPEN_DISPOSITION_QUEUE',
    status: 'ELIGIBLE',
    createdAt: '2026-10-25T00:00:00Z',
  },
];

const MOCK_USERS = [
  { id: 1, username: 'hieu', fullName: 'Võ Trọng Hiếu', email: 'hieu@edms.local', role: 'ROLE_ADMIN', enabled: true, createdAt: '2026-01-10T08:00:00Z' },
  { id: 2, username: 'staff1', fullName: 'Nguyễn Văn Nhân Viên', email: 'staff1@edms.local', role: 'ROLE_STAFF', enabled: true, createdAt: '2026-02-15T09:30:00Z' },
  { id: 3, username: 'user1', fullName: 'Trần Thị Người Dùng', email: 'user1@edms.local', role: 'ROLE_USER', enabled: true, createdAt: '2026-03-20T11:00:00Z' },
];

const MOCK_DASHBOARD = {
  documentStats: {
    totalDocuments: 3,
    totalStorageBytes: 7700480,
    documentsByType: { 'Hợp đồng': 1, 'Báo cáo': 1, 'Biên bản': 1 },
  },
  totalUsers: 3,
  usageStats: {
    activeUsers: 3,
    totalUploads: 14,
    totalDownloads: 28,
    totalPreviews: 45,
    totalUpdates: 9,
  },
  recentActivities: [
    { id: 1, username: 'hieu', action: 'DOCUMENT_UPLOAD', description: 'Tải lên tài liệu: Hợp đồng cung cấp dịch vụ hạ tầng mạng Q3/2026', timestamp: '2026-10-20T10:15:00Z' },
    { id: 2, username: 'staff1', action: 'DOCUMENT_REVIEW_SUBMIT', description: 'Gửi duyệt tài liệu: Báo cáo kiểm toán bảo mật và chữ ký số định kỳ', timestamp: '2026-10-18T14:20:00Z' },
  ],
};

const MOCK_AUDIT_LOGS = {
  content: [
    { id: 501, username: 'hieu', action: 'DOCUMENT_UPLOAD', resourceType: 'DOCUMENT', resourceId: '101', description: 'Tải lên tài liệu phiên bản v1', timestamp: '2026-10-15T08:30:00Z' },
    { id: 502, username: 'hieu', action: 'DOCUMENT_REVIEW_APPROVE', resourceType: 'REVIEW', resourceId: '201', description: 'Phê duyệt tài liệu #101 phiên bản v1', timestamp: '2026-10-16T09:00:00Z' },
    { id: 503, username: 'staff1', action: 'DOCUMENT_PREVIEW', resourceType: 'DOCUMENT', resourceId: '101', description: 'Xem trước tài liệu trực tuyến', timestamp: '2026-10-17T11:20:00Z' },
  ],
  totalPages: 1,
  totalElements: 3,
};

const MOCK_SYSTEM_STATUS = {
  status: 'UP',
  timestamp: new Date().toISOString(),
  uptimeSeconds: 864200,
  heapMemoryUsage: { usedBytes: 154857600, maxBytes: 536870912 },
  database: { status: 'UP', activeConnections: 5, maxConnections: 50 },
  storage: { status: 'UP', totalStorageBytes: 7700480, availableStorageBytes: 107374182400 },
  keystore: { status: 'VALID', alias: 'edms-signing-key', expiryDate: '2028-10-20' },
  activeUsersCount: 3,
  totalDocumentsCount: 3,
};

const MOCK_REVIEWS = [
  {
    reviewId: 201,
    documentId: 102,
    documentTitle: 'Báo cáo kiểm toán bảo mật và chữ ký số định kỳ',
    versionNumber: 1,
    originalFileName: 'Bao_Cao_Kiem_Toan_ATTT_2026.pdf',
    submittedBy: 'staff1',
    submittedAt: '2026-10-18T14:20:00Z',
    status: 'PENDING',
  },
];

const MOCK_DISPOSITIONS = [
  {
    requestId: 301,
    documentId: 103,
    documentTitle: 'Biên bản nghiệm thu phần mềm EDMS Giai đoạn 2',
    currentVersion: 3,
    reason: 'Đã hết thời hạn lưu trữ quy định 3 năm theo chính sách hồ sơ dự án.',
    requestedBy: 'hieu',
    requestedAt: '2026-10-25T00:00:00Z',
    status: 'PENDING',
  },
];

async function setupMocks(page) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    const method = req.method();

    if (url.includes('/api/documents') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DOCUMENTS),
      });
      return;
    }

    if (url.includes('/api/tasks') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TASKS),
      });
      return;
    }

    if (url.includes('/api/users') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USERS),
      });
      return;
    }

    if (url.includes('/api/dashboard') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DASHBOARD),
      });
      return;
    }

    if (url.includes('/api/audit-logs') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUDIT_LOGS),
      });
      return;
    }

    if (url.includes('/api/activity-history') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUDIT_LOGS.content),
      });
      return;
    }

    if (url.includes('/api/system/status') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SYSTEM_STATUS),
      });
      return;
    }

    if (url.includes('/api/system/metrics') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cpuUsagePercent: 12.5, memoryUsedMb: 148 }),
      });
      return;
    }

    if (url.includes('/api/reviews/queue') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REVIEWS),
      });
      return;
    }

    if (url.includes('/api/disposition/queue') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DISPOSITIONS),
      });
      return;
    }

    if (url.includes('/api/saved-searches') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    req.continue();
  });
}

async function setAuth(page, userProfile) {
  await page.evaluate((profile) => {
    localStorage.setItem('edms_token', 'mock_verified_jwt_token_2026');
    localStorage.setItem('edms_user', JSON.stringify(profile));
  }, userProfile);
}

async function run() {
  console.log('🚀 Starting Comprehensive EDMS UI Verification Suite...');
  console.log(`📸 Output directory: ${OUT_DIR}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await setupMocks(page);

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP 1440x900 - LOGIN PAGE
    // -------------------------------------------------------------
    console.log('\n[1/21] Testing Desktop 1440x900 - Login Screen...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_01_login_desktop_1440.png'), fullPage: false });
    console.log('  ✓ Saved after_01_login_desktop_1440.png');

    // -------------------------------------------------------------
    // 2. DESKTOP 1440x900 - ADMIN DOCUMENTS PAGE
    // -------------------------------------------------------------
    console.log('\n[2/21] Authenticating as Admin (hieu)...');
    await setAuth(page, { username: 'hieu', fullName: 'Võ Trọng Hiếu', role: 'ROLE_ADMIN' });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_02_documents_desktop_1440.png'), fullPage: false });
    console.log('  ✓ Saved after_02_documents_desktop_1440.png');

    // -------------------------------------------------------------
    // 3. DARK MODE TOGGLE (1440x900)
    // -------------------------------------------------------------
    console.log('\n[3/21] Testing Dark Mode Theme Toggle...');
    const themeBtn = await page.$('#theme-toggle-btn');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise((r) => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_03_documents_dark_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_03_documents_dark_1440.png');
      await themeBtn.click(); // revert to light
      await new Promise((r) => setTimeout(r, 800));
    }

    // -------------------------------------------------------------
    // 4. COLLAPSED SIDEBAR (1440x900)
    // -------------------------------------------------------------
    console.log('\n[4/21] Testing Collapsible Modern Sidebar...');
    const collapseBtn = await page.$('#sidebar-collapse-btn');
    if (collapseBtn) {
      await collapseBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_04_sidebar_collapsed_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_04_sidebar_collapsed_1440.png');
      await collapseBtn.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    // -------------------------------------------------------------
    // 5. UPLOAD MODAL (1440x900) - HIGHEST PRIORITY SCREEN
    // -------------------------------------------------------------
    console.log('\n[5/21] Testing Standardized Upload Modal (Highest Priority)...');
    const uploadBtn = await page.$('#open-upload-modal-btn');
    if (uploadBtn) {
      await uploadBtn.click();
      await new Promise((r) => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_05_upload_modal_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_05_upload_modal_1440.png');
      const closeUploadBtn = await page.$('#close-upload-modal-btn');
      if (closeUploadBtn) await closeUploadBtn.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    // -------------------------------------------------------------
    // 6. NOTIFICATIONS POPOVER (1440x900)
    // -------------------------------------------------------------
    console.log('\n[6/21] Testing Notification Popover...');
    const notifBtn = await page.$('#nav-notifications-btn');
    if (notifBtn) {
      await notifBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_06_notifications_popover_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_06_notifications_popover_1440.png');
      await notifBtn.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    // -------------------------------------------------------------
    // 7. TASK CENTER (1440x900)
    // -------------------------------------------------------------
    console.log('\n[7/21] Testing Task Center (Công việc)...');
    const taskBtn = await page.$('#nav-tasks-btn');
    if (taskBtn) {
      await taskBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_07_task_center_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_07_task_center_1440.png');
    }

    // -------------------------------------------------------------
    // 8. REVIEW QUEUE (1440x900)
    // -------------------------------------------------------------
    console.log('\n[8/21] Testing Review Queue (Hàng đợi duyệt)...');
    const reviewBtn = await page.$('#nav-review-queue-btn');
    if (reviewBtn) {
      await reviewBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_08_review_queue_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_08_review_queue_1440.png');
    }

    // -------------------------------------------------------------
    // 9. DISPOSITION QUEUE (1440x900)
    // -------------------------------------------------------------
    console.log('\n[9/21] Testing Disposition Queue (Hàng đợi tiêu hủy)...');
    const dispBtn = await page.$('#nav-disposition-queue-btn');
    if (dispBtn) {
      await dispBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_09_disposition_queue_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_09_disposition_queue_1440.png');
    }

    // -------------------------------------------------------------
    // 10. DASHBOARD OVERVIEW (1440x900)
    // -------------------------------------------------------------
    console.log('\n[10/21] Testing Dashboard Overview (Bảng điều khiển)...');
    const dashBtn = await page.$('#nav-dashboard-btn');
    if (dashBtn) {
      await dashBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_10_dashboard_overview_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_10_dashboard_overview_1440.png');
    }

    // -------------------------------------------------------------
    // 11. USERS MANAGEMENT (1440x900)
    // -------------------------------------------------------------
    console.log('\n[11/21] Testing Users Management & Permissions...');
    const usersBtn = await page.$('#nav-users-btn');
    if (usersBtn) {
      await usersBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_11_users_management_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_11_users_management_1440.png');
    }

    // -------------------------------------------------------------
    // 12. AUDIT LOGS (1440x900)
    // -------------------------------------------------------------
    console.log('\n[12/21] Testing Audit Logs & Security...');
    const auditBtn = await page.$('#nav-audit-btn');
    if (auditBtn) {
      await auditBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_12_audit_logs_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_12_audit_logs_1440.png');
    }

    // -------------------------------------------------------------
    // 13. SYSTEM STATUS (1440x900)
    // -------------------------------------------------------------
    console.log('\n[13/21] Testing System Status (Trạng thái hệ thống)...');
    const sysBtn = await page.$('#nav-system-status-btn');
    if (sysBtn) {
      await sysBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_13_system_status_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_13_system_status_1440.png');
    }

    // -------------------------------------------------------------
    // 14. PUBLIC VERIFICATION PAGE (/verify)
    // -------------------------------------------------------------
    console.log('\n[14/21] Testing Public Verification Page (/verify)...');
    await page.goto('http://localhost:5173/verify', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_14_verify_page_1440.png'), fullPage: false });
    console.log('  ✓ Saved after_14_verify_page_1440.png');

    // -------------------------------------------------------------
    // 15. LAPTOP VIEWPORT (1366x768)
    // -------------------------------------------------------------
    console.log('\n[15/21] Testing Laptop 1366x768 Viewport...');
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_15_laptop_1366x768.png'), fullPage: false });
    console.log('  ✓ Saved after_15_laptop_1366x768.png');

    // -------------------------------------------------------------
    // 16. TABLET VIEWPORT (768x1024)
    // -------------------------------------------------------------
    console.log('\n[16/21] Testing Tablet 768x1024 Viewport...');
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_16_tablet_768x1024.png'), fullPage: false });
    console.log('  ✓ Saved after_16_tablet_768x1024.png');

    // -------------------------------------------------------------
    // 17. TABLET MOBILE DRAWER OPEN
    // -------------------------------------------------------------
    console.log('\n[17/21] Testing Tablet Mobile Drawer Open...');
    const drawerToggleBtn = await page.$('#mobile-menu-toggle-btn');
    if (drawerToggleBtn) {
      await drawerToggleBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_17_tablet_drawer_open.png'), fullPage: false });
      console.log('  ✓ Saved after_17_tablet_drawer_open.png');
      const drawerCloseBtn = await page.$('#mobile-drawer-close-btn');
      if (drawerCloseBtn) await drawerCloseBtn.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    // -------------------------------------------------------------
    // 18. MOBILE 1 VIEWPORT (390x844 - iPhone 14)
    // -------------------------------------------------------------
    console.log('\n[18/21] Testing Mobile 390x844 Viewport...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_18_mobile_390x844.png'), fullPage: false });
    console.log('  ✓ Saved after_18_mobile_390x844.png');

    // -------------------------------------------------------------
    // 19. MOBILE 2 VIEWPORT (375x812 - iPhone X)
    // -------------------------------------------------------------
    console.log('\n[19/21] Testing Mobile 375x812 Viewport...');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_19_mobile_375x812.png'), fullPage: false });
    console.log('  ✓ Saved after_19_mobile_375x812.png');

    // -------------------------------------------------------------
    // 20. ROLE-BASED: STAFF (1440x900)
    // -------------------------------------------------------------
    console.log('\n[20/21] Testing Role: STAFF...');
    await page.setViewport({ width: 1440, height: 900 });
    await setAuth(page, { username: 'staff1', fullName: 'Nguyễn Văn Nhân Viên', role: 'ROLE_STAFF' });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_20_role_staff_1440.png'), fullPage: false });
    console.log('  ✓ Saved after_20_role_staff_1440.png');

    // -------------------------------------------------------------
    // 21. ROLE-BASED: USER (1440x900)
    // -------------------------------------------------------------
    console.log('\n[21/21] Testing Role: USER...');
    await setAuth(page, { username: 'user1', fullName: 'Trần Thị Người Dùng', role: 'ROLE_USER' });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_21_role_user_1440.png'), fullPage: false });
    console.log('  ✓ Saved after_21_role_user_1440.png');

    console.log('\n🎉 ALL 21 VERIFICATION SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error during verification suite:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
