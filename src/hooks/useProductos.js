import { startTransition, useState, useEffect, useRef } from 'react';
import { registrarCategoria, registrarMarca, registrarTamano } from '../data/productos';
import { fetchAllPublicProducts } from '../lib/productosPublicos';
import { getPublicRestClient } from '../lib/supabasePublicRest';
import { deferSupabase } from '../utils/deferSupabase';

const PRODUCTOS_CACHE_KEY = 'fp_productos_cache_v1';
const LCP_IMAGE_KEY = 'fp_lcp_image_v1';

function writeLcpImageHint(lista) {
  try {
    const activos = lista.filter(
      (p) => p.activo !== false && typeof p.imagen_url === 'string' && p.imagen_url.trim()
    );
    // Mismo orden que el catálogo: es_nuevo desc, luego nombre asc
    const ordenados = [...activos].sort((a, b) => {
      const aNuevo = a.es_nuevo === true ? 1 : 0;
      const bNuevo = b.es_nuevo === true ? 1 : 0;
      if (aNuevo !== bNuevo) return bNuevo - aNuevo;
      return String(a.nombre || '').localeCompare(String(b.nombre || ''));
    });
    const urls = ordenados.slice(0, 2).map((p) => p.imagen_url.trim());
    if (urls.length > 0) {
      localStorage.setItem(LCP_IMAGE_KEY, JSON.stringify(urls));
    }
  } catch {
    // Ignore quota errors
  }
}

function readProductosCache() {
  try {
    const raw = localStorage.getItem(PRODUCTOS_CACHE_KEY);
    if (!raw) return { data: [], complete: false };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data)) return { data: [], complete: false };
    return {
      data: parsed.data,
      complete: parsed.complete !== false,
    };
  } catch {
    return { data: [], complete: false };
  }
}

function writeProductosCache(lista, complete = true) {
  try {
    localStorage.setItem(PRODUCTOS_CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      complete,
      data: lista,
    }));
  } catch {
    // Ignore quota/storage errors.
  }
}

function registrarMetadatosProductos(lista) {
  lista.forEach((p) => {
    registrarCategoria(p.categoria);
    registrarMarca(p.marca);
    registrarTamano(p.tamano);
  });
}

function waitForCatalogIdle() {
  if (typeof window === 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: 180 });
      return;
    }
    window.setTimeout(resolve, 0);
  });
}

/**
 * useProductos
 * Fetch de todos los productos desde Supabase + suscripción Realtime.
 * Retorna productos y estados de carga, actualización, caché y carga parcial.
 *
 * - productos : array con los datos ([] mientras carga)
 * - loading   : true durante el fetch inicial sin datos disponibles
 * - refreshing: true cuando actualiza productos que ya están visibles
 * - error     : string con mensaje legible, o null si todo fue bien
 * - refetch   : función para reintentar manualmente
 */
