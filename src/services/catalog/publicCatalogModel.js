import { cardRequiresOptions } from './adapters.js';

const CARD_PRESENTATION_PRIORITY = [
  'pieza',
  'lata',
  'botella',
  'bolsa',
  'paquete',
  'docena',
  'juego',
  'rollo',
  'metro',
  'otro',
  'caja',
];

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

function normalizeSearchValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

export function getCardSearchMatch(card, search) {
  const tokens = normalizeSearchValue(search).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const colors = (Array.isArray(card?.colors) ? card.colors : [])
    .filter((color) => {
      const name = normalizeSearchValue(color?.name);
      return tokens.some((token) => name.includes(token));
    });
  const sizes = (Array.isArray(card?.sizes) ? card.sizes : [])
    .filter((size) => {
      const name = normalizeSearchValue(size?.name);
      return tokens.some((token) => name.includes(token));
    });

  if (colors.length === 0 && sizes.length === 0) return null;

  const color = colors[0] ?? null;
  const size = sizes[0] ?? null;
  const labels = [];
  if (color) {
    labels.push(colors.length > 1
      ? `${color.name} +${colors.length - 1}`
      : color.name);
  }
  if (size) labels.push(size.name);

  return {
    colorSlug: color?.slug ?? null,
    colorName: color?.name ?? null,
    colorHex: color?.hex ?? null,
    colorImageUrl: color?.imageUrl ?? null,
    colorCount: colors.length,
    sizeId: size?.id ?? null,
    sizeName: size?.name ?? null,
    label: labels.join(' · '),
  };
}

export function getCardAction(card) {
  if (!card?.inStock) return { label: 'No disponible', disabled: true, kind: 'unavailable' };
  if (cardRequiresOptions(card)) {
    return { label: 'Elegir opciones', disabled: false, kind: 'options' };
  }
  return { label: 'Ver producto', disabled: false, kind: 'simple' };
}

export function getPrimaryPresentationType(types) {
  const available = Array.isArray(types)
    ? types.map((type) => String(type || '').trim()).filter(Boolean)
    : [];

  return CARD_PRESENTATION_PRIORITY.find((type) => available.includes(type))
    || available[0]
    || 'presentación';
}

export function buildCardProductParams(current, card, searchMatch = null) {
  const params = new URLSearchParams(current ?? undefined);
  if (card?.slug) params.set('producto', card.slug);
  if (card?.lineSlug) params.set('gama', card.lineSlug);
  if (searchMatch?.colorSlug) params.set('seleccionColor', searchMatch.colorSlug);
  else params.delete('seleccionColor');
  if (searchMatch?.sizeName) params.set('seleccionMedida', searchMatch.sizeName);
  else params.delete('seleccionMedida');
  return params;
}

export function closeProductParams(current) {
  const params = new URLSearchParams(current ?? undefined);
  params.delete('producto');
  params.delete('seleccionColor');
  params.delete('seleccionMedida');
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

export function resolveInitialVariantSelection(
  variants,
  { lineSlug, colorSlug, sizeName } = {},
) {
  const list = Array.isArray(variants) ? variants : [];
  const normalizedSize = normalizeSearchValue(sizeName);
  const matches = (variant) => (
    (!lineSlug || variant?.line_slug === lineSlug)
    && (!colorSlug || variant?.color_slug === colorSlug)
    && (!normalizedSize || normalizeSearchValue(variant?.size_name) === normalizedSize)
  );
  const exact = list.find(matches);

  if (exact) {
    return {
      lineId: exact.line_id ?? null,
      colorId: exact.color_id ?? null,
      sizeId: exact.size_id ?? null,
    };
  }

  return {
    lineId: resolveInitialLineId(list, lineSlug),
    colorId: colorSlug
      ? list.find((variant) => (
        (!lineSlug || variant?.line_slug === lineSlug)
        && variant?.color_slug === colorSlug
      ))?.color_id ?? null
      : null,
    sizeId: normalizedSize
      ? list.find((variant) => (
        (!lineSlug || variant?.line_slug === lineSlug)
        && normalizeSearchValue(variant?.size_name) === normalizedSize
      ))?.size_id ?? null
      : null,
  };
}
