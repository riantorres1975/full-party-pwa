import { useDeferredValue, useState } from 'react';
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
} from 'lucide-react';
import DataErrorState from '../DataErrorState.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { useToast } from '../../ui/ToastProvider.jsx';
import { useAdminProductsWorkspace } from '../../../hooks/catalog/useAdminProductsWorkspace.js';
import { getAdminProductReadiness } from '../../../services/catalog/adminProductModel.js';
import ProductEditorDrawer from './ProductEditorDrawer.jsx';

function ProductSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {[0, 1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-admin-border bg-admin-card" />)}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-admin-bg/70 px-3 py-2">
      <Icon size={14} className="text-admin-muted" />
      <div>
        <p className="text-[9px] font-black uppercase tracking-wide text-admin-muted">{label}</p>
        <p className="text-sm font-black text-admin-text">{value}</p>
      </div>
    </div>
  );
}

export default function AdminProductsWorkspace() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase('es'));
  const workspace = useAdminProductsWorkspace(deferredSearch);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const canEdit = usePermission('catalogo.edit');
  const canDelete = usePermission('catalogo.delete');
  const toast = useToast();

  const openEditor = (product = null) => {
    setSelectedProduct(product);
    setEditorOpen(true);
  };

  const saveProduct = async (payload, id) => {
    try {
      const saved = await workspace.saveProduct(payload, id);
      setSelectedProduct(saved);
      toast.success('Producto V2 guardado.');
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar el producto.');
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fiesta-magenta">Familias de producto</p>
            <h2 className="mt-1 text-xl font-black text-admin-text">Productos V2</h2>
            <p className="mt-1 max-w-xl text-xs text-admin-muted">Una familia concentra sus combinaciones, formas de venta, precios e inventario.</p>
          </div>
          {canEdit && (
            <button type="button" onClick={() => openEditor()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-pink-500/20">
              <Plus size={17} /> Nuevo producto
            </button>
          )}
        </div>
      </section>

      <div className="flex items-center gap-3 rounded-2xl border border-admin-border bg-admin-card p-3">
        <Search size={17} className="ml-1 shrink-0 text-admin-muted" />
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto o slug..." className="min-w-0 flex-1 bg-transparent text-sm text-admin-text outline-none placeholder:text-admin-inactive" />
        <span className="rounded-lg bg-admin-elevated px-2.5 py-1 text-[10px] font-black text-admin-muted">{workspace.total} productos</span>
      </div>

      {workspace.loading ? (
        <ProductSkeleton />
      ) : workspace.error ? (
        <DataErrorState message={workspace.error.message} onRetry={workspace.refresh} />
      ) : workspace.products.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-admin-border bg-admin-card px-6 text-center">
          <PackagePlus size={34} className="text-admin-inactive" />
          <h3 className="mt-3 text-sm font-black text-admin-text">No hay productos para mostrar</h3>
          <p className="mt-1 text-xs text-admin-muted">Crea una familia o cambia la busqueda.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {workspace.products.map((product) => {
            const readiness = getAdminProductReadiness(product);
            return (
              <article key={product.id} className="group overflow-hidden rounded-2xl border border-admin-border bg-admin-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-[16/9] bg-admin-elevated">
                  {product.main_image_url ? <img src={product.main_image_url} alt="" className="h-full w-full object-contain p-4" /> : <div className="flex h-full items-center justify-center text-admin-inactive"><Box size={42} /></div>}
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-black ${product.active ? 'bg-emerald-500 text-white' : 'bg-admin-card/90 text-admin-muted'}`}>{product.active ? 'Publicado' : 'Borrador'}</span>
                    {product.featured && <span className="rounded-full bg-fiesta-magenta px-2 py-1 text-[9px] font-black text-white">Destacado</span>}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-fiesta-magenta">{product.brand?.name || 'Sin marca'}</p>
                      <h3 className="mt-1 line-clamp-2 text-base font-black leading-tight text-admin-text">{product.name}</h3>
                      <p className="mt-1 text-[11px] text-admin-muted">{product.category?.name || 'Sin categoria'}</p>
                    </div>
                    <span className="text-sm font-black text-admin-text">{product.minPrice == null ? 'S/P' : `$${product.minPrice.toFixed(2)}`}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Stat icon={Layers3} label="Variantes" value={product.variantCount} />
                    <Stat icon={CircleDollarSign} label="Formas" value={product.presentationCount} />
                    <Stat icon={Warehouse} label="Disponible" value={product.inventoryAvailable} />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-admin-muted">
                      <span>Preparacion</span><span>{readiness.percent}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-admin-elevated">
                      <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-600" style={{ width: `${readiness.percent}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => openEditor(product)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-admin-border px-3 py-2 text-xs font-black text-admin-text hover:border-fiesta-magenta/40 hover:text-fiesta-magenta"><Edit3 size={14} /> Abrir editor</button>
                    {canDelete && <button type="button" onClick={() => removeProduct(product)} className="flex h-9 w-9 items-center justify-center rounded-xl text-admin-muted hover:bg-red-500/10 hover:text-red-500" aria-label={`Eliminar ${product.name}`}><Trash2 size={15} /></button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {workspace.products.length < workspace.total && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={workspace.loadMore}
            disabled={workspace.loadingMore}
            className="rounded-xl border border-admin-border bg-admin-card px-5 py-2.5 text-sm font-black text-admin-text hover:border-fiesta-magenta/40 hover:text-fiesta-magenta disabled:opacity-50"
          >
            {workspace.loadingMore
              ? 'Cargando...'
              : `Cargar mas (${workspace.total - workspace.products.length} pendientes)`}
          </button>
        </div>
      )}

      {editorOpen && (
        <ProductEditorDrawer product={selectedProduct} lookups={workspace.lookups} saving={workspace.saving} canEdit={canEdit} onSave={saveProduct} onClose={() => { setEditorOpen(false); setSelectedProduct(null); }} />
      )}
    </div>
  );
}
