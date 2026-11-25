import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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
  const [params, setParams] = useSearchParams();
  const anioActual = new Date().getFullYear();
  const anioSolicitado = Number(params.get('anio'));
  const anio = Number.isInteger(anioSolicitado) && anioSolicitado >= 1000 && anioSolicitado <= anioActual ? anioSolicitado : anioActual;
  const tab = TABS.includes(params.get('vista')) ? params.get('vista') : 'ventas';
  const { data, loading, error, refetch } = useReportesData(anio);

  useEffect(() => {
    setBreadcrumb([t('reportes.title')]);
  }, [setBreadcrumb, t]);

  const changeView = (name, value) => setParams(current => {
    const next = new URLSearchParams(current);
    next.set(name, String(value));
    return next;
  }, { replace: true });

  return (
    <div>
      <div className="pb-4">
        <PageHeader
          title={t('reportes.title')}
          subtitle={t('reportes.subtitle')}
          actions={
            <div role="group" aria-label={t('reportes.yearLabel')} className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => changeView('anio', anio - 1)}
                disabled={anio <= 1000}
                aria-label={t('reportes.anioAnterior')}
                className="flex size-10 items-center justify-center rounded-lg border border-admin-border text-admin-text-secondary hover:bg-admin-elevated disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span aria-live="polite" className="w-12 text-center text-sm font-black tabular-nums text-admin-text">{anio}</span>
              <button
                type="button"
                onClick={() => changeView('anio', anio + 1)}
                disabled={anio >= anioActual}
                aria-label={t('reportes.anioSiguiente')}
                className="flex size-10 items-center justify-center rounded-lg border border-admin-border text-admin-text-secondary hover:bg-admin-elevated disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={refetch}
                aria-label={t('admin.reloadData')}
                disabled={loading}
                className="flex size-10 items-center justify-center rounded-lg border border-admin-border text-admin-text-secondary hover:bg-admin-elevated disabled:opacity-40"
                title={t('admin.reloadData')}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          }
        />

        {/* Tabs */}
        <div role="group" aria-label={t('reportes.sectionLabel')} className="flex flex-wrap gap-2">
          {TABS.map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => changeView('vista', key)}
              aria-pressed={tab === key}
              className={`min-h-10 rounded-lg border px-3 text-sm font-bold transition-colors ${
                tab === key
                  ? 'border-violet-700 bg-violet-700 text-white'
                  : 'border-admin-border bg-admin-card text-admin-text-secondary hover:bg-admin-elevated'
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
