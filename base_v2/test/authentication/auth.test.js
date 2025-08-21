const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const testDataPath = path.join(__dirname, 'auth_test_data.csv');
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
  const browser = await puppeteer.launch(); // Headless by default
  const page = await browser.newPage();

  for (let i = 0; i < testData.length; i++) {
    const row = testData[i];
    const { username, password, expected_result } = row;
    const testIndex = i + 1;
    let testStatus = 'failed';

    console.log(`--- Running test case ${testIndex}: username='${username}' ---`);

    try {
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

      // Use a more robust selector for username if #username is too generic
      await page.waitForSelector('input[name="username"]', { visible: true });
      await page.type('input[name="username"]', username || '');
      await page.type('input[name="password"]', password || '');

      await page.click('button[type="submit"]');

      if (expected_result === 'success') {
        // Wait for the login API call to complete successfully
        await page.waitForResponse(
            response =>
                response.url().includes('/api/authentication/login') && response.status() === 200,
            { timeout: 10000 }
        );

        // Now that the backend has responded, wait for the client-side redirect
        await page.waitForFunction(
          'window.location.pathname.startsWith("/dashboard")',
          { timeout: 5000 }
        );

        // Finally, verify the dashboard content
                await page.waitForSelector('h2');
        const pageTitle = await page.$eval('h2', el => el.textContent);
        if (pageTitle.includes('Dashboard')) {
            testStatus = 'passed';
        }
      } else {
        // For failed logins with credentials, expect a server error
        if (username && password) {
            await page.waitForSelector('.alert-danger', { timeout: 5000 });
            const errorMessage = await page.$eval('.alert-danger', el => el.textContent);
            if (errorMessage) {
                testStatus = 'passed';
            }
        } else {
            // For empty fields, expect a client-side validation error
            await page.waitForSelector('.invalid-feedback', { timeout: 5000 });
            const validationMessage = await page.$eval('.invalid-feedback', el => el.textContent);
            if (validationMessage) {
                testStatus = 'passed';
            }
        }
      }
    } catch (error) {
      console.error(`Test case ${testIndex} with username '${username}' threw an error:`, error.message);
      testStatus = 'failed';
    } finally {
            const screenshotName = `auth-test-${testIndex}-${username || 'empty'}-${testStatus}.png`;
      await page.screenshot({ path: path.join(screenshotsPath, screenshotName) });
      console.log(`Result: ${testStatus}`);
      console.log(`Screenshot saved to ${screenshotName}`);

      // Logout if the test resulted in a successful login
            if (testStatus === 'passed' && expected_result === 'success') {
        try {
          // Directly call the logout function exposed by the AuthContext
          await page.evaluate(() => window.handleLogout());
          await page.waitForNavigation({ waitUntil: 'networkidle2' });
        } catch (e) {
          console.error('Could not log out:', e.message);
        }
      }

      // Clear cookies to ensure a clean state for the next test
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
    }
  }

  await browser.close();
  console.log('--- Authentication tests completed. ---');
})();
