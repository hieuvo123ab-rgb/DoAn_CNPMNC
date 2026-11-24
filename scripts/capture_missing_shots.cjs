const path = require('path');
const fs = require('fs');
const puppeteer = require(path.resolve(__dirname, '../frontend/node_modules/puppeteer-core'));

const OUT_DIR = path.resolve(__dirname, '../docs/audit/screenshots_41_nghiep_vu');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('[START] Capturing Remaining Targeted Screenshots...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const navigateTo = async (view) => {
    await page.evaluate((v) => {
      window.dispatchEvent(new CustomEvent('app-navigate', { detail: v }));
    }, view);
    await sleep(1500);
  };

  try {
    // 1. Authenticate as Admin
    console.log('[AUTH] Logging in as Admin (hieu)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.type('#username-input', 'hieu');
    await page.type('#password-input', 'password123');
    await page.click('#login-submit-btn');
    await sleep(2500);

    // 2. NV-A03: Version Restore Confirmation Dialog
    console.log('[NV-A03] Capturing Version Restore Confirmation...');
    await navigateTo('documents');
    const verBtn = await page.$('.action-btn.version-btn, [id^="version-doc-btn-"]');
    if (verBtn) {
      await verBtn.click();
      await sleep(1500);
      const restoreBtn = await page.$('button[title*="Khôi phục"]');
      if (restoreBtn) {
        await restoreBtn.click();
        await sleep(1000);
        await page.screenshot({ path: path.join(OUT_DIR, 'NV_A03_khoi_phuc_phien_ban.png'), fullPage: false });
        console.log('  -> Saved NV_A03_khoi_phuc_phien_ban.png');
      }
    }

    // 3. NV-D06 & NV-H03: Notification Panel Dropdown
    console.log('[NV-D06 & NV-H03] Capturing Notification Dropdown...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await sleep(1500);
    const notifBell = await page.$('#nav-notifications-btn');
    if (notifBell) {
      await notifBell.click();
      await sleep(1200);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_D06_thong_bao_thoi_gian_thuc.png'), fullPage: false });
      console.log('  -> Saved NV_D06_thong_bao_thoi_gian_thuc.png');
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_H03_thong_bao_dieu_tra_task_center.png'), fullPage: false });
      console.log('  -> Saved NV_H03_thong_bao_dieu_tra_task_center.png');
      await notifBell.click();
      await sleep(500);
    }

    // 4. NV-E03: Task Detail Drawer with Comments
    console.log('[NV-E03] Capturing Task Detail Drawer with Comments...');
    await navigateTo('tasks');
    const listBtn = await page.$('#btn-view-list');
    if (listBtn) await listBtn.click();
    await sleep(1000);
    const viewDetailBtn = await page.$('button[title="Xem chi tiết"]');
    if (viewDetailBtn) {
      await viewDetailBtn.click();
      await sleep(1500);
      await page.screenshot({ path: path.join(OUT_DIR, 'NV_E03_task_drawer_binh_luan.png'), fullPage: false });
      console.log('  -> Saved NV_E03_task_drawer_binh_luan.png');
    }

    console.log('[SUCCESS] All targeted screenshots captured!');
  } catch (err) {
    console.error('[ERROR]', err);
  } finally {
    await browser.close();
  }
}

run();
