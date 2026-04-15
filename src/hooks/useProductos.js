import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { registrarCategoria, registrarMarca, registrarTamano } from '../data/productos';

function precargarImagenLCP(productos) {
  if (typeof document === 'undefined' || !Array.isArray(productos) || productos.length === 0) return;

  const candidata = productos.find((p) => p?.imagen_url && p?.activo !== false);
  if (!candidata?.imagen_url) return;

  const href = candidata.imagen_url;
  const existente = document.querySelector(`link[data-fp-lcp="1"][href="${href}"]`);
  if (existente) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = href;
  link.crossOrigin = 'anonymous';
  link.setAttribute('data-fp-lcp', '1');
  document.head.appendChild(link);
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
  const [productos, setProductos] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [tick,      setTick]      = useState(0); // dispara refetch

  useEffect(() => {
    let cancelado = false; // evita setState en componente desmontado

    async function fetchProductos() {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('productos')
        .select('*')
        .order('activo', { ascending: false })  // activos primero
        .order('nombre', { ascending: true });

      if (cancelado) return;

      if (sbError) {
        console.error('[useProductos]', sbError.code, sbError.message);
        setError(
          sbError.code === 'PGRST301'
            ? 'No tienes permisos para ver los productos.'
            : 'Error al cargar productos. Intenta de nuevo más tarde.'
        );
        setProductos([]);
      } else {
        const lista = data ?? [];
        precargarImagenLCP(lista);
        lista.forEach(p => {
          registrarCategoria(p.categoria);
          registrarMarca(p.marca);
          registrarTamano(p.tamano);
        });
        setProductos(lista);
      }

      setLoading(false);
    }

    fetchProductos();
    return () => { cancelado = true; };
  }, [tick]);

  // Realtime subscription for product INSERT / UPDATE / DELETE
  useEffect(() => {
    const channel = supabase
      .channel('productos-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'productos' },
        ({ new: nuevo }) => {
          registrarCategoria(nuevo.categoria);
          registrarMarca(nuevo.marca);
          registrarTamano(nuevo.tamano);
          setProductos(prev => [nuevo, ...prev]);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'productos' },
        ({ new: actualizado }) => {
          registrarCategoria(actualizado.categoria);
          registrarMarca(actualizado.marca);
          registrarTamano(actualizado.tamano);
          setProductos(prev =>
            prev.map(p => p.id === actualizado.id ? actualizado : p)
          );
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'productos' },
        ({ old: eliminado }) => {
          setProductos(prev => prev.filter(p => p.id !== eliminado.id));
        })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] Error en canal de productos — verifica que Replication esté activo en Supabase');
        }
      });

    return () => supabase.removeChannel(channel);
  }, []);

  const refetch = () => setTick(t => t + 1);

  return { productos, loading, error, refetch };
}
