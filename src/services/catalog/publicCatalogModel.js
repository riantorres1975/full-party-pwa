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

export function groupCatalogCards(cards, sort = 'featured') {
  const byProduct = new Map();
  for (const card of cards) {
    const key = card.productId || card.slug || card.groupKey;
    const family = byProduct.get(key) ?? [];
    family.push(card);
    byProduct.set(key, family);
  }

  const groups = Array.from(byProduct.values(), (family) => {
    if (family.length === 1) return family[0];
    const available = family.filter(({ inStock }) => inStock);
    const prices = (available.length ? available : family)
      .map(({ minPrice }) => minPrice)
      .filter(Number.isFinite);
    const image = [...available, ...family].find(({ imageUrl }) => imageUrl);
    const colors = new Map();
    const sizes = new Map();

    for (const card of family) {
      for (const color of card.colors) {
        const key = color.slug || color.name;
        const previous = colors.get(key);
        if (!previous || (!previous.imageUrl && color.imageUrl)) colors.set(key, color);
      }
      for (const size of card.sizes) sizes.set(size.id || size.name, size);
    }

    return {
      ...family[0],
      groupKey: family[0].productId || family[0].slug || family[0].groupKey,
      lineId: null,
      lineName: null,
      lineSlug: null,
      lineCount: new Set(family.map(({ lineSlug }) => lineSlug).filter(Boolean)).size,
      colors: [...colors.values()],
      colorCount: colors.size,
      sizes: [...sizes.values()],
      variantCount: family.reduce((total, card) => total + card.variantCount, 0),
      presentationCount: family.reduce((total, card) => total + card.presentationCount, 0),
      presentationTypes: [...new Set(family.flatMap(({ presentationTypes }) => presentationTypes))],
      featured: family.some(({ featured }) => featured),
      isNew: family.some(({ isNew }) => isNew),
      inStock: available.length > 0,
      minPrice: prices.length ? Math.min(...prices) : null,
      imageUrl: image?.imageUrl ?? null,
      groupedCards: family,
    };
  });

  if (sort === 'price_asc' || sort === 'price_desc') {
    const direction = sort === 'price_asc' ? 1 : -1;
    groups.sort((left, right) => {
      if (left.minPrice == null) return right.minPrice == null ? 0 : 1;
      if (right.minPrice == null) return -1;
      return direction * (left.minPrice - right.minPrice);
    });
  }
  return groups;
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

export function getGroupedCardSearchMatch(card, search) {
  if (!card.groupedCards) return getCardSearchMatch(card, search);

  const matches = card.groupedCards.flatMap((member) => {
    const match = getCardSearchMatch(member, search);
    return match ? [{
      ...match,
      lineSlug: member.lineSlug,
      inStock: member.inStock,
    }] : [];
  });

  // Keep matched dimensions from the same line instead of combining independent
  // color and size lists from different lines.
  matches.sort((left, right) => Number(right.inStock) - Number(left.inStock)
    || Number(Boolean(right.colorSlug && right.sizeName)) - Number(Boolean(left.colorSlug && left.sizeName)));
  return matches[0] ?? null;
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
  const lineSlug = searchMatch?.lineSlug || card?.lineSlug;
  if (lineSlug) params.set('gama', lineSlug);
  if (searchMatch?.colorSlug) params.set('seleccionColor', searchMatch.colorSlug);
  else params.delete('seleccionColor');
  if (searchMatch?.sizeName) params.set('seleccionMedida', searchMatch.sizeName);
  else params.delete('seleccionMedida');
  return params;
}

export function buildProductSelectionParams(
  current,
  { lineSlug, colorSlug, sizeName } = {},
) {
  const params = new URLSearchParams(current ?? undefined);
  if (lineSlug) params.set('gama', lineSlug);
  else params.delete('gama');
  if (colorSlug) params.set('seleccionColor', colorSlug);
  else params.delete('seleccionColor');
  if (sizeName) params.set('seleccionMedida', sizeName);
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
  const exact = list.filter(matches);
  const singleValue = (key) => {
    const values = new Set(exact.map((variant) => variant[key] ?? null));
    return values.size === 1 ? values.values().next().value : null;
  };

  if (exact.length > 0) {
    return {
      lineId: singleValue('line_id'),
      colorId: singleValue('color_id'),
      sizeId: singleValue('size_id'),
    };
  }

  const inLine = list.filter((variant) => !lineSlug || variant.line_slug === lineSlug);
  return {
    lineId: resolveInitialLineId(list, lineSlug),
    colorId: colorSlug ? inLine.find((variant) => variant.color_slug === colorSlug)?.color_id ?? null : null,
    sizeId: normalizedSize
      ? inLine.find((variant) => normalizeSearchValue(variant.size_name) === normalizedSize)?.size_id ?? null
      : null,
  };
}
