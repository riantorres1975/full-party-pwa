// ─────────────────────────────────────────────────────────────────────────────
// useCatalogCards — tarjetas del catálogo V2 con filtros, paginación real por
// offset, abort de peticiones obsoletas y revalidación por Realtime.
// No descarga variantes: solo lo que devuelve catalog_list_cards.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listCards } from '../../services/catalog/productsRepository.js';
import { subscribeToCatalogChanges } from '../../services/catalog/inventoryRepository.js';
import { CatalogError } from '../../services/catalog/errors.js';

export const CARDS_PAGE_SIZE = 24;

function stableFiltersKey(filters) {
  return JSON.stringify(filters ?? {});
}

/**
 * @param {object} filters - filtros del catálogo (sizeIds ya resueltos a UUID)
 * @param {{ enabled?: boolean, realtime?: boolean }} options
 */
export function useCatalogCards(filters, { enabled = true, realtime = true } = {}) {
  const filtersKey = useMemo(() => stableFiltersKey(filters), [filters]);
  const [cards, setCards] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const filtersRef = useRef(filters);
  const filtersKeyRef = useRef(filtersKey);
  filtersRef.current = filters;
  filtersKeyRef.current = filtersKey;

  const fetchPage = useCallback(async (offset, { append } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const page = await listCards(
      { ...filtersRef.current, limit: CARDS_PAGE_SIZE, offset },
      { signal: controller.signal },
    );
    return page;
  }, []);

  // Carga inicial / cambio de filtros
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPage(0)
      .then((page) => {
        if (cancelled) return;
        setCards(page.cards);
        setTotal(page.total);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof CatalogError && err.cause?.name === 'AbortError') return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, enabled]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    const requestFiltersKey = filtersKeyRef.current;
    setLoadingMore(true);
    try {
      const page = await fetchPage(cards.length, { append: true });
      if (requestFiltersKey !== filtersKeyRef.current) return;
      setCards((prev) => {
        const known = new Set(prev.map((c) => c.groupKey));
        return [...prev, ...page.cards.filter((c) => !known.has(c.groupKey))];
      });
      setTotal(page.total);
    } catch (err) {
      if (!(err instanceof CatalogError && err.cause?.name === 'AbortError')) {
        setError(err);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [cards.length, fetchPage, loadingMore]);

  const refresh = useCallback(async () => {
    // Revalida lo ya cargado sin colapsar la lista a la primera página.
    const requestFiltersKey = filtersKeyRef.current;
    const loaded = Math.max(cards.length, CARDS_PAGE_SIZE);
    const pages = Math.ceil(loaded / CARDS_PAGE_SIZE);
    try {
      const results = [];
      for (let i = 0; i < pages; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        results.push(await listCards(
          { ...filtersRef.current, limit: CARDS_PAGE_SIZE, offset: i * CARDS_PAGE_SIZE },
        ));
      }
      const merged = [];
      const known = new Set();
      for (const page of results) {
        for (const card of page.cards) {
          if (!known.has(card.groupKey)) {
            known.add(card.groupKey);
            merged.push(card);
          }
        }
      }
      if (requestFiltersKey !== filtersKeyRef.current) return;
      setCards(merged);
      setTotal(results[0]?.total ?? 0);
    } catch {
      // revalidación silenciosa: conserva los datos actuales
    }
  }, [cards.length]);

  // Revalidación por Realtime (admin cambia stock/precios/variantes)
  useEffect(() => {
    if (!enabled || !realtime) return undefined;
    return subscribeToCatalogChanges(() => {
      refresh();
    });
  }, [enabled, realtime, refresh]);

  return {
    cards,
    total,
    hasMore: cards.length < total,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
  };
}
