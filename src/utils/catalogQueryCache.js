export const CATALOG_QUERY_CACHE_KEY = 'fp_catalog_query_pages_v1';
export const CATALOG_QUERY_CACHE_TTL_MS = 10 * 60 * 1000;
export const CATALOG_QUERY_CACHE_MAX_ENTRIES = 8;
export const CATALOG_QUERY_CACHE_MAX_PRODUCTS = 200;

function readEntries(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem(CATALOG_QUERY_CACHE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isFresh(entry, now) {
  return Number.isFinite(entry?.ts)
    && now - entry.ts <= CATALOG_QUERY_CACHE_TTL_MS;
}

function normalizeEntry(entry) {
  if (!entry || typeof entry.key !== 'string' || !Array.isArray(entry.data)) return null;

  const data = entry.data.slice(0, CATALOG_QUERY_CACHE_MAX_PRODUCTS);
  const totalCount = Number.isInteger(entry.totalCount)
    ? Math.max(entry.totalCount, data.length)
    : data.length;

  return {
    key: entry.key,
    ts: Number(entry.ts),
    data,
    totalCount,
    hasMore: typeof entry.hasMore === 'boolean'
      ? entry.hasMore
      : data.length < totalCount,
  };
}

export function readCatalogQueryCache(storage, key, now = Date.now()) {
  const entry = readEntries(storage)
    .map(normalizeEntry)
    .find((candidate) => candidate?.key === key && isFresh(candidate, now));

  if (!entry) return null;
  return {
    data: entry.data,
    totalCount: entry.totalCount,
    hasMore: entry.hasMore,
  };
}

export function writeCatalogQueryCache(
  storage,
  key,
  {
    data,
    totalCount,
    hasMore,
  },
  now = Date.now(),
) {
  if (!storage || typeof key !== 'string' || !Array.isArray(data)) return false;

  const entry = normalizeEntry({
    key,
    ts: now,
    data,
    totalCount,
    hasMore,
  });
  if (!entry) return false;

  const entries = readEntries(storage)
    .map(normalizeEntry)
    .filter((candidate) => (
      candidate
      && candidate.key !== key
      && isFresh(candidate, now)
    ));

  try {
    storage.setItem(
      CATALOG_QUERY_CACHE_KEY,
      JSON.stringify([entry, ...entries].slice(0, CATALOG_QUERY_CACHE_MAX_ENTRIES)),
    );
    return true;
  } catch {
    return false;
  }
}
