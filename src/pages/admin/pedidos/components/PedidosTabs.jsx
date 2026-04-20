import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useAdminData } from '../../../../contexts/AdminDataContext';
import PedidosActivos from './PedidosActivos';
import PedidosHistorial from './PedidosHistorial';

export default function PedidosTabs() {
  const { t } = useLanguage();
  const { setBusqueda } = useAdminData();
  const [tabActivo, setTabActivo] = useState('activos');
  const [busquedaInput, setBusquedaInput] = useState('');
  const busquedaDebounced = useDebounce(busquedaInput, 300);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || 'activos';
    setTabActivo(tab);
  }, []);

  const cambiarTab = (tab) => {
    setTabActivo(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-admin-border-soft overflow-x-auto py-3">
        <button
          onClick={() => cambiarTab('activos')}
          className={`px-4 py-1 text-sm font-body font-bold whitespace-nowrap transition-all border-b-2 -mb-3 pb-2 ${
            tabActivo === 'activos'
              ? 'border-fiesta-magenta text-fiesta-magenta'
              : 'border-transparent text-admin-muted hover:text-admin-text'
          }`}
        >
          {t('admin.orders.tabs.active')}
        </button>
        <button
          onClick={() => cambiarTab('historial')}
          className={`px-4 py-1 text-sm font-body font-bold whitespace-nowrap transition-all border-b-2 -mb-3 pb-2 ${
            tabActivo === 'historial'
              ? 'border-fiesta-magenta text-fiesta-magenta'
              : 'border-transparent text-admin-muted hover:text-admin-text'
          }`}
        >
          {t('admin.orders.tabs.history')}
        </button>
      </div>

      {/* Tab content */}
      {tabActivo === 'activos' && (
        <PedidosActivos
          busquedaInput={busquedaInput}
          setBusquedaInput={setBusquedaInput}
          busquedaDebounced={busquedaDebounced}
          setBusqueda={setBusqueda}
        />
      )}
      {tabActivo === 'historial' && <PedidosHistorial />}

      {/* Mobile padding */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
