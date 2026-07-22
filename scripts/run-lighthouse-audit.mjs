import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const BASE_URL = 'http://127.0.0.1:4173';
const REPORT_DIR = path.join(ROOT, 'test-results');

export const LIGHTHOUSE_BUDGET = {
  categories: {
    performance: 0.8,
    accessibility: 1,
    'best-practices': 0.95,
    seo: 1,
  },
  mobile: { lcp: 4000, tbt: 300, cls: 0.1 },
  desktop: { lcp: 3000, tbt: 200, cls: 0.1 },
};

const SCENARIOS = [
  { id: 'landing-mobile', pathname: '/', profile: 'mobile' },
  { id: 'catalog-mobile', pathname: '/catalogo', profile: 'mobile' },
  { id: 'landing-desktop', pathname: '/', profile: 'desktop' },
  { id: 'catalog-desktop', pathname: '/catalogo', profile: 'desktop' },
];

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} exited with code ${code}`));
    });
  });
}

async function waitForPreview(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Preview did not start at ${BASE_URL}`);
}

function score(report, category) {
  return Number(report.categories?.[category]?.score);
}

export function summarizeLighthouseReport(report, scenario) {
  return {
    id: scenario.id,
    profile: scenario.profile,
    performance: Math.round(score(report, 'performance') * 100),
    accessibility: Math.round(score(report, 'accessibility') * 100),
    bestPractices: Math.round(score(report, 'best-practices') * 100),
    seo: Math.round(score(report, 'seo') * 100),
    lcp: Math.round(report.audits?.['largest-contentful-paint']?.numericValue || 0),
    tbt: Math.round(report.audits?.['total-blocking-time']?.numericValue || 0),
    cls: Math.round((report.audits?.['cumulative-layout-shift']?.numericValue || 0) * 1000) / 1000,
  };
}

export function evaluateLighthouseReport(report, scenario, budget = LIGHTHOUSE_BUDGET) {
  const failures = [];
  for (const [category, minimum] of Object.entries(budget.categories)) {
    const actual = score(report, category);
    if (!Number.isFinite(actual) || actual < minimum) {
      failures.push(`${category} ${Math.round(actual * 100)} < ${Math.round(minimum * 100)}`);
    }
  }

  const metrics = budget[scenario.profile];
  const actualMetrics = {
    lcp: report.audits?.['largest-contentful-paint']?.numericValue,
    tbt: report.audits?.['total-blocking-time']?.numericValue,
    cls: report.audits?.['cumulative-layout-shift']?.numericValue,
  };
  for (const [metric, maximum] of Object.entries(metrics)) {
    const actual = Number(actualMetrics[metric]);
    if (!Number.isFinite(actual) || actual > maximum) {
      failures.push(`${metric.toUpperCase()} ${Math.round(actual * 1000) / 1000} > ${maximum}`);
    }
  }
  return failures;
}

async function auditScenario(scenario) {
  const outputPath = path.join(REPORT_DIR, `lighthouse-${scenario.id}.json`);
  const lighthouseCli = path.join(ROOT, 'node_modules', 'lighthouse', 'cli', 'index.js');
  const args = [
    lighthouseCli,
    `${BASE_URL}${scenario.pathname}`,
    '--quiet',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    `--output-path=${outputPath}`,
    '--chrome-flags=--headless --no-sandbox',
  ];
  if (scenario.profile === 'desktop') args.push('--preset=desktop');

  await runCommand(process.execPath, args);
  const report = JSON.parse(await readFile(outputPath, 'utf8'));
  return { summary: summarizeLighthouseReport(report, scenario), failures: evaluateLighthouseReport(report, scenario) };
}

async function stopPreview(preview) {
  if (preview.exitCode !== null) return;
  preview.kill('SIGTERM');
  await new Promise((resolve) => {
    preview.once('exit', resolve);
    setTimeout(resolve, 3000);
  });
}

export async function runLighthouseAudit() {
  await mkdir(REPORT_DIR, { recursive: true });
  const viteCli = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  const preview = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
  });

  try {
    await waitForPreview();
    const results = [];
    for (const scenario of SCENARIOS) results.push(await auditScenario(scenario));

    console.table(results.map(({ summary }) => summary));
    const failures = results.flatMap(({ summary, failures: scenarioFailures }) => (
      scenarioFailures.map((failure) => `${summary.id}: ${failure}`)
    ));
    if (failures.length > 0) throw new Error(`Lighthouse budget failed:\n- ${failures.join('\n- ')}`);
  } finally {
    await stopPreview(preview);
  }
}

const isDirectRun = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  runLighthouseAudit().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
