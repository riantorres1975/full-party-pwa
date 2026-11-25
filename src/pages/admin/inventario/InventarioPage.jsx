import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, MapPin, Package, Pencil, Search, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { usePermission } from '../../../hooks/usePermission';
import DataErrorState from '../../../components/admin/DataErrorState';
import { createFuzzySearchIndex } from '../../../utils/fuzzySearch';
import EditarExistencia from './components/EditarExistencia';
import InventarioFilters, { FILTROS } from './components/InventarioFilters';
import { useInventario } from './hooks/useInventario';

const searchKeys = [
  { name: 'sku', weight: 0.29 },
  { name: 'nombre', weight: 0.36 },
  { name: 'presentacion', weight: 0.15 },
  { name: 'categoria', weight: 0.11 },
  { name: 'marca', weight: 0.09 },
];

const stockStyles = {
  sinStock: 'bg-red-100 text-red-800',
  bajo: 'bg-amber-100 text-amber-900',
  ok: 'bg-admin-elevated text-admin-text-secondary',
};

const metrics = [
  ['stock_actual', 'stockActual'],
  ['stock_reservado', 'reservado'],
  ['stock_disponible', 'disponible'],
  ['stock_minimo', 'stockMinimo'],
];

const formatStock = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 3 });
const focusStyle = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-fiesta-magenta';

function getStatus(row) {
  if (row.stock_disponible <= 0) return 'sinStock';
  if (row.stock_disponible <= row.stock_minimo) return 'bajo';
  return 'ok';
}

