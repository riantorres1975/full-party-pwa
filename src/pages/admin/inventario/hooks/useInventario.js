import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';

export function useInventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const { t } = useLanguage();

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('productos')
        .select('id, nombre, categoria, imagen_url, activo, stock_ilimitado, stock_actual, stock_minimo')
        .order('nombre', { ascending: true });

      if (err) throw new Error(err.message);
      setProductos(data || []);
    } catch (err) {
      console.error('[useInventario]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStock = useCallback(async (id, fields) => {
    // Optimistic update
    setProductos((prev) =>
      prev.map((p) => p.id === id ? { ...p, ...fields } : p)
    );

    try {
      const { error: err } = await supabase
        .from('productos')
        .update(fields)
        .eq('id', id);

      if (err) throw new Error(err.message);
      toast.success(t('inventario.guardado'));
    } catch (err) {
      console.error('[useInventario.updateStock]', err);
      toast.error(t('inventario.error'));
      // Revert on error
      fetch();
    }
  }, [fetch, toast, t]);

  return { productos, loading, error, refetch: fetch, updateStock };
}
