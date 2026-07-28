import { useState, useEffect, useMemo } from 'react';
import { Package, ExternalLink, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { usePermission } from '../../../hooks/usePermission';
import PageHeader from '../../../components/admin/PageHeader';
import StockCell from './components/StockCell';
import InventarioFilters from './components/InventarioFilters';
import { useInventario } from './hooks/useInventario';
import { fuzzySearch } from '../../../utils/fuzzySearch';
import DataErrorState from '../../../components/admin/DataErrorState';

const INVENTARIO_SEARCH_KEYS = [
  { name: 'nombre', weight: 0.55 },
  { name: 'categoria', weight: 0.2 },
  { name: 'marca', weight: 0.15 },
  { name: 'tamano', weight: 0.1 },
];

const STOCK_STATUS = {
  sinStock:  { label: 'inventario.estado.sinStock',  cls: 'bg-red-500/15 text-red-500' },
  bajo:      { label: 'inventario.estado.bajo',      cls: 'bg-amber-500/15 text-amber-500' },
  ok:        { label: 'inventario.estado.ok',        cls: 'bg-emerald-500/15 text-emerald-500' },
};

const STOCK_FILTERS = new Set(['todos', 'sinStock', 'bajo', 'ok']);

function getInitialStockFilter() {
  const value = new URLSearchParams(window.location.search).get('filtro');
  return STOCK_FILTERS.has(value) ? value : 'todos';
}

function getStatus(p) {
  if (p.stock_disponible <= 0) return 'sinStock';
  if (p.stock_disponible <= p.stock_minimo) return 'bajo';
  return 'ok';
}

function StockBadge({ status, t }) {
  const { label, cls } = STOCK_STATUS[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-body font-bold ${cls}`}>
      {t(label)}
    </span>
  );
}

export default function InventarioPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();
  const canEdit = usePermission('catalogo.edit');
  const { productos, loading, error, refetch, updateStock } = useInventario();

  const [filtro, setFiltro] = useState(getInitialStockFilter);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setBreadcrumb([t('inventario.title')]);
  }, [setBreadcrumb, t]);

  const filtered = useMemo(() => {
    let list = productos;

    if (search.trim()) {
      list = fuzzySearch(list, search, INVENTARIO_SEARCH_KEYS, { threshold: 0.38 });
    }

    if (filtro !== 'todos') {
      list = list.filter((p) => getStatus(p) === filtro);
    }

    return list;
  }, [productos, filtro, search]);

  const counts = useMemo(() => ({
    sinStock: productos.filter((p) => getStatus(p) === 'sinStock').length,
    bajo: productos.filter((p) => getStatus(p) === 'bajo').length,
  }), [productos]);
  const hasFilters = filtro !== 'todos' || search.trim().length > 0;
  const clearFilters = () => {
    setFiltro('todos');
    setSearch('');
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-admin-bg pb-4">
        <PageHeader
          title={t('inventario.title')}
          subtitle={t('inventario.subtitle')}
          actions={
            <Link
              to="/admin/catalogo"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body font-bold text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors"
            >
              <ExternalLink size={14} />
              {t('inventario.verCatalogo')}
            </Link>
          }
        />

        {/* Alertas de stock */}
        {(counts.sinStock > 0 || counts.bajo > 0) && (
          <div className="flex flex-wrap gap-3 mb-4">
            {counts.sinStock > 0 && (
              <button
                type="button"
                onClick={() => setFiltro('sinStock')}
                aria-pressed={filtro === 'sinStock'}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-body font-bold hover:bg-red-500/15 transition-colors"
              >
                {counts.sinStock} {t('inventario.estado.sinStock')}
              </button>
            )}
            {counts.bajo > 0 && (
              <button
                type="button"
                onClick={() => setFiltro('bajo')}
                aria-pressed={filtro === 'bajo'}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-body font-bold hover:bg-amber-500/15 transition-colors"
              >
                {counts.bajo} {t('inventario.estado.bajo')}
              </button>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('inventario.buscar')}
              aria-label={t('inventario.buscar')}
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-admin-border bg-admin-bg text-admin-text text-sm font-body focus:outline-none focus:ring-2 focus:ring-fiesta-magenta/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={t('inventario.limpiarBusqueda')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-admin-muted hover:text-admin-text hover:bg-admin-elevated"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <InventarioFilters active={filtro} onChange={setFiltro} />
        </div>
        {!loading && !error && (
          <p className="mt-2 text-xs font-body text-admin-muted" aria-live="polite">
            {t('inventario.resultados', { count: filtered.length })}
          </p>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
        </div>
      ) : error ? (
        <DataErrorState message={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-admin-muted">
          <Package size={36} className="opacity-30" />
          <p className="font-body font-bold text-sm">{t('inventario.vacio.titulo')}</p>
          <p className="font-body text-xs">{t('inventario.vacio.desc')}</p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-1 rounded-lg border border-admin-border px-3 py-2 text-sm font-body font-bold text-admin-text hover:bg-admin-elevated transition-colors"
            >
              {t('inventario.limpiarFiltros')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Mobile: lista de tarjetas ── */}
          <div className="sm:hidden rounded-xl border border-admin-border divide-y divide-admin-border overflow-hidden">
            {filtered.map((p) => {
              const status = getStatus(p);
              return (
                <div key={p.id} className="flex items-center gap-3 px-3 py-3 bg-admin-bg hover:bg-admin-elevated/40 transition-colors">
                  {/* Imagen */}
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.nombre} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-admin-elevated" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-admin-elevated flex items-center justify-center shrink-0">
                      <Package size={14} className="text-admin-muted" />
                    </div>
                  )}

                  {/* Nombre + estado */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-admin-text text-sm leading-tight truncate">{p.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.categoria && <span className="text-xs text-admin-muted truncate">{p.categoria}</span>}
                      <StockBadge status={status} t={t} />
                    </div>
                  </div>

                  {/* Controles */}
                    <div className="flex items-center gap-3 shrink-0">
                      <StockCell
                        value={p.stock_actual}
                        field="stock_actual"
                        disabled={!canEdit}
                        onCommit={(v) => updateStock(p.id, { stock_actual: v })}
                      />
                      <div className="min-w-14 text-right text-[11px] text-admin-muted">
                        <span className="block">{p.stock_disponible} disp.</span>
                        {p.stock_reservado > 0 && <span className="block">{p.stock_reservado} res.</span>}
                      </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop: tabla completa ── */}
          <div className="hidden sm:block rounded-xl border border-admin-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-admin-border bg-admin-elevated">
                    <th className="text-left px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">{t('inventario.col.producto')}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">{t('inventario.col.estado')}</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">{t('inventario.col.stockActual')}</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">Reservado</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">Disponible</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">{t('inventario.col.stockMinimo')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const status = getStatus(p);
                    return (
                      <tr key={p.id} className="border-b border-admin-border last:border-0 hover:bg-admin-elevated/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {p.imagen_url ? (
                              <img src={p.imagen_url} alt={p.nombre} className="w-9 h-9 rounded-lg object-cover shrink-0 bg-admin-elevated" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-admin-elevated flex items-center justify-center shrink-0">
                                <Package size={14} className="text-admin-muted" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-admin-text truncate text-sm">{p.nombre}</p>
                              <p className="text-xs text-admin-muted truncate">
                                {[p.presentacion, p.ubicacion].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StockBadge status={status} t={t} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <StockCell value={p.stock_actual} field="stock_actual" disabled={!canEdit} onCommit={(v) => updateStock(p.id, { stock_actual: v })} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-admin-muted">{p.stock_reservado}</td>
                        <td className="px-4 py-3 text-center font-black text-admin-text">{p.stock_disponible}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <StockCell value={p.stock_minimo} field="stock_minimo" disabled={!canEdit} onCommit={(v) => updateStock(p.id, { stock_minimo: v })} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
