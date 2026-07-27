// ─────────────────────────────────────────────────────────────────────────────
// useCatalogCategories — árbol de categorías jerárquicas del catálogo V2.
// Caché en módulo + localStorage (TTL 10 min); las categorías cambian poco.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { listCategoryTree } from '../../services/catalog/categoriesRepository.js';
import { indexCategoriesBySlug } from '../../services/catalog/adapters.js';

const CACHE_KEY = 'fp_catalog_categories_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;

let memoryCache = null; // { tree, ts }

function readStorageCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (!raw || !Array.isArray(raw.tree) || Date.now() - raw.ts > CACHE_TTL_MS) return null;
    return raw.tree;
  } catch {
    return null;
  }
}

function writeStorageCache(tree) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), tree }));
  } catch {
    // cuota llena: solo caché en memoria
  }
}

/**
 * @returns {{ tree: Array, bySlug: Map<string,object>, loading: boolean,
 *   error: object|null, refresh: () => Promise<void> }}
 */
export function useCatalogCategories() {
  const [tree, setTree] = useState(() => memoryCache?.tree ?? readStorageCache() ?? []);
  const [loading, setLoading] = useState(() => !memoryCache && !readStorageCache());
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const bySlug = useRef(new Map());
  bySlug.current = tree.length > 0 ? indexCategoriesBySlug(tree) : new Map();

  const load = useCallback(async () => {
    try {
      const { tree: freshTree } = await listCategoryTree();
      if (!mountedRef.current) return;
      memoryCache = { tree: freshTree, ts: Date.now() };
      writeStorageCache(freshTree);
      setTree(freshTree);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { tree, bySlug: bySlug.current, loading, error, refresh: load };
}
