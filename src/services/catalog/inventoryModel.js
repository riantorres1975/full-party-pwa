function joinName(parts) {
  return parts.filter(Boolean).join(' ');
}

export function adaptAdminInventoryRow(row) {
  const variant = row?.variant ?? {};
  const product = variant.product ?? {};
  const presentation = row?.presentation ?? null;
  const quantity = Number(row?.quantity) || 0;
  const reserved = Number(row?.reserved_quantity) || 0;
  const threshold = Number(row?.low_stock_threshold) || 0;

  return {
    id: row?.id ?? null,
    variant_id: row?.variant_id ?? null,
    sale_presentation_id: row?.sale_presentation_id ?? null,
    location_id: row?.location_id ?? null,
    nombre: joinName([
      product.name,
      variant.line?.name,
      variant.color?.exact_name,
      variant.size?.name,
    ]),
    categoria: product.category?.name ?? '',
    marca: product.brand?.name ?? '',
    tamano: variant.size?.name ?? '',
    presentacion: presentation?.name ?? 'Unidad base',
    ubicacion: row?.location?.name ?? '',
    sku: variant.sku ?? '',
    imagen_url: variant.image_url ?? product.main_image_url ?? null,
    stock_actual: quantity,
    stock_reservado: reserved,
    stock_disponible: Math.max(0, quantity - reserved),
    stock_minimo: threshold,
    unidad: presentation?.base_unit ?? 'pieza',
    contenido_presentacion: Number(presentation?.base_units_total) || 1,
    updated_at: row?.updated_at ?? null,
  };
}
