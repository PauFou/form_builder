#!/usr/bin/env node

const { chromium } = require('playwright');
const { injectAxe, checkA11y } = require('axe-playwright');
const fs = require('fs').promises;
const path = require('path');

const PAGES_TO_TEST = [
  { url: 'http://localhost:3000', name: 'home' },
  { url: 'http://localhost:3000/forms', name: 'forms-list' },
  { url: 'http://localhost:3000/forms/new', name: 'form-create' },
  { url: 'http://localhost:3001/preview/sample', name: 'form-preview' },
];

const WCAG_AA_RULES = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  },
};

async function runAccessibilityTests() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = [];
  
  console.log('🔍 Running accessibility tests...\n');
  
  for (const pageInfo of PAGES_TO_TEST) {
    console.log(`Testing ${pageInfo.name} (${pageInfo.url})...`);
    
    const page = await context.newPage();
    
    try {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' });
      await injectAxe(page);
      
      // Run accessibility checks
      const violations = await checkA11y(page, null, {
        axeOptions: WCAG_AA_RULES,
      });
      
      results.push({
        page: pageInfo.name,
        url: pageInfo.url,
        violations: violations || [],
        timestamp: new Date().toISOString(),
      });
      
      if (violations && violations.length > 0) {
        console.log(`❌ Found ${violations.length} accessibility violations`);
        violations.forEach((violation) => {
          console.log(`   - ${violation.help} (${violation.impact})`);
          console.log(`     ${violation.helpUrl}`);
        });
      } else {
        console.log('✅ No accessibility violations found');
      }
    } catch (error) {
      console.error(`❌ Error testing ${pageInfo.name}:`, error.message);
      results.push({
        page: pageInfo.name,
        url: pageInfo.url,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      await page.close();
    }
    
    console.log('');
  }
  
  await browser.close();
  
  // Save results
  const resultsDir = path.join(process.cwd(), 'a11y-results');
  await fs.mkdir(resultsDir, { recursive: true });
  
  const reportPath = path.join(resultsDir, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(results);
  const htmlPath = path.join(resultsDir, 'report.html');
  await fs.writeFile(htmlPath, htmlReport);
  
  // Check if any violations were found
  const hasViolations = results.some(
    (result) => result.violations && result.violations.length > 0
  );
  
  if (hasViolations) {
    console.log('❌ Accessibility violations found. See a11y-results/report.html for details.');
    process.exit(1);
  } else {
    console.log('✅ All accessibility tests passed!');
  }
}

function generateHTMLReport(results) {
  const totalViolations = results.reduce(
    (sum, result) => sum + (result.violations?.length || 0),
    0
  );
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #2563eb; }
    h2 { color: #1e40af; margin-top: 30px; }
    .summary {
      background: #f0f9ff;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .page-result {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .violation {
      background: #fef2f2;
      border: 1px solid #ef4444;
      border-radius: 4px;
      padding: 15px;
      margin: 10px 0;
    }
    .success {
      background: #f0fdf4;
      border: 1px solid #10b981;
      border-radius: 4px;
      padding: 15px;
      margin: 10px 0;
    }
    .impact-critical { color: #991b1b; font-weight: bold; }
    .impact-serious { color: #dc2626; font-weight: bold; }
    .impact-moderate { color: #f59e0b; }
    .impact-minor { color: #6b7280; }
    code {
      background: #f3f4f6;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>Accessibility Test Report (WCAG AA)</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Total Pages Tested:</strong> ${results.length}</p>
    <p><strong>Total Violations:</strong> ${totalViolations}</p>
    <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
  </div>
  
  ${results
    .map(
      (result) => `
    <div class="page-result">
      <h2>${result.page}</h2>
      <p><strong>URL:</strong> <code>${result.url}</code></p>
      
      ${
        result.error
          ? `<div class="violation">Error: ${result.error}</div>`
          : result.violations.length === 0
          ? '<div class="success">✅ No accessibility violations found!</div>'
          : result.violations
              .map(
                (violation) => `
          <div class="violation">
            <h3>${violation.help}</h3>
            <p class="impact-${violation.impact}">Impact: ${violation.impact}</p>
            <p>${violation.description}</p>
            <p><strong>WCAG:</strong> ${violation.tags.join(', ')}</p>
            <p><strong>Elements affected:</strong> ${violation.nodes.length}</p>
            <details>
              <summary>View details</summary>
              <ul>
                ${violation.nodes
                  .map(
                    (node) => `
                  <li>
                    <code>${node.target.join(' ')}</code>
                    <br>
                    ${node.failureSummary}
                  </li>
                `
                  )
                  .join('')}
              </ul>
            </details>
            <p><a href="${violation.helpUrl}" target="_blank">Learn more →</a></p>
          </div>
        `
              )
              .join('')
      }
    </div>
  `
    )
    .join('')}
</body>
</html>
  `;
}

// Run tests
runAccessibilityTests().catch(console.error);