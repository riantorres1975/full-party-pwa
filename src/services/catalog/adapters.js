// ─────────────────────────────────────────────────────────────────────────────
// Adaptadores PUROS: normalizan las respuestas de las RPC del catálogo V2 a
// formas estables para la app. Defensivos ante nulos y campos faltantes.
// Sin dependencias de Supabase (unit-testables).
// ─────────────────────────────────────────────────────────────────────────────

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// ── Tarjetas (catalog_list_cards) ────────────────────────────────────────────

/**
 * ¿La tarjeta permite "Agregar" directo o requiere "Elegir opciones"?
 * Solo se puede agregar directo cuando hay exactamente UNA variante con UNA
 * presentación posible y ninguna dimensión que elegir (§15).
 */
export function cardRequiresOptions(card) {
  const variantCount = asNumber(card?.variantCount ?? card?.variant_count, 0);
  const presentationCount = asNumber(
    card?.presentationCount ?? card?.presentation_count,
    0,
  );
  const colorCount = asNumber(card?.colorCount ?? card?.color_count, 0);
  const lineCount = asNumber(card?.lineCount ?? card?.line_count, 0);
  const sizes = asArray(card?.sizes);
  return !(
    variantCount === 1 &&
    presentationCount === 1 &&
    colorCount <= 1 &&
    lineCount <= 1 &&
    sizes.length <= 1
  );
}

export function adaptCard(raw) {
  const sizes = asArray(raw?.sizes).map((s) => ({
    id: s?.id ?? null,
    name: s?.name ?? null,
  }));
  const colors = asArray(raw?.colors).map((c) => ({
    slug: c?.slug ?? null,
    name: c?.name ?? null,
    hex: c?.hex ?? null,
    imageUrl: c?.image_url ?? c?.imageUrl ?? null,
  }));
  const card = {
    groupKey: raw?.group_key ?? null,
    productId: raw?.product_id ?? null,
    name: raw?.product_name ?? '',
    slug: raw?.product_slug ?? null,
    shortDescription: raw?.short_description ?? null,
    brandName: raw?.brand_name ?? null,
    brandSlug: raw?.brand_slug ?? null,
    lineId: raw?.line_id ?? null,
    lineName: raw?.line_name ?? null,
    lineSlug: raw?.line_slug ?? null,
    imageUrl: raw?.image_url ?? null,
    minPrice: asNumber(raw?.min_price, 0),
    colorCount: asNumber(raw?.color_count, 0),
    lineCount: asNumber(raw?.line_count, 0),
    variantCount: asNumber(raw?.variant_count, 0),
    presentationCount: asNumber(raw?.presentation_count, 0),
    sizes,
    colors,
    presentationTypes: asArray(raw?.presentation_types),
    inStock: raw?.in_stock === true,
    featured: raw?.featured === true,
    isNew: raw?.is_new === true,
  };
  return { ...card, requiresOptions: cardRequiresOptions(card) };
}

export function adaptCardsResponse(payload) {
  return {
    cards: asArray(payload?.cards).map(adaptCard),
    total: asNumber(payload?.total, 0),
    limit: asNumber(payload?.limit, 24),
    offset: asNumber(payload?.offset, 0),
  };
}

// ── Detalle (catalog_get_product_detail) ─────────────────────────────────────

export function adaptTier(raw) {
  return {
    minimumQuantity: asNumber(raw?.minimum_quantity, 1),
    maximumQuantity: raw?.maximum_quantity == null ? null : asNumber(raw.maximum_quantity),
    pricePerPresentation: asNumber(raw?.price_per_presentation, 0),
    label: raw?.label ?? null,
  };
}

