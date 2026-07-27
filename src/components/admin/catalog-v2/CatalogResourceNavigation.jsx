import {
  Badge,
  Droplets,
  Folders,
  Layers3,
  MapPinned,
  Palette,
  Ruler,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  ADMIN_CATALOG_GROUPS,
  ADMIN_CATALOG_RESOURCES,
} from '../../../services/catalog/adminCatalogModel.js';

const ICONS = {
  badge: Badge,
  droplets: Droplets,
  folders: Folders,
  layers: Layers3,
  palette: Palette,
  ruler: Ruler,
  sliders: SlidersHorizontal,
  sparkles: Sparkles,
  store: MapPinned,
};

export default function CatalogResourceNavigation({
  activeResource,
  counts,
  onSelect,
}) {
  return (
    <nav aria-label="Catalogos auxiliares" className="space-y-5">
      {ADMIN_CATALOG_GROUPS.map((group) => (
        <section key={group.id}>
          <div className="mb-2 hidden px-2 xl:block">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-admin-muted">
              {group.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-admin-inactive">
              {group.description}
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-1.5 xl:overflow-visible">
            {group.resources.map((resourceKey) => {
              const resource = ADMIN_CATALOG_RESOURCES[resourceKey];
              const Icon = ICONS[resource.icon] ?? Folders;
              const active = activeResource === resourceKey;

              return (
                <button
                  key={resourceKey}
                  type="button"
                  onClick={() => onSelect(resourceKey)}
                  className={`group flex min-w-max items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all xl:w-full ${
                    active
                      ? 'border-fiesta-magenta/40 bg-fiesta-magenta/10 text-fiesta-magenta shadow-sm'
                      : 'border-transparent text-admin-muted hover:border-admin-border hover:bg-admin-elevated hover:text-admin-text'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    active ? 'bg-fiesta-magenta text-white' : 'bg-admin-elevated text-admin-muted'
                  }`}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black xl:truncate">
                      {resource.label}
                    </span>
                    <span className="hidden text-[10px] text-admin-inactive xl:block">
                      {counts[resourceKey] ?? '...'} registros
                    </span>
                  </span>
                  <span className="rounded-full bg-admin-card px-2 py-0.5 text-[10px] font-black xl:hidden">
                    {counts[resourceKey] ?? '...'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}
