import { useEffect, useState } from 'react';
import { Database, Plus, Search, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import DataErrorState from '../DataErrorState.jsx';
import { useToast } from '../../ui/ToastProvider.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { useAdminCatalogWorkspace } from '../../../hooks/catalog/useAdminCatalogWorkspace.js';
import {
  ADMIN_CATALOG_RESOURCES,
  getAdminCatalogRowTitle,
} from '../../../services/catalog/adminCatalogModel.js';
import CatalogEntityForm from './CatalogEntityForm.jsx';
import CatalogEntityList from './CatalogEntityList.jsx';
import CatalogResourceNavigation from './CatalogResourceNavigation.jsx';

function ResourceSkeleton() {
  return (
    <div className="space-y-3" aria-label="Cargando catalogo">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="h-[78px] animate-pulse rounded-2xl border border-admin-border bg-admin-card">
          <div className="m-4 h-3 w-1/3 rounded bg-admin-elevated" />
          <div className="mx-4 h-2 w-1/5 rounded bg-admin-elevated" />
        </div>
      ))}
    </div>
  );
}
export default function AdminCatalogWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedResource = searchParams.get('seccion');
  const initialResource = ADMIN_CATALOG_RESOURCES[requestedResource]
    ? requestedResource
    : 'categories';
  const workspace = useAdminCatalogWorkspace(initialResource);
  const [search, setSearch] = useState('');
  const [editingEntity, setEditingEntity] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const canEdit = usePermission('catalogo.edit');
  const canDelete = usePermission('catalogo.delete');
  const toast = useToast();
  const resource = ADMIN_CATALOG_RESOURCES[workspace.resourceKey];

  useEffect(() => {
    if (requestedResource && ADMIN_CATALOG_RESOURCES[requestedResource]) {
      workspace.setResourceKey(requestedResource);
    }
  }, [requestedResource, workspace.setResourceKey]);

  const selectResource = (nextResource) => {
    setSearch('');
    setFormOpen(false);
    setEditingEntity(null);
    workspace.setResourceKey(nextResource);
    setSearchParams({ vista: 'base', seccion: nextResource }, { replace: true });
  };

  const openCreate = () => {
    setEditingEntity(null);
    setFormOpen(true);
  };

  const openEdit = (entity) => {
    setEditingEntity(entity);
    setFormOpen(true);
  };

  const handleSave = async (payload, id) => {
    try {
      await workspace.saveEntity(payload, id);
      toast.success(`${resource.singular[0].toUpperCase()}${resource.singular.slice(1)} guardada.`);
      setFormOpen(false);
      setEditingEntity(null);
      workspace.refresh();
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar el registro.');
    }
  };

  const handleDelete = async (entity) => {
    const title = getAdminCatalogRowTitle(workspace.resourceKey, entity);
    if (!window.confirm(`Eliminar "${title}"? Esta accion no se puede deshacer.`)) return;
    try {
      await workspace.deleteEntity(entity.id);
      toast.success(`${title} se elimino del catalogo.`);
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar el registro.');
    }
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-admin-border bg-admin-card px-5 py-5 shadow-sm sm:px-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-pink-500/16 to-violet-600/12 blur-2xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-500/20">
              <Database size={20} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-admin-text">Base del catalogo V2</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-600">
                  <ShieldCheck size={11} /> Supabase conectado
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-admin-muted">
                Estos catalogos alimentan filtros, variantes, precios e inventario sin duplicar productos.
              </p>
            </div>
          </div>
          {!canEdit && (
            <span className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-600">
              Acceso de solo lectura
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-2xl border border-admin-border bg-admin-card p-3 xl:sticky xl:top-24 xl:self-start">
          <CatalogResourceNavigation
            activeResource={workspace.resourceKey}
            counts={workspace.overview}
            onSelect={selectResource}
          />
        </aside>

        <main className="min-w-0">
          <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-fiesta-magenta">
                Catalogo auxiliar
              </p>
              <h2 className="mt-1 text-xl font-black text-admin-text">{resource.label}</h2>
              <p className="mt-1 text-xs text-admin-muted">{resource.description}</p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-pink-500/20 transition-transform active:scale-95"
              >
                <Plus size={17} />
                {resource.article} {resource.singular}
              </button>
            )}
          </header>

          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-admin-border bg-admin-card p-3">
            <Search size={17} className="ml-1 shrink-0 text-admin-muted" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar en ${resource.label.toLowerCase()}...`}
              className="min-w-0 flex-1 bg-transparent text-sm text-admin-text outline-none placeholder:text-admin-inactive"
            />
            <span className="rounded-lg bg-admin-elevated px-2.5 py-1 text-[10px] font-black text-admin-muted">
              {workspace.rows.length} registros
            </span>
          </div>

          {workspace.loading ? (
            <ResourceSkeleton />
          ) : workspace.error ? (
            <DataErrorState message={workspace.error.message} onRetry={workspace.refresh} compact />
          ) : (
            <CatalogEntityList
              resourceKey={workspace.resourceKey}
              rows={workspace.rows}
              lookups={workspace.lookups}
              search={search}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </main>
      </div>

      {formOpen && (
        <CatalogEntityForm
          resourceKey={workspace.resourceKey}
          entity={editingEntity}
          lookups={workspace.lookups}
          saving={workspace.saving}
          canEdit={canEdit}
          onSave={handleSave}
          onClose={() => {
            setFormOpen(false);
            setEditingEntity(null);
          }}
        />
      )}
    </div>
  );
}