export function adaptPresentation(raw) {
  return {
    id: raw?.id ?? null,
    variantId: raw?.variant_id ?? null,
    name: raw?.name ?? '',
    presentationType: raw?.presentation_type ?? 'otro',
    baseUnit: raw?.base_unit ?? 'pieza',
    containedQuantity: asNumber(raw?.contained_quantity),
    containedUnit: raw?.contained_unit ?? null,
    containsPresentationId: raw?.contains_presentation_id ?? null,
    containsQuantity: asNumber(raw?.contains_quantity),
    baseUnitsTotal: asNumber(raw?.base_units_total, 1),
    basePrice: asNumber(raw?.base_price, 0),
    compareAtPrice: asNumber(raw?.compare_at_price),
    sku: raw?.sku ?? null,
    barcode: raw?.barcode ?? null,
    minimumOrderQuantity: asNumber(raw?.minimum_order_quantity, 1),
    quantityStep: asNumber(raw?.quantity_step, 1),
    maximumOrderQuantity: raw?.maximum_order_quantity == null
      ? null
      : asNumber(raw.maximum_order_quantity),
    inventoryPolicy: raw?.inventory_policy ?? 'shared_base_units',
    sortOrder: asNumber(raw?.sort_order, 0),
    availableQuantity: asNumber(raw?.available_quantity),
    inStock: raw?.in_stock == null ? null : raw.in_stock === true,
    tiers: asArray(raw?.tiers).map(adaptTier),
  };
}

export function adaptVariant(raw) {
  return {
    id: raw?.id ?? null,
    line_id: raw?.line_id ?? null,
    line_name: raw?.line_name ?? null,
    line_slug: raw?.line_slug ?? null,
    finish_type: raw?.finish_type ?? null,
    color_id: raw?.color_id ?? null,
    color_name: raw?.color_name ?? null,
    color_slug: raw?.color_slug ?? null,
    color_hex: raw?.color_hex ?? null,
    color_code: raw?.color_code ?? null,
    size_id: raw?.size_id ?? null,
    size_name: raw?.size_name ?? null,
    size_numeric: asNumber(raw?.size_numeric),
    size_unit: raw?.size_unit ?? null,
    finish: raw?.finish ?? null,
    sku: raw?.sku ?? null,
    barcode: raw?.barcode ?? null,
    image_url: raw?.image_url ?? null,
    inventory_policy: raw?.inventory_policy ?? 'shared_base_units',
    presentations: asArray(raw?.presentations).map(adaptPresentation),
  };
}

export function adaptProductDetail(payload) {
  if (!payload) return null;
  const product = payload.product ?? {};
  return {
    product: {
      id: product.id ?? null,
      name: product.name ?? '',
      slug: product.slug ?? null,
      shortDescription: product.short_description ?? null,
      description: product.description ?? null,
      mainImageUrl: product.main_image_url ?? null,
      listingGroupMode: product.listing_group_mode ?? 'product',
      featured: product.featured === true,
      isNew: product.is_new === true,
      seoTitle: product.seo_title ?? null,
      seoDescription: product.seo_description ?? null,
      brand: product.brand ?? null,
      category: product.category ?? null,
    },
    breadcrumb: asArray(payload.breadcrumb).map((c) => ({
      id: c?.id ?? null,
      name: c?.name ?? null,
      slug: c?.slug ?? null,
    })),
    lines: asArray(payload.lines).map((l) => ({
      id: l?.id ?? null,
      name: l?.name ?? null,
      slug: l?.slug ?? null,
      finishType: l?.finish_type ?? null,
      imageUrl: l?.image_url ?? null,
      colors: asArray(l?.colors).map((c) => ({
        colorId: c?.color_id ?? null,
        exactName: c?.exact_name ?? null,
        slug: c?.slug ?? null,
        hex: c?.hex ?? null,
        commercialName: c?.commercial_name ?? null,
        imageUrl: c?.image_url ?? null,
      })),
    })),
    sizes: asArray(payload.sizes).map((s) => ({
      id: s?.id ?? null,
      name: s?.name ?? null,
      numericValue: asNumber(s?.numeric_value),
      unit: s?.unit ?? null,
    })),
    variants: asArray(payload.variants).map(adaptVariant),
    images: asArray(payload.images).map((img) => ({
      id: img?.id ?? null,
      imageUrl: img?.image_url ?? null,
      imageType: img?.image_type ?? 'galeria',
      altText: img?.alt_text ?? null,
      variantId: img?.variant_id ?? null,
      lineId: img?.line_id ?? null,
      colorId: img?.color_id ?? null,
      sortOrder: asNumber(img?.sort_order, 0),
    })),
    attributes: asArray(payload.attributes).map((a) => ({
      name: a?.name ?? null,
      value: a?.value ?? null,
      unit: a?.unit ?? null,
    })),
    related: asArray(payload.related).map((r) => ({
      relationType: r?.relation_type ?? 'similar',
      productId: r?.product_id ?? null,
      name: r?.name ?? null,
      slug: r?.slug ?? null,
      imageUrl: r?.image_url ?? null,
      minPrice: asNumber(r?.min_price),
    })),
  };
}

