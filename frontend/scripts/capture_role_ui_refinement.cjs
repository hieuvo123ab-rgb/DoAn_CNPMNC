// VISUAL MOCK CAPTURE ONLY — NOT AN AUTHENTICATED E2E OR RBAC SECURITY TEST.
// This script intentionally intercepts HTTP API requests and supplies fixture data.
// Screenshots verify layouts, not real Spring Boot responses or user permissions.
// For real API/RBAC checks see scripts/test_team_preview_live.py on Preview branch.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../../docs/role-ui-review/screenshots/after');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Realistic Mock Data for UI Verification
const MOCK_DOCS = [
  {
    id: 101,
    title: 'Báo cáo Tài chính Quý III/2026',
    description: 'Báo cáo tổng hợp số liệu kế toán và phân tích tài chính toàn cơ quan',
    documentType: 'Báo cáo',
    originalFileName: 'BaoCaoTaiChinh_Q3_2026.pdf',
    fileSize: 2458900,
    createdBy: 'hieu',
    createdAt: '2026-10-15T08:30:00Z',
    currentVersionNumber: 3,
    accessMode: 'INTERNAL',
    currentReviewStatus: 'APPROVED',
    lifecycleStatus: 'ACTIVE',
    retentionUntil: '2031-10-15',
    legalHold: false,
    eligibleForDisposition: false,
    userPermission: 'OWNER'
  },
  {
    id: 102,
    title: 'Hợp đồng Cung cấp Dịch vụ Viễn thông',
    description: 'Hợp đồng khung triển khai hạ tầng kết nối số với đối tác chiến lược',
    documentType: 'Hợp đồng',
    originalFileName: 'HopDong_DichVu_VienThong.pdf',
    fileSize: 4194304,
    createdBy: 'thanh',
    createdAt: '2026-10-16T14:15:00Z',
    currentVersionNumber: 2,
    accessMode: 'PRIVATE',
    currentReviewStatus: 'PENDING',
    lifecycleStatus: 'ACTIVE',
    retentionUntil: '2036-12-31',
    legalHold: true,
    legalHoldReason: 'Bảo lưu tài liệu phục vụ quyết toán liên tịch',
    eligibleForDisposition: false,
    userPermission: 'EDIT'
  },
  {
    id: 103,
    title: 'Quyết định Ban hành Quy chế Quản trị Số',
    description: 'Quy chuẩn an toàn bảo mật và mã hóa tài liệu số trong toàn hệ thống',
    documentType: 'Quyết định',
    originalFileName: 'QuyetDinh_QuyChe_So_2026.pdf',
    fileSize: 1048576,
    createdBy: 'hieu',
    createdAt: '2026-10-10T09:00:00Z',
    currentVersionNumber: 1,
    accessMode: 'INTERNAL',
    currentReviewStatus: 'APPROVED',
    lifecycleStatus: 'ARCHIVED',
    archivedBy: 'hieu',
    retentionUntil: '2026-10-01',
    eligibleForDisposition: true,
    userPermission: 'OWNER'
  }
];

const MOCK_TASKS = [
  {
    id: 'T-101',
    taskType: 'REVIEW_PENDING',
    title: 'Xét duyệt Hợp đồng Cung cấp Dịch vụ Viễn thông (v2)',
    description: 'Người gửi: chuyên viên thanh • Thời gian: 16/10/2026',
    actionKey: 'OPEN_REVIEW_QUEUE',
    createdAt: '2026-10-16T14:15:00Z'
  },
  {
    id: 'T-102',
    taskType: 'DISPOSITION_PENDING',
    title: 'Phê duyệt tiêu hủy tài liệu hết hạn lưu trữ #103',
    description: 'Quyết định Ban hành Quy chế Quản trị Số đã hoàn tất thời hạn lưu trữ tối thiểu',
    actionKey: 'OPEN_DISPOSITION_QUEUE',
    createdAt: '2026-10-18T10:00:00Z'
  }
];

const MOCK_REVIEWS = [
  {
    reviewId: 201,
    documentId: 102,
    documentTitle: 'Hợp đồng Cung cấp Dịch vụ Viễn thông',
    originalFileName: 'HopDong_DichVu_VienThong.pdf',
    versionNumber: 2,
    submittedBy: 'thanh',
    submittedAt: '2026-10-16T14:15:00Z',
    status: 'PENDING'
  }
];

