const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { login } = require('../test-helpers');

const testDataPath = path.join(__dirname, 'role_permissions_test_data.csv');
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


(async () => {
  const testData = await readTestData();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await login(page);

  for (let i = 0; i < testData.length; i++) {
    const row = testData[i];
    const { roleName, permissionToAssign, expected_result } = row;
    const testIndex = i + 1;
    let testStatus = 'failed';

    console.log(`--- Running test case ${testIndex}: Assigning permission '${permissionToAssign}' to role '${roleName}' ---`);

    try {
      await page.goto('http://localhost:3000/roles', { waitUntil: 'networkidle2' });

      const roleRowSelector = `//td[contains(text(), "${roleName}")]/..`;
            await page.waitForSelector(`xpath/${roleRowSelector}`);
      const [roleRow] = await page.$x(roleRowSelector);
      const assignPermissionButton = await roleRow.$('a[href*="/assign-permissions"]');
      await assignPermissionButton.click();

      await page.waitForSelector('form');
      const permissionCheckboxSelector = `//label[contains(text(), "${permissionToAssign}")]/input[@type='checkbox']`;
            await page.waitForSelector(`xpath/${permissionCheckboxSelector}`);
      const [permissionCheckbox] = await page.$x(permissionCheckboxSelector);
      await permissionCheckbox.click();

      await page.click('button[type="submit"]');

      await page.waitForSelector('.toast-body', { visible: true });
      const toastMessage = await page.$eval('.toast-body', el => el.textContent);
      if (toastMessage.includes('Permissions assigned successfully')) {
        testStatus = 'passed';
      }

    } catch (error) {
      console.error(`Test case ${testIndex} threw an error:`, error.message);
      testStatus = 'failed';
    } finally {
      const screenshotName = `role-permissions-test-${testIndex}-${roleName.replace(/\s+/g, '-')}-${permissionToAssign.replace(/\./g, '-')}-${testStatus}.png`;
      await page.screenshot({ path: path.join(screenshotsPath, screenshotName) });
      console.log(`Result: ${testStatus}`);
      console.log(`Screenshot saved to ${screenshotName}`);
    }
  }

  await browser.close();
  console.log('--- Role-permission assignment tests completed. ---');
})();
