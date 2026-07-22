import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateLighthouseReport, summarizeLighthouseReport } from '../scripts/run-lighthouse-audit.mjs';

function buildReport({ performance = 0.9, lcp = 2500, tbt = 100, cls = 0.05 } = {}) {
  return {
    categories: {
      performance: { score: performance },
      accessibility: { score: 1 },
      'best-practices': { score: 1 },
      seo: { score: 1 },
    },
    audits: {
      'largest-contentful-paint': { numericValue: lcp },
      'total-blocking-time': { numericValue: tbt },
      'cumulative-layout-shift': { numericValue: cls },
    },
  };
}

test('accepts a report within the mobile quality budget', () => {
  const scenario = { id: 'catalog-mobile', profile: 'mobile' };
  const report = buildReport();

  assert.deepEqual(evaluateLighthouseReport(report, scenario), []);
  assert.deepEqual(summarizeLighthouseReport(report, scenario), {
    id: 'catalog-mobile',
    profile: 'mobile',
    performance: 90,
    accessibility: 100,
    bestPractices: 100,
    seo: 100,
    lcp: 2500,
    tbt: 100,
    cls: 0.05,
  });
});

test('reports every quality budget regression', () => {
  const failures = evaluateLighthouseReport(
    buildReport({ performance: 0.7, lcp: 4500, tbt: 350, cls: 0.2 }),
    { id: 'catalog-mobile', profile: 'mobile' },
  );

  assert.deepEqual(failures, [
    'performance 70 < 80',
    'LCP 4500 > 4000',
    'TBT 350 > 300',
    'CLS 0.2 > 0.1',
  ]);
});
