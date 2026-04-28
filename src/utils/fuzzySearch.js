import Fuse from 'fuse.js';

const DEFAULT_FUSE_OPTIONS = {
  shouldSort: true,
  ignoreLocation: true,
  ignoreDiacritics: true,
  threshold: 0.35,
  minMatchCharLength: 1,
};

function normalizarQuery(query) {
  return String(query || '').trim();
}

export function fuzzySearch(items, query, keys, options = {}) {
  const q = normalizarQuery(query);
  if (!q) return items;
  if (!Array.isArray(items) || items.length === 0) return [];

  const fuse = new Fuse(items, {
    ...DEFAULT_FUSE_OPTIONS,
    ...options,
    keys,
  });

  return fuse.search(q).map(result => result.item);
}

export function fuzzySearchByText(items, query, getText, options = {}) {
  const q = normalizarQuery(query);
  if (!q) return items;
  if (!Array.isArray(items) || items.length === 0) return [];

  const indexed = items.map(item => ({ item, text: getText(item) }));
  const fuse = new Fuse(indexed, {
    ...DEFAULT_FUSE_OPTIONS,
    ...options,
    keys: ['text'],
  });

  return fuse.search(q).map(result => result.item.item);
}
