const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../frontend/node_modules/puppeteer-core'));
const fs = require('fs');

async function testLogin() {
  const env = fs.readFileSync('.env.qa', 'utf8');
  let u = 'qa_admin', p = '';
  env.split('\n').forEach(l => {
    if (l.startsWith('EDMS_TEAM_ADMIN_USERNAME=')) u = l.split('=')[1].trim();
    if (l.startsWith('EDMS_TEAM_ADMIN_PASSWORD=')) p = l.split('=')[1].trim();
  });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', res => {
    if (res.url().includes('/api/')) console.log('API RES:', res.status(), res.url());
  });

  await page.goto('http://localhost:8088/login', { waitUntil: 'networkidle2' });
  await page.type('#username-input', u);
  await page.type('#password-input', p);
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'docs/qa-real-ui/screenshots/errors/login_debug.png' });

  const currentUrl = page.url();
  const alertText = await page.evaluate(() => {
    const el = document.querySelector('#login-error-alert');
    return el ? el.textContent : null;
  });
  const hasNavDocs = await page.$('#nav-docs-btn') !== null;
  const bodyText = await page.evaluate(() => document.body.innerText);

  console.log('Current URL:', currentUrl);
  console.log('Alert text:', alertText);
  console.log('Has #nav-docs-btn:', hasNavDocs);
  console.log('Body snippet:', bodyText.substring(0, 200));

  await browser.close();
}
testLogin();

