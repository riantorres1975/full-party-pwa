import { cardRequiresOptions } from './adapters.js';

export function getCatalogCategoryPath(pathname) {
  const parts = String(pathname ?? '')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts[0] !== 'catalogo') return '';

  return parts.slice(1).map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  }).join('/');
}

export function buildCategoryHref(category) {
  const path = Array.isArray(category?.path)
    ? category.path
    : [category?.slug].filter(Boolean);
  return path.length > 0 ? `/catalogo/${path.join('/')}` : '/catalogo';
}

export function buildCardTitle(card) {
  return [card?.name, card?.lineName]
    .filter(Boolean)
    .filter((value, index, values) => (
      index === 0 || !values[0].toLocaleLowerCase('es').includes(value.toLocaleLowerCase('es'))
    ))
    .join(' ');
}

export function getCardAction(card) {
  if (!card?.inStock) return { label: 'No disponible', disabled: true, kind: 'unavailable' };
  if (cardRequiresOptions(card)) {
    return { label: 'Elegir opciones', disabled: false, kind: 'options' };
  }
  return { label: 'Ver producto', disabled: false, kind: 'simple' };
}

export function buildCardProductParams(current, card) {
  const params = new URLSearchParams(current ?? undefined);
  if (card?.slug) params.set('producto', card.slug);
  if (card?.lineSlug) params.set('gama', card.lineSlug);
  return params;
}

export function closeProductParams(current) {
  const params = new URLSearchParams(current ?? undefined);
  params.delete('producto');
  return params;
}

export function getPresentationDescription(presentation) {
  if (!presentation) return '';
  if (presentation.containsQuantity && presentation.containsPresentationId) {
    return `${presentation.containsQuantity} presentaciones`;
  }
  if (presentation.containedQuantity && presentation.containedUnit) {
    return `${presentation.containedQuantity} ${presentation.containedUnit}`;
  }
  if (presentation.baseUnitsTotal) {
    return `${presentation.baseUnitsTotal} unidades`;
  }
  return presentation.presentationType || '';
}

export function resolveInitialLineId(variants, lineSlug) {
  if (!lineSlug) return null;
  return (Array.isArray(variants) ? variants : [])
    .find((variant) => variant?.line_slug === lineSlug)?.line_id ?? null;
}
