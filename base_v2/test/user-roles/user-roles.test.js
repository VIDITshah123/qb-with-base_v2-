const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const testDataPath = path.join(__dirname, 'user_roles_test_data.csv');
const screenshotsPath = path.join(__dirname, '..', 'screenshots');

const readTestData = () => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(testDataPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const login = async (page) => {
  console.log('--- Logging in as admin ---');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.type('input[name="username"]', 'admin@employdex.com');
  await page.type('input[name="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForResponse(response => response.url().includes('/api/authentication/login') && response.status() === 200);
  await page.waitForFunction('window.location.pathname.startsWith("/dashboard")');
  console.log('--- Login successful ---');
};

(async () => {
  const testData = await readTestData();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await login(page);

  for (let i = 0; i < testData.length; i++) {
    const row = testData[i];
    const { username, roleToAssign, expected_result } = row;
    const testIndex = i + 1;
    let testStatus = 'failed';

    console.log(`--- Running test case ${testIndex}: Assigning role '${roleToAssign}' to user '${username}' ---`);

    try {
      await page.goto('http://localhost:3000/users', { waitUntil: 'networkidle2' });

      const userRowSelector = `//td[contains(text(), "${username}")]/..`;
            await page.waitForSelector(`xpath/${userRowSelector}`);
      const [userRow] = await page.$x(userRowSelector);
      const assignRoleButton = await userRow.$('a[href*="/assign-roles"]');
      await assignRoleButton.click();

      await page.waitForSelector('form');
      const roleCheckboxSelector = `//label[contains(text(), "${roleToAssign}")]/input[@type='checkbox']`;
            await page.waitForSelector(`xpath/${roleCheckboxSelector}`);
      const [roleCheckbox] = await page.$x(roleCheckboxSelector);
      await roleCheckbox.click();

      await page.click('button[type="submit"]');

      await page.waitForSelector('.toast-body', { visible: true });
      const toastMessage = await page.$eval('.toast-body', el => el.textContent);
      if (toastMessage.includes('Roles assigned successfully')) {
        testStatus = 'passed';
      }

    } catch (error) {
      console.error(`Test case ${testIndex} threw an error:`, error.message);
      testStatus = 'failed';
    } finally {
      const screenshotName = `user-roles-test-${testIndex}-${username.split('@')[0]}-${roleToAssign.replace(/\s+/g, '-')}-${testStatus}.png`;
      await page.screenshot({ path: path.join(screenshotsPath, screenshotName) });
      console.log(`Result: ${testStatus}`);
      console.log(`Screenshot saved to ${screenshotName}`);
    }
  }

  await browser.close();
  console.log('--- User-role assignment tests completed. ---');
})();
