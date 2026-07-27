import { Edit3, Eye, EyeOff, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  getAdminCatalogResource,
  getAdminCatalogRowTitle,
} from '../../../services/catalog/adminCatalogModel.js';

function relationLabel(resourceKey, row, resource, lookups) {
  const relation = resource.fields.find((field) => field.type === 'relation');
  if (!relation || !row?.[relation.name]) return null;
  const related = (lookups[relation.resource] ?? []).find(
    (candidate) => candidate.id === row[relation.name],
  );
  return related ? getAdminCatalogRowTitle(relation.resource, related) : null;
}

export default function CatalogEntityList({
  resourceKey,
  rows,
  lookups,
  search,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) {
  const resource = getAdminCatalogResource(resourceKey);
  const normalizedSearch = search.trim().toLocaleLowerCase('es');
  const filtered = rows.filter((row) => {
    if (!normalizedSearch) return true;
    return [
      getAdminCatalogRowTitle(resourceKey, row),
      row.slug,
      row.description,
      relationLabel(resourceKey, row, resource, lookups),
    ].some((value) => String(value ?? '').toLocaleLowerCase('es').includes(normalizedSearch));
  });

  if (filtered.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-admin-border bg-admin-bg/50 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-admin-elevated text-admin-muted">
          <MoreHorizontal size={22} />
        </span>
        <h3 className="mt-3 text-sm font-black text-admin-text">
          {search ? 'No encontramos coincidencias' : `Todavia no hay ${resource.label.toLowerCase()}`}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-admin-muted">
          {search
            ? 'Prueba con otro nombre, slug o relacion.'
            : `Crea la primera ${resource.singular} para comenzar.`}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card">
      <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_100px_96px] gap-4 border-b border-admin-border bg-admin-bg/70 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-admin-muted md:grid">
        <span>Nombre</span>
        <span>Organizacion</span>
        <span>Estado</span>
        <span className="text-right">Acciones</span>
      </div>
      <div className="divide-y divide-admin-border">
        {filtered.map((row) => {
          const title = getAdminCatalogRowTitle(resourceKey, row);
          const related = relationLabel(resourceKey, row, resource, lookups);
          const active = row.active !== false;
          return (
            <article
              key={row.id}
              className="grid gap-3 px-4 py-4 transition-colors hover:bg-admin-elevated/55 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_100px_96px] md:items-center md:gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {row.hex_value && (
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: row.hex_value }}
                      aria-hidden="true"
                    />
                  )}
                  <h3 className="truncate text-sm font-black text-admin-text">{title}</h3>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-admin-muted">
                  {row.slug || row.internal_code || 'Sin identificador publico'}
                </p>
              </div>

              <div className="min-w-0 text-xs text-admin-muted">
                <p className="truncate font-bold text-admin-text-secondary">
                  {related || row.collection_type || row.unit || row.data_type || 'Catalogo general'}
                </p>
                <p className="mt-0.5 truncate text-[10px]">
                  {row.description || (row.sort_order != null ? `Orden ${row.sort_order}` : 'Sin descripcion')}
                </p>
              </div>

              <div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-admin-elevated text-admin-inactive'
                }`}>
                  {active ? <Eye size={12} /> : <EyeOff size={12} />}
                  {active ? 'Visible' : 'Oculto'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-1">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-admin-muted hover:bg-fiesta-magenta/10 hover:text-fiesta-magenta"
                    aria-label={`Editar ${title}`}
                  >
                    <Edit3 size={16} />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-admin-muted hover:bg-red-500/10 hover:text-red-500"
                    aria-label={`Eliminar ${title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
