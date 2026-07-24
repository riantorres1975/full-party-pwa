import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchPublicProductPage,
  PUBLIC_PRODUCTS_PAGE_SIZE,
  resolveCatalogRefreshLimit,
} from '../lib/productosPublicos';
import { getPublicRestClient } from '../lib/supabasePublicRest';
import { trackCatalogDataRequest } from '../utils/analytics';
import {
  readCatalogQueryCache,
  writeCatalogQueryCache,
} from '../utils/catalogQueryCache';
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

function getQueryCacheStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
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
  const initialCacheRef = useRef(
    readCatalogQueryCache(getQueryCacheStorage(), queryKey)
    || (isDefaultQuery(query) ? readCatalogCache() : null),
  );
  const [productos, setProductos] = useState(initialCacheRef.current?.data || []);
  const [totalCount, setTotalCount] = useState(initialCacheRef.current?.totalCount || 0);
  const [hasMore, setHasMore] = useState(
    () => initialCacheRef.current?.hasMore
      ?? (initialCacheRef.current?.data.length || 0) < (initialCacheRef.current?.totalCount || 0),
  );
  const [productsQueryKey, setProductsQueryKey] = useState(queryKey);
  const [loading, setLoading] = useState(() => !initialCacheRef.current);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [usingCachedData, setUsingCachedData] = useState(Boolean(initialCacheRef.current));
  const [loadMoreError, setLoadMoreError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const requestVersionRef = useRef(0);
  const activeQueryKeyRef = useRef(queryKey);
  const queryRef = useRef(query);
  const productsRef = useRef(productos);
  const totalCountRef = useRef(totalCount);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(false);
  const loadMoreControllerRef = useRef(null);
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
    const currentQueryKey = queryKey;
    const queryChanged = activeQueryKeyRef.current !== currentQueryKey;
    let hasExistingProducts = productsRef.current.length > 0;

    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = null;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setLoadMoreError(null);

    if (queryChanged) {
      activeQueryKeyRef.current = currentQueryKey;
      extraProductIdRef.current = null;
      setProductsQueryKey(currentQueryKey);
      const cachedQuery = readCatalogQueryCache(getQueryCacheStorage(), currentQueryKey);

      if (cachedQuery) {
        productsRef.current = cachedQuery.data;
        totalCountRef.current = cachedQuery.totalCount;
        hasMoreRef.current = cachedQuery.hasMore;
        hasExistingProducts = cachedQuery.data.length > 0;
        setProductos(cachedQuery.data);
        setTotalCount(cachedQuery.totalCount);
        setHasMore(cachedQuery.hasMore);
        setLoading(false);
        setUsingCachedData(true);
      } else {
        productsRef.current = [];
        totalCountRef.current = 0;
        hasMoreRef.current = false;
        hasExistingProducts = false;
        setProductos([]);
        setTotalCount(0);
        setHasMore(false);
        setUsingCachedData(false);
      }
    }

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
      // Refrescar sin colapsar: cubrir los productos ya cargados de esta
      // misma consulta (el producto requerido compartido se re-anexa aparte).
      const loadedCount = productsRef.current.filter(
        (product) => String(product.id) !== extraProductIdRef.current,
      ).length;
      const result = await fetchPublicProductPage(getPublicRestClient(), {
        limit: resolveCatalogRefreshLimit(loadedCount),
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
      const nextHasMore = result.hasMore;
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

      productsRef.current = nextProducts;
      totalCountRef.current = nextTotal;
      hasMoreRef.current = nextHasMore;
      startTransition(() => {
        setProductsQueryKey(currentQueryKey);
        setProductos(nextProducts);
        setTotalCount(nextTotal);
        setHasMore(nextHasMore);
        setUsingCachedData(false);
        setLoading(false);
        setRefreshing(false);
      });
      writeCatalogQueryCache(getQueryCacheStorage(), currentQueryKey, {
        data: result.data,
        totalCount: nextTotal,
        hasMore: nextHasMore,
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
    const controller = new AbortController();
    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = controller;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);
    const version = requestVersionRef.current;
    const currentQuery = queryRef.current;
    const currentQueryKey = JSON.stringify(currentQuery);
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
        signal: controller.signal,
      });
      if (controller.signal.aborted || requestVersionRef.current !== version) return;
      trackCatalogDataRequest({
        requestType: 'load_more',
        status: result.error ? 'error' : 'success',
        durationMs: Date.now() - startedAt,
        resultCount: result.data.length,
        hasFilters: hasActiveFilters(currentQuery),
      });
      if (result.error) {
        setLoadMoreError('No pudimos cargar más productos.');
        return;
      }

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
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
      const cacheProducts = next.filter(
        (product) => String(product.id) !== extraProductIdRef.current,
      );
      writeCatalogQueryCache(getQueryCacheStorage(), currentQueryKey, {
        data: cacheProducts,
        totalCount: totalCountRef.current || cacheProducts.length,
        hasMore: nextHasMore,
      });
      if (isDefaultQuery(currentQuery)) {
        writeCatalogCache(next, totalCountRef.current || next.length);
      }
    } finally {
      if (loadMoreControllerRef.current === controller) {
        loadMoreControllerRef.current = null;
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [enabled]);

  useEffect(() => () => {
    loadMoreControllerRef.current?.abort();
  }, []);

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

  const productsMatchQuery = productsQueryKey === queryKey;

  return {
    productos: productsMatchQuery ? productos : [],
    totalCount: productsMatchQuery ? totalCount : 0,
    hasMore: productsMatchQuery ? hasMore : false,
    loading: loading || !productsMatchQuery,
    loadingMore: productsMatchQuery && loadingMore,
    loadMoreError: productsMatchQuery ? loadMoreError : null,
    refreshing: productsMatchQuery && refreshing,
    error: productsMatchQuery ? error : null,
    usingCachedData: productsMatchQuery && usingCachedData,
    isPartialData: false,
    isInitialSyncing: !productsMatchQuery || (loading && productos.length === 0),
    refetch,
    loadMore,
  };
}