// ── Facetas (catalog_get_facets) ─────────────────────────────────────────────

export function adaptFacets(payload) {
  const mapList = (list, mapFn) => asArray(list).map(mapFn);
  return {
    brands: mapList(payload?.brands, (b) => ({ slug: b?.slug, name: b?.name, count: asNumber(b?.count, 0) })),
    lines: mapList(payload?.lines, (l) => ({ slug: l?.slug, name: l?.name, count: asNumber(l?.count, 0) })),
    colorFamilies: mapList(payload?.color_families, (f) => ({ slug: f?.slug, name: f?.name, count: asNumber(f?.count, 0) })),
    colors: mapList(payload?.colors, (c) => ({ slug: c?.slug, name: c?.name, hex: c?.hex ?? null, count: asNumber(c?.count, 0) })),
    sizes: mapList(payload?.sizes, (s) => ({ id: s?.id ?? null, name: s?.name, count: asNumber(s?.count, 0) })),
    finishes: mapList(payload?.finishes, (f) => ({ value: f?.value, count: asNumber(f?.count, 0) })),
    price: {
      min: asNumber(payload?.price?.min),
      max: asNumber(payload?.price?.max),
    },
    availability: {
      inStock: asNumber(payload?.availability?.in_stock, 0),
      outOfStock: asNumber(payload?.availability?.out_of_stock, 0),
    },
  };
}

// ── Categorías (árbol jerárquico) ────────────────────────────────────────────

/** Construye el árbol de categorías a partir de filas planas con parent_id. */
export function buildCategoryTree(rows) {
  const list = asArray(rows).map((r) => ({
    id: r?.id ?? null,
    name: r?.name ?? '',
    slug: r?.slug ?? null,
    parentId: r?.parent_id ?? null,
    description: r?.description ?? null,
    imageUrl: r?.image_url ?? null,
    icon: r?.icon ?? null,
    sortOrder: asNumber(r?.sort_order, 0),
    children: [],
  }));
  const byId = new Map(list.map((c) => [c.id, c]));
  const roots = [];
  for (const cat of list) {
    const parent = cat.parentId ? byId.get(cat.parentId) : null;
    if (parent) parent.children.push(cat);
    else roots.push(cat);
  }
  const sortRec = (nodes) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

/** Aplana el árbol en un mapa slug → nodo (con ruta de slugs para URLs). */
export function indexCategoriesBySlug(tree) {
  const index = new Map();
  const walk = (nodes, path) => {
    for (const node of nodes) {
      const fullPath = [...path, node.slug];
      index.set(node.slug, { ...node, path: fullPath });
      walk(node.children, fullPath);
    }
  };
  walk(asArray(tree), []);
  return index;
}

// ── Carrito validado por el servidor (catalog_validate_cart) ────────────────

export function adaptValidatedCart(payload) {
  return {
    valid: payload?.valid === true,
    issues: asArray(payload?.issues).map((i) => ({
      line: asNumber(i?.line, 0),
      code: i?.code ?? 'unknown',
      message: i?.message ?? '',
    })),
    lines: asArray(payload?.lines),
    total: asNumber(payload?.total, 0),
  };
}

/** Conserva lineas invalidas para que la validacion canonica las reporte. */
export function adaptCartItemsForRpc(items) {
  return asArray(items).map((item) => ({
    variant_id: item?.variant_id ?? item?.variantId ?? null,
    sale_presentation_id:
      item?.sale_presentation_id ?? item?.salePresentationId ?? null,
    quantity: item?.quantity ?? null,
  }));
}
