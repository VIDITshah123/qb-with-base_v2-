const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { login } = require('../test-helpers');

const testDataPath = path.join(__dirname, 'feature_toggles_test_data.csv');
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
    const { action, featureName, featureDescription, expected_result } = row;
    const testIndex = i + 1;
    let testStatus = 'failed';

    console.log(`--- Running test case ${testIndex}: action='${action}', featureName='${featureName}' ---`);

    try {
      await page.goto('http://localhost:3000/feature-toggles', { waitUntil: 'networkidle2' });

      if (action === 'create') {
        await page.click('a[href="/feature-toggles/create"]');
        await page.waitForSelector('form');
        await page.type('input[name="feature_name"]', featureName);
        await page.type('input[name="feature_description"]', featureDescription);
        await page.click('button[type=\"submit\"]');
        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('Feature toggle created successfully')) {
          testStatus = 'passed';
        }
      } else if (action === 'enable' || action === 'disable') {
        const featureRowSelector = `//td[contains(text(), \"${featureName}\")]/..`;
        await page.waitForSelector(`xpath/${featureRowSelector}`);
        const [featureRow] = await page.$x(featureRowSelector);
        const toggleSwitch = await featureRow.$('.form-check-input');
        
        const isEnabled = await toggleSwitch.getProperty('checked');
        const currentlyEnabled = await isEnabled.jsonValue();

        if ((action === 'enable' && !currentlyEnabled) || (action === 'disable' && currentlyEnabled)) {
            await toggleSwitch.click();
        }

        await page.waitForSelector('.toast-body', { visible: true });
        const toastMessage = await page.$eval('.toast-body', el => el.textContent);
        if (toastMessage.includes('Feature toggle updated successfully')) {
          testStatus = 'passed';
        }
      }
    } catch (error) {
      console.error(`Test case ${testIndex} threw an error:`, error.message);
      testStatus = 'failed';
    } finally {
      const screenshotName = `feature-toggles-test-${testIndex}-${action}-${featureName.replace(/\s+/g, '-')}-${testStatus}.png`;
      await page.screenshot({ path: path.join(screenshotsPath, screenshotName) });
      console.log(`Result: ${testStatus}`);
      console.log(`Screenshot saved to ${screenshotName}`);
    }
  }

  await browser.close();
  console.log('--- Feature toggle management tests completed. ---');
})();
