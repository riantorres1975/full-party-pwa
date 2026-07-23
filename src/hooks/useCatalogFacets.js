import { useEffect, useMemo, useState } from 'react';
import { categorias as CATEGORIAS_CONFIG, registrarCategoria, registrarMarca, registrarTamano } from '../data/productos';
import {
  fetchAllPublicProducts,
  fetchPublicCatalogFacets,
} from '../lib/productosPublicos';
import { getPublicRestClient } from '../lib/supabasePublicRest';
import { trackCatalogDataRequest } from '../utils/analytics';

const FACETS_CACHE_KEY = 'fp_catalog_facets_v1';
const FACETS_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const FACET_FALLBACK_FIELDS = 'id,nombre,descripcion,categoria,marca,tamano,precio,imagen_url,activo';

function readFacetsCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FACETS_CACHE_KEY) || 'null');
    if (!parsed || !Array.isArray(parsed.rows)) return [];
    if (Date.now() - Number(parsed.ts || 0) > FACETS_CACHE_MAX_AGE_MS) return [];
    return parsed.rows;
  } catch {
    return [];
  }
}

function writeFacetsCache(rows) {
  try {
    localStorage.setItem(FACETS_CACHE_KEY, JSON.stringify({ ts: Date.now(), rows }));
  } catch {
    // Facets can always be rebuilt from Supabase.
  }
}

function rowsFromProducts(products) {
  const groups = new Map();
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = Number.NEGATIVE_INFINITY;

  products
    .filter((product) => product?.activo !== false)
    .forEach((product) => {
      const price = Number(product.precio);
      if (Number.isFinite(price)) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }

      [
        ['categoria', product.categoria],
        ['marca', product.marca],
        ['tamano', product.tamano],
      ].forEach(([dimension, value]) => {
        const cleanValue = String(value || '').trim();
        if (!cleanValue) return;
        const key = `${dimension}:${cleanValue}`;
        const current = groups.get(key) || {
          dimension,
          valor: cleanValue,
          cantidad: 0,
          imagen: null,
        };
        current.cantidad += 1;
        if (!current.imagen && product.imagen_url) current.imagen = product.imagen_url;
        groups.set(key, current);
      });
    });

  return [
    ...groups.values(),
    {
      dimension: 'resumen',
      valor: 'catalogo',
      cantidad: products.length,
      precio_min: Number.isFinite(minPrice) ? minPrice : null,
      precio_max: Number.isFinite(maxPrice) ? maxPrice : null,
    },
  ];
}

function buildFacetState(rows) {
  const labels = Object.fromEntries(CATEGORIAS_CONFIG.map(({ id, label }) => [id, label]));
  const categoryRows = rows.filter(({ dimension, valor }) => dimension === 'categoria' && valor);
  const brandRows = rows.filter(({ dimension, valor }) => dimension === 'marca' && valor);
  const sizeRows = rows.filter(({ dimension, valor }) => dimension === 'tamano' && valor);
  const summary = rows.find(({ dimension }) => dimension === 'resumen');

  categoryRows.forEach(({ valor }) => registrarCategoria(valor));
  brandRows.forEach(({ valor }) => registrarMarca(valor));
  sizeRows.forEach(({ valor }) => registrarTamano(valor));

  const categoryStats = categoryRows
    .map((row) => ({
      id: row.valor,
      label: labels[row.valor] || row.valor,
      count: Number(row.cantidad) || 0,
      imagen: row.imagen || null,
    }))
    .sort((a, b) => (
      b.count - a.count
      || String(a.label).localeCompare(String(b.label), 'es', { sensitivity: 'base' })
    ));

  return {
    categoryStats,
    catalogIndex: categoryRows.map((row) => ({
      id: `facet-${row.valor}`,
      nombre: row.valor,
      categoria: row.valor,
      activo: true,
    })),
    priceBounds: {
      min: Number.isFinite(Number(summary?.precio_min)) ? Number(summary.precio_min) : null,
      max: Number.isFinite(Number(summary?.precio_max)) ? Number(summary.precio_max) : null,
    },
    totalProducts: Number(summary?.cantidad) || categoryRows.reduce(
      (total, row) => total + (Number(row.cantidad) || 0),
      0,
    ),
  };
}

export function useCatalogFacets() {
  const [rows, setRows] = useState(readFacetsCache);
  const [loading, setLoading] = useState(() => rows.length === 0);
  const facetState = useMemo(() => buildFacetState(rows), [rows]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let refreshTimer;

    async function loadFacets() {
      const client = getPublicRestClient();
      const startedAt = Date.now();
      const result = await fetchPublicCatalogFacets(client, { signal: controller.signal });
      let nextRows = result.data;

      if (result.error) {
        if (!controller.signal.aborted) {
          trackCatalogDataRequest({
            requestType: 'facets',
            status: 'error',
            durationMs: Date.now() - startedAt,
            usingCache: rows.length > 0,
          });
        }
        const fallbackStartedAt = Date.now();
        const fallback = await fetchAllPublicProducts(client, {
          fields: FACET_FALLBACK_FIELDS,
          initialPageSize: 500,
          pageSize: 500,
          signal: controller.signal,
        });
        if (fallback.error || fallback.cancelled) {
          if (!controller.signal.aborted) {
            trackCatalogDataRequest({
              requestType: 'facets_fallback',
              status: 'error',
              durationMs: Date.now() - fallbackStartedAt,
              resultCount: fallback.data.length,
            });
          }
          if (active) setLoading(false);
          return;
        }
        trackCatalogDataRequest({
          requestType: 'facets_fallback',
          status: 'success',
          durationMs: Date.now() - fallbackStartedAt,
          resultCount: fallback.data.length,
        });
        nextRows = rowsFromProducts(fallback.data);
      } else {
        trackCatalogDataRequest({
          requestType: 'facets',
          status: 'success',
          durationMs: Date.now() - startedAt,
          resultCount: Array.isArray(nextRows) ? nextRows.length : 0,
        });
      }

      if (!active || !Array.isArray(nextRows)) return;
      writeFacetsCache(nextRows);
      setRows(nextRows);
      setLoading(false);
    }

    const handleUnexpectedError = () => {
      if (active && !controller.signal.aborted) {
        trackCatalogDataRequest({
          requestType: 'facets',
          status: 'error',
          usingCache: rows.length > 0,
        });
        setLoading(false);
      }
    };

    loadFacets().catch(handleUnexpectedError);
    const refreshFacets = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        loadFacets().catch(handleUnexpectedError);
      }, 300);
    };
    window.addEventListener('fp:catalog-facets-stale', refreshFacets);

    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      window.removeEventListener('fp:catalog-facets-stale', refreshFacets);
      controller.abort();
    };
  }, []);

  return { ...facetState, loading };
}
