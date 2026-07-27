import { useCallback, useEffect, useState } from 'react';
import {
  deleteAdminProduct,
  listAdminProducts,
  saveAdminProduct,
} from '../../services/catalog/adminProductsRepository.js';
import { listAdminCatalogResource } from '../../services/catalog/adminCatalogRepository.js';

const PAGE_SIZE = 18;

export function useAdminProductsWorkspace(search = '') {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [lookups, setLookups] = useState({ categories: [], brands: [] });
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
        const [page, categories, brands] = await Promise.all([
          listAdminProducts(
            { offset: 0, limit: PAGE_SIZE, search },
            { signal: controller.signal },
          ),
          listAdminCatalogResource('categories', { signal: controller.signal }),
          listAdminCatalogResource('brands', { signal: controller.signal }),
        ]);
        if (cancelled) return;
        setProducts(page.products);
        setTotal(page.total);
        setLookups({ categories, brands });
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
  };
}
