import { useState, useEffect, useMemo } from 'react';
import { Package, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { usePermission } from '../../../hooks/usePermission';
import PageHeader from '../../../components/admin/PageHeader';
import StockCell from './components/StockCell';
import InventarioFilters from './components/InventarioFilters';
import { useInventario } from './hooks/useInventario';

const STOCK_STATUS = {
  ilimitado: { label: 'inventario.estado.ilimitado', cls: 'bg-admin-elevated text-admin-muted' },
  sinStock:  { label: 'inventario.estado.sinStock',  cls: 'bg-red-500/15 text-red-500' },
  bajo:      { label: 'inventario.estado.bajo',      cls: 'bg-amber-500/15 text-amber-500' },
  ok:        { label: 'inventario.estado.ok',        cls: 'bg-emerald-500/15 text-emerald-500' },
};

function getStatus(p) {
  if (p.stock_ilimitado) return 'ilimitado';
  if (p.stock_actual <= 0) return 'sinStock';
  if (p.stock_actual <= p.stock_minimo) return 'bajo';
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

  const [filtro, setFiltro] = useState('todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setBreadcrumb([t('inventario.title')]);
  }, [setBreadcrumb, t]);

  const filtered = useMemo(() => {
    let list = productos;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.nombre?.toLowerCase().includes(q) ||
        p.categoria?.toLowerCase().includes(q)
      );
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

  return (
    <div>
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
        <div className="flex flex-wrap gap-3 mb-5">
          {counts.sinStock > 0 && (
            <button
              onClick={() => setFiltro('sinStock')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-body font-bold hover:bg-red-500/15 transition-colors"
            >
              {counts.sinStock} {t('inventario.estado.sinStock')}
            </button>
          )}
          {counts.bajo > 0 && (
            <button
              onClick={() => setFiltro('bajo')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-body font-bold hover:bg-amber-500/15 transition-colors"
            >
              {counts.bajo} {t('inventario.estado.bajo')}
            </button>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('inventario.buscar')}
          className="flex-1 px-3 py-2 rounded-lg border border-admin-border bg-admin-bg text-admin-text text-sm font-body focus:outline-none focus:ring-2 focus:ring-fiesta-magenta/40"
        />
        <InventarioFilters active={filtro} onChange={setFiltro} />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-admin-muted text-sm mb-3">{error}</p>
          <button onClick={refetch} className="text-sm text-fiesta-magenta underline">{t('common.retry') || 'Reintentar'}</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-admin-muted">
          <Package size={36} className="opacity-30" />
          <p className="font-body font-bold text-sm">{t('inventario.vacio.titulo')}</p>
          <p className="font-body text-xs">{t('inventario.vacio.desc')}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-admin-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-admin-border bg-admin-elevated">
                  <th className="text-left px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">
                    {t('inventario.col.producto')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">
                    {t('inventario.col.estado')}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">
                    {t('inventario.col.ilimitado')}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">
                    {t('inventario.col.stockActual')}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide hidden sm:table-cell">
                    {t('inventario.col.stockMinimo')}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">
                    {t('inventario.col.activo')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const status = getStatus(p);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-admin-border last:border-0 hover:bg-admin-elevated/40 transition-colors"
                    >
                      {/* Producto */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {p.imagen_url ? (
                            <img
                              src={p.imagen_url}
                              alt={p.nombre}
                              className="w-9 h-9 rounded-lg object-cover shrink-0 bg-admin-elevated"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-admin-elevated flex items-center justify-center shrink-0">
                              <Package size={14} className="text-admin-muted" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-admin-text truncate text-sm">{p.nombre}</p>
                            {p.categoria && (
                              <p className="text-xs text-admin-muted truncate">{p.categoria}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <StockBadge status={status} t={t} />
                      </td>

                      {/* Toggle ilimitado */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => canEdit && updateStock(p.id, { stock_ilimitado: !p.stock_ilimitado })}
                          disabled={!canEdit}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                            ${p.stock_ilimitado ? 'bg-fiesta-magenta' : 'bg-admin-border'}`}
                          aria-label={t('inventario.col.ilimitado')}
                        >
                          <span className={`block w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform
                            ${p.stock_ilimitado ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </td>

                      {/* Stock actual */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <StockCell
                            value={p.stock_actual}
                            field="stock_actual"
                            disabled={p.stock_ilimitado || !canEdit}
                            onCommit={(v) => updateStock(p.id, { stock_actual: v })}
                          />
                        </div>
                      </td>

                      {/* Stock mínimo */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex justify-center">
                          <StockCell
                            value={p.stock_minimo}
                            field="stock_minimo"
                            disabled={p.stock_ilimitado || !canEdit}
                            min={1}
                            onCommit={(v) => updateStock(p.id, { stock_minimo: v })}
                          />
                        </div>
                      </td>

                      {/* Activo */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => canEdit && updateStock(p.id, { activo: !p.activo })}
                          disabled={!canEdit}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                            ${p.activo ? 'bg-emerald-500' : 'bg-admin-border'}`}
                          aria-label={t('inventario.col.activo')}
                        >
                          <span className={`block w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform
                            ${p.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
