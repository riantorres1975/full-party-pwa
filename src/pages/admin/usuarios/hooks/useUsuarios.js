import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const { t } = useLanguage();

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, email, nombre, role, activo, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (err) throw new Error(err.message);
      setUsuarios(data || []);
    } catch (err) {
      console.error('[useUsuarios]', err);
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const updateRole = useCallback(async (userId, newRole) => {
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (err) throw new Error(err.message);
      toast.success(t('usuarios.roleUpdated'));
      await fetchUsuarios();
      return true;
    } catch (err) {
      console.error('[useUsuarios.updateRole]', err);
      toast.error(t('usuarios.updateError'));
      return false;
    }
  }, [fetchUsuarios, toast, t]);

  const toggleActivo = useCallback(async (userId, currentActivo) => {
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ activo: !currentActivo })
        .eq('id', userId);

      if (err) throw new Error(err.message);
      toast.success(t('usuarios.statusUpdated'));
      await fetchUsuarios();
      return true;
    } catch (err) {
      console.error('[useUsuarios.toggleActivo]', err);
      toast.error(t('usuarios.updateError'));
      return false;
    }
  }, [fetchUsuarios, toast, t]);

  return { usuarios, loading, error, refetch: fetchUsuarios, updateRole, toggleActivo };
}
