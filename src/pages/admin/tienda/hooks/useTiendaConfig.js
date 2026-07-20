import { useState, useEffect, useCallback, useMemo } from 'react';
import { getConfig, setConfig } from '../../../../lib/configAdmin';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';
import { validateTiendaConfig } from '../tiendaValidation';

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

function serializeConfig(info, sucursales, redes) {
  return JSON.stringify({ info, sucursales, redes });
}

export function useTiendaConfig() {
  const [info, setInfo] = useState(DEFAULTS.tienda_info);
  const [sucursales, setSucursales] = useState(DEFAULTS.sucursales);
  const [redes, setRedes] = useState(DEFAULTS.redes_sociales);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const toast = useToast();
  const { t } = useLanguage();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dbInfo, dbSuc, dbRedes] = await Promise.all([
        getConfig('tienda_info', null),
        getConfig('sucursales', null),
        getConfig('redes_sociales', null),
      ]);
      const nextInfo = dbInfo ? { ...DEFAULTS.tienda_info, ...dbInfo } : DEFAULTS.tienda_info;
      const nextSucursales = dbSuc || DEFAULTS.sucursales;
      const nextRedes = dbRedes ? { ...DEFAULTS.redes_sociales, ...dbRedes } : DEFAULTS.redes_sociales;

      setInfo(nextInfo);
      setSucursales(nextSucursales);
      setRedes(nextRedes);
      setSavedSnapshot(serializeConfig(nextInfo, nextSucursales, nextRedes));
    } catch (e) {
      console.error('[useTiendaConfig]', e);
      setError(e.message || 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const validationErrors = useMemo(
    () => validateTiendaConfig(info, sucursales, redes),
    [info, sucursales, redes]
  );
  const isValid = Object.keys(validationErrors).length === 0;
  const isDirty = useMemo(
    () => savedSnapshot !== null && serializeConfig(info, sucursales, redes) !== savedSnapshot,
    [info, sucursales, redes, savedSnapshot]
  );

  const save = useCallback(async () => {
    if (!isValid) {
      toast.error(t('tienda.validacion.revisar'));
      return false;
    }

    setSaving(true);
    try {
      await Promise.all([
        setConfig('tienda_info', info),
        setConfig('sucursales', sucursales),
        setConfig('redes_sociales', redes),
      ]);
      setSavedSnapshot(serializeConfig(info, sucursales, redes));
      toast.success(t('tienda.guardado'));
      return true;
    } catch (e) {
      console.error('[useTiendaConfig.save]', e);
      toast.error(t('tienda.error'));
      return false;
    } finally {
      setSaving(false);
    }
  }, [info, sucursales, redes, isValid, toast, t]);

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
    loading, saving, error, isDirty, isValid, validationErrors,
    updateInfo, updateSucursal, updateRedes,
    addSucursal, removeSucursal,
    save,
    refetch: load,
  };
}
