import { useCallback, useEffect, useRef, useState } from 'react';

import {
  listInventoryForVariant,
  subscribeToCatalogChanges,
} from '../../services/catalog/inventoryRepository.js';
import { CatalogError } from '../../services/catalog/errors.js';

/**
 * Inventario detallado para el panel. Requiere una sesion con permiso de
 * catalogo; el catalogo publico recibe disponibilidad agregada desde las RPC.
 */
export function useCatalogInventory(
  variantId,
  { enabled = true, realtime = true } = {},
) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled && variantId));
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const variantIdRef = useRef(variantId);
  variantIdRef.current = variantId;

  const load = useCallback(async ({ silent = false } = {}) => {
    const currentVariantId = variantIdRef.current;
    if (!enabled || !currentVariantId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);

    try {
      const data = await listInventoryForVariant(currentVariantId, {
        signal: controller.signal,
      });
      if (currentVariantId !== variantIdRef.current) return;
      setRows(data);
      setError(null);
    } catch (err) {
      if (err instanceof CatalogError && err.cause?.name === 'AbortError') return;
      setError(err);
    } finally {
      if (!silent && currentVariantId === variantIdRef.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [variantId, load]);

  useEffect(() => {
    if (!enabled || !realtime || !variantId) return undefined;
    return subscribeToCatalogChanges(() => load({ silent: true }));
  }, [enabled, realtime, variantId, load]);

  return { rows, loading, error, refresh: load };
}
