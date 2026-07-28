import {
  buildCartLineKey,
  resolvePresentationPricing,
} from './pricing.js';
import { normalizeQuantity } from './variantSelection.js';

export const CATALOG_CART_SCHEMA = 2;
export const CATALOG_CART_STORAGE_KEY = 'fullPartyCatalogCartV2';
export const LEGACY_CART_STORAGE_KEY = 'carritoPWA';

function asNullableNumber(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function buildPresentationSnapshot(presentation) {
  return {
    id: presentation.id,
    name: presentation.name || 'Presentación',
    presentationType: presentation.presentationType || 'otro',
    baseUnit: presentation.baseUnit || 'pieza',
    baseUnitsTotal: Number(presentation.baseUnitsTotal) || 1,
    basePrice: Number(presentation.basePrice) || 0,
    minimumOrderQuantity: Math.max(
      1,
      Number(presentation.minimumOrderQuantity) || 1,
    ),
    quantityStep: Math.max(1, Number(presentation.quantityStep) || 1),
    maximumOrderQuantity: asNullableNumber(presentation.maximumOrderQuantity),
    availableQuantity: asNullableNumber(presentation.availableQuantity),
    tiers: Array.isArray(presentation.tiers)
      ? presentation.tiers.map((tier) => ({
        minimumQuantity: Number(tier.minimumQuantity) || 1,
        maximumQuantity: asNullableNumber(tier.maximumQuantity),
        pricePerPresentation: Number(tier.pricePerPresentation) || 0,
        label: tier.label || null,
      }))
      : [],
  };
}

function clampAddedQuantity(presentation, quantity) {
  const minimum = Math.max(1, Number(presentation.minimumOrderQuantity) || 1);
  const step = Math.max(1, Number(presentation.quantityStep) || 1);
  const maximum = asNullableNumber(presentation.maximumOrderQuantity);
  const requested = Math.max(minimum, Math.floor(Number(quantity) || minimum));
  const stepped = minimum + Math.ceil((requested - minimum) / step) * step;
  return maximum == null ? stepped : Math.min(stepped, maximum);
}

export function buildCatalogCartItem({
  product,
  variant,
  presentation,
  quantity,
}) {
  if (!product?.id || !variant?.id || !presentation?.id) {
    throw new Error('La selección del producto está incompleta.');
  }

  const presentationSnapshot = buildPresentationSnapshot(presentation);
  const safeQuantity = normalizeQuantity(presentationSnapshot, quantity);
  const pricing = resolvePresentationPricing(presentationSnapshot, safeQuantity);

  return {
    schema: CATALOG_CART_SCHEMA,
    key: buildCartLineKey(variant.id, presentation.id),
    productId: product.id,
    variantId: variant.id,
    salePresentationId: presentation.id,
    productName: product.name || 'Producto',
    brandName: product.brand?.name || null,
    lineName: variant.line_name || null,
    colorName: variant.color_name || null,
    sizeName: variant.size_name || null,
    presentationName: presentation.name || 'Presentación',
    presentationType: presentation.presentationType || 'otro',
    sku: presentation.sku || variant.sku || null,
    imageUrl: variant.image_url || product.mainImageUrl || null,
    quantity: safeQuantity,
    presentation: presentationSnapshot,
    unitPrice: pricing.unitPrice,
    subtotal: pricing.subtotal,
    tierLabel: pricing.tierLabel,
    totalUnits: pricing.totalUnits,
    nextTier: pricing.nextTier,
  };
}

export function normalizeCatalogCartItem(raw) {
  if (
    raw?.schema !== CATALOG_CART_SCHEMA
    || !raw.variantId
    || !raw.salePresentationId
    || !raw.productId
    || !raw.presentation
  ) {
    return null;
  }

  const presentation = buildPresentationSnapshot({
    ...raw.presentation,
    id: raw.salePresentationId,
  });
  const quantity = normalizeQuantity(presentation, raw.quantity);
  const pricing = resolvePresentationPricing(presentation, quantity);

  return {
    ...raw,
    schema: CATALOG_CART_SCHEMA,
    key: buildCartLineKey(raw.variantId, raw.salePresentationId),
    quantity,
    presentation,
    unitPrice: pricing.unitPrice,
    subtotal: pricing.subtotal,
    tierLabel: pricing.tierLabel,
    totalUnits: pricing.totalUnits,
    nextTier: pricing.nextTier,
  };
}

export function addCatalogCartItem(items, incoming) {
  const current = Array.isArray(items)
    ? items.map(normalizeCatalogCartItem).filter(Boolean)
    : [];
  const nextItem = normalizeCatalogCartItem(incoming);
  if (!nextItem) return current;

  const existing = current.find((item) => item.key === nextItem.key);
  const requestedQuantity = (existing?.quantity || 0) + nextItem.quantity;
  const quantity = clampAddedQuantity(nextItem.presentation, requestedQuantity);
  const available = nextItem.presentation.availableQuantity;

  if (available != null && quantity > available) {
    return current;
  }

  const merged = normalizeCatalogCartItem({
    ...(existing || nextItem),
    ...nextItem,
    quantity,
  });

  if (!existing) return [...current, merged];
  return current.map((item) => (item.key === merged.key ? merged : item));
}

export function updateCatalogCartQuantity(items, key, quantity) {
  const current = Array.isArray(items) ? items : [];
  if (Number(quantity) <= 0) {
    return current.filter((item) => item.key !== key);
  }

  return current.map((item) => {
    if (item.key !== key) return item;
    const normalized = normalizeCatalogCartItem({ ...item, quantity });
    const available = normalized?.presentation.availableQuantity;
    if (!normalized || (available != null && normalized.quantity > available)) {
      return item;
    }
    return normalized;
  });
}

export function getCatalogCartTotal(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + (Number(item.subtotal) || 0),
    0,
  );
}

export function parseCatalogCart(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed?.schema !== CATALOG_CART_SCHEMA || !Array.isArray(parsed.items)) {
      return [];
    }
    return parsed.items.map(normalizeCatalogCartItem).filter(Boolean).slice(0, 50);
  } catch {
    return [];
  }
}

export function serializeCatalogCart(items) {
  return JSON.stringify({
    schema: CATALOG_CART_SCHEMA,
    items: (Array.isArray(items) ? items : [])
      .map(normalizeCatalogCartItem)
      .filter(Boolean)
      .slice(0, 50),
  });
}

export function getCatalogCartFingerprint(items, customer) {
  const lines = (Array.isArray(items) ? items : []).map((item) => [
    item.variantId,
    item.salePresentationId,
    item.quantity,
  ]);
  return JSON.stringify({
    lines,
    name: String(customer?.nombre || '').trim(),
    phone: String(customer?.telefono || '').replace(/\D/g, ''),
    delivery: customer?.tipoEntrega || 'tienda',
    address: customer?.tipoEntrega === 'envio'
      ? String(customer?.direccion || '').trim()
      : '',
  });
}
