// ─────────────────────────────────────────────────────────────────────────────
// useCatalogFilters — estado de filtros sincronizado con la URL (§18, §20).
// Compartir URL conserva filtros; regresar los restaura; limpiar individual
// y limpiar todos; contador de activos para el botón móvil.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_FILTERS,
  parseFiltersFromSearchParams,
  serializeFiltersToSearchParams,
  toggleArrayValue,
  countActiveFilters,
  hasActiveFilters,
  clearAllFilters,
  resolveSizeIds,
} from '../../services/catalog/filterUrl.js';

const ARRAY_KEYS = new Set(['brands', 'lines', 'colorFamilies', 'colors', 'sizes']);

/**
 * @param {{ facetSizes?: Array }} options - facetas actuales para resolver
 *   slugs de medida de la URL a ids (el RPC filtra por UUID).
 */
export function useCatalogFilters({ facetSizes = [] } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams],
  );

  const writeFilters = useCallback((next, { replace = false } = {}) => {
    const params = serializeFiltersToSearchParams(next);
    setSearchParams(params, { replace });
  }, [setSearchParams]);

  /** Fija un filtro escalar (finish, minPrice, maxPrice, inStock, sort, search, collectionSlug). */
  const setFilter = useCallback((key, value, opts) => {
    const next = { ...filters, [key]: value };
    writeFilters(next, opts);
  }, [filters, writeFilters]);

  /** Alterna un valor en un filtro de selección múltiple. */
  const toggleFilter = useCallback((key, value) => {
    if (!ARRAY_KEYS.has(key)) return;
    const next = { ...filters, [key]: toggleArrayValue(filters[key], value) };
    writeFilters(next);
  }, [filters, writeFilters]);

  /** Quita un filtro completo (§18 "Limpiar filtro"). */
  const clearFilter = useCallback((key) => {
    const next = { ...filters, [key]: DEFAULT_FILTERS[key] };
    writeFilters(next);
  }, [filters, writeFilters]);

  /** Limpia todos los filtros conservando búsqueda y orden. */
  const clearAll = useCallback(() => {
    writeFilters(clearAllFilters(filters));
  }, [filters, writeFilters]);

  /** Filtros listos para el RPC (slugs de medida → UUIDs). */
  const rpcFilters = useMemo(() => ({
    ...filters,
    sizeIds: resolveSizeIds(filters.sizes, facetSizes),
  }), [filters, facetSizes]);

  return {
    filters,
    rpcFilters,
    setFilter,
    toggleFilter,
    clearFilter,
    clearAll,
    activeCount: countActiveFilters(filters),
    hasActive: hasActiveFilters(filters),
  };
}
