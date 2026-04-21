import { useState, useEffect, useCallback } from 'react';
import { getConfig, setConfig } from '../../../../lib/configAdmin';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';

const DEFAULTS = {
  tienda_info: {
    nombre: import.meta.env.VITE_NOMBRE_NEGOCIO || '',
    whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '',
    horario: import.meta.env.VITE_HORARIO_TIENDA || '',
    direccion: '',
    maps_url: '',
  },
  sucursales: [
    {
      id: '1',
      badge: import.meta.env.VITE_SUC1_BADGE || '',
      nombre: import.meta.env.VITE_SUC1_NOMBRE || '',
      direccion: import.meta.env.VITE_SUC1_DIRECCION || '',
      maps_url: import.meta.env.VITE_SUC1_MAPS_URL || '',
      facebook: import.meta.env.VITE_SUC1_FACEBOOK || '',
    },
    {
      id: '2',
      badge: import.meta.env.VITE_SUC2_BADGE || '',
      nombre: import.meta.env.VITE_SUC2_NOMBRE || '',
      direccion: import.meta.env.VITE_SUC2_DIRECCION || '',
      maps_url: import.meta.env.VITE_SUC2_MAPS_URL || '',
      facebook: import.meta.env.VITE_SUC2_FACEBOOK || '',
    },
  ],
  redes_sociales: {
    facebook: '',
    instagram: '',
    tiktok: import.meta.env.VITE_TIKTOK_URL || '',
  },
};

export function useTiendaConfig() {
  const [info, setInfo] = useState(DEFAULTS.tienda_info);
  const [sucursales, setSucursales] = useState(DEFAULTS.sucursales);
  const [redes, setRedes] = useState(DEFAULTS.redes_sociales);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { t } = useLanguage();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dbInfo, dbSuc, dbRedes] = await Promise.all([
        getConfig('tienda_info', null),
        getConfig('sucursales', null),
        getConfig('redes_sociales', null),
      ]);
      if (dbInfo) setInfo({ ...DEFAULTS.tienda_info, ...dbInfo });
      if (dbSuc) setSucursales(dbSuc);
      if (dbRedes) setRedes({ ...DEFAULTS.redes_sociales, ...dbRedes });
    } catch (e) {
      console.error('[useTiendaConfig]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await Promise.all([
        setConfig('tienda_info', info),
        setConfig('sucursales', sucursales),
        setConfig('redes_sociales', redes),
      ]);
      toast.success(t('tienda.guardado'));
    } catch (e) {
      console.error('[useTiendaConfig.save]', e);
      toast.error(t('tienda.error'));
    } finally {
      setSaving(false);
    }
  }, [info, sucursales, redes, toast, t]);

  const updateInfo = (field, value) => setInfo(prev => ({ ...prev, [field]: value }));
  const updateSucursal = (id, field, value) =>
    setSucursales(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const updateRedes = (field, value) => setRedes(prev => ({ ...prev, [field]: value }));

  const addSucursal = () => setSucursales(prev => [
    ...prev,
    { id: String(Date.now()), badge: '', nombre: '', direccion: '', maps_url: '', facebook: '' },
  ]);
  const removeSucursal = (id) => setSucursales(prev => prev.filter(s => s.id !== id));

  return {
    info, sucursales, redes,
    loading, saving,
    updateInfo, updateSucursal, updateRedes,
    addSucursal, removeSucursal,
    save,
  };
}
