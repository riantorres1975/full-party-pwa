import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';
import {
  listAdminInventory,
  updateAdminInventory,
} from '../../../../services/catalog/inventoryRepository';

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
      const data = await listAdminInventory();
      setProductos(data);
    } catch (err) {
      console.error('[useInventario]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStock = useCallback(async (id, fields) => {
    const repositoryFields = {
      ...(fields.stock_actual != null ? { quantity: fields.stock_actual } : {}),
      ...(fields.stock_minimo != null ? { lowStockThreshold: fields.stock_minimo } : {}),
    };
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...fields };
        next.stock_disponible = Math.max(
          0,
          Number(next.stock_actual) - Number(next.stock_reservado),
        );
        return next;
      })
    );

    try {
      await updateAdminInventory(id, repositoryFields);
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
