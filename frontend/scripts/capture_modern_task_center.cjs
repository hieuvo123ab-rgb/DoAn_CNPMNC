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
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

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

    // Screenshot 1: Kanban View (Default Unified Kanban)
    console.log('[3] Capturing 01_task_center_2_kanban_view.png...');
    await page.screenshot({ path: path.join(OUT_DIR, '01_task_center_2_kanban_view.png'), fullPage: false });

    // Screenshot 2: Switch to List View
    console.log('[4] Switching to List View and capturing 02_task_center_2_list_view.png...');
    await page.click('#btn-view-list');
    await page.waitForSelector('.data-table', { timeout: 10000 });
    await delay(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '02_task_center_2_list_view.png'), fullPage: false });

    // Screenshot 3: Open Task Detail Drawer from right edge
    console.log('[5] Opening Task Detail Drawer and capturing 03_task_center_2_detail_drawer.png...');
    const firstRow = await page.$('.data-table tbody tr');
    if (firstRow) {
      await firstRow.click();
      await page.waitForSelector('.task-drawer', { timeout: 10000 });
      await delay(1200);
      await page.screenshot({ path: path.join(OUT_DIR, '03_task_center_2_detail_drawer.png'), fullPage: false });
      
      // Close Drawer cleanly
      await page.evaluate(() => {
        const btn = document.querySelector('.task-drawer .ent-modal__close-btn') || document.querySelector('.task-drawer-overlay');
        if (btn) btn.click();
      });
      await delay(1000);
    }

    // Screenshot 4: Open Workload & Backlog Analytics Modal
    console.log('[6] Opening Workload & Backlog Analytics Modal and capturing 04_task_center_2_workload_analytics.png...');
    await page.evaluate(() => {
      const btn = document.getElementById('btn-workload-analytics');
      if (btn) btn.click();
    });
    await page.waitForSelector('.ent-modal', { timeout: 10000 });
    await delay(1200);
    await page.screenshot({ path: path.join(OUT_DIR, '04_task_center_2_workload_analytics.png'), fullPage: false });

    // Close Workload Modal
    await page.evaluate(() => {
      const btn = document.querySelector('.ent-modal .ent-modal__close-btn') || document.querySelector('.ent-modal__footer button');
      if (btn) btn.click();
    });
    await delay(1000);

    // Switch back to Kanban
    await page.click('#btn-view-kanban');
    await delay(800);

    // Screenshot 5: Dark Mode Toggle
    console.log('[7] Toggling Dark Mode and capturing 05_task_center_2_dark_mode.png...');
    await page.click('#theme-toggle-btn');
    await delay(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '05_task_center_2_dark_mode.png'), fullPage: false });

    // Switch back to light theme
    await page.click('#theme-toggle-btn');
    await delay(600);

    // Screenshot 6: Mobile Viewport (375x812) with Drawer Open
    console.log('[8] Testing Mobile Viewport 375x812 and capturing 06_task_center_2_mobile_drawer.png...');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await delay(800);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'tasks' }));
    });
    await delay(1200);
    const card = await page.$('.kanban-card');
    if (card) {
      await card.click();
      await delay(1200);
    }
    await page.screenshot({ path: path.join(OUT_DIR, '06_task_center_2_mobile_drawer.png'), fullPage: false });

    console.log('\n[SUCCESS] All Task Center 2.0 visual evidence screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
