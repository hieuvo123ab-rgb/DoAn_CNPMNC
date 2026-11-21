const path = require('path');
const fs = require('fs');
const puppeteer = require(path.resolve(__dirname, '../frontend/node_modules/puppeteer-core'));

const OUTPUT_DIR = path.resolve(__dirname, '../docs/audit/cleaned_ui_screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('[START] Capturing Cleaned UI Evidence with Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login as Admin
  console.log('Logging in...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.type('#username-input', 'admin');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await sleep(2000);

  // 2. Task Center - Kanban View
  console.log('Navigating to Task Center (Kanban)...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'tasks' })));
  await sleep(2500);

  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_TaskCenter_Kanban_Clean.png') });
  console.log('Saved 01_TaskCenter_Kanban_Clean.png');

  // 3. Open Task Detail Drawer
  console.log('Opening Task Detail Drawer...');
  await page.evaluate(() => {
    const card = document.querySelector('.kanban-card');
    if (card) card.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_TaskCenter_Drawer_Clean.png') });
  console.log('Saved 02_TaskCenter_Drawer_Clean.png');

  // Close drawer
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.task-drawer__header button');
    if (closeBtn) closeBtn.click();
  });
  await sleep(1000);

  // 4. Task Center - List View
  console.log('Switching to Task Center (List View)...');
  await page.evaluate(() => {
    const listBtn = document.getElementById('view-list-btn');
    if (listBtn) listBtn.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_TaskCenter_List_Clean.png') });
  console.log('Saved 03_TaskCenter_List_Clean.png');

  // 5. Workload Analytics Modal
  console.log('Opening Workload Analytics Modal...');
  await page.evaluate(() => {
    const wlBtn = document.getElementById('btn-workload-analytics');
    if (wlBtn) wlBtn.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_Workload_Analytics_Clean.png') });
  console.log('Saved 04_Workload_Analytics_Clean.png');

  // Close workload modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.ent-modal-header button');
    if (closeBtn) closeBtn.click();
  });
  await sleep(1000);

  // 6. Investigation Page
  console.log('Navigating to Investigation Page...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'investigations' })));
  await sleep(2500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_Investigation_Clean.png') });
  console.log('Saved 05_Investigation_Clean.png');

  // 7. Virtual Data Room Page
  console.log('Navigating to Virtual Data Room...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('app-navigate', { detail: 'vdr' })));
  await sleep(2500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_VDR_Clean.png') });
  console.log('Saved 06_VDR_Clean.png');

  await browser.close();
  console.log('[SUCCESS] All Cleaned UI screenshots captured successfully!');
}

run().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
