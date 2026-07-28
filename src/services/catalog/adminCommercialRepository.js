import { supabase as defaultClient } from '../../lib/supabase.js';
import { classifyCatalogError } from './errors.js';
import {
  normalizeInventoryPayload,
  normalizePresentationPayload,
  normalizePriceTierPayload,
  normalizeVariantPayload,
} from './adminCommercialModel.js';

const CONSTRAINT_MESSAGES = {
  catalog_variants_unique_combination: 'Esa combinacion de gama, color, medida y acabado ya existe.',
  catalog_sale_presentations_unique_name: 'La variante ya tiene una presentacion con ese nombre.',
  catalog_sale_presentations_content_shape: 'Configura contenido directo o una presentacion contenida, no ambos.',
  catalog_price_tiers_no_overlap: 'El rango de mayoreo se superpone con otro escalon activo.',
  catalog_inventory_unique: 'Ya existe inventario para esa variante, presentacion y sucursal.',
  catalog_inventory_reserved_lte: 'La cantidad reservada no puede superar la existencia.',
};

function commercialError(error, fallback) {
  const rawMessage = String(error?.message ?? '');
  if (rawMessage.includes('cycle') || rawMessage.includes('nesting exceeds')) {
    return classifyCatalogError(
      { ...error, message: 'Una presentacion no puede crear ciclos ni superar cinco niveles.' },
      fallback,
    );
  }
  if (rawMessage.includes('same variant') || rawMessage.includes('does not belong to variant')) {
    return classifyCatalogError(
      { ...error, message: 'La presentacion contenida debe pertenecer a la misma variante.' },
      fallback,
    );
  }
  if (rawMessage.includes('shared_base_units') || rawMessage.includes('separate_by_presentation')) {
    return classifyCatalogError(
      { ...error, message: 'La fila de inventario no coincide con la politica de la variante.' },
      fallback,
    );
  }
  const key = Object.keys(CONSTRAINT_MESSAGES).find((constraint) =>
    rawMessage.includes(constraint)
    || String(error?.details ?? '').includes(constraint));
  if (!key && error?.code === '23P01') {
    return classifyCatalogError(
      { ...error, message: CONSTRAINT_MESSAGES.catalog_price_tiers_no_overlap },
      fallback,
    );
  }
  return classifyCatalogError(
    key ? { ...error, message: CONSTRAINT_MESSAGES[key] } : error,
    fallback,
  );
}

async function saveRow(table, payload, { id = null, client, fallback }) {
  const query = id
    ? client.from(table).update(payload).eq('id', id)
    : client.from(table).insert(payload);
  const { data, error } = await query.select('id').single();
  if (error) throw commercialError(error, fallback);
  return data;
}

async function deleteRow(table, id, { client, fallback }) {
  const { data, error } = await client
    .from(table)
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw commercialError(error, fallback);
  if (!data?.length) {
    throw classifyCatalogError(
      { code: '42501', message: 'permission denied' },
      fallback,
    );
  }
}

export function saveAdminVariant(
  productId,
  input,
  { id = null, client = defaultClient } = {},
) {
  return saveRow('catalog_variants', normalizeVariantPayload(input, productId), {
    id,
    client,
    fallback: 'No se pudo guardar la variante.',
  });
}

export function deleteAdminVariant(id, { client = defaultClient } = {}) {
  return deleteRow('catalog_variants', id, {
    client,
    fallback: 'No se pudo eliminar la variante.',
  });
}

export function saveAdminPresentation(
  variantId,
  input,
  { id = null, client = defaultClient } = {},
) {
  return saveRow(
    'catalog_sale_presentations',
    normalizePresentationPayload(input, variantId),
    { id, client, fallback: 'No se pudo guardar la presentacion.' },
  );
}

export function deleteAdminPresentation(id, { client = defaultClient } = {}) {
  return deleteRow('catalog_sale_presentations', id, {
    client,
    fallback: 'No se pudo eliminar la presentacion.',
  });
}

export function saveAdminPriceTier(
  presentationId,
  input,
  { id = null, client = defaultClient } = {},
) {
  return saveRow(
    'catalog_price_tiers',
    normalizePriceTierPayload(input, presentationId),
    { id, client, fallback: 'No se pudo guardar el escalon de precio.' },
  );
}

export function deleteAdminPriceTier(id, { client = defaultClient } = {}) {
  return deleteRow('catalog_price_tiers', id, {
    client,
    fallback: 'No se pudo eliminar el escalon de precio.',
  });
}

export function saveAdminInventory(
  input,
  { id = null, client = defaultClient } = {},
) {
  return saveRow('catalog_inventory', normalizeInventoryPayload(input), {
    id,
    client,
    fallback: 'No se pudo guardar el inventario.',
  });
}

export function deleteAdminInventory(id, { client = defaultClient } = {}) {
  return deleteRow('catalog_inventory', id, {
    client,
    fallback: 'No se pudo eliminar el inventario.',
  });
}
