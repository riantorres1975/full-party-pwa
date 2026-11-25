import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteAdminProduct,
  getAdminProductById,
  listAdminProducts,
  registerAdminQuickProduct,
  saveAdminProduct,
} from '../../services/catalog/adminProductsRepository.js';
import { listAdminCatalogResource } from '../../services/catalog/adminCatalogRepository.js';
import {
  deleteAdminInventory,
  deleteAdminPresentation,
  deleteAdminPriceTier,
  deleteAdminVariant,
  saveAdminInventory,
  saveAdminPresentation,
  saveAdminPriceTier,
  saveAdminVariant,
} from '../../services/catalog/adminCommercialRepository.js';
import { applyAdminCommercialRows } from '../../services/catalog/adminBulkRepository.js';

const PAGE_SIZE = 18;

export function useAdminProductsWorkspace({ search = '', active, categoryId } = {}) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [lookups, setLookups] = useState({
    categories: [],
    brands: [],
    lines: [],
    colors: [],
    sizes: [],
    locations: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [moreError, setMoreError] = useState(null);
  const [lookupsError, setLookupsError] = useState(null);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [lookupsToken, setLookupsToken] = useState(0);
  const listingRef = useRef(null);

  const refresh = useCallback(() => setReloadToken((value) => value + 1), []);
  const retryLookups = () => setLookupsToken(value => value + 1);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLookupsLoading(true);
      setLookupsError(null);
      try {
        const [categories, brands, lines, colors, sizes, locations] = await Promise.all([
          listAdminCatalogResource('categories', { signal: controller.signal }),
          listAdminCatalogResource('brands', { signal: controller.signal }),
          listAdminCatalogResource('lines', { signal: controller.signal }),
          listAdminCatalogResource('colors', { signal: controller.signal }),
          listAdminCatalogResource('sizes', { signal: controller.signal }),
          listAdminCatalogResource('locations', { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) setLookups({ categories, brands, lines, colors, sizes, locations });
      } catch (loadError) {
        if (!controller.signal.aborted) setLookupsError(loadError);
      } finally {
        if (!controller.signal.aborted) setLookupsLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [lookupsToken]);

  useEffect(() => {
    const controller = new AbortController();
    const listing = { controller, loadingMore: false };
    listingRef.current = listing;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setMoreError(null);

    listAdminProducts({ limit: PAGE_SIZE, search, active, categoryId }, { signal: controller.signal })
      .then(page => {
        if (controller.signal.aborted) return;
        setProducts(page.products);
        setTotal(page.total);
      })
      .catch(loadError => { if (!controller.signal.aborted) setError(loadError); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [active, categoryId, reloadToken, search]);

  const loadMore = useCallback(async () => {
    const listing = listingRef.current;
    if (!listing || listing.loadingMore || loading || products.length >= total) return;
    const { signal } = listing.controller;
    listing.loadingMore = true;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const page = await listAdminProducts({
        offset: products.length,
        limit: PAGE_SIZE,
        search,
        active,
        categoryId,
      }, { signal });
      if (signal.aborted) return;
      setProducts((current) => [...current, ...page.products]);
      setTotal(page.total);
    } catch (loadError) {
      if (!signal.aborted) setMoreError(loadError);
    } finally {
      listing.loadingMore = false;
      if (!signal.aborted) setLoadingMore(false);
    }
  }, [active, categoryId, loading, products.length, search, total]);

  const saveProduct = useCallback(async (input, id = null) => {
    setSaving(true);
    try {
      const saved = await saveAdminProduct(input, { id });
      refresh();
      return saved;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const registerQuickProduct = useCallback(async (registration) => {
    try {
      return await registerAdminQuickProduct(registration);
    } finally {
      refresh();
    }
  }, [refresh]);

  const removeProduct = useCallback(async (id) => {
    setSaving(true);
    try {
      await deleteAdminProduct(id);
      refresh();
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const mutateCommercial = useCallback(async (productId, operation) => {
    setSaving(true);
    try {
      await operation();
      const refreshed = await getAdminProductById(productId);
      setProducts((current) => current.map(
        (product) => (product.id === productId ? refreshed : product),
      ));
      return refreshed;
    } finally {
      setSaving(false);
    }
  }, []);

  const commercial = {
    saveVariant: (productId, input, id = null) => mutateCommercial(
      productId,
      () => saveAdminVariant(productId, input, { id }),
    ),
    deleteVariant: (productId, id) => mutateCommercial(
      productId,
      () => deleteAdminVariant(id),
    ),
    savePresentation: (productId, variantId, input, id = null) => mutateCommercial(
      productId,
      () => saveAdminPresentation(variantId, input, { id }),
    ),
    deletePresentation: (productId, id) => mutateCommercial(
      productId,
      () => deleteAdminPresentation(id),
    ),
    savePriceTier: (productId, presentationId, input, id = null) => mutateCommercial(
      productId,
      () => saveAdminPriceTier(presentationId, input, { id }),
    ),
    deletePriceTier: (productId, id) => mutateCommercial(
      productId,
      () => deleteAdminPriceTier(id),
    ),
    saveInventory: (productId, input, id = null) => mutateCommercial(
      productId,
      () => saveAdminInventory(input, { id }),
    ),
    deleteInventory: (productId, id) => mutateCommercial(
      productId,
      () => deleteAdminInventory(id),
    ),
    applyBulkRows: async (productId, rows) => {
      setSaving(true);
      try {
        const report = await applyAdminCommercialRows(productId, rows);
        const refreshed = await getAdminProductById(productId);
        setProducts((current) => current.map(
          (product) => (product.id === productId ? refreshed : product),
        ));
        return { report, product: refreshed };
      } finally {
        setSaving(false);
      }
    },
  };

  return {
    products,
    total,
    lookups,
    lookupsLoading,
    lookupsError,
    retryLookups,
    loading,
    loadingMore,
    saving,
    error,
    moreError,
    refresh,
    saveProduct,
    registerQuickProduct,
    removeProduct,
    loadMore,
    commercial,
  };
}