const MOCK_DISPOSITIONS = [
  {
    requestId: 301,
    documentId: 103,
    documentTitle: 'Quyết định Ban hành Quy chế Quản trị Số',
    currentVersion: 1,
    retentionUntil: '2026-10-01',
    requestedBy: 'hieu',
    requestedAt: '2026-10-18T10:00:00Z',
    reason: 'Đã hoàn thành thời hạn lưu trữ theo niên hạn pháp luật',
    legalHold: false,
    eligibleForDisposition: true,
    status: 'PENDING'
  }
];

const MOCK_USERS = [
  {
    id: 1,
    username: 'hieu',
    fullName: 'Võ Trọng Hiếu',
    email: 'admin@edms.enterprise.vn',
    role: 'ROLE_ADMIN',
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 2,
    username: 'thanh',
    fullName: 'Nguyễn Văn Thành',
    email: 'thanh.staff@edms.enterprise.vn',
    role: 'ROLE_STAFF',
    enabled: true,
    createdAt: '2026-02-15T00:00:00Z'
  },
  {
    id: 3,
    username: 'nhanvien1',
    fullName: 'Trần Thị Mai',
    email: 'mai.tran@edms.enterprise.vn',
    role: 'ROLE_USER',
    enabled: true,
    createdAt: '2026-03-20T00:00:00Z'
  }
];

const MOCK_DASHBOARD = {
  documentStats: {
    totalDocuments: 128,
    documentsByType: { 'Báo cáo': 45, 'Hợp đồng': 32, 'Quyết định': 28, 'Khác': 23 },
    totalStorageBytes: 154289000
  },
  usageStats: {
    totalUploads: 56,
    totalPreviews: 240,
    totalDownloads: 112,
    totalUpdates: 38,
    activeUsers: 18
  },
  totalUsers: 24,
  recentActivities: [
    {
      id: 501,
      username: 'hieu',
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTH',
      resourceId: 'hieu',
      description: 'Đăng nhập thành công từ IP 192.168.1.50',
      timestamp: '2026-10-20T10:30:00Z'
    },
    {
      id: 502,
      username: 'thanh',
      action: 'DOCUMENT_UPLOAD',
      resourceType: 'DOCUMENT',
      resourceId: '102',
      description: 'Tải lên phiên bản mới cho tài liệu #102',
      timestamp: '2026-10-20T10:15:00Z'
    }
  ]
};

const MOCK_AUDIT = {
  content: [
    {
      id: 901,
      timestamp: '2026-10-20T11:00:00Z',
      username: 'hieu',
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTH',
      resourceId: 'hieu',
      description: 'Đăng nhập thành công từ IP 192.168.1.50'
    },
    {
      id: 902,
      timestamp: '2026-10-20T10:45:00Z',
      username: 'thanh',
      action: 'DOCUMENT_UPDATE',
      resourceType: 'DOCUMENT',
      resourceId: '102',
      description: 'Cập nhật phân loại tài liệu sang Hợp đồng'
    }
  ],
  totalPages: 1,
  totalElements: 2
};

const MOCK_SYSTEM_STATUS = {
  status: 'UP',
  uptimeSeconds: 864200,
  services: {
    database: { status: 'UP', message: 'PostgreSQL 16 Enterprise connection pool healthy' },
    storage: { status: 'UP', message: 'Encrypted object storage active' },
    cryptoEngine: { status: 'READY', message: 'RSA-2048 Digital Signature & SHA-256 Engine online' },
    stompBroker: { status: 'AVAILABLE', message: 'In-memory real-time message broker running' }
  }
};

