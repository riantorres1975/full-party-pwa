import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchPublicProductPage,
  PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE,
  PUBLIC_PRODUCTS_PAGE_SIZE,
} from '../lib/productosPublicos';
import { getPublicRestClient } from '../lib/supabasePublicRest';
import { trackCatalogDataRequest } from '../utils/analytics';
import { deferSupabase } from '../utils/deferSupabase';

const CATALOG_CACHE_KEY = 'fp_catalog_pages_v2';
const CATALOG_CACHE_LIMIT = 200;

function normalizeList(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value ?? '').trim())
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

export function normalizeCatalogQuery({
  search = '',
  categories = [],
  brands = [],
  sizes = [],
  minPrice = null,
  maxPrice = null,
  ids = [],
  sortOrder = 'featured',
} = {}) {
  return {
    search: String(search).trim(),
    categories: normalizeList(categories),
    brands: normalizeList(brands),
    sizes: normalizeList(sizes),
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
    ids: normalizeList(ids),
    sortOrder,
  };
}

function isDefaultQuery(query) {
  return !query.search
    && query.categories.length === 0
    && query.brands.length === 0
    && query.sizes.length === 0
    && query.minPrice === null
    && query.maxPrice === null
    && query.ids.length === 0
    && query.sortOrder === 'featured';
}

function hasActiveFilters(query) {
  return Boolean(
    query.search
    || query.categories.length
    || query.brands.length
    || query.sizes.length
    || query.minPrice !== null
    || query.maxPrice !== null
    || query.ids.length,
  );
}

function readCatalogCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || 'null');
    if (!parsed || !Array.isArray(parsed.data)) return null;
    return {
      data: parsed.data.slice(0, CATALOG_CACHE_LIMIT),
      totalCount: Number.isInteger(parsed.totalCount) ? parsed.totalCount : parsed.data.length,
    };
  } catch {
    return null;
  }
}

function writeCatalogCache(data, totalCount) {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      totalCount,
      complete: data.length >= totalCount,
      data: data.slice(0, CATALOG_CACHE_LIMIT),
    }));
  } catch {
    // Keep the current page in memory when storage quota is unavailable.
  }
}

function appendUnique(current, incoming) {
  const knownIds = new Set(current.map(({ id }) => String(id)));
  return [
    ...current,
    ...incoming.filter(({ id }) => {
      const key = String(id);
      if (!key || knownIds.has(key)) return false;
      knownIds.add(key);
      return true;
    }),
  ];
}

