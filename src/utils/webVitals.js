import { trackEvent } from './analytics.js';

const THRESHOLDS = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
};

export function rateWebVital(name, value) {
  const thresholds = THRESHOLDS[name];
  if (!thresholds || !Number.isFinite(value) || value < 0) return null;
  if (value <= thresholds[0]) return 'good';
  if (value <= thresholds[1]) return 'needs_improvement';
  return 'poor';
}

export function trackWebVital(name, value, target) {
  const rating = rateWebVital(name, value);
  if (!rating) return false;

  const metricValue = name === 'CLS'
    ? Math.round(value * 1000) / 1000
    : Math.round(value);

  return trackEvent('web_vital', {
    metric: name,
    metric_value: metricValue,
    metric_rating: rating,
  }, target);
}

export function observeWebVitals(target = typeof window !== 'undefined' ? window : null) {
  const PerformanceObserverClass = target?.PerformanceObserver;
  const documentTarget = target?.document;
  if (!PerformanceObserverClass || !documentTarget) return () => {};

  const observers = [];
  const reported = new Set();
  const values = { LCP: null, CLS: 0, INP: null };
  let hasLayoutShift = false;

  const report = (name) => {
    if (reported.has(name) || values[name] === null) return;
    if (name === 'CLS' && !hasLayoutShift) return;
    if (trackWebVital(name, values[name], target)) reported.add(name);
  };

  const observe = (type, callback, options = {}) => {
    try {
      const observer = new PerformanceObserverClass((list) => callback(list.getEntries()));
      observer.observe({ type, buffered: true, ...options });
      observers.push(observer);
    } catch {
      // Older browsers may expose PerformanceObserver without every entry type.
    }
  };

  observe('largest-contentful-paint', (entries) => {
    const lastEntry = entries.at(-1);
    if (lastEntry) values.LCP = lastEntry.startTime;
  });

  observe('layout-shift', (entries) => {
    for (const entry of entries) {
      if (entry.hadRecentInput) continue;
      hasLayoutShift = true;
      values.CLS += entry.value;
    }
  });

  observe('event', (entries) => {
    for (const entry of entries) {
      if (!entry.interactionId) continue;
      values.INP = Math.max(values.INP || 0, entry.duration);
    }
  }, { durationThreshold: 40 });

  const reportLcp = () => report('LCP');
  const flush = () => {
    report('LCP');
    report('CLS');
    report('INP');
  };
  const handleVisibilityChange = () => {
    if (documentTarget.visibilityState === 'hidden') flush();
  };
  const lcpTimer = target.setTimeout(reportLcp, 5000);

  documentTarget.addEventListener('visibilitychange', handleVisibilityChange);
  target.addEventListener('pagehide', flush);

  return () => {
    target.clearTimeout(lcpTimer);
    documentTarget.removeEventListener('visibilitychange', handleVisibilityChange);
    target.removeEventListener('pagehide', flush);
    observers.forEach((observer) => observer.disconnect());
  };
}