async function setupRouteMocking(page, currentUser) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    const method = request.method();

    if (url.includes('/api/auth/login')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock_jwt_token_' + currentUser.role,
          user: currentUser
        })
      });
      return;
    }

    if (url.includes('/api/documents') && method === 'GET') {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DOCS)
      });
      return;
    }

    if (url.includes('/api/tasks')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentUser.role === 'ROLE_ADMIN' ? MOCK_TASKS : [MOCK_TASKS[0]])
      });
      return;
    }

    if (url.includes('/api/admin/review-queue')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REVIEWS)
      });
      return;
    }

    if (url.includes('/api/admin/disposition-queue')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DISPOSITIONS)
      });
      return;
    }

    if (url.includes('/api/admin/users') && !url.includes('/role-permissions')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USERS)
      });
      return;
    }

    if (url.includes('/api/admin/role-permissions')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roles: ['ROLE_ADMIN', 'ROLE_STAFF', 'ROLE_USER'],
          permissions: [
            { code: 'DOC_VIEW', description: 'Xem tài liệu nội bộ', admin: true, staff: true, user: true },
            { code: 'DOC_UPLOAD', description: 'Tải lên tài liệu mới', admin: true, staff: true, user: true },
            { code: 'DOC_REVIEW', description: 'Xét duyệt tài liệu', admin: true, staff: false, user: false },
            { code: 'USER_MANAGE', description: 'Quản lý người dùng', admin: true, staff: false, user: false }
          ]
        })
      });
      return;
    }

    if (url.includes('/api/admin/dashboard')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DASHBOARD)
      });
      return;
    }

    if (url.includes('/api/admin/audit-logs') || url.includes('/api/audit')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUDIT)
      });
      return;
    }

    if (url.includes('/api/admin/system-status')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SYSTEM_STATUS)
      });
      return;
    }

    if (url.includes('/api/public/verify')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          documentId: 101,
          versionNumber: 3,
          title: 'Báo cáo Tài chính Quý III/2026',
          fileName: 'BaoCaoTaiChinh_Q3_2026.pdf',
          fileHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          signatureStatus: 'VALID',
          signer: 'Võ Trọng Hiếu (Giám đốc Điều hành)',
          signedAt: '2026-10-15T08:35:00Z',
          message: 'Tài liệu nguyên vẹn, chữ ký số hợp lệ và được chứng thực bởi EDMS Trust.'
        })
      });
      return;
    }

    if (url.includes('/api/notifications')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Yêu cầu xét duyệt mới',
            content: 'Chuyên viên thanh đã gửi duyệt phiên bản v2 cho Hợp đồng Viễn thông',
            read: false,
            createdAt: '2026-10-20T10:00:00Z'
          }
        ])
      });
      return;
    }

    if (url.includes('/api/saved-searches')) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
      return;
    }

    request.continue();
  });
}

