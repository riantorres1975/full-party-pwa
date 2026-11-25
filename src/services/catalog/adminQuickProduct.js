import { SUCURSALES } from '../../data/sucursales.js';
import { slugifyCatalogValue } from './adminCatalogModel.js';

export const QUICK_PRESENTATIONS = [
  { value: 'pieza', label: 'Pieza' },
  { value: 'bolsa', label: 'Bolsa' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'caja', label: 'Caja' },
  { value: 'lata', label: 'Lata' },
  { value: 'botella', label: 'Botella' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'juego', label: 'Juego' },
];

export const QUICK_PHOTO_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const MAX_WHOLE = 999999999;

function parseAmount(value) {
  const text = String(value ?? '').trim();
  return /^\d{1,10}(?:[.,]\d{1,2})?$/.test(text) ? Number(text.replace(',', '.')) : null;
}

function parseWhole(value, minimum) {
  const text = String(value ?? '').trim();
  if (!/^\d{1,9}$/.test(text)) return null;
  const number = Number(text);
  return number >= minimum && number <= MAX_WHOLE ? number : null;
}

export function getQuickSaleLocations(locations) {
  return locations.filter(({ slug, active }) => (
    active !== false && SUCURSALES.some(({ id }) => id === slug)
  ));
}

export function buildQuickProductRegistration(draft, productId, lookups) {
  const name = draft.name.trim();
  const slug = slugifyCatalogValue(name);
  const presentation = QUICK_PRESENTATIONS.find(({ value }) => value === draft.presentation);
  const units = draft.presentation === 'pieza' ? 1 : parseWhole(draft.units, 1);
  const price = parseAmount(draft.price);
  const stock = parseWhole(draft.stock, 0);
  const wholesaleMin = parseWhole(draft.wholesaleMin, 2);
  const wholesalePrice = parseAmount(draft.wholesalePrice);
  const errors = {};

  if (!name || !slug) errors.name = 'Escribe un nombre con letras o números.';
  if (!lookups.categories.some(({ id, active }) => id === draft.category && active !== false)) {
    errors.category = 'Elige una categoría.';
  }
  if (!presentation) errors.presentation = 'Elige cómo se vende.';
  if (units == null) errors.units = 'Escribe un número entero mayor que cero.';
  if (price == null || price <= 0) errors.price = 'Escribe un precio mayor a $0.00.';
  if (stock == null) errors.stock = 'Escribe un número entero. Usa 0 si aún no tienes existencia.';
  if (!getQuickSaleLocations(lookups.locations).some(({ id }) => id === draft.location)) {
    errors.location = 'Elige la sucursal.';
  }
  if (draft.wholesale) {
    if (wholesaleMin == null) errors.wholesaleMin = 'Escribe una cantidad de 2 o más.';
    if (!(wholesalePrice > 0 && wholesalePrice < price)) {
      errors.wholesalePrice = 'El precio de mayoreo debe ser menor al precio de venta y mayor a $0.00.';
    }
  }
  if (draft.photo && (!QUICK_PHOTO_EXTENSIONS[draft.photo.type] || draft.photo.size > 5 * 1024 * 1024)) {
    errors.photo = 'Selecciona una imagen JPG, PNG, WebP o AVIF de hasta 5 MB.';
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    product: {
      name,
      slug: `${slug}-${productId.slice(0, 8)}`,
      category_id: draft.category,
      brand_id: draft.brand,
      short_description: draft.description,
    },
    row: {
      row_key: 'alta-rapida',
      variant: {
        sku: `FP-${productId.toUpperCase()}`,
        inventory_policy: 'separate_by_presentation',
        active: true,
      },
      presentation: {
        name: units === 1 ? presentation.label : `${presentation.label} con ${units} piezas`,
        presentation_type: presentation.value,
        base_unit: 'pieza',
        contained_quantity: units,
        contained_unit: 'pieza',
        base_units_total: units,
        base_price: price,
        minimum_order_quantity: 1,
        quantity_step: 1,
        active: true,
      },
      inventory: { location_id: draft.location, quantity: stock, reserved_quantity: 0 },
      tier: draft.wholesale ? {
        minimum_quantity: wholesaleMin,
        price_per_presentation: wholesalePrice,
        label: 'Mayoreo',
        active: true,
      } : null,
    },
  };
}
