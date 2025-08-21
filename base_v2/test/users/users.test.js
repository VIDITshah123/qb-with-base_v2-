const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { login } = require('../test-helpers');

const testDataPath = path.join(__dirname, 'users_test_data.csv');
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
    const { action, username, password, firstName, lastName, mobileNumber, role, newLastName, newRole, expected_result } = row;
    const testIndex = i + 1;
    let testStatus = 'failed';

    console.log(`--- Running test case ${testIndex}: action='${action}', username='${username}' ---`);

    try {
      await page.goto('http://localhost:3000/users', { waitUntil: 'networkidle2' });

      if (action === 'create') {
        await page.click('a[href="/users/create"]');
        await page.waitForSelector('form');
        await page.type('input[name="email"]', username);
        await page.type('input[name="password"]', password);
        await page.type('input[name="first_name"]', firstName);
        await page.type('input[name="last_name"]', lastName);
        await page.type('input[name="mobile_number"]', mobileNumber);
        await page.select('select[name="role_id"]', role); // This assumes role is the value of an option
        await page.click('button[type="submit"]');
        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('User created successfully')) {
          testStatus = 'passed';
        }
      } else if (action === 'edit') {
        // Find user row and click edit
        const userRowSelector = `//td[contains(text(), "${username}")]/..`;
                await page.waitForSelector(`xpath/${userRowSelector}`);
        const [userRow] = await page.$x(userRowSelector);
        const editButton = await userRow.$('a[href*="/edit"]');
        await editButton.click();

        await page.waitForSelector('form');
        await page.type('input[name="last_name"]', newLastName);
        // Add logic to change role if needed
        await page.click('button[type="submit"]');
        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('User updated successfully')) {
          testStatus = 'passed';
        }
      } else if (action === 'delete') {
        const userRowSelector = `//td[contains(text(), "${username}")]/..`;
                await page.waitForSelector(`xpath/${userRowSelector}`);
        const [userRow] = await page.$x(userRowSelector);
        const deleteButton = await userRow.$('button.btn-danger');
        await deleteButton.click();
        
        // Handle confirmation dialog
        await page.waitForSelector('.modal-dialog');
        await page.click('.modal-footer .btn-danger');

        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('User deleted successfully')) {
          testStatus = 'passed';
        }
      }
    } catch (error) {
      console.error(`Test case ${testIndex} threw an error:`, error.message);
      testStatus = 'failed';
    } finally {
      const screenshotName = `users-test-${testIndex}-${action}-${username.split('@')[0]}-${testStatus}.png`;
      await page.screenshot({ path: path.join(screenshotsPath, screenshotName) });
      console.log(`Result: ${testStatus}`);
      console.log(`Screenshot saved to ${screenshotName}`);
    }
  }

  await browser.close();
  console.log('--- User management tests completed. ---');
})();
