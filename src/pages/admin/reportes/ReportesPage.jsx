import { useState, useEffect } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import PageHeader from '../../../components/admin/PageHeader';
import ResumenCards from './components/ResumenCards';
import VentasMensuales from './components/VentasMensuales';
import ProductosRanking from './components/ProductosRanking';
import ClientesFrecuentes from './components/ClientesFrecuentes';
import TipoEntrega from './components/TipoEntrega';
import { useReportesData } from './hooks/useReportesData';
import DataErrorState from '../../../components/admin/DataErrorState';

const TABS = ['ventas', 'productos', 'clientes', 'entrega'];

export default function ReportesPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [tab, setTab] = useState('ventas');
  const { data, loading, error, refetch } = useReportesData(anio);

  useEffect(() => {
    setBreadcrumb([t('reportes.title')]);
  }, [setBreadcrumb, t]);

  const anioActual = new Date().getFullYear();

  return (
    <div>
      <div className="sticky top-0 z-10 bg-admin-bg pb-4">
        <PageHeader
          title={t('reportes.title')}
          subtitle={t('reportes.subtitle')}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAnio((y) => y - 1)}
                aria-label={t('reportes.anioAnterior')}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-admin-border text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-body font-black text-admin-text w-12 text-center">{anio}</span>
              <button
                type="button"
                onClick={() => setAnio((y) => y + 1)}
                disabled={anio >= anioActual}
                aria-label={t('reportes.anioSiguiente')}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-admin-border text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={refetch}
                aria-label={t('admin.reloadData')}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-admin-border text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors"
                title={t('admin.reloadData')}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          }
        />

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-bold transition-colors ${
                tab === key
                  ? 'bg-fiesta-magenta text-white'
                  : 'bg-admin-elevated text-admin-muted hover:text-admin-text'
              }`}
            >
              {t(`reportes.tab.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
        </div>
      ) : error ? (
        <DataErrorState message={error} onRetry={refetch} />
      ) : !data ? null : (
        <div className="space-y-5">
          {/* Resumen siempre visible */}
          <ResumenCards resumen={data.resumen} />

          {/* Contenido por tab */}
          {tab === 'ventas' && <VentasMensuales meses={data.meses} />}
          {tab === 'productos' && <ProductosRanking productos={data.productosRanking} />}
          {tab === 'clientes' && <ClientesFrecuentes clientes={data.clientesFrecuentes} />}
          {tab === 'entrega' && <TipoEntrega tipos={data.tipoEntrega} />}
        </div>
      )}
    </div>
  );
}
