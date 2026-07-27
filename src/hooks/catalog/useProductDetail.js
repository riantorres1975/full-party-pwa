// ─────────────────────────────────────────────────────────────────────────────
// useProductDetail — ficha completa del producto V2 (variantes, presentaciones,
// escalones, disponibilidad, imágenes). Se carga SOLO al abrir el producto
// (§29) y se revalida con Realtime.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { getProductDetail } from '../../services/catalog/productsRepository.js';
import { subscribeToCatalogChanges } from '../../services/catalog/inventoryRepository.js';
import { CatalogError } from '../../services/catalog/errors.js';

/**
 * @param {string|null} slug - slug del producto (null = no cargar)
 * @param {{ realtime?: boolean }} options
 */
export function useProductDetail(slug, { realtime = true } = {}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);
  const slugRef = useRef(slug);
  slugRef.current = slug;

  const load = useCallback(async ({ silent = false } = {}) => {
    const currentSlug = slugRef.current;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!currentSlug) {
      setDetail(null);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!silent) setLoading(true);
    try {
      const data = await getProductDetail(currentSlug, { signal: controller.signal });
      if (requestId !== requestIdRef.current || currentSlug !== slugRef.current) return;
      setDetail(data);
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      if (err instanceof CatalogError && err.cause?.name === 'AbortError') return;
      setError(err);
    } finally {
      if (!silent && requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDetail(null);
    load();
    return () => abortRef.current?.abort();
  }, [slug, load]);

  // Revalidación silenciosa cuando cambian stock/precios/presentaciones
  useEffect(() => {
    if (!realtime || !slug) return undefined;
    return subscribeToCatalogChanges(() => {
      load({ silent: true });
    });
  }, [slug, realtime, load]);

  return { detail, loading, error, refresh: load };
}
