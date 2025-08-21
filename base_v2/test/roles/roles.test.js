const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const testDataPath = path.join(__dirname, 'roles_test_data.csv');
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
  await page.type('input[name="password"]', 'Admin@321');
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
    const { action, roleName, roleDescription, permissions, newRoleDescription, expected_result } = row;
    const testIndex = i + 1;
    let testStatus = 'failed';

    console.log(`--- Running test case ${testIndex}: action='${action}', roleName='${roleName}' ---`);

    try {
      await page.goto('http://localhost:3000/roles', { waitUntil: 'networkidle2' });

      if (action === 'create') {
        await page.click('a[href="/roles/create"]');
        await page.waitForSelector('form');
        await page.type('input[name="role_name"]', roleName);
        await page.type('input[name="role_description"]', roleDescription);
        // Note: This assumes permissions are passed as a comma-separated string of permission names (or IDs)
        // and that we can find checkboxes by a value or ID related to the permission name.
        const perms = permissions.split(',');
        for (const p of perms) {
          const checkboxSelector = `//input[@type='checkbox' and @value='${p}']`;
                    const [checkbox] = await page.$x(checkboxSelector);
          await page.waitForSelector(`xpath/${checkboxSelector}`);
          await checkbox.click();
        }
        await page.click('button[type="submit"]');
        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('Role created successfully')) {
          testStatus = 'passed';
        }
      } else if (action === 'edit') {
        const roleRowSelector = `//td[contains(text(), "${roleName}")]/..`;
                await page.waitForSelector(`xpath/${roleRowSelector}`);
        const [roleRow] = await page.$x(roleRowSelector);
        const editButton = await roleRow.$('a[href*="/edit"]');
        await editButton.click();

        await page.waitForSelector('form');
        const descriptionInput = await page.$('input[name="role_description"]');
        await descriptionInput.click({ clickCount: 3 }); // Select all text
        await descriptionInput.press('Backspace'); // Delete selected text
        await descriptionInput.type(newRoleDescription);
        await page.click('button[type="submit"]');
        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('Role updated successfully')) {
          testStatus = 'passed';
        }
      } else if (action === 'delete') {
        const roleRowSelector = `//td[contains(text(), "${roleName}")]/..`;
                await page.waitForSelector(`xpath/${roleRowSelector}`);
        const [roleRow] = await page.$x(roleRowSelector);
        const deleteButton = await roleRow.$('button.btn-danger');
        await deleteButton.click();
        
        await page.waitForSelector('.modal-dialog');
        await page.click('.modal-footer .btn-danger');

        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('Role deleted successfully')) {
          testStatus = 'passed';
        }
      }
    } catch (error) {
      console.error(`Test case ${testIndex} threw an error:`, error.message);
      testStatus = 'failed';
    } finally {
      const screenshotName = `roles-test-${testIndex}-${action}-${roleName.replace(/\s+/g, '-')}-${testStatus}.png`;
      await page.screenshot({ path: path.join(screenshotsPath, screenshotName) });
      console.log(`Result: ${testStatus}`);
      console.log(`Screenshot saved to ${screenshotName}`);
    }
  }

  await browser.close();
  console.log('--- Role management tests completed. ---');
})();
