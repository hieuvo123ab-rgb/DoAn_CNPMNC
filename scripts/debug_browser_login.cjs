const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../frontend/node_modules/puppeteer-core'));

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testLogin(username, password) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.type('#username-input', username);
  await page.type('#password-input', password);
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  
  const pageInfo = await page.evaluate(() => {
    return {
      hasDocsBtn: !!document.querySelector('#nav-docs-btn'),
      sidebar: !!document.querySelector('.ent-sidebar'),
      userBadge: document.querySelector('.ent-user-badge, .ent-sidebar__user')?.textContent?.trim()
    };
  });
  console.log(`Login test [${username} with password "${password}"]:`, pageInfo);
  await browser.close();
}

async function run() {
  await testLogin('admin', '1 2 3');
  await testLogin('admin', '123');
  await testLogin('staff', '1 2 3');
  await testLogin('user', '123');
}

run().catch(console.error);
