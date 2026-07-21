import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { registrarCategoria, registrarMarca, registrarTamano } from '../data/productos';

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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data)) return [];
    return parsed.data;
  } catch {
    return [];
  }
}

function writeProductosCache(lista) {
  try {
    localStorage.setItem(PRODUCTOS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: lista }));
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

/**
 * useProductos
 * Fetch de todos los productos desde Supabase + suscripción Realtime.
 * Retorna { productos, loading, error, refetch }
 *
 * - productos : array con los datos ([] mientras carga)
 * - loading   : true durante el fetch inicial y cada refetch
 * - error     : string con mensaje legible, o null si todo fue bien
 * - refetch   : función para reintentar manualmente
 */
export function useProductos() {
  const [cacheSeed] = useState(() => readProductosCache());
  const [productos, setProductos] = useState(cacheSeed);
  const [loading,   setLoading]   = useState(() => cacheSeed.length === 0);
  const [error,     setError]     = useState(null);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [isInitialSyncing, setIsInitialSyncing] = useState(() => cacheSeed.length === 0);
  const [tick,      setTick]      = useState(0); // dispara refetch

  useEffect(() => {
    if (cacheSeed.length > 0) {
      registrarMetadatosProductos(cacheSeed);
    }
  }, [cacheSeed]);

  useEffect(() => {
    let cancelado = false; // evita setState en componente desmontado

    const baseQuery = () =>
      supabase
        .from('productos')
        .select('*')
        .order('activo', { ascending: false })
        .order('nombre', { ascending: true });

    async function fetchProductos() {
      if (productos.length === 0) {
        setLoading(true);
      }
      setError(null);

      const enPrimerArranqueSinCache = productos.length === 0 && tick === 0;

      if (enPrimerArranqueSinCache) {
        const { data: primerLote, error: primerError } = await baseQuery();

        if (cancelado) return;

        if (!primerError && Array.isArray(primerLote) && primerLote.length > 0) {
          registrarMetadatosProductos(primerLote);
          writeProductosCache(primerLote);
          writeLcpImageHint(primerLote);
          setProductos(primerLote);
          setUsingCachedData(false);
          setIsInitialSyncing(false);
          setLoading(false);
          return;
        }

        const { data, error: sbError } = await baseQuery();
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
          } else {
            setUsingCachedData(true);
          }
        } else {
          const lista = data ?? [];
          registrarMetadatosProductos(lista);
          writeProductosCache(lista);
          writeLcpImageHint(lista);
          setProductos(lista);
          setUsingCachedData(false);
        }

        setIsInitialSyncing(false);
        setLoading(false);
        return;
      }

      const { data, error: sbError } = await baseQuery();
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
        } else {
          setUsingCachedData(true);
        }
      } else {
        const lista = data ?? [];
        registrarMetadatosProductos(lista);
        writeProductosCache(lista);
        setProductos(lista);
        setUsingCachedData(false);
      }

      setLoading(false);
    }

    fetchProductos();
    return () => { cancelado = true; };
  }, [tick]);

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
    const channel = supabase
      .channel('productos-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'productos' },
        ({ new: nuevo }) => {
          registrarMetadatosProductos([nuevo]);
          setProductos((prev) => {
            const next = [nuevo, ...prev];
            writeProductosCache(next);
            return next;
          });
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'productos' },
        ({ new: actualizado }) => {
          registrarMetadatosProductos([actualizado]);
          setProductos((prev) => {
            const next = prev.map((p) => (p.id === actualizado.id ? actualizado : p));
            writeProductosCache(next);
            return next;
          });
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'productos' },
        ({ old: eliminado }) => {
          setProductos((prev) => {
            const next = prev.filter((p) => p.id !== eliminado.id);
            writeProductosCache(next);
            return next;
          });
        })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] Error en canal de productos — verifica que Replication esté activo en Supabase');
        }
      });

    return () => supabase.removeChannel(channel);
  }, []);

  const refetch = () => setTick(t => t + 1);

  return { productos, loading, error, usingCachedData, isInitialSyncing, refetch };
}
