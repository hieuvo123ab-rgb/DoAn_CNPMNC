const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../../docs/ui-modernization/screenshots_task_center');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('[START] Capturing Task Center Modernization Screenshots...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();

  try {
    // 1. Login as Admin
    console.log('[1] Logging in as Admin (hieu)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#login-submit-btn', { timeout: 10000 });

    await page.type('#username-input', 'hieu');
    await page.type('#password-input', 'password123');
    await page.click('#login-submit-btn');

    // 2. Navigate to Task Center
    console.log('[2] Navigating to Task Center...');
    await page.waitForSelector('#nav-tasks-btn', { timeout: 12000 });
    await delay(1000);
    await page.click('#nav-tasks-btn');
    await page.waitForSelector('.kanban-grid', { timeout: 10000 });
    await delay(1000);

    // Screenshot 1: Kanban View (Default)
    console.log('[3] Capturing 01_task_center_kanban_desktop_1440.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '01_task_center_kanban_desktop_1440.png'), fullPage: false });

    // Screenshot 2: Switch to List View
    console.log('[4] Switching to List View and capturing 02_task_center_list_desktop_1440.png...');
    await page.click('#btn-view-list');
    await page.waitForSelector('.data-table', { timeout: 10000 });
    await delay(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '02_task_center_list_desktop_1440.png'), fullPage: false });

    // Screenshot 3: Open Create Task Modal
    console.log('[5] Opening Create Task Modal and capturing 03_task_center_create_modal.png...');
    await page.click('#btn-create-task');
    await page.waitForSelector('.ent-modal', { timeout: 10000 });
    await delay(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '03_task_center_create_modal.png'), fullPage: false });

    // Close Create Modal
    await page.click('.ent-modal__close-btn');
    await delay(1000);

    // Screenshot 4: Open Detail & Activity History Modal
    console.log('[6] Opening Detail & Activity History Modal...');
    // Click on the first row in List view to open detail
    const firstRow = await page.$('.data-table tbody tr');
    if (firstRow) {
      await firstRow.click();
      await page.waitForSelector('.ent-modal', { timeout: 10000 });
      await delay(1000);
      await page.screenshot({ path: path.join(OUT_DIR, '04_task_center_detail_timeline.png'), fullPage: false });
      // Close detail modal
      const closeBtn = await page.$('.ent-modal__close-btn');
      if (closeBtn) await closeBtn.click();
      await delay(1000);
    }

    // Screenshot 5: Switch to System Derived Tasks Tab
    console.log('[7] Switching to System Derived Tasks Tab...');
    await page.click('#tab-system-tasks');
    await delay(1500);
    await page.screenshot({ path: path.join(OUT_DIR, '05_task_center_system_tasks_tab.png'), fullPage: false });

    // Screenshot 6: Dark Mode Toggle
    console.log('[8] Toggling Dark Mode...');
    await page.click('#theme-toggle-btn');
    await delay(1000);
    // Switch back to manual tasks tab in dark mode
    await page.click('#tab-manual-tasks');
    await delay(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '06_task_center_dark_mode.png'), fullPage: false });

    // Switch back to light theme
    await page.click('#theme-toggle-btn');
    await delay(500);

    // Screenshot 7: Mobile Viewport (375x812)
    console.log('[9] Testing Mobile Viewport 375x812...');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await delay(1000);
    const hamburger = await page.$('#mobile-menu-toggle-btn');
    if (hamburger) {
      await hamburger.click();
      await delay(800);
      await page.click('#nav-tasks-btn');
      await delay(1500);
    }
    await page.screenshot({ path: path.join(OUT_DIR, '07_task_center_mobile_responsive_375.png'), fullPage: false });

    console.log('\n[SUCCESS] All 7 UI evidence screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
