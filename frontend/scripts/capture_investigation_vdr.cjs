const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../../docs/investigation-vdr');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('[START] Starting Investigation & Virtual Data Room Visual Capture Suite...');
  console.log(`[SNAP] Output directory: ${OUT_DIR}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Authenticate as Admin
    console.log('\n[1/6] Authenticating as Admin (hieu)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.type('#username-input', 'hieu');
    await page.type('#password-input', 'password123');
    await page.click('#login-submit-btn');
    await new Promise(r => setTimeout(r, 2000));

    // 2. Navigate to Investigation Module
    console.log('\n[2/6] Navigating to Document Investigation Dashboard...');
    const invNavBtn = await page.waitForSelector('#nav-investigations-btn', { timeout: 10000 });
    await invNavBtn.click();
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUT_DIR, '01_investigation_dashboard.png'), fullPage: false });
    console.log('  [OK] Saved 01_investigation_dashboard.png');

    // 3. Open First Investigation Case Detail (Evidence tab)
    console.log('\n[3/6] Opening Investigation Case Detail (Evidence & Integrity)...');
    const firstCaseRow = await page.waitForSelector('.ent-table tbody tr', { timeout: 10000 });
    await firstCaseRow.click();
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(OUT_DIR, '02_investigation_case_detail_evidence.png'), fullPage: false });
    console.log('  [OK] Saved 02_investigation_case_detail_evidence.png');

    // 4. Switch to Side-by-side Diff Tab
    console.log('\n[4/6] Switching to Side-by-side Diff Viewer...');
    const tabs = await page.$$('.ent-modal button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.includes('So sánh phiên bản')) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    // Trigger diff button
    const diffButtons = await page.$$('.ent-modal button');
    for (const btn of diffButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('So sánh khác biệt')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(OUT_DIR, '03_investigation_version_diff.png'), fullPage: false });
    console.log('  [OK] Saved 03_investigation_version_diff.png');

    // Close Modal
    const closeBtn = await page.waitForSelector('.ent-modal__close-btn');
    await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));

    // 5. Navigate to Virtual Data Room (VDR)
    console.log('\n[5/6] Navigating to Virtual Data Room Dashboard...');
    const vdrNavBtn = await page.waitForSelector('#nav-vdr-btn', { timeout: 10000 });
    await vdrNavBtn.click();
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUT_DIR, '04_vdr_rooms_dashboard.png'), fullPage: false });
    console.log('  [OK] Saved 04_vdr_rooms_dashboard.png');

    // 6. Open Room Detail (Documents & Security Audit)
    console.log('\n[6/6] Opening Data Room Detail & Security Audit...');
    const firstRoomRow = await page.waitForSelector('.ent-table tbody tr', { timeout: 10000 });
    await firstRoomRow.click();
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(OUT_DIR, '05_vdr_room_detail_documents.png'), fullPage: false });
    console.log('  [OK] Saved 05_vdr_room_detail_documents.png');

    // Switch to Security Audit tab
    const roomTabs = await page.$$('.ent-modal button');
    for (const tab of roomTabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.includes('Nhật ký an ninh')) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(OUT_DIR, '06_vdr_security_audit_anti_leak.png'), fullPage: false });
    console.log('  [OK] Saved 06_vdr_security_audit_anti_leak.png');

    console.log('\n[ALL OK] Successfully captured all visual evidence for Investigation & VDR modules!');

  } catch (err) {
    console.error('Puppeteer capture error:', err);
  } finally {
    await browser.close();
  }
}

run();
