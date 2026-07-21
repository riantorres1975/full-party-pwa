const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
const PARAM_NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
const SENSITIVE_PARAM_PATTERN = /name|nombre|phone|telefono|email|address|direccion|message|mensaje|search_term/i;
const MAX_STRING_LENGTH = 80;
const reportedErrors = new WeakSet();

function getWindowTarget(target) {
  if (target) return target;
  return typeof window !== 'undefined' ? window : null;
}

export function sanitizeAnalyticsParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => {
      if (!PARAM_NAME_PATTERN.test(key) || SENSITIVE_PARAM_PATTERN.test(key)) return [];
      if (typeof value === 'number') return Number.isFinite(value) ? [[key, value]] : [];
      if (typeof value === 'boolean') return [[key, value]];
      if (typeof value !== 'string') return [];

      const cleanValue = value.replace(/\s+/g, ' ').trim().slice(0, MAX_STRING_LENGTH);
      return cleanValue ? [[key, cleanValue]] : [];
    }),
  );
}

export function trackEvent(name, params = {}, target) {
  const windowTarget = getWindowTarget(target);
  if (!EVENT_NAME_PATTERN.test(name) || typeof windowTarget?.gtag !== 'function') return false;

  try {
    windowTarget.gtag('event', name, sanitizeAnalyticsParams(params));
    return true;
  } catch {
    return false;
  }
}

export function buildProductAnalyticsParams(product, extra = {}) {
  const price = Number(product?.precio);

  return sanitizeAnalyticsParams({
    item_id: product?.id === undefined || product?.id === null ? '' : String(product.id),
    item_category: product?.categoria || '',
    item_brand: product?.marca || '',
    price: Number.isFinite(price) ? price : 0,
    currency: 'MXN',
    ...extra,
  });
}

export function classifyError(error) {
  const signature = `${error?.name || ''} ${error?.message || ''}`.toLowerCase();
  if (/chunkloaderror|loading chunk|dynamically imported module/.test(signature)) {
    return 'asset_load';
  }
  if (/network|fetch|offline/.test(signature)) return 'network';
  if (error?.name === 'TypeError') return 'type_error';
  return 'unexpected';
}

export function trackAppError(error, { context = 'unknown', route = '' } = {}, target) {
  const canDeduplicate = error !== null && (typeof error === 'object' || typeof error === 'function');
  if (canDeduplicate && reportedErrors.has(error)) return false;

  const tracked = trackEvent('app_error', {
    error_type: classifyError(error),
    context,
    route,
  }, target);

  if (tracked && canDeduplicate) reportedErrors.add(error);
  return tracked;
}
