const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function login(page) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  console.log('--- Logging in as admin ---');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  await page.waitForSelector('input[name="username"]', { visible: true });
  await page.type('input[name="username"]', username);
  await page.type('input[name="password"]', password);

  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('--- Login successful ---');
}

module.exports = { login };
