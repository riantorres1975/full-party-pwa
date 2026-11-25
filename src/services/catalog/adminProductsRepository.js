import { supabase as defaultClient } from '../../lib/supabase.js';
import { applyAdminCommercialRows } from './adminBulkRepository.js';
import { QUICK_PHOTO_EXTENSIONS } from './adminQuickProduct.js';
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
  { offset = 0, limit = 18, search = '', active, categoryId } = {},
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
    .order('id', { ascending: true })
    .range(safeOffset, safeOffset + safeLimit - 1);
  if (safeSearch) {
    query = query.or(`name.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%`);
  }
  if (typeof active === 'boolean') query = query.eq('active', active);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (signal && typeof query.abortSignal === 'function') query = query.abortSignal(signal);

  const { data, error, count } = await query;
  if (error) throw classifyCatalogError(error, 'No se pudieron cargar los productos V2.');
  const products = (Array.isArray(data) ? data : []).map(adaptAdminProduct);
  return {
    products,
    total: count ?? (safeOffset + products.length),
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
  { id = null, newId = null, client = defaultClient } = {},
) {
  const payload = normalizeAdminProductPayload(input);
  let query = id
    ? client.from('catalog_products').update(payload).eq('id', id)
    : client.from('catalog_products').insert(newId ? { ...payload, id: newId } : payload);

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

/** Keep the product private until the sale, price and inventory row is complete. */
export async function registerAdminQuickProduct(
  { productId, product, row, photo },
  { client = defaultClient } = {},
) {
  const existing = await getAdminProductById(productId, { client });
  if (existing?.active) return existing;

  const publish = async (draft) => {
    try {
      return await saveAdminProduct({ ...draft, active: true }, { id: productId, client });
    } catch (error) {
      error.readyToPublish = true;
      throw error;
    }
  };

  // The commercial row is transactional. If it was accepted before the browser
  // lost its connection, publishing must not write stock or prices a second time.
  if (existing?.presentationCount > 0) return publish(existing);

  let draft = await saveAdminProduct(
    { ...product, main_image_url: existing?.main_image_url, active: false },
    { id: existing?.id, newId: productId, client },
  );

  if (photo) {
    const storage = client.storage.from('productos-imagenes');
    const path = `catalogo/${productId}/principal.${QUICK_PHOTO_EXTENSIONS[photo.type]}`;
    const { error } = await storage.upload(path, photo, { upsert: true, contentType: photo.type });
    if (error) throw new Error('No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.');
    const { data } = storage.getPublicUrl(path);
    draft = await saveAdminProduct(
      { ...draft, main_image_url: data.publicUrl },
      { id: productId, client },
    );
  }

  let report;
  try {
    report = await applyAdminCommercialRows(productId, [row], { client });
  } catch (error) {
    // A lost response is ambiguous. Keep the input stable until the retry can check.
    error.readyToPublish = true;
    throw error;
  }
  if (report.created + report.updated !== 1) {
    throw new Error('No se pudo guardar el precio y la existencia. Revisa los datos e inténtalo de nuevo.');
  }

  return publish(draft);
}