function FilaInventario({ producto, status, canEdit, onEdit, t }) {
  return (
    <li className="grid gap-3.5 px-3.5 py-4 sm:px-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] xl:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-admin-elevated p-1.5 sm:size-16">
          {producto.imagen_url ? <img src={producto.imagen_url} alt="" loading="lazy" className="h-full w-full object-contain" /> : <Package size={20} aria-hidden="true" className="text-admin-muted" />}
        </div>
        <div className="min-w-0">
          <p className="break-words text-sm font-black leading-snug text-admin-text sm:text-base">{producto.nombre}</p>
          <p className="mt-0.5 break-words text-xs leading-relaxed text-admin-muted">
            {[producto.presentacion, producto.sku && `SKU ${producto.sku}`].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {producto.ubicacion && <span className="inline-flex items-center gap-1 text-xs font-bold text-admin-text-secondary"><MapPin size={13} aria-hidden="true" className="shrink-0" />{producto.ubicacion}</span>}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${stockStyles[status]}`}>
              {t(`inventario.estado.${status}`)}
            </span>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-4">
        {metrics.map(([field, label]) => (
          <div key={field} className="min-w-0 rounded-lg bg-admin-elevated px-2 py-2 sm:px-2.5">
            <dt className="text-[11px] font-semibold leading-tight text-admin-muted">{t(`inventario.col.${label}`)}</dt>
            <dd className={`mt-0.5 break-all text-sm font-bold tabular-nums ${field === 'stock_disponible' ? 'text-admin-text' : 'text-admin-text-secondary'}`}>
              {formatStock.format(producto[field])}
            </dd>
          </div>
        ))}
      </dl>
      {canEdit && (
        <button type="button" onClick={event => onEdit(producto, event.currentTarget)} className={`inline-flex min-h-11 items-center justify-center gap-2 justify-self-start rounded-xl border border-admin-border px-3 text-sm font-bold text-admin-text-secondary hover:bg-admin-elevated ${focusStyle}`}>
          <Pencil size={15} aria-hidden="true" />{t('inventario.editar.accion')}
          <span className="sr-only">{[producto.nombre, producto.presentacion, producto.ubicacion].filter(Boolean).join(' · ')}</span>
        </button>
      )}
    </li>
  );
}

export default function InventarioPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();
  const canEdit = usePermission('catalogo.edit');
  const { productos, loading, error, refetch, updateStock } = useInventario();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [productoEditar, setProductoEditar] = useState(null);
  const searchRef = useRef(null);
  const triggerRef = useRef(null);
  const deferredSearch = useDeferredValue(search.trim());
  const filtro = FILTROS.includes(params.get('filtro')) ? params.get('filtro') : 'todos';
  const sucursal = params.get('sucursal') ?? '';

  useEffect(() => {
    setBreadcrumb([t('inventario.title')]);
  }, [setBreadcrumb, t]);

  const sucursales = useMemo(() => [...new Map(productos
    .filter(p => p.location_id && p.ubicacion)
    .map(p => [p.location_id, p.ubicacion])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'es-MX')), [productos]);
  const searchIndex = useMemo(() => createFuzzySearchIndex(productos, searchKeys), [productos]);
  const { results, counts } = useMemo(() => {
    const counts = { todos: 0, alertas: 0, sinStock: 0, bajo: 0, ok: 0 };
    const results = [];
    for (const producto of searchIndex.search(deferredSearch)) {
      if (sucursal && producto.location_id !== sucursal) continue;
      const status = getStatus(producto);
      const alerta = status !== 'ok';
      counts.todos += 1;
      counts[status] += 1;
      if (alerta) counts.alertas += 1;
      if (filtro === 'todos' || status === filtro || (filtro === 'alertas' && alerta)) {
        results.push({ producto, status });
      }
    }
    return { results, counts };
  }, [searchIndex, deferredSearch, filtro, sucursal]);

  const changeFilter = (key, value) => {
    setParams(current => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });
  };

  const clearFilters = () => {
    setSearch('');
    setParams(current => {
      const next = new URLSearchParams(current);
      next.delete('filtro');
      next.delete('sucursal');
      return next;
    }, { replace: true });
  };

  const openEditor = (producto, trigger) => {
    setProductoEditar(producto);
    triggerRef.current = trigger;
  };

  const closeEditor = () => {
    setProductoEditar(null);
    requestAnimationFrame(() => {
      if (!triggerRef.current?.isConnected) searchRef.current?.focus({ preventScroll: true });
    });
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-4 pb-5">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-3xl border border-admin-border bg-admin-card px-4 py-5 sm:items-center sm:px-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-admin-text sm:text-3xl">{t('inventario.title')}</h1>
          <p className="mt-1 text-sm text-admin-muted">{t('inventario.subtitle')}</p>
        </div>
        <Link to="/admin/catalogo" className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-admin-border px-3 text-sm font-bold text-admin-text-secondary hover:bg-admin-elevated ${focusStyle}`}>
          {t('inventario.verCatalogo')} <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <div className="space-y-3 rounded-2xl border border-admin-border bg-admin-card p-3.5 sm:p-4">
        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,0.55fr)]">
          <div className="relative">
            <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
            <input ref={searchRef} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={t('inventario.buscar')} aria-label={t('inventario.buscar')} className={`min-h-11 w-full rounded-xl border border-admin-border bg-admin-input py-2 pl-9 pr-10 text-base text-admin-text sm:text-sm ${focusStyle} [&::-webkit-search-cancel-button]:hidden`} />
            {search && <button type="button" onClick={() => { setSearch(''); searchRef.current?.focus(); }} aria-label={t('inventario.limpiarBusqueda')} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-elevated"><X size={16} aria-hidden="true" /></button>}
          </div>
          {(sucursales.length > 0 || sucursal) && (
            <select aria-label={t('inventario.sucursal')} value={sucursal} onChange={event => changeFilter('sucursal', event.target.value)} className={`min-h-11 w-full rounded-xl border border-admin-border bg-admin-input px-3 text-base font-bold text-admin-text sm:text-sm ${focusStyle}`}>
              <option value="">{t('admin.orders.allBranches')}</option>
              {sucursal && !sucursales.some(([id]) => id === sucursal) && <option value={sucursal}>{t('inventario.sucursalNoDisponible')}</option>}
              {sucursales.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
            </select>
          )}
        </div>
        <InventarioFilters active={filtro} onChange={value => changeFilter('filtro', value === 'todos' ? '' : value)} counts={!loading && !error ? counts : undefined} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12" role="status" aria-label={t('common.loading')}>
          <div className="size-7 animate-spin rounded-full border-[3px] border-purple-700 border-t-purple-300" />
        </div>
      ) : error ? (
        <DataErrorState message={error} onRetry={refetch} />
      ) : (
        <section aria-label={t('inventario.lista')} className="rounded-2xl border border-admin-border bg-admin-card">
          <p aria-live="polite" className="border-b border-admin-border px-4 py-3 text-sm font-bold text-admin-text-secondary">
            {t('inventario.resultados', { count: results.length })}
          </p>
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-9 text-center">
              <Package size={24} aria-hidden="true" className="text-admin-muted" />
              <p className="text-sm font-bold text-admin-text">{t('inventario.vacio.titulo')}</p>
              <p className="text-xs text-admin-muted">{t('inventario.vacio.desc')}</p>
              {(filtro !== 'todos' || search.trim() || sucursal) && <button type="button" onClick={clearFilters} className="min-h-11 text-sm font-bold text-admin-text-secondary underline">{t('inventario.limpiarFiltros')}</button>}
            </div>
          ) : (
            <ul className="divide-y divide-admin-border">
              {results.map(({ producto, status }) => <FilaInventario key={producto.id} producto={producto} status={status} canEdit={canEdit} onEdit={openEditor} t={t} />)}
            </ul>
          )}
        </section>
      )}
      {productoEditar && canEdit && <EditarExistencia key={productoEditar.id} producto={productoEditar} onClose={closeEditor} onSave={updateStock} />}
    </div>
  );
}
