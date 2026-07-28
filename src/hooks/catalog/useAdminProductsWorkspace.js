import { useCallback, useEffect, useState } from 'react';
import {
  deleteAdminProduct,
  getAdminProductById,
  listAdminProducts,
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

const PAGE_SIZE = 18;

export function useAdminProductsWorkspace(search = '') {
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
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => setReloadToken((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [page, categories, brands, lines, colors, sizes, locations] = await Promise.all([
          listAdminProducts(
            { offset: 0, limit: PAGE_SIZE, search },
            { signal: controller.signal },
          ),
          listAdminCatalogResource('categories', { signal: controller.signal }),
          listAdminCatalogResource('brands', { signal: controller.signal }),
          listAdminCatalogResource('lines', { signal: controller.signal }),
          listAdminCatalogResource('colors', { signal: controller.signal }),
          listAdminCatalogResource('sizes', { signal: controller.signal }),
          listAdminCatalogResource('locations', { signal: controller.signal }),
        ]);
        if (cancelled) return;
        setProducts(page.products);
        setTotal(page.total);
        setLookups({ categories, brands, lines, colors, sizes, locations });
      } catch (loadError) {
        if (!cancelled && loadError?.name !== 'AbortError') setError(loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadToken, search]);

  const loadMore = useCallback(async () => {
    if (loadingMore || products.length >= total) return;
    setLoadingMore(true);
    try {
      const page = await listAdminProducts({
        offset: products.length,
        limit: PAGE_SIZE,
        search,
      });
      setProducts((current) => [...current, ...page.products]);
      setTotal(page.total);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, products.length, search, total]);

  const saveProduct = useCallback(async (input, id = null) => {
    setSaving(true);
    try {
      const saved = await saveAdminProduct(input, { id });
      setProducts((current) => {
        const exists = current.some((product) => product.id === saved.id);
        return exists
          ? current.map((product) => (product.id === saved.id ? saved : product))
          : [saved, ...current];
      });
      if (!id) setTotal((current) => current + 1);
      return saved;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeProduct = useCallback(async (id) => {
    setSaving(true);
    try {
      await deleteAdminProduct(id);
      setProducts((current) => current.filter((product) => product.id !== id));
      setTotal((current) => Math.max(0, current - 1));
    } finally {
      setSaving(false);
    }
  }, []);

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
  };

  return {
    products,
    total,
    lookups,
    loading,
    loadingMore,
    saving,
    error,
    refresh,
    saveProduct,
    removeProduct,
    loadMore,
    commercial,
  };
}
