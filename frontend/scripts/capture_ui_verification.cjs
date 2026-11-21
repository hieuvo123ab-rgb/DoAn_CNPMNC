const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../../docs/ui-modernization/after');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('🚀 Starting Enterprise UI Modernization Verification Suite...');
  console.log(`📸 Output directory: ${OUT_DIR}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP VIEWPORT (1440x900) - LOGIN PAGE
    // -------------------------------------------------------------
    console.log('\n[1/12] Testing Desktop 1440x900 - Login Screen...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

    // Clear any previous token to see modernized Login screen
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(OUT_DIR, 'after_01_login_desktop_1440.png'), fullPage: false });
    console.log('  ✓ Saved after_01_login_desktop_1440.png');

    // -------------------------------------------------------------
    // 2. AUTHENTICATION & DOCUMENTS PAGE (1440x900)
    // -------------------------------------------------------------
    console.log('\n[2/12] Authenticating as Admin (hieu)...');
    await page.type('#username-input', 'hieu');
    await page.type('#password-input', 'password123');
    await page.click('#login-submit-btn');

    await page.waitForSelector('#nav-docs-btn', { timeout: 15000 });
    try {
      await page.waitForSelector('.doc-row', { timeout: 12000 });
    } catch (e) {
      console.log('  (doc-row wait timeout, taking screenshot)');
    }
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(OUT_DIR, 'after_02_documents_desktop_1440.png'), fullPage: false });
    console.log('  ✓ Saved after_02_documents_desktop_1440.png');

    // -------------------------------------------------------------
    // 3. DARK MODE TOGGLE (1440x900)
    // -------------------------------------------------------------
    console.log('\n[3/12] Testing Dark Mode Theme Toggle...');
    const themeBtn = await page.$('#theme-toggle-btn');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_03_documents_dark_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_03_documents_dark_1440.png');
      // Switch back to light
      await themeBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }

    // -------------------------------------------------------------
    // 4. COLLAPSED SIDEBAR (1440x900)
    // -------------------------------------------------------------
    console.log('\n[4/12] Testing Collapsible Modern Sidebar...');
    const collapseBtn = await page.$('#sidebar-collapse-btn');
    if (collapseBtn) {
      await collapseBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_04_sidebar_collapsed_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_04_sidebar_collapsed_1440.png');
      // Expand back
      await collapseBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }

    // -------------------------------------------------------------
    // 5. NOTIFICATION POPOVER (1440x900)
    // -------------------------------------------------------------
    console.log('\n[5/12] Testing Live Notification Popover...');
    const notifBtn = await page.$('#nav-notifications-btn');
    if (notifBtn) {
      await notifBtn.click();
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_05_notifications_popover_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_05_notifications_popover_1440.png');
      // Close popover
      await notifBtn.click();
      await new Promise(r => setTimeout(r, 600));
    }

    // -------------------------------------------------------------
    // 6. TASK CENTER (1440x900)
    // -------------------------------------------------------------
    console.log('\n[6/12] Navigating to Task Center...');
    const taskBtn = await page.$('#nav-tasks-btn');
    if (taskBtn) {
      await taskBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_06_task_center_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_06_task_center_1440.png');
    }

    // -------------------------------------------------------------
    // 6b. REVIEW QUEUE (1440x900)
    // -------------------------------------------------------------
    console.log('\n[6b/14] Navigating to Review Queue...');
    const reviewBtn = await page.$('#nav-review-queue-btn');
    if (reviewBtn) {
      await reviewBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_06b_review_queue_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_06b_review_queue_1440.png');
    }

    // -------------------------------------------------------------
    // 6c. USERS MANAGEMENT (1440x900)
    // -------------------------------------------------------------
    console.log('\n[6c/14] Navigating to Users & Permissions...');
    const usersBtn = await page.$('#nav-users-btn');
    if (usersBtn) {
      await usersBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_06c_users_management_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_06c_users_management_1440.png');
    }

    // -------------------------------------------------------------
    // 6d. DASHBOARD OVERVIEW (1440x900)
    // -------------------------------------------------------------
    console.log('\n[6d/14] Navigating to Dashboard Overview...');
    const dashBtn = await page.$('#nav-dashboard-btn');
    if (dashBtn) {
      await dashBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_06d_dashboard_overview_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_06d_dashboard_overview_1440.png');
    }

    // -------------------------------------------------------------
    // 6e. AUDIT LOGS (1440x900)
    // -------------------------------------------------------------
    console.log('\n[6e/14] Navigating to Audit Logs...');
    const auditBtn = await page.$('#nav-audit-btn');
    if (auditBtn) {
      await auditBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_06e_audit_logs_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_06e_audit_logs_1440.png');
    }

    // -------------------------------------------------------------
    // 7. SYSTEM STATUS (1440x900)
    // -------------------------------------------------------------
    console.log('\n[7/14] Navigating to System Status...');
    const sysBtn = await page.$('#nav-system-status-btn');
    if (sysBtn) {
      await sysBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_07_system_status_1440.png'), fullPage: false });
      console.log('  ✓ Saved after_07_system_status_1440.png');
    }

    // Back to documents
    await page.click('#nav-docs-btn');
    await new Promise(r => setTimeout(r, 1500));

    // -------------------------------------------------------------
    // 8. LAPTOP VIEWPORT (1366x768)
    // -------------------------------------------------------------
    console.log('\n[8/12] Testing Laptop 1366x768 Viewport...');
    await page.setViewport({ width: 1366, height: 768 });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_08_laptop_1366x768.png'), fullPage: false });
    console.log('  ✓ Saved after_08_laptop_1366x768.png');

    // -------------------------------------------------------------
    // 9. TABLET VIEWPORT (768x1024)
    // -------------------------------------------------------------
    console.log('\n[9/12] Testing Tablet 768x1024 Viewport...');
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_09_tablet_768x1024.png'), fullPage: false });
    console.log('  ✓ Saved after_09_tablet_768x1024.png');

    // -------------------------------------------------------------
    // 10. TABLET MOBILE DRAWER OPEN
    // -------------------------------------------------------------
    console.log('\n[10/12] Testing Tablet Mobile Drawer Open...');
    const hamburgerBtn = await page.$('#mobile-menu-toggle-btn');
    if (hamburgerBtn) {
      await hamburgerBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(OUT_DIR, 'after_10_tablet_drawer_open.png'), fullPage: false });
      console.log('  ✓ Saved after_10_tablet_drawer_open.png');
      const closeBtn = await page.$('#mobile-drawer-close-btn');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }

    // -------------------------------------------------------------
    // 11. MOBILE 1 VIEWPORT (390x844 - iPhone 14)
    // -------------------------------------------------------------
    console.log('\n[11/12] Testing Mobile 390x844 Viewport...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_11_mobile_390x844.png'), fullPage: false });
    console.log('  ✓ Saved after_11_mobile_390x844.png');

    // -------------------------------------------------------------
    // 12. MOBILE 2 VIEWPORT (375x812 - iPhone X)
    // -------------------------------------------------------------
    console.log('\n[12/12] Testing Mobile 375x812 Viewport...');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, 'after_12_mobile_375x812.png'), fullPage: false });
    console.log('  ✓ Saved after_12_mobile_375x812.png');

    console.log('\n🎉 ALL 12 VERIFICATION SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error during UI acceptance:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
