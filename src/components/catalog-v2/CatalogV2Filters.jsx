import { Check, SlidersHorizontal, X } from 'lucide-react';

import { sizeNameToSlug } from '../../services/catalog/filterUrl.js';

function FilterGroup({ title, items, selected, onToggle, color = false }) {
  if (!items?.length) return null;
  return (
    <section className="catalog-v2-filter-group">
      <h3>{title}</h3>
      <div className="catalog-v2-filter-list">
        {items.map((item) => {
          const value = item.slug ?? item.value ?? sizeNameToSlug(item.name);
          const checked = selected.includes(value);
          return (
            <button
              type="button"
              key={value}
              className={checked ? 'is-selected' : ''}
              onClick={() => onToggle(value)}
              aria-pressed={checked}
            >
              <span className="catalog-v2-filter-check">
                {checked && <Check size={12} strokeWidth={3} />}
              </span>
              {color && (
                <span
                  className="catalog-v2-color-dot"
                  style={{ background: item.hex || '#e5e7eb' }}
                  aria-hidden="true"
                />
              )}
              <span>{item.name ?? item.value}</span>
              <small>{item.count}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function CatalogV2Filters({
  facets,
  filters,
  activeCount,
  onToggle,
  onSet,
  onClear,
  mobile = false,
  open = false,
  onClose,
}) {
  const content = (
    <>
      <div className="catalog-v2-filters__header">
        <div>
          <SlidersHorizontal size={18} />
          <h2>Filtros</h2>
          {activeCount > 0 && <span>{activeCount}</span>}
        </div>
        <button type="button" onClick={onClear} disabled={activeCount === 0}>
          Limpiar todos
        </button>
        {mobile && (
          <button type="button" className="catalog-v2-icon-button" onClick={onClose} aria-label="Cerrar filtros">
            <X size={20} />
          </button>
        )}
      </div>

      <FilterGroup
        title="Marca"
        items={facets.brands}
        selected={filters.brands}
        onToggle={(value) => onToggle('brands', value)}
      />
      <FilterGroup
        title="Gama / línea"
        items={facets.lines}
        selected={filters.lines}
        onToggle={(value) => onToggle('lines', value)}
      />
      <FilterGroup
        title="Familia de color"
        items={facets.colorFamilies}
        selected={filters.colorFamilies}
        onToggle={(value) => onToggle('colorFamilies', value)}
        color
      />
      <FilterGroup
        title="Color exacto"
        items={facets.colors}
        selected={filters.colors}
        onToggle={(value) => onToggle('colors', value)}
        color
      />
      <FilterGroup
        title="Medida"
        items={facets.sizes}
        selected={filters.sizes}
        onToggle={(value) => onToggle('sizes', value)}
      />

      <section className="catalog-v2-filter-group">
        <h3>Disponibilidad</h3>
        <button
          type="button"
          className={`catalog-v2-stock-filter ${filters.inStock === true ? 'is-selected' : ''}`}
          onClick={() => onSet('inStock', filters.inStock === true ? null : true)}
        >
          <span className="catalog-v2-filter-check">
            {filters.inStock === true && <Check size={12} strokeWidth={3} />}
          </span>
          Solo disponibles
          <small>{facets.availability.inStock}</small>
        </button>
      </section>

      {mobile && (
        <button type="button" className="catalog-v2-primary-button catalog-v2-apply-filters" onClick={onClose}>
          Ver resultados
        </button>
      )}
    </>
  );

  if (!mobile) return <aside className="catalog-v2-filters">{content}</aside>;
  if (!open) return null;
  return (
    <div className="catalog-v2-filter-sheet" role="dialog" aria-modal="true" aria-label="Filtros del catálogo">
      <button type="button" className="catalog-v2-filter-sheet__backdrop" onClick={onClose} aria-label="Cerrar filtros" />
      <div className="catalog-v2-filter-sheet__panel">{content}</div>
    </div>
  );
}
