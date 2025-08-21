const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const testDir = __dirname;

// Find all .test.js files recursively in the test directory
const findTestFiles = (dir) => {
  let testFiles = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      testFiles = testFiles.concat(findTestFiles(filePath));
    } else if (file.endsWith('.test.js')) {
      testFiles.push(filePath);
    }
  }

  return testFiles;
};

const screenshotsDir = path.join(__dirname, 'screenshots');

const generateHtmlReport = (results) => {
  const passedCount = results.filter(r => r.status === 'pass').length;
  const failedCount = results.length - passedCount;

  let rows = '';
  results.forEach(result => {
    const statusClass = result.status === 'pass' ? 'status-pass' : 'status-fail';
    const relativeTestPath = path.relative(__dirname, result.file);
    const screenshotsHtml = result.screenshots.map(screenshot => 
      `<a href="./screenshots/${screenshot}" target="_blank">${screenshot}</a>`
    ).join('<br>');

    rows += `
      <tr>
        <td>${relativeTestPath}</td>
        <td class="${statusClass}">${result.status.toUpperCase()}</td>
        <td>${screenshotsHtml || 'No new screenshots'}</td>
      </tr>
    `;
  });

  const reportHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Execution Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-card { padding: 20px; border-radius: 8px; color: white; min-width: 150px; }
        .total { background-color: #4a90e2; }
        .passed { background-color: #28a745; }
        .failed { background-color: #dc3545; }
        .status-pass { color: #28a745; font-weight: bold; }
        .status-fail { color: #dc3545; font-weight: bold; }
        a { color: #0066cc; }
      </style>
    </head>
    <body>
      <h1>Test Execution Report</h1>
      <h2>Summary</h2>
      <div class="summary">
        <div class="summary-card total"><strong>Total Tests:</strong> ${results.length}</div>
        <div class="summary-card passed"><strong>Passed:</strong> ${passedCount}</div>
        <div class="summary-card failed"><strong>Failed:</strong> ${failedCount}</div>
      </div>
      <h2>Details</h2>
      <table>
        <thead>
          <tr>
            <th>Test File</th>
            <th>Status</th>
            <th>Screenshots</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const reportPath = path.join(__dirname, 'test-report.html');
  fs.writeFileSync(reportPath, reportHtml);
  console.log(`\nHTML report generated at: ${reportPath}`);
};

const runTests = async () => {
  const testFiles = findTestFiles(testDir);

  if (testFiles.length === 0) {
    console.log('No test files found.');
    return;
  }

  console.log(`Found ${testFiles.length} test files. Running them sequentially...\n`);

  const results = [];
  let overallExitCode = 0;

  for (const file of testFiles) {
    console.log(`--- Executing: ${path.relative(testDir, file)} ---`);
    const screenshotsBefore = fs.existsSync(screenshotsDir) ? fs.readdirSync(screenshotsDir) : [];

    await new Promise(resolve => {
      const child = exec(`node "${file}"`);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        process.stdout.write(data);
        stdout += data;
      });

      child.stderr.on('data', (data) => {
        process.stderr.write(data);
        stderr += data;
      });

      child.on('close', (code) => {
        const screenshotsAfter = fs.existsSync(screenshotsDir) ? fs.readdirSync(screenshotsDir) : [];
        const newScreenshots = screenshotsAfter.filter(f => !screenshotsBefore.includes(f));

        if (code === 0) {
          console.log(`--- Finished: ${path.relative(testDir, file)} ---\n`);
          results.push({ file, status: 'pass', screenshots: newScreenshots });
        } else {
          console.error(`--- Error executing ${file} (Exit code: ${code}) ---\n`);
          results.push({ file, status: 'fail', screenshots: newScreenshots, error: stderr });
          overallExitCode = 1;
        }
        resolve();
      });
    });
  }

  generateHtmlReport(results);

  if (overallExitCode !== 0) {
    console.log('\nSome tests failed.');
    process.exit(1);
  } else {
    console.log('\nAll tests completed successfully.');
  }
};

runTests().catch(err => {
  console.error('An unexpected error occurred in the test runner:', err);
  process.exit(1);
});
