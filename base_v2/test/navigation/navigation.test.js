const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { login } = require('../test-helpers');

const testDataPath = path.join(__dirname, 'navigation_test_data.csv');
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
    const { linkText, expectedPath, parentLinkText } = row;
    const testIndex = i + 1;
    let testStatus = 'failed';

    console.log(`--- Running test case ${testIndex}: Navigating to '${linkText}' ---`);

    try {
      if (parentLinkText) {
        const parentLinkSelector = `//div[contains(@class, 'sidebar-link')]//span[contains(text(), "${parentLinkText}")]`;
        await page.waitForSelector(`xpath/${parentLinkSelector}`);
        const [parentLink] = await page.$x(parentLinkSelector);
        if (parentLink) {
          await parentLink.click();
          await page.waitForTimeout(500); // Wait for submenu to open
        }
      }

      const linkSelector = `//a[contains(@class, 'sidebar-link')]//span[contains(text(), "${linkText}")]`;
      await page.waitForSelector(`xpath/${linkSelector}`);
      const [link] = await page.$x(linkSelector);
      await link.click();

      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      const currentPath = new URL(page.url()).pathname;
      if (currentPath === expectedPath) {
        testStatus = 'passed';
      }

    } catch (error) {
      console.error(`Test case ${testIndex} threw an error:`, error.message);
      testStatus = 'failed';
    } finally {
      const screenshotName = `navigation-test-${testIndex}-${linkText.replace(/\s+/g, '-')}-${testStatus}.png`;
      await page.screenshot({ path: path.join(screenshotsPath, screenshotName) });
      console.log(`Result: ${testStatus}`);
      console.log(`Screenshot saved to ${screenshotName}`);
    }
  }

  await browser.close();
  console.log('--- Navigation tests completed. ---');
})();