export function useProductos({ completeCatalog = true } = {}) {
  const [cacheSeed] = useState(() => readProductosCache());
  const [productos, setProductos] = useState(cacheSeed.data);
  const [loading,   setLoading]   = useState(() => cacheSeed.data.length === 0);
  const [error,     setError]     = useState(null);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [isPartialData, setIsPartialData] = useState(
    () => cacheSeed.data.length > 0 && !cacheSeed.complete,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialSyncing, setIsInitialSyncing] = useState(() => cacheSeed.data.length === 0);
  const [tick,      setTick]      = useState(0); // dispara refetch
  const cacheCompleteRef = useRef(cacheSeed.complete);

  useEffect(() => {
    if (cacheSeed.data.length > 0) {
      registrarMetadatosProductos(cacheSeed.data);
    }
  }, [cacheSeed]);

  useEffect(() => {
    let cancelado = false; // evita setState en componente desmontado
    const abortController = new AbortController();
    let hasUsableProducts = productos.length > 0;

    const baseQuery = async ({ acceptPartial = false, ...options } = {}) => {
      const result = await fetchAllPublicProducts(getPublicRestClient(), {
        maxPages: completeCatalog ? Number.POSITIVE_INFINITY : 1,
        signal: abortController.signal,
        waitBetweenPages: completeCatalog ? waitForCatalogIdle : undefined,
        ...options,
      });

      if (acceptPartial && result.error && result.data.length > 0) {
        console.warn('[useProductos] Carga parcial del catálogo', result.error.code);
        return { ...result, error: null };
      }

      return result;
    };

    async function fetchProductos() {
      const hasExistingProducts = productos.length > 0;

      if (!hasExistingProducts) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const enPrimerArranqueSinCache = productos.length === 0 && tick === 0;

      if (enPrimerArranqueSinCache) {
        let registeredCount = 0;
        let publishedCount = 0;
        const { data: primerLote, error: primerError, complete: primerComplete } = await baseQuery({
          acceptPartial: true,
          onPage: (partialProducts, { pageIndex, isLastPage }) => {
            if (cancelado || partialProducts.length === 0) return;

            const newProducts = partialProducts.slice(registeredCount);
            registrarMetadatosProductos(newProducts);
            registeredCount = partialProducts.length;
            publishedCount = partialProducts.length;
            cacheCompleteRef.current = isLastPage;
            writeProductosCache(partialProducts, isLastPage);
            if (pageIndex === 0) writeLcpImageHint(partialProducts);
            hasUsableProducts = true;

            const publishPage = () => {
              if (pageIndex === 0 || newProducts.length > 0) {
                setProductos(partialProducts);
              }
              setUsingCachedData(false);
              setIsPartialData(!isLastPage);
              setIsInitialSyncing(false);
              setLoading(false);
              setRefreshing(completeCatalog && !isLastPage);
            };

            if (pageIndex === 0) {
              publishPage();
            } else {
              startTransition(publishPage);
            }
          },
        });

        if (cancelado) return;

        if (!primerError && Array.isArray(primerLote)) {
          const needsFinalPublish = publishedCount !== primerLote.length;
          if (needsFinalPublish) {
            registrarMetadatosProductos(primerLote.slice(publishedCount));
            setProductos(primerLote);
          }
          cacheCompleteRef.current = primerComplete !== false;
          if (publishedCount === 0) {
            writeProductosCache(primerLote, primerComplete !== false);
            writeLcpImageHint(primerLote);
          }
          // When onPage published the terminal page, keep its product and
          // metadata updates in the same transition to avoid an intermediate
          // grid built from an incomplete catalog.
          if (needsFinalPublish || publishedCount === 0) {
            setUsingCachedData(false);
            setIsPartialData(primerComplete === false);
            setIsInitialSyncing(false);
            setLoading(false);
            setRefreshing(false);
          }
          return;
        }

        const { data, error: sbError, complete } = await baseQuery();
        if (cancelado) return;

        if (sbError) {
          if (primerError || !primerLote || primerLote.length === 0) {
            console.error('[useProductos]', sbError.code, sbError.message);
            setError(
              sbError.code === 'PGRST301'
                ? 'No tienes permisos para ver los productos.'
                : 'Error al cargar productos. Intenta de nuevo más tarde.'
            );
            setProductos([]);
            setIsPartialData(false);
          } else {
            setUsingCachedData(true);
          }
        } else {
          const lista = data ?? [];
          registrarMetadatosProductos(lista);
          cacheCompleteRef.current = complete !== false;
          writeProductosCache(lista, complete !== false);
          writeLcpImageHint(lista);
          setProductos(lista);
          setUsingCachedData(false);
          setIsPartialData(complete === false);
        }

        setIsInitialSyncing(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error: sbError, complete } = await baseQuery();
      if (cancelado) return;

      if (sbError) {
        console.error('[useProductos]', sbError.code, sbError.message);
        if (productos.length === 0) {
          setError(
            sbError.code === 'PGRST301'
              ? 'No tienes permisos para ver los productos.'
              : 'Error al cargar productos. Intenta de nuevo más tarde.'
          );
          setProductos([]);
          setIsPartialData(false);
        } else {
          setUsingCachedData(true);
        }
      } else {
        const lista = data ?? [];
        registrarMetadatosProductos(lista);
        cacheCompleteRef.current = complete !== false;
        writeProductosCache(lista, complete !== false);
        writeLcpImageHint(lista);
        setProductos(lista);
        setUsingCachedData(false);
        setIsPartialData(complete === false);
      }

      setLoading(false);
      setRefreshing(false);
    }

    fetchProductos().catch((unexpectedError) => {
      if (cancelado) return;

      console.error('[useProductos] Error inesperado', unexpectedError);
      if (hasUsableProducts) {
        setUsingCachedData(true);
      } else {
        setError('Error al cargar productos. Intenta de nuevo más tarde.');
        setProductos([]);
        setIsPartialData(false);
      }
      setIsInitialSyncing(false);
      setLoading(false);
      setRefreshing(false);
    });
    return () => {
      cancelado = true;
      abortController.abort();
    };
  }, [completeCatalog, tick]);

  useEffect(() => {
    let wasOffline = !navigator.onLine;
    const markOffline = () => { wasOffline = true; };
    const refreshWhenOnline = () => {
      if (!wasOffline) return;
      wasOffline = false;
      setTick((current) => current + 1);
    };
    window.addEventListener('offline', markOffline);
    window.addEventListener('online', refreshWhenOnline);
    return () => {
      window.removeEventListener('offline', markOffline);
      window.removeEventListener('online', refreshWhenOnline);
    };
  }, []);

  // Realtime subscription for product INSERT / UPDATE / DELETE
  useEffect(() => {
    let realtimeClient;
    let channel;

    const cancelDeferredLoad = deferSupabase((supabase) => {
      realtimeClient = supabase;
      channel = supabase
        .channel('productos-rt')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'productos' },
          ({ new: nuevo }) => {
            registrarMetadatosProductos([nuevo]);
            setProductos((prev) => {
              const next = [nuevo, ...prev];
              writeProductosCache(next, cacheCompleteRef.current);
              return next;
            });
          })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'productos' },
          ({ new: actualizado }) => {
            registrarMetadatosProductos([actualizado]);
            setProductos((prev) => {
              const next = prev.map((p) => (p.id === actualizado.id ? actualizado : p));
              writeProductosCache(next, cacheCompleteRef.current);
              return next;
            });
          })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'productos' },
          ({ old: eliminado }) => {
            setProductos((prev) => {
              const next = prev.filter((p) => p.id !== eliminado.id);
              writeProductosCache(next, cacheCompleteRef.current);
              return next;
            });
          })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('[Realtime] Error en canal de productos — verifica que Replication esté activo en Supabase');
          }
        });
    });

    return () => {
      cancelDeferredLoad();
      if (realtimeClient && channel) realtimeClient.removeChannel(channel);
    };
  }, []);

  const refetch = () => {
    if (loading || refreshing) return;
    setTick(t => t + 1);
  };

  return {
    productos,
    loading,
    error,
    usingCachedData,
    isPartialData,
    refreshing,
    isInitialSyncing,
    refetch,
  };
}
