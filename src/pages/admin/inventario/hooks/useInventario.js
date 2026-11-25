import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';
import {
  getAdminInventoryRow,
  listAdminInventory,
  updateAdminInventory,
} from '../../../../services/catalog/inventoryRepository';

export function useInventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const updateStock = useCallback(async (expected, fields) => {
    const repositoryFields = {
      ...(fields.stock_actual != null ? { quantity: fields.stock_actual } : {}),
      ...(fields.stock_minimo != null ? { lowStockThreshold: fields.stock_minimo } : {}),
    };
    const guardado = await updateAdminInventory(expected.id, repositoryFields, { expected });
    const actual = guardado ?? await getAdminInventoryRow(expected.id);
    setProductos(prev => prev.flatMap(p => {
      if (p.id !== expected.id) return [p];
      return actual ? [actual] : [];
    }));
    if (guardado) {
      toast.success(t('inventario.guardado'));
    }
    return { saved: Boolean(guardado), current: actual };
  }, [toast, t]);

  return { productos, loading, error, refetch: fetch, updateStock };
}
