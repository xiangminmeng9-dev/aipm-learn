import { test, expect, Page, ConsoleMessage } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '../../test-results/screenshots');
const RESULTS_FILE = path.join(__dirname, '../../test-results/results.json');

interface TestResult {
  page: string;
  url: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  loadTime: number;
  consoleErrors: string[];
  checks: { name: string; passed: boolean; detail?: string }[];
  screenshot: string;
  error?: string;
}

const results: TestResult[] = [];

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err: Error) => {
    errors.push(`PageError: ${err.message}`);
  });
  return errors;
}

async function testPage(page: Page, url: string, pageName: string, extraChecks?: (page: Page) => Promise<{ name: string; passed: boolean; detail?: string }[]>) {
  const errors = collectConsoleErrors(page);
  const checks: { name: string; passed: boolean; detail?: string }[] = [];
  const startTime = Date.now();

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    // Check HTTP status
    const httpOk = response?.status() === 200;
    checks.push({ name: 'HTTP 200', passed: httpOk, detail: `Status: ${response?.status()}` });

    // Check page title
    const title = await page.title();
    checks.push({ name: 'Page title exists', passed: !!title, detail: title || 'empty' });

    // Check for visible content
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasContent = bodyText.trim().length > 10;
    checks.push({ name: 'Page has content', passed: hasContent, detail: hasContent ? `${bodyText.trim().substring(0, 80)}...` : 'empty body' });

    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      return Array.from(document.images)
        .filter(img => img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
        .map(img => img.src);
    });
    checks.push({ name: 'No broken images', passed: brokenImages.length === 0, detail: brokenImages.length > 0 ? `Broken: ${brokenImages.join(', ')}` : 'OK' });

    // Check for Next.js error overlay
    const hasErrorOverlay = await page.locator('[data-nextjs-dialog]').count().then(c => c > 0);
    checks.push({ name: 'No Next.js error overlay', passed: !hasErrorOverlay });

    // Wait for lazy content
    await page.waitForTimeout(2000);

    // Run extra checks
    if (extraChecks) {
      const extra = await extraChecks(page);
      checks.push(...extra);
    }

    // Screenshot
    const screenshotName = pageName.replace(/[^a-zA-Z0-9]/g, '_');
    const screenshotPath = path.join(SCREENSHOT_DIR, `${screenshotName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Filter console errors
    const filteredErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('manifest.json') &&
      !e.includes('DevTools') &&
      !e.includes('Download the React DevTools')
    );

    const allPassed = checks.every(c => c.passed) && filteredErrors.length === 0;

    results.push({
      page: pageName,
      url,
      status: allPassed ? 'PASS' : 'FAIL',
      loadTime,
      consoleErrors: filteredErrors,
      checks,
      screenshot: screenshotPath,
    });
  } catch (err: any) {
    const loadTime = Date.now() - startTime;
    const screenshotName = pageName.replace(/[^a-zA-Z0-9]/g, '_');
    const screenshotPath = path.join(SCREENSHOT_DIR, `${screenshotName}_error.png`);
    try { await page.screenshot({ path: screenshotPath }); } catch {}

    results.push({
      page: pageName,
      url,
      status: 'FAIL',
      loadTime,
      consoleErrors: errors,
      checks,
      screenshot: screenshotPath,
      error: err.message,
    });
  }
}

test.describe('AI PM Learning Platform - Full QA', () => {
  test('Homepage', async ({ page }) => {
    await testPage(page, `${BASE_URL}/`, 'Homepage', async (p) => {
      const hasLinks = await p.locator('a[href]').count().then(c => c > 0);
      return [{ name: 'Navigation links present', passed: hasLinks }];
    });
  });

  test('Notebook Dashboard', async ({ page }) => {
    await testPage(page, `${BASE_URL}/notebook/dashboard`, 'Notebook_Dashboard');
  });

  test('Notebook Todos', async ({ page }) => {
    await testPage(page, `${BASE_URL}/notebook/todos`, 'Notebook_Todos', async (p) => {
      const hasInput = await p.locator('input, textarea').count().then(c => c > 0);
      return [{ name: 'Has input for adding todos', passed: hasInput }];
    });
  });

  test('Notebook Notes', async ({ page }) => {
    await testPage(page, `${BASE_URL}/notebook/notes`, 'Notebook_Notes');
  });

  test('Simulator Dashboard', async ({ page }) => {
    await testPage(page, `${BASE_URL}/simulator/dashboard`, 'Simulator_Dashboard');
  });

  test('Simulator Workflow', async ({ page }) => {
    await testPage(page, `${BASE_URL}/simulator/workflow`, 'Simulator_Workflow');
  });

  test('Interview Dashboard', async ({ page }) => {
    await testPage(page, `${BASE_URL}/interview/dashboard`, 'Interview_Dashboard');
  });

  test('Interview Methodology', async ({ page }) => {
    await testPage(page, `${BASE_URL}/interview/methodology`, 'Interview_Methodology');
  });

  test('Skills Dashboard', async ({ page }) => {
    await testPage(page, `${BASE_URL}/skills/dashboard`, 'Skills_Dashboard');
  });

  test('Skills JD Analysis', async ({ page }) => {
    await testPage(page, `${BASE_URL}/skills/jd-analysis`, 'Skills_JD_Analysis');
  });

  test('Daily Challenge Dashboard', async ({ page }) => {
    await testPage(page, `${BASE_URL}/daily-challenge/dashboard`, 'DailyChallenge_Dashboard');
  });

  test('Daily Challenge Tech', async ({ page }) => {
    await testPage(page, `${BASE_URL}/daily-challenge/tech`, 'DailyChallenge_Tech');
  });

  test('Resume Dashboard', async ({ page }) => {
    await testPage(page, `${BASE_URL}/resume/dashboard`, 'Resume_Dashboard');
  });

  test.afterAll(async () => {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    console.log('\n=== TEST RESULTS SUMMARY ===');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    results.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      const failedChecks = r.checks.filter(c => !c.passed).map(c => c.name);
      console.log(`${icon} ${r.page} (${r.loadTime}ms)${failedChecks.length ? ' - Failed: ' + failedChecks.join(', ') : ''}`);
      if (r.consoleErrors.length > 0) {
        console.log(`   Console errors: ${r.consoleErrors.slice(0, 3).join('; ')}`);
      }
      if (r.error) {
        console.log(`   Error: ${r.error.substring(0, 100)}`);
      }
    });
  });
});
