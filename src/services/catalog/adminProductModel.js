import { slugifyCatalogValue } from './adminCatalogModel.js';

export const PRODUCT_GROUP_MODES = [
  { value: 'product', label: 'Una tarjeta por producto' },
  { value: 'line', label: 'Una tarjeta por gama' },
];

export function createAdminProductDraft() {
  return {
    name: '',
    slug: '',
    category_id: '',
    brand_id: '',
    short_description: '',
    description: '',
    main_image_url: '',
    listing_group_mode: 'product',
    featured: false,
    new_until: '',
    seo_title: '',
    seo_description: '',
    active: false,
  };
}

function nullableText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

export function normalizeAdminProductPayload(input) {
  const name = String(input?.name ?? '').trim();
  return {
    name,
    slug: slugifyCatalogValue(input?.slug || name),
    category_id: nullableText(input?.category_id),
    brand_id: nullableText(input?.brand_id),
    short_description: nullableText(input?.short_description),
    description: nullableText(input?.description),
    main_image_url: nullableText(input?.main_image_url),
    listing_group_mode: input?.listing_group_mode === 'line' ? 'line' : 'product',
    featured: input?.featured === true,
    new_until: nullableText(input?.new_until),
    seo_title: nullableText(input?.seo_title),
    seo_description: nullableText(input?.seo_description),
    active: input?.active === true,
  };
}

export function validateAdminProductPayload(input) {
  const payload = normalizeAdminProductPayload(input);
  const errors = {};

  if (!payload.name) errors.name = 'El nombre es obligatorio.';
  if (!payload.slug) errors.slug = 'El slug es obligatorio.';
  if (!payload.category_id) errors.category_id = 'Selecciona una categoria.';
  if (payload.short_description && payload.short_description.length > 180) {
    errors.short_description = 'Usa como maximo 180 caracteres.';
  }
  if (payload.seo_title && payload.seo_title.length > 70) {
    errors.seo_title = 'Usa como maximo 70 caracteres.';
  }
  if (payload.seo_description && payload.seo_description.length > 170) {
    errors.seo_description = 'Usa como maximo 170 caracteres.';
  }

  return { valid: Object.keys(errors).length === 0, errors, payload };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asNullableNumber(value) {
  return value == null || value === '' ? null : asNumber(value, null);
}

function compareLabels(left, right) {
  return String(left ?? '').localeCompare(String(right ?? ''), 'es', { numeric: true });
}

export function adaptAdminProduct(raw) {
  const variants = asArray(raw?.variants).map((variant) => {
    const presentations = asArray(variant?.presentations).map((presentation) => ({
      ...presentation,
      base_price: asNumber(presentation?.base_price),
      base_units_total: asNumber(presentation?.base_units_total),
      contained_quantity: asNullableNumber(presentation?.contained_quantity),
      contains_quantity: asNullableNumber(presentation?.contains_quantity),
      compare_at_price: asNullableNumber(presentation?.compare_at_price),
      maximum_order_quantity: asNullableNumber(presentation?.maximum_order_quantity),
      sort_order: asNumber(presentation?.sort_order),
      tiers: asArray(presentation?.tiers)
        .map((tier) => ({
          ...tier,
          minimum_quantity: asNumber(tier?.minimum_quantity),
          maximum_quantity: tier?.maximum_quantity == null
            ? null
            : asNumber(tier.maximum_quantity),
          price_per_presentation: asNumber(tier?.price_per_presentation),
        }))
        .sort((a, b) => a.minimum_quantity - b.minimum_quantity),
    })).sort((a, b) =>
      a.sort_order - b.sort_order || compareLabels(a.name, b.name));
    const inventory = asArray(variant?.inventory).map((row) => ({
      ...row,
      quantity: asNumber(row?.quantity),
      reserved_quantity: asNumber(row?.reserved_quantity),
      available_quantity: asNumber(row?.quantity) - asNumber(row?.reserved_quantity),
    })).sort((a, b) => compareLabels(a.location?.name, b.location?.name));
    return { ...variant, presentations, inventory };
  }).sort((a, b) => {
    const left = [a.line?.name, a.color?.exact_name, a.size?.name, a.finish]
      .filter(Boolean)
      .join(' ');
    const right = [b.line?.name, b.color?.exact_name, b.size?.name, b.finish]
      .filter(Boolean)
      .join(' ');
    return compareLabels(left || a.sku, right || b.sku);
  });

  const presentations = variants.flatMap((variant) => variant.presentations);
  const inventory = variants.flatMap((variant) => variant.inventory);
  const prices = presentations.map((item) => item.base_price).filter(Number.isFinite);

  return {
    id: raw?.id ?? null,
    name: raw?.name ?? '',
    slug: raw?.slug ?? '',
    category_id: raw?.category_id ?? null,
    brand_id: raw?.brand_id ?? null,
    short_description: raw?.short_description ?? null,
    description: raw?.description ?? null,
    main_image_url: raw?.main_image_url ?? null,
    listing_group_mode: raw?.listing_group_mode ?? 'product',
    active: raw?.active === true,
    featured: raw?.featured === true,
    new_until: raw?.new_until ?? null,
    seo_title: raw?.seo_title ?? null,
    seo_description: raw?.seo_description ?? null,
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
    category: raw?.category ?? null,
    brand: raw?.brand ?? null,
    collections: asArray(raw?.collection_links)
      .map((link) => link?.collection)
      .filter(Boolean),
    variants,
    variantCount: variants.length,
    activeVariantCount: variants.filter((variant) => variant.active !== false).length,
    presentationCount: presentations.length,
    priceTierCount: presentations.reduce(
      (total, presentation) => total + presentation.tiers.length,
      0,
    ),
    minPrice: prices.length ? Math.min(...prices) : null,
    inventoryAvailable: inventory.reduce(
      (total, row) => total + row.available_quantity,
      0,
    ),
  };
}

export function getAdminProductReadiness(product) {
  const checks = [
    { id: 'identity', ready: Boolean(product?.name && product?.slug && product?.category_id) },
    { id: 'image', ready: Boolean(product?.main_image_url) },
    { id: 'variants', ready: (product?.variantCount ?? 0) > 0 },
    { id: 'presentations', ready: (product?.presentationCount ?? 0) > 0 },
  ];
  const complete = checks.filter((check) => check.ready).length;
  return {
    checks,
    complete,
    total: checks.length,
    percent: Math.round((complete / checks.length) * 100),
    publishable: checks.every((check) => check.ready),
  };
}