export function useCatalogProducts(queryInput, {
  enabled = true,
  requiredProductId = null,
} = {}) {
  const query = useMemo(() => normalizeCatalogQuery(queryInput), [queryInput]);
  const queryKey = JSON.stringify(query);
  const initialCacheRef = useRef(isDefaultQuery(query) ? readCatalogCache() : null);
  const [productos, setProductos] = useState(initialCacheRef.current?.data || []);
  const [totalCount, setTotalCount] = useState(initialCacheRef.current?.totalCount || 0);
  const [hasMore, setHasMore] = useState(
    () => (initialCacheRef.current?.data.length || 0) < (initialCacheRef.current?.totalCount || 0),
  );
  const [loading, setLoading] = useState(() => !initialCacheRef.current);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [usingCachedData, setUsingCachedData] = useState(Boolean(initialCacheRef.current));
  const [refreshTick, setRefreshTick] = useState(0);
  const requestVersionRef = useRef(0);
  const queryRef = useRef(query);
  const productsRef = useRef(productos);
  const totalCountRef = useRef(totalCount);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(false);
  const requiredProductIdRef = useRef(requiredProductId);
  const extraProductIdRef = useRef(null);

  queryRef.current = query;
  productsRef.current = productos;
  totalCountRef.current = totalCount;
  hasMoreRef.current = hasMore;
  requiredProductIdRef.current = requiredProductId;

  const loadRequiredProduct = useCallback(async (currentProducts, signal) => {
    const id = String(requiredProductIdRef.current || '').trim();
    if (!id || currentProducts.some((product) => String(product.id) === id)) {
      return currentProducts;
    }

    const startedAt = Date.now();
    const result = await fetchPublicProductPage(getPublicRestClient(), {
      limit: 1,
      filters: { ids: [id] },
      signal,
    });
    if (!signal?.aborted) {
      trackCatalogDataRequest({
        requestType: 'shared_product',
        status: result.error ? 'error' : 'success',
        durationMs: Date.now() - startedAt,
        resultCount: result.data.length,
        hasFilters: true,
      });
    }
    if (result.error || result.data.length === 0) return currentProducts;
    return appendUnique(currentProducts, result.data);
  }, []);

  useEffect(() => {
    const version = requestVersionRef.current + 1;
    requestVersionRef.current = version;
    const controller = new AbortController();
    const currentQuery = queryRef.current;
    const hasExistingProducts = productsRef.current.length > 0;

    if (!enabled) {
      setProductos([]);
      setTotalCount(0);
      setHasMore(false);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return () => controller.abort();
    }

    if (hasExistingProducts) {
      setRefreshing(true);
    } else {
      setTotalCount(0);
      setHasMore(false);
      setLoading(true);
    }
    setError(null);

    async function loadInitialPage() {
      const startedAt = Date.now();
      const result = await fetchPublicProductPage(getPublicRestClient(), {
        limit: PUBLIC_PRODUCTS_INITIAL_PAGE_SIZE,
        filters: currentQuery,
        sortOrder: currentQuery.sortOrder,
        signal: controller.signal,
      });

      if (controller.signal.aborted || requestVersionRef.current !== version) return;
      if (result.error) {
        trackCatalogDataRequest({
          requestType: 'initial',
          status: 'error',
          durationMs: Date.now() - startedAt,
          hasFilters: hasActiveFilters(currentQuery),
          usingCache: hasExistingProducts,
        });
        if (!hasExistingProducts) {
          setError('Error al cargar productos. Intenta de nuevo mas tarde.');
        } else {
          setUsingCachedData(true);
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const nextProducts = await loadRequiredProduct(result.data, controller.signal);
      if (controller.signal.aborted || requestVersionRef.current !== version) return;
      const nextTotal = result.count ?? result.data.length;
      extraProductIdRef.current = nextProducts.length > result.data.length
        ? String(requiredProductIdRef.current || '')
        : null;
      trackCatalogDataRequest({
        requestType: 'initial',
        status: 'success',
        durationMs: Date.now() - startedAt,
        resultCount: result.data.length,
        hasFilters: hasActiveFilters(currentQuery),
        usingCache: hasExistingProducts,
      });

      startTransition(() => {
        setProductos(nextProducts);
        setTotalCount(nextTotal);
        setHasMore(result.hasMore);
        setUsingCachedData(false);
        setLoading(false);
        setRefreshing(false);
      });
      if (isDefaultQuery(currentQuery)) writeCatalogCache(nextProducts, nextTotal);
    }

    loadInitialPage().catch(() => {
      if (controller.signal.aborted || requestVersionRef.current !== version) return;
      trackCatalogDataRequest({
        requestType: 'initial',
        status: 'error',
        hasFilters: hasActiveFilters(currentQuery),
        usingCache: hasExistingProducts,
      });
      setError('Error al cargar productos. Intenta de nuevo mas tarde.');
      setLoading(false);
      setRefreshing(false);
    });

    return () => controller.abort();
  }, [enabled, loadRequiredProduct, queryKey, refreshTick]);

  const loadMore = useCallback(async () => {
    if (!enabled || loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const version = requestVersionRef.current;
    const currentQuery = queryRef.current;
    const offset = productsRef.current.filter(
      (product) => String(product.id) !== extraProductIdRef.current,
    ).length;
    const startedAt = Date.now();

    try {
      const result = await fetchPublicProductPage(getPublicRestClient(), {
        offset,
        limit: PUBLIC_PRODUCTS_PAGE_SIZE,
        filters: currentQuery,
        sortOrder: currentQuery.sortOrder,
        includeCount: false,
      });
      if (requestVersionRef.current !== version) return;
      trackCatalogDataRequest({
        requestType: 'load_more',
        status: result.error ? 'error' : 'success',
        durationMs: Date.now() - startedAt,
        resultCount: result.data.length,
        hasFilters: hasActiveFilters(currentQuery),
      });
      if (result.error) return;

      const next = appendUnique(productsRef.current, result.data);
      productsRef.current = next;
      setProductos(next);
      if (Number.isInteger(result.count)) {
        totalCountRef.current = result.count;
        setTotalCount(result.count);
      }
      const nextHasMore = Number.isInteger(totalCountRef.current)
        ? offset + result.data.length < totalCountRef.current
        : result.hasMore;
      setHasMore(nextHasMore);
      if (isDefaultQuery(currentQuery)) {
        writeCatalogCache(next, totalCountRef.current || next.length);
      }
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [enabled]);

  useEffect(() => {
    let timer;
    let realtimeClient;
    let channel;
    const cancelDeferredLoad = deferSupabase((supabase) => {
      realtimeClient = supabase;
      channel = supabase
        .channel('catalogo-paginado-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            setRefreshTick((tick) => tick + 1);
            window.dispatchEvent(new Event('fp:catalog-facets-stale'));
          }, 250);
        })
        .subscribe();
    });

    return () => {
      window.clearTimeout(timer);
      cancelDeferredLoad();
      if (realtimeClient && channel) realtimeClient.removeChannel(channel);
    };
  }, []);

  const refetch = useCallback(() => {
    if (loading || refreshing) return;
    setRefreshTick((tick) => tick + 1);
  }, [loading, refreshing]);

  return {
    productos,
    totalCount,
    hasMore,
    loading,
    loadingMore,
    refreshing,
    error,
    usingCachedData,
    isPartialData: false,
    isInitialSyncing: loading && productos.length === 0,
    refetch,
    loadMore,
  };
}
