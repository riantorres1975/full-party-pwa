// ─────────────────────────────────────────────────────────────────────────────
// pricingRepository — precios canónicos del servidor:
// resolución por presentación y validación completa del carrito (§12, §27).
// La UI calcula la vista previa con pricing.js; el SERVIDOR siempre tiene la
// última palabra.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase as defaultClient } from '../../lib/supabase.js';
import { adaptCartItemsForRpc, adaptValidatedCart } from './adapters.js';
import { CATALOG_ERROR_TYPES, CatalogError, classifyCatalogError } from './errors.js';

/**
 * Resuelve precio en servidor para una presentación + cantidad.
 * @returns {Promise<{unitPrice:number, tierLabel:?string, tierMinimum:?number,
 *   subtotal:number, nextTierMinimum:?number, nextTierMissing:?number,
 *   nextTierPrice:?number}>}
 */
export async function resolvePrice(
  salePresentationId,
  quantity,
  { client = defaultClient, signal } = {},
) {
  const safeQuantity = Number(quantity);
  if (!salePresentationId || !Number.isInteger(safeQuantity) || safeQuantity < 1) {
    throw new CatalogError(
      CATALOG_ERROR_TYPES.INVALID,
      'La presentacion y la cantidad deben ser validas.',
    );
  }

  let request = client.rpc('catalog_resolve_price', {
    p_sale_presentation_id: salePresentationId,
    p_quantity: safeQuantity,
  });
  if (signal && typeof request.abortSignal === 'function') {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request;
  if (error) throw classifyCatalogError(error, 'No se pudo calcular el precio.');

  const row = Array.isArray(data) ? data[0] : data;
  return {
    unitPrice: Number(row?.unit_price) || 0,
    tierLabel: row?.tier_label ?? null,
    tierMinimum: row?.tier_minimum ?? null,
    subtotal: Number(row?.subtotal) || 0,
    nextTierMinimum: row?.next_tier_minimum ?? null,
    nextTierMissing: row?.next_tier_quantity_missing ?? null,
    nextTierPrice: row?.next_tier_price ?? null,
  };
}

/**
 * Valida el carrito contra el servidor (precios, existencia, mínimos/steps).
 * @param {Array<{variant_id:string, sale_presentation_id:string, quantity:number}>} items
 * @returns {Promise<{valid:boolean, issues:Array, lines:Array, total:number}>}
 */
export async function validateCart(items, { client = defaultClient, signal } = {}) {
  const safeItems = adaptCartItemsForRpc(items);

  let request = client.rpc('catalog_validate_cart', { p_items: safeItems });
  if (signal && typeof request.abortSignal === 'function') {
    request = request.abortSignal(signal);
  }

  const { data, error } = await request;
  if (error) throw classifyCatalogError(error, 'No se pudo validar el carrito.');
  return adaptValidatedCart(data);
}
