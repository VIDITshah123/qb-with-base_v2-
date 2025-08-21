const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { login } = require('../test-helpers');

const testDataPath = path.join(__dirname, 'permissions_test_data.csv');
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
    const { action, permissionName, permissionDescription, newPermissionDescription, expected_result } = row;
    const testIndex = i + 1;
    let testStatus = 'failed';

    console.log(`--- Running test case ${testIndex}: action='${action}', permissionName='${permissionName}' ---`);

    try {
      await page.goto('http://localhost:3000/permissions', { waitUntil: 'networkidle2' });

      if (action === 'create') {
        await page.click('a[href="/permissions/create"]');
        await page.waitForSelector('form');
        await page.type('input[name="permission_name"]', permissionName);
        await page.type('input[name="permission_description"]', permissionDescription);
        await page.click('button[type="submit"]');
        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('Permission created successfully')) {
          testStatus = 'passed';
        }
      } else if (action === 'edit') {
        const permissionRowSelector = `//td[contains(text(), "${permissionName}")]/..`;
                await page.waitForSelector(`xpath/${permissionRowSelector}`);
        const [permissionRow] = await page.$x(permissionRowSelector);
        const editButton = await permissionRow.$('a[href*="/edit"]');
        await editButton.click();

        await page.waitForSelector('form');
        const descriptionInput = await page.$('input[name="permission_description"]');
        await descriptionInput.click({ clickCount: 3 });
        await descriptionInput.press('Backspace');
        await descriptionInput.type(newPermissionDescription);
        await page.click('button[type="submit"]');
        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('Permission updated successfully')) {
          testStatus = 'passed';
        }
      } else if (action === 'delete') {
        const permissionRowSelector = `//td[contains(text(), "${permissionName}")]/..`;
                await page.waitForSelector(`xpath/${permissionRowSelector}`);
        const [permissionRow] = await page.$x(permissionRowSelector);
        const deleteButton = await permissionRow.$('button.btn-danger');
        await deleteButton.click();
        
        await page.waitForSelector('.modal-dialog');
        await page.click('.modal-footer .btn-danger');

        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('Permission deleted successfully')) {
          testStatus = 'passed';
        }
      }
    } catch (error) {
      console.error(`Test case ${testIndex} threw an error:`, error.message);
      testStatus = 'failed';
    } finally {
      const screenshotName = `permissions-test-${testIndex}-${action}-${permissionName.replace(/\s+/g, '-')}-${testStatus}.png`;
      await page.screenshot({ path: path.join(screenshotsPath, screenshotName) });
      console.log(`Result: ${testStatus}`);
      console.log(`Screenshot saved to ${screenshotName}`);
    }
  }

  await browser.close();
  console.log('--- Permission management tests completed. ---');
})();