async function run() {
  console.log('VISUAL MOCK CAPTURE — fixtures only; no real JWT/API/E2E verification');
  console.log(`📸 Output directory: ${OUT_DIR}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();

    // -------------------------------------------------------------
    // PART 1: PUBLIC (UNAUTHENTICATED) SCREENS
    // -------------------------------------------------------------
    console.log('\n[1/6] Capturing Public Unauthenticated Screens...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(OUT_DIR, 'public_01_login_desktop_1440.png') });
    console.log('  ✓ Saved public_01_login_desktop_1440.png');

    // Public Verification Page
    await page.goto('http://localhost:5173/verify', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'public_02_verify_portal_1440.png') });
    console.log('  ✓ Saved public_02_verify_portal_1440.png');

    // -------------------------------------------------------------
    // PART 2: ROLE_ADMIN (QUẢN TRỊ VIÊN) SCREENS
    // -------------------------------------------------------------
    console.log('\n[2/6] Capturing ROLE_ADMIN (Quản trị viên) Screens...');
    const adminUser = MOCK_USERS[0];
    await setupRouteMocking(page, adminUser);

    // Set authenticated state in localStorage
    await page.evaluate((user) => {
      localStorage.setItem('edms_token', 'mock_token_admin');
      localStorage.setItem('edms_user', JSON.stringify(user));
    }, adminUser);

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Admin Documents - Light Mode
    await page.screenshot({ path: path.join(OUT_DIR, 'admin_01_desktop_1440_documents_light.png') });
    console.log('  ✓ Saved admin_01_desktop_1440_documents_light.png');

    // Admin Documents - Dark Mode
    const themeBtn = await page.$('#theme-toggle-btn');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(OUT_DIR, 'admin_02_desktop_1440_documents_dark.png') });
      console.log('  ✓ Saved admin_02_desktop_1440_documents_dark.png');
      // Revert to light mode
      await themeBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }

    // Sidebar Collapsed
    const collapseBtn = await page.$('#sidebar-collapse-btn');
    if (collapseBtn) {
      await collapseBtn.click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(OUT_DIR, 'admin_03_desktop_1440_sidebar_collapsed.png') });
      console.log('  ✓ Saved admin_03_desktop_1440_sidebar_collapsed.png');
      await collapseBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }

    // Notification Popover
    const notifBtn = await page.$('#nav-notifications-btn');
    if (notifBtn) {
      await notifBtn.click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(OUT_DIR, 'admin_04_desktop_1440_notifications.png') });
      console.log('  ✓ Saved admin_04_desktop_1440_notifications.png');
      await notifBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    // Task Center
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'tasks' })));
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'admin_05_desktop_1440_task_center.png') });
    console.log('  ✓ Saved admin_05_desktop_1440_task_center.png');

    // Review Queue
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'review-queue' })));
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'admin_06_desktop_1440_review_queue.png') });
    console.log('  ✓ Saved admin_06_desktop_1440_review_queue.png');

    // Disposition Queue
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'disposition-queue' })));
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'admin_07_desktop_1440_disposition_queue.png') });
    console.log('  ✓ Saved admin_07_desktop_1440_disposition_queue.png');

    // Users Management
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'users' })));
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'admin_08_desktop_1440_users_management.png') });
    console.log('  ✓ Saved admin_08_desktop_1440_users_management.png');

    // Dashboard Overview
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'dashboard' })));
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, 'admin_09_desktop_1440_dashboard.png') });
    console.log('  ✓ Saved admin_09_desktop_1440_dashboard.png');

    // Audit Logs
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'audit' })));
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, 'admin_10_desktop_1440_audit_logs.png') });
    console.log('  ✓ Saved admin_10_desktop_1440_audit_logs.png');

    // System Status
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'system-status' })));
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, 'admin_11_desktop_1440_system_status.png') });
    console.log('  ✓ Saved admin_11_desktop_1440_system_status.png');

    // -------------------------------------------------------------
    // PART 3: ROLE_STAFF (CHUYÊN VIÊN) SCREENS
    // -------------------------------------------------------------
    console.log('\n[3/6] Capturing ROLE_STAFF (Chuyên viên) Screens...');
    const staffUser = MOCK_USERS[1];
    await page.evaluate((user) => {
      localStorage.setItem('edms_token', 'mock_token_staff');
      localStorage.setItem('edms_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'documents' }));
    }, staffUser);

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'staff_01_desktop_1440_documents.png') });
    console.log('  ✓ Saved staff_01_desktop_1440_documents.png');

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'tasks' })));
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUT_DIR, 'staff_02_desktop_1440_task_center.png') });
    console.log('  ✓ Saved staff_02_desktop_1440_task_center.png');

    // -------------------------------------------------------------
    // PART 4: ROLE_USER (NGƯỜI DÙNG) SCREENS
    // -------------------------------------------------------------
    console.log('\n[4/6] Capturing ROLE_USER (Người dùng) Screens...');
    const standardUser = MOCK_USERS[2];
    await page.evaluate((user) => {
      localStorage.setItem('edms_token', 'mock_token_user');
      localStorage.setItem('edms_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'documents' }));
    }, standardUser);

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'user_01_desktop_1440_documents.png') });
    console.log('  ✓ Saved user_01_desktop_1440_documents.png');

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'tasks' })));
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUT_DIR, 'user_02_desktop_1440_task_center.png') });
    console.log('  ✓ Saved user_02_desktop_1440_task_center.png');

    // Reset back to Admin for responsive views
    await page.evaluate((user) => {
      localStorage.setItem('edms_token', 'mock_token_admin');
      localStorage.setItem('edms_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'documents' }));
    }, adminUser);

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // -------------------------------------------------------------
    // PART 5: RESPONSIVE VIEWPORTS
    // -------------------------------------------------------------
    console.log('\n[5/6] Testing Multi-Viewport Responsiveness...');

    // 1366x768 (Laptop)
    await page.setViewport({ width: 1366, height: 768 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUT_DIR, 'responsive_01_laptop_1366x768.png') });
    console.log('  ✓ Saved responsive_01_laptop_1366x768.png');

    // 768x1024 (Tablet)
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUT_DIR, 'responsive_02_tablet_768x1024.png') });
    console.log('  ✓ Saved responsive_02_tablet_768x1024.png');

    // Tablet Drawer Open
    const menuBtn = await page.$('#mobile-menu-toggle-btn');
    if (menuBtn) {
      await menuBtn.click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(OUT_DIR, 'responsive_03_tablet_drawer_open.png') });
      console.log('  ✓ Saved responsive_03_tablet_drawer_open.png');
      const closeBtn = await page.$('#mobile-drawer-close-btn');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    // 390x844 (iPhone 14)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUT_DIR, 'responsive_04_mobile_390x844_iphone14.png') });
    console.log('  ✓ Saved responsive_04_mobile_390x844_iphone14.png');

    // 375x812 (iPhone X)
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUT_DIR, 'responsive_05_mobile_375x812_iphonex.png') });
    console.log('  ✓ Saved responsive_05_mobile_375x812_iphonex.png');

    console.log('\n🎉 ALL 22 ROLE-BASED VERIFICATION SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error during role verification capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
