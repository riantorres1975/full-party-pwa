import { supabase as defaultClient } from '../../lib/supabase.js';
import { classifyCatalogError } from './errors.js';
import {
  adaptAdminProduct,
  normalizeAdminProductPayload,
} from './adminProductModel.js';

const ADMIN_PRODUCT_SELECT = `
  id, category_id, brand_id, name, slug, short_description, description,
  main_image_url, listing_group_mode, active, featured, new_until,
  seo_title, seo_description, created_at, updated_at,
  category:catalog_categories(id, name, slug),
  brand:catalog_brands(id, name, slug),
  collection_links:catalog_collection_products(
    collection:catalog_collections(id, name, slug)
  ),
  variants:catalog_variants(
    id, product_id, line_id, color_id, size_id, finish, sku, barcode,
    image_url, inventory_policy, active, created_at, updated_at,
    line:catalog_product_lines(id, name, slug),
    color:catalog_colors(
      id, exact_name, slug, hex_value, internal_code,
      family:catalog_color_families(id, name, slug)
    ),
    size:catalog_sizes(id, name, numeric_value, unit),
    presentations:catalog_sale_presentations(
      id, variant_id, name, presentation_type, base_unit,
      contained_quantity, contained_unit, contains_presentation_id,
      contains_quantity, base_units_total, base_price, compare_at_price,
      sku, barcode, minimum_order_quantity, quantity_step,
      maximum_order_quantity, inventory_policy, sort_order, active,
      tiers:catalog_price_tiers(
        id, minimum_quantity, maximum_quantity,
        price_per_presentation, label, active
      )
    ),
    inventory:catalog_inventory(
      id, variant_id, sale_presentation_id, location_id, quantity,
      reserved_quantity, updated_at,
      location:catalog_locations(id, name, slug)
    )
  )
`;

export async function listAdminProducts(
  { offset = 0, limit = 18, search = '' } = {},
  { client = defaultClient, signal } = {},
) {
  const safeOffset = Math.max(0, Number(offset) || 0);
  const safeLimit = Math.min(60, Math.max(1, Number(limit) || 18));
  const safeSearch = String(search ?? '')
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  let query = client
    .from('catalog_products')
    .select(ADMIN_PRODUCT_SELECT, { count: 'exact' })
    .order('updated_at', { ascending: false })
    .order('name', { ascending: true })
    .range(safeOffset, safeOffset + safeLimit - 1);
  if (safeSearch) {
    query = query.or(`name.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%`);
  }
  if (signal && typeof query.abortSignal === 'function') query = query.abortSignal(signal);

  const { data, error, count } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudieron cargar los productos V2.');
  return {
    products: (Array.isArray(data) ? data : []).map(adaptAdminProduct),
    total: count ?? 0,
    offset: safeOffset,
    limit: safeLimit,
  };
}

export async function getAdminProductById(
  productId,
  { client = defaultClient, signal } = {},
) {
  if (!productId) return null;
  let query = client
    .from('catalog_products')
    .select(ADMIN_PRODUCT_SELECT)
    .eq('id', productId)
    .maybeSingle();
  if (signal && typeof query.abortSignal === 'function') query = query.abortSignal(signal);

  const { data, error } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudo cargar el producto V2.');
  return data ? adaptAdminProduct(data) : null;
}

export async function saveAdminProduct(
  input,
  { id = null, client = defaultClient } = {},
) {
  const payload = normalizeAdminProductPayload(input);
  let query = id
    ? client.from('catalog_products').update(payload).eq('id', id)
    : client.from('catalog_products').insert(payload);

  const { data, error } = await query
    .select('id')
    .single();
  if (error) throw classifyCatalogError(error, 'No se pudo guardar el producto V2.');
  return getAdminProductById(data.id, { client });
}

export async function deleteAdminProduct(
  productId,
  { client = defaultClient } = {},
) {
  const { error } = await client.from('catalog_products').delete().eq('id', productId);
  if (error) throw classifyCatalogError(error, 'No se pudo eliminar el producto V2.');
}
