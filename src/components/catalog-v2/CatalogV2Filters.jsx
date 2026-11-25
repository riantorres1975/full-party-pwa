import { useRef } from 'react';
import { Check, SlidersHorizontal, X } from 'lucide-react';

import { useDialogFocus } from '../../hooks/useDialogFocus.js';
import { sizeNameToSlug } from '../../services/catalog/filterUrl.js';

function FilterGroup({ title, items, selected, onToggle, color = false }) {
  if (!items?.length) return null;
  return (
    <section className="catalog-v2-filter-group">
      {title && <h3>{title}</h3>}
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
  collections,
  open = false,
  onClose,
}) {
  const panelRef = useRef(null);
  useDialogFocus({ open, containerRef: panelRef, onClose });
  if (!open) return null;

  const colorCount = filters.colorFamilies.length + filters.colors.length;
  const hasColorFamilies = facets.colorFamilies.length > 0;
  const hasExactColors = facets.colors.length > 0;

  return (
    <div className="catalog-v2-filter-sheet catalog-v2-filter-sheet--simple" role="dialog" aria-modal="true" aria-labelledby="catalog-filters-title">
      <div className="catalog-v2-filter-sheet__backdrop" aria-hidden="true" onClick={onClose} />
      <div ref={panelRef} tabIndex={-1} className="catalog-v2-filter-sheet__panel">
        <div className="catalog-v2-filters__header">
          <div>
            <SlidersHorizontal size={19} aria-hidden="true" />
            <h2 id="catalog-filters-title">Filtros</h2>
          </div>
          <button type="button" onClick={onClear} disabled={activeCount === 0}>Limpiar filtros</button>
          <button type="button" className="catalog-v2-icon-button" onClick={onClose} aria-label="Cerrar filtros">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <section className="catalog-v2-filter-group">
          <label className="catalog-v2-filter-select">
            <span>Ordenar por</span>
            <select value={filters.sort} onChange={(event) => onSet('sort', event.target.value)}>
              <option value="featured">Destacados</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
              <option value="name_asc">Nombre A–Z</option>
            </select>
          </label>
          <button
            type="button"
            className={`catalog-v2-stock-filter ${filters.inStock === true ? 'is-selected' : ''}`}
            onClick={() => onSet('inStock', filters.inStock === true ? null : true)}
            aria-pressed={filters.inStock === true}
          >
            <span className="catalog-v2-filter-check">
              {filters.inStock === true && <Check size={12} strokeWidth={3} aria-hidden="true" />}
            </span>
            Solo productos disponibles
          </button>
        </section>

        <FilterGroup title="Medida" items={facets.sizes} selected={filters.sizes} onToggle={(value) => onToggle('sizes', value)} />

        {(hasColorFamilies || hasExactColors) && (
          <details className="catalog-v2-filter-more">
            <summary>{colorCount ? `Color (${colorCount})` : 'Color'}</summary>
            <FilterGroup title="Colores generales" items={facets.colorFamilies} selected={filters.colorFamilies} onToggle={(value) => onToggle('colorFamilies', value)} color />
            {hasExactColors && (
              <details>
                <summary>Tonos exactos</summary>
                <FilterGroup items={facets.colors} selected={filters.colors} onToggle={(value) => onToggle('colors', value)} color />
              </details>
            )}
          </details>
        )}

        <details className="catalog-v2-filter-more">
          <summary>Más filtros</summary>
          {collections.length > 0 && (
            <label className="catalog-v2-filter-select">
              <span>Colección</span>
              <select value={filters.collectionSlug || ''} onChange={(event) => onSet('collectionSlug', event.target.value || null)}>
                <option value="">Todas las colecciones</option>
                {collections.map((collection) => <option key={collection.id} value={collection.slug}>{collection.name}</option>)}
              </select>
            </label>
          )}
          <FilterGroup title="Marca" items={facets.brands} selected={filters.brands} onToggle={(value) => onToggle('brands', value)} />
          <FilterGroup title="Gama" items={facets.lines} selected={filters.lines} onToggle={(value) => onToggle('lines', value)} />
        </details>

        <div className="catalog-v2-filter-actions">
          <button type="button" className="catalog-v2-primary-button" onClick={onClose}>Ver productos</button>
        </div>
      </div>
    </div>
  );
}
