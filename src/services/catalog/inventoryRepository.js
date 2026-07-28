// ─────────────────────────────────────────────────────────────────────────────
// inventoryRepository — inventario del catálogo V2.
//
// La tabla catalog_inventory NO es legible públicamente (RLS): la
// disponibilidad llega a la UI ya calculada en las RPC (tarjetas/detalle).
// Aquí vive:
//  - la suscripción Realtime para revalidar datos públicos cuando el admin
//    cambia stock/precios,
//  - lecturas de panel (rol autenticado) para el admin (Fase 4).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase as defaultClient } from '../../lib/supabase.js';
import { classifyCatalogError } from './errors.js';
import { adaptAdminInventoryRow } from './inventoryModel.js';

const subscriptionsByClient = new WeakMap();

function getClientSubscriptions(client) {
  let subscriptions = subscriptionsByClient.get(client);
  if (!subscriptions) {
    subscriptions = new Map();
    subscriptionsByClient.set(client, subscriptions);
  }
  return subscriptions;
}

/**
 * Suscribe a cambios de inventario/catálogo y ejecuta onChange con debounce
 * para coalescer ráfagas de actualizaciones del admin.
 * @returns {() => void} función de desuscripción
 */
export function subscribeToCatalogChanges(
  onChange,
  { client = defaultClient, debounceMs = 600, channelName = 'catalog-v2-rt' } = {},
) {
  if (typeof onChange !== 'function') return () => {};

  const subscriptions = getClientSubscriptions(client);
  let state = subscriptions.get(channelName);

  if (!state) {
    state = { listeners: new Set(), timer: null, channel: null, debounceMs };
    const schedule = () => {
      if (state.timer) clearTimeout(state.timer);
      state.timer = setTimeout(() => {
        state.timer = null;
        for (const listener of state.listeners) listener();
      }, state.debounceMs);
    };

    state.channel = client
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catalog_inventory' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catalog_sale_presentations' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catalog_price_tiers' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catalog_variants' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catalog_products' }, schedule)
      .subscribe();
    subscriptions.set(channelName, state);
  }

  state.listeners.add(onChange);

  return () => {
    state.listeners.delete(onChange);
    if (state.listeners.size > 0) return;
    if (state.timer) clearTimeout(state.timer);
    subscriptions.delete(channelName);
    try {
      client.removeChannel(state.channel);
    } catch {
      // canal ya cerrado
    }
  };
}

// ── Lecturas de panel (requieren sesión con rol; usadas en Fase 4) ──────────

const INVENTORY_SELECT = `
  id, variant_id, sale_presentation_id, location_id,
  quantity, reserved_quantity, low_stock_threshold, updated_at,
  location:catalog_locations(id, name, slug)
`;

/** Filas de inventario de una variante (todas las sucursales). Solo panel. */
export async function listInventoryForVariant(variantId, { client = defaultClient, signal } = {}) {
  if (!variantId) return [];

  let query = client
    .from('catalog_inventory')
    .select(INVENTORY_SELECT)
    .eq('variant_id', variantId);

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudo cargar el inventario.');
  return (Array.isArray(data) ? data : []).map((row) => ({
    id: row.id,
    variantId: row.variant_id,
    salePresentationId: row.sale_presentation_id,
    locationId: row.location_id,
    locationName: row.location?.name ?? null,
    quantity: Number(row.quantity) || 0,
    reservedQuantity: Number(row.reserved_quantity) || 0,
    availableQuantity: (Number(row.quantity) || 0) - (Number(row.reserved_quantity) || 0),
    lowStockThreshold: Number(row.low_stock_threshold) || 0,
    updatedAt: row.updated_at ?? null,
  }));
}

const ADMIN_INVENTORY_SELECT = `
  id, variant_id, sale_presentation_id, location_id,
  quantity, reserved_quantity, low_stock_threshold, updated_at,
  location:catalog_locations!catalog_inventory_location_id_fkey(id, name, slug),
  presentation:catalog_sale_presentations!catalog_inventory_sale_presentation_id_fkey(
    id, name, presentation_type, base_unit, base_units_total
  ),
  variant:catalog_variants!catalog_inventory_variant_id_fkey(
    id, sku, image_url,
    product:catalog_products!catalog_variants_product_id_fkey(
      id, name, slug, main_image_url,
      category:catalog_categories!catalog_products_category_id_fkey(id, name, slug),
      brand:catalog_brands!catalog_products_brand_id_fkey(id, name, slug)
    ),
    line:catalog_product_lines!catalog_variants_line_id_fkey(id, name, slug),
    color:catalog_colors!catalog_variants_color_id_fkey(id, exact_name, slug),
    size:catalog_sizes!catalog_variants_size_id_fkey(id, name, unit)
  )
`;

export async function listAdminInventory({ client = defaultClient, signal } = {}) {
  let query = client
    .from('catalog_inventory')
    .select(ADMIN_INVENTORY_SELECT)
    .order('updated_at', { ascending: false });

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudo cargar el inventario.');
  return (Array.isArray(data) ? data : []).map(adaptAdminInventoryRow);
}

export async function updateAdminInventory(
  inventoryId,
  fields,
  { client = defaultClient } = {},
) {
  const updates = {};
  if (fields.quantity != null) updates.quantity = Math.max(0, Number(fields.quantity) || 0);
  if (fields.lowStockThreshold != null) {
    updates.low_stock_threshold = Math.max(0, Number(fields.lowStockThreshold) || 0);
  }
  if (Object.keys(updates).length === 0) return;

  const { error } = await client
    .from('catalog_inventory')
    .update(updates)
    .eq('id', inventoryId);
  if (error) throw classifyCatalogError(error, 'No se pudo actualizar el inventario.');
}

/** Sucursales activas. Solo panel (el público no las necesita). */
export async function listLocations({ client = defaultClient, signal } = {}) {
  let query = client
    .from('catalog_locations')
    .select('id,name,slug,active')
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (signal && typeof query.abortSignal === 'function') {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudieron cargar las sucursales.');
  return Array.isArray(data) ? data : [];
}
