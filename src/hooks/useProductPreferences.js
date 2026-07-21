import { useCallback, useEffect, useMemo, useState } from 'react';

export const FAVORITES_STORAGE_KEY = 'fp_favorite_products_v1';
export const RECENT_PRODUCTS_STORAGE_KEY = 'fp_recent_products_v1';
const MAX_RECENT_PRODUCTS = 8;

export function normalizeProductIds(value, limit = Number.POSITIVE_INFINITY) {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map((id) => String(id || '').trim())
      .filter(Boolean),
  )].slice(0, limit);
}

export function updateRecentProductIds(currentIds, productId, limit = MAX_RECENT_PRODUCTS) {
  const id = String(productId || '').trim();
  if (!id) return normalizeProductIds(currentIds, limit);
  return normalizeProductIds([id, ...currentIds.filter((currentId) => currentId !== id)], limit);
}

function readIds(key, limit) {
  try {
    return normalizeProductIds(JSON.parse(localStorage.getItem(key) || '[]'), limit);
  } catch {
    return [];
  }
}

function writeIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Preferences remain available in memory when storage is unavailable.
  }
}

export function useProductPreferences() {
  const [favoriteIds, setFavoriteIds] = useState(() => readIds(FAVORITES_STORAGE_KEY));
  const [recentIds, setRecentIds] = useState(() => readIds(
    RECENT_PRODUCTS_STORAGE_KEY,
    MAX_RECENT_PRODUCTS,
  ));
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const isFavorite = useCallback(
    (productId) => favoriteIdSet.has(String(productId)),
    [favoriteIdSet],
  );

  const toggleFavorite = useCallback((productId) => {
    const id = String(productId || '').trim();
    if (!id) return;

    setFavoriteIds((currentIds) => {
      const nextIds = currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id];
      writeIds(FAVORITES_STORAGE_KEY, nextIds);
      return nextIds;
    });
  }, []);

  const recordViewedProduct = useCallback((productId) => {
    setRecentIds((currentIds) => {
      const nextIds = updateRecentProductIds(currentIds, productId);
      writeIds(RECENT_PRODUCTS_STORAGE_KEY, nextIds);
      return nextIds;
    });
  }, []);

  useEffect(() => {
    const syncPreferences = (event) => {
      if (event.key === FAVORITES_STORAGE_KEY) {
        setFavoriteIds(readIds(FAVORITES_STORAGE_KEY));
      }
      if (event.key === RECENT_PRODUCTS_STORAGE_KEY) {
        setRecentIds(readIds(RECENT_PRODUCTS_STORAGE_KEY, MAX_RECENT_PRODUCTS));
      }
    };

    window.addEventListener('storage', syncPreferences);
    return () => window.removeEventListener('storage', syncPreferences);
  }, []);

  return {
    favoriteIds,
    recentIds,
    isFavorite,
    toggleFavorite,
    recordViewedProduct,
  };
}
