import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useProductos
 * Fetch de todos los productos desde Supabase.
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
        setError(
          sbError.code === 'PGRST301'
            ? 'No tienes permisos para ver los productos. Revisa las políticas RLS en Supabase.'
            : `Error al cargar productos: ${sbError.message}`
        );
        setProductos([]);
      } else {
        setProductos(data ?? []);
      }

      setLoading(false);
    }

    fetchProductos();
    return () => { cancelado = true; };
  }, [tick]);

  const refetch = () => setTick(t => t + 1);

  return { productos, loading, error, refetch };
}
