import assert from 'node:assert/strict';
import test from 'node:test';
import { rateWebVital, trackWebVital } from '../src/utils/webVitals.js';

test('rates Core Web Vitals against their public thresholds', () => {
  assert.equal(rateWebVital('LCP', 2500), 'good');
  assert.equal(rateWebVital('LCP', 2501), 'needs_improvement');
  assert.equal(rateWebVital('CLS', 0.26), 'poor');
  assert.equal(rateWebVital('INP', 200), 'good');
  assert.equal(rateWebVital('UNKNOWN', 10), null);
});

test('reports rounded anonymous Web Vital values', () => {
  const calls = [];
  const target = { gtag: (...args) => calls.push(args) };

  assert.equal(trackWebVital('CLS', 0.12356, target), true);
  assert.equal(trackWebVital('LCP', 2875.7, target), true);
  assert.deepEqual(calls, [
    ['event', 'web_vital', {
      metric: 'CLS',
      metric_value: 0.124,
      metric_rating: 'needs_improvement',
    }],
    ['event', 'web_vital', {
      metric: 'LCP',
      metric_value: 2876,
      metric_rating: 'needs_improvement',
    }],
  ]);
});
