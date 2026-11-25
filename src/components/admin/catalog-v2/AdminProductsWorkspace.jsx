import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  CircleDollarSign,
  Edit3,
  Layers3,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  Warehouse,
  X,
} from 'lucide-react';
import DataErrorState from '../DataErrorState.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { useToast } from '../../ui/ToastProvider.jsx';
import { useAdminProductsWorkspace } from '../../../hooks/catalog/useAdminProductsWorkspace.js';
import { getAdminDraftStep } from '../../../services/catalog/adminProductModel.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import ProductEditorDrawer from './ProductEditorDrawer.jsx';
import ProductQuickCreateDrawer from './ProductQuickCreateDrawer.jsx';

const PRODUCT_GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-3';
const PRODUCT_STATES = [
  { value: '', label: 'Todos' },
  { value: 'publicados', label: 'Publicados' },
  { value: 'borradores', label: 'Borradores' },
];
const draftGuidance = {
  general: 'Completa los datos del producto.',
  variants: 'Agrega o activa una variante.',
  commercial: 'Configura una presentación y su precio.',
  publish: 'Revisa la ficha para publicar.',
};
const UUID_PATTERN = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

function ProductSkeleton() {
  return (
    <div className={PRODUCT_GRID_CLASS} aria-busy="true" aria-label="Cargando productos">
      {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-admin-border bg-admin-card" />)}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 px-1 py-1.5">
      <Icon size={13} className="shrink-0 text-admin-muted" />
      <div className="min-w-0">
        <p className="truncate text-[8px] font-black uppercase tracking-wide text-admin-muted">{label}</p>
        <p className="text-xs font-black text-admin-text">{value}</p>
      </div>
    </div>
  );
}

export default function AdminProductsWorkspace() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);
  const debouncedSearch = useDebounce(search.trim(), 250);
  const requestedState = params.get('estado');
  const status = PRODUCT_STATES.some(option => option.value === requestedState) ? requestedState : '';
  const requestedCategory = params.get('categoria') ?? '';
  const categoryId = UUID_PATTERN.test(requestedCategory) ? requestedCategory : '';
  const active = status ? status === 'publicados' : undefined;
  const workspace = useAdminProductsWorkspace({ search: debouncedSearch, active, categoryId });
  const hasFilters = Boolean(status || categoryId || search.trim());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorStep, setEditorStep] = useState('general');
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const canEdit = usePermission('catalogo.edit');
  const canDelete = usePermission('catalogo.delete');
  const toast = useToast();
  const canUseEditor = !workspace.lookupsLoading && !workspace.lookupsError;

  const changeFilter = (key, value) => setParams(current => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value);
    else next.delete(key);
    return next;
  }, { replace: true });

  const clearFilters = () => {
    setSearch('');
    setParams(current => {
      const next = new URLSearchParams(current);
      next.delete('estado');
      next.delete('categoria');
      return next;
    }, { replace: true });
    searchRef.current?.focus();
  };

  useEffect(() => {
    if (params.get('nuevo') !== '1' || !canUseEditor) return;
    if (canEdit) setQuickCreateOpen(true);
    const siguiente = new URLSearchParams(params);
    siguiente.delete('nuevo');
    setParams(siguiente, { replace: true });
  }, [canEdit, canUseEditor, params, setParams]);

  const openEditor = (product = null, step = 'general') => {
    setSelectedProduct(product);
    setEditorStep(step === 'publish' ? 'general' : step);
    setEditorOpen(true);
  };

  const saveProduct = async (payload, id) => {
    try {
      const saved = await workspace.saveProduct(payload, id);
      setSelectedProduct(saved);
      toast.success('Producto guardado.');
      return saved;
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar el producto.');
      return null;
    }
  };

  const mutateCommercial = async (operation, successMessage) => {
    try {
      const refreshed = await operation();
      setSelectedProduct(refreshed);
      toast.success(successMessage);
      return refreshed;
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar el cambio comercial.');
      throw error;
    }
  };

  const applyBulkRows = async (rows) => {
    try {
      const { report, product } = await workspace.commercial.applyBulkRows(
        selectedProduct.id,
        rows,
      );
      setSelectedProduct(product);
      toast.success(
        `Proceso masivo: ${report.created} creadas, ${report.updated} actualizadas, ${report.rejected} rechazadas.`,
      );
      return report;
    } catch (error) {
      toast.error(error.message || 'No se pudo ejecutar el proceso masivo.');
      throw error;
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Eliminar "${product.name}" y todos sus datos comerciales?`)) return;
    try {
      await workspace.removeProduct(product.id);
      toast.success(`${product.name} se elimino.`);
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar el producto.');
    }
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-admin-border bg-admin-card px-5 py-6 shadow-sm sm:px-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-pink-500/16 to-violet-600/14 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-admin-text">Productos a la venta</h2>
            <p className="mt-1 max-w-xl text-sm text-admin-muted">Agrega productos o actualiza sus precios y existencias.</p>
          </div>
          {canEdit && (
            <button type="button" onClick={() => setQuickCreateOpen(true)} disabled={!canUseEditor} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-800 disabled:opacity-50">
              <Plus size={17} /> Nuevo producto
            </button>
          )}
        </div>
      </section>

      <div className="space-y-2.5 rounded-2xl border border-admin-border bg-admin-card p-3.5">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.5fr)]">
          <div className="relative">
            <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
            <input ref={searchRef} type="search" value={search} onChange={event => setSearch(event.target.value)} aria-label="Buscar producto por nombre" placeholder="Buscar producto por nombre" className="min-h-11 w-full rounded-xl border border-admin-border bg-admin-input py-2 pl-9 pr-10 text-base text-admin-text outline-none focus:ring-2 focus:ring-violet-600/60 sm:text-sm [&::-webkit-search-cancel-button]:hidden" />
            {search && <button type="button" aria-label="Limpiar búsqueda" onClick={() => { setSearch(''); searchRef.current?.focus(); }} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-elevated"><X size={16} aria-hidden="true" /></button>}
          </div>
          <select aria-label="Filtrar por categoría" value={categoryId} onChange={event => changeFilter('categoria', event.target.value)} disabled={workspace.lookupsLoading} className="min-h-11 w-full rounded-xl border border-admin-border bg-admin-input px-3 text-base font-bold text-admin-text sm:text-sm">
            <option value="">Todas las categorías</option>
            {categoryId && !workspace.lookups.categories.some(category => category.id === categoryId) && <option value={categoryId}>Categoría seleccionada</option>}
            {workspace.lookups.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label="Filtrar por estado de publicación" className="flex flex-wrap gap-2">
            {PRODUCT_STATES.map(({ value, label }) => <button key={value} type="button" aria-pressed={status === value} onClick={() => changeFilter('estado', value)} className={`min-h-10 rounded-xl border px-3 text-sm font-bold ${status === value ? 'border-violet-700 bg-violet-700 text-white' : 'border-admin-border text-admin-text-secondary hover:bg-admin-elevated'}`}>{label}</button>)}
          </div>
          <p role="status" className="text-sm font-semibold text-admin-muted">{workspace.loading && !workspace.error ? 'Buscando…' : !workspace.error && `${workspace.total} ${workspace.total === 1 ? 'producto' : 'productos'}`}</p>
        </div>
      </div>

      {workspace.lookupsError && <DataErrorState message="No se pudieron cargar las categorías y opciones del editor." onRetry={workspace.retryLookups} compact />}

      {workspace.loading ? (
        <ProductSkeleton />
      ) : workspace.error ? (
        <DataErrorState message={workspace.error.message} onRetry={workspace.refresh} />
      ) : workspace.products.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-admin-border bg-admin-card px-6 text-center">
          <PackagePlus size={34} className="text-admin-inactive" />
          <h3 className="mt-3 text-sm font-black text-admin-text">No hay productos para mostrar</h3>
          <p className="mt-1 text-sm text-admin-muted">{hasFilters ? 'Prueba con otro nombre o cambia los filtros.' : 'Los productos registrados aparecerán aquí.'}</p>
          {hasFilters && <button type="button" onClick={clearFilters} className="mt-3 min-h-10 rounded-lg border border-admin-border px-3 text-sm font-bold text-admin-text-secondary hover:bg-admin-elevated">Quitar filtros</button>}
        </div>
      ) : (
        <div className={PRODUCT_GRID_CLASS}>
          {workspace.products.map((product) => {
            const draftStep = product.active ? null : getAdminDraftStep(product);
            return (
              <article key={product.id} className="group overflow-hidden rounded-2xl border border-admin-border bg-admin-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-[16/9] bg-admin-elevated">
                  {product.main_image_url ? <img src={product.main_image_url} alt="" className="h-full w-full object-contain p-3" /> : <div className="flex h-full items-center justify-center text-admin-inactive"><Box size={36} /></div>}
                  <div className="absolute left-2.5 top-2.5 flex gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${product.active ? 'bg-emerald-500 text-white' : 'bg-admin-card/90 text-admin-muted'}`}>{product.active ? 'Publicado' : 'Borrador'}</span>
                    {product.featured && <span className="rounded-full bg-fiesta-magenta px-2 py-0.5 text-[8px] font-black text-white">Destacado</span>}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wide text-fiesta-magenta">{product.brand?.name || 'Sin marca'}</p>
                      <h3 className="mt-0.5 line-clamp-2 text-sm font-black leading-tight text-admin-text">{product.name}</h3>
                      <p className="mt-1 text-[10px] text-admin-muted">{product.category?.name || 'Sin categoria'}</p>
                    </div>
                    <span className="shrink-0 text-xs font-black text-admin-text">{product.minPrice == null ? 'Sin precio' : `$${product.minPrice.toFixed(2)}`}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 divide-x divide-admin-border rounded-lg bg-admin-elevated/50 px-1">
                    <Stat icon={Layers3} label="Variantes" value={product.variantCount} />
                    <Stat icon={CircleDollarSign} label="Presentaciones" value={product.presentationCount} />
                    <Stat icon={Warehouse} label="Disponible" value={product.inventoryAvailable} />
                  </div>
                  {draftStep && <p className="mt-3 rounded-lg bg-amber-100 px-2.5 py-2 text-xs font-bold text-amber-900">{draftGuidance[draftStep]}</p>}
                  <div className="mt-3 flex gap-1.5">
                    <button type="button" disabled={!canUseEditor} onClick={() => openEditor(product, canEdit && draftStep ? draftStep : 'general')} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-admin-border px-2.5 py-1.5 text-xs font-black text-admin-text hover:bg-admin-elevated disabled:opacity-50"><Edit3 size={14} aria-hidden="true" /> {canEdit ? draftStep ? 'Continuar borrador' : 'Editar producto' : 'Ver ficha'}</button>
                    {canDelete && <button type="button" onClick={() => removeProduct(product)} className="flex h-8 w-8 items-center justify-center rounded-lg text-admin-muted hover:bg-red-500/10 hover:text-red-500" aria-label={`Eliminar ${product.name}`}><Trash2 size={14} /></button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!workspace.loading && !workspace.error && workspace.products.length < workspace.total && (
        <div className="flex flex-col items-center gap-2">
          {workspace.moreError && <p role="alert" className="text-sm text-admin-text">No se pudieron cargar más productos.</p>}
          <button
            type="button"
            onClick={workspace.loadMore}
            disabled={workspace.loadingMore}
            className="rounded-xl border border-admin-border bg-admin-card px-5 py-2.5 text-sm font-black text-admin-text hover:border-fiesta-magenta/40 hover:text-fiesta-magenta disabled:opacity-50"
          >
            {workspace.loadingMore
              ? 'Cargando…'
              : workspace.moreError ? 'Reintentar' : `Cargar más (${workspace.total - workspace.products.length} restantes)`}
          </button>
        </div>
      )}

      {quickCreateOpen && (
        <ProductQuickCreateDrawer
          lookups={workspace.lookups}
          onRegister={async (registration) => {
            const saved = await workspace.registerQuickProduct(registration);
            setQuickCreateOpen(false);
            toast.success(saved.name, { title: 'Producto publicado' });
          }}
          onAdvanced={() => { setQuickCreateOpen(false); openEditor(); }}
          onClose={() => setQuickCreateOpen(false)}
        />
      )}

      {editorOpen && (
        <ProductEditorDrawer
          product={selectedProduct}
          initialStep={editorStep}
          lookups={workspace.lookups}
          saving={workspace.saving}
          canEdit={canEdit}
          canDelete={canDelete}
          onSave={saveProduct}
          commercialActions={{
            saveVariant: (input, id) => mutateCommercial(
              () => workspace.commercial.saveVariant(selectedProduct.id, input, id),
              'Variante guardada.',
            ),
            deleteVariant: (id) => mutateCommercial(
              () => workspace.commercial.deleteVariant(selectedProduct.id, id),
              'Variante eliminada.',
            ),
            savePresentation: (variantId, input, id) => mutateCommercial(
              () => workspace.commercial.savePresentation(
                selectedProduct.id,
                variantId,
                input,
                id,
              ),
              'Presentacion guardada.',
            ),
            deletePresentation: (id) => mutateCommercial(
              () => workspace.commercial.deletePresentation(selectedProduct.id, id),
              'Presentacion eliminada.',
            ),
            savePriceTier: (presentationId, input, id) => mutateCommercial(
              () => workspace.commercial.savePriceTier(
                selectedProduct.id,
                presentationId,
                input,
                id,
              ),
              'Escalon de precio guardado.',
            ),
            deletePriceTier: (id) => mutateCommercial(
              () => workspace.commercial.deletePriceTier(selectedProduct.id, id),
              'Escalon de precio eliminado.',
            ),
            saveInventory: (input, id) => mutateCommercial(
              () => workspace.commercial.saveInventory(selectedProduct.id, input, id),
              'Inventario guardado.',
            ),
            deleteInventory: (id) => mutateCommercial(
              () => workspace.commercial.deleteInventory(selectedProduct.id, id),
              'Inventario eliminado.',
            ),
          }}
          onBulkApply={applyBulkRows}
          onClose={() => { setEditorOpen(false); setSelectedProduct(null); }}
        />
      )}
    </div>
  );
}
