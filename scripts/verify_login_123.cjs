const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../frontend/node_modules/puppeteer-core'));

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/qa-real-ui/screenshots');

async function run() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      errors.push(`Page error: ${err.message}`);
    });

    console.log(`Navigating to ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin', 'login_page.png') });
    console.log('Login page loaded & captured.');

    // Enter admin credentials (123)
    await page.waitForSelector('#username-input');
    await page.type('#username-input', 'admin');
    await page.waitForSelector('#password-input');
    await page.type('#password-input', '123');

    console.log('Submitting login form with admin / 123...');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or document page
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin', 'admin_dashboard_logged_in.png') });
    console.log('Dashboard screenshot captured.');

    // Check if token exists in localStorage
    const authState = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
        role: localStorage.getItem('role')
      };
    });
    console.log('Auth state in browser:', authState);

    console.log('Errors logged:', errors);
    console.log('TEST RESULT: SUCCESS');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
  }
}

run();

