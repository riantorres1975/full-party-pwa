export const INVENTORY_POLICIES = [
  { value: 'shared_base_units', label: 'Unidades base compartidas' },
  { value: 'separate_by_presentation', label: 'Separado por presentacion' },
];

export const PRESENTATION_TYPES = [
  'pieza',
  'bolsa',
  'paquete',
  'caja',
  'lata',
  'rollo',
  'botella',
  'juego',
  'otro',
];

function text(value) {
  return String(value ?? '').trim();
}

function nullableText(value) {
  return text(value) || null;
}

function numberOrNull(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integerOrNull(value) {
  if (value === '' || value == null) return null;
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && Number(value) === number ? number : null;
}

export function createVariantDraft(variant = null) {
  return {
    line_id: variant?.line_id ?? '',
    color_id: variant?.color_id ?? '',
    size_id: variant?.size_id ?? '',
    finish: variant?.finish ?? '',
    sku: variant?.sku ?? '',
    barcode: variant?.barcode ?? '',
    image_url: variant?.image_url ?? '',
    inventory_policy: variant?.inventory_policy ?? 'shared_base_units',
    active: variant?.active !== false,
  };
}

export function normalizeVariantPayload(input, productId) {
  return {
    product_id: productId,
    line_id: nullableText(input?.line_id),
    color_id: nullableText(input?.color_id),
    size_id: nullableText(input?.size_id),
    finish: nullableText(input?.finish),
    sku: nullableText(input?.sku),
    barcode: nullableText(input?.barcode),
    image_url: nullableText(input?.image_url),
    inventory_policy: input?.inventory_policy === 'separate_by_presentation'
      ? 'separate_by_presentation'
      : 'shared_base_units',
    active: input?.active !== false,
  };
}

export function validateVariantPayload(input, productId) {
  const payload = normalizeVariantPayload(input, productId);
  const errors = {};
  if (!productId) errors.product_id = 'Guarda primero la familia del producto.';
  if (!payload.line_id && !payload.color_id && !payload.size_id && !payload.finish) {
    const hasIdentity = payload.sku || payload.barcode;
    if (!hasIdentity) errors.sku = 'Una variante simple necesita SKU o codigo de barras.';
  }
  return { valid: Object.keys(errors).length === 0, errors, payload };
}

export function createPresentationDraft(presentation = null) {
  const composed = Boolean(presentation?.contains_presentation_id);
  return {
    name: presentation?.name ?? '',
    presentation_type: presentation?.presentation_type ?? 'pieza',
    content_mode: composed ? 'composed' : 'direct',
    base_unit: presentation?.base_unit ?? 'pieza',
    contained_quantity: presentation?.contained_quantity ?? 1,
    contained_unit: presentation?.contained_unit ?? 'pieza',
    contains_presentation_id: presentation?.contains_presentation_id ?? '',
    contains_quantity: presentation?.contains_quantity ?? 1,
    base_units_total: presentation?.base_units_total ?? 1,
    base_price: presentation?.base_price ?? 0,
    compare_at_price: presentation?.compare_at_price ?? '',
    sku: presentation?.sku ?? '',
    barcode: presentation?.barcode ?? '',
    minimum_order_quantity: presentation?.minimum_order_quantity ?? 1,
    quantity_step: presentation?.quantity_step ?? 1,
    maximum_order_quantity: presentation?.maximum_order_quantity ?? '',
    inventory_policy: presentation?.inventory_policy ?? '',
    sort_order: presentation?.sort_order ?? 0,
    active: presentation?.active !== false,
  };
}

export function normalizePresentationPayload(input, variantId) {
  const composed = input?.content_mode === 'composed';
  return {
    variant_id: variantId,
    name: text(input?.name),
    presentation_type: text(input?.presentation_type) || 'otro',
    base_unit: text(input?.base_unit) || 'pieza',
    contained_quantity: composed ? null : numberOrNull(input?.contained_quantity),
    contained_unit: composed ? null : nullableText(input?.contained_unit),
    contains_presentation_id: composed ? nullableText(input?.contains_presentation_id) : null,
    contains_quantity: composed ? numberOrNull(input?.contains_quantity) : null,
    base_units_total: numberOrNull(input?.base_units_total),
    base_price: numberOrNull(input?.base_price),
    compare_at_price: numberOrNull(input?.compare_at_price),
    sku: nullableText(input?.sku),
    barcode: nullableText(input?.barcode),
    minimum_order_quantity: integerOrNull(input?.minimum_order_quantity),
    quantity_step: integerOrNull(input?.quantity_step),
    maximum_order_quantity: integerOrNull(input?.maximum_order_quantity),
    inventory_policy: INVENTORY_POLICIES.some(
      (policy) => policy.value === input?.inventory_policy,
    )
      ? input.inventory_policy
      : null,
    sort_order: Number.parseInt(input?.sort_order, 10) || 0,
    active: input?.active !== false,
  };
}

export function validatePresentationPayload(input, variantId) {
  const payload = normalizePresentationPayload(input, variantId);
  const errors = {};
  if (!variantId) errors.variant_id = 'Selecciona una variante.';
  if (!payload.name) errors.name = 'El nombre es obligatorio.';
  if (!PRESENTATION_TYPES.includes(payload.presentation_type)) {
    errors.presentation_type = 'Selecciona un tipo valido.';
  }
  if (input?.content_mode === 'composed') {
    if (!payload.contains_presentation_id) {
      errors.contains_presentation_id = 'Selecciona la presentacion contenida.';
    }
    if (!(payload.contains_quantity > 0)) {
      errors.contains_quantity = 'La cantidad contenida debe ser mayor a cero.';
    }
  } else {
    if (!(payload.contained_quantity > 0)) {
      errors.contained_quantity = 'La cantidad debe ser mayor a cero.';
    }
    if (!payload.contained_unit) errors.contained_unit = 'Indica la unidad contenida.';
  }
  if (!(payload.base_units_total > 0)) {
    errors.base_units_total = 'El total de unidades base debe ser mayor a cero.';
  }
  if (!(payload.base_price >= 0)) errors.base_price = 'El precio no puede ser negativo.';
  if (!(payload.minimum_order_quantity >= 1)) {
    errors.minimum_order_quantity = 'La compra minima debe ser un entero mayor a cero.';
  }
  if (!(payload.quantity_step >= 1)) {
    errors.quantity_step = 'El incremento debe ser un entero mayor a cero.';
  }
  if (
    payload.maximum_order_quantity != null
    && payload.maximum_order_quantity < payload.minimum_order_quantity
  ) {
    errors.maximum_order_quantity = 'El maximo debe ser mayor o igual al minimo.';
  }
  return { valid: Object.keys(errors).length === 0, errors, payload };
}

export function createPriceTierDraft(tier = null) {
  return {
    minimum_quantity: tier?.minimum_quantity ?? 1,
    maximum_quantity: tier?.maximum_quantity ?? '',
    price_per_presentation: tier?.price_per_presentation ?? 0,
    label: tier?.label ?? '',
    active: tier?.active !== false,
  };
}

export function normalizePriceTierPayload(input, presentationId) {
  return {
    sale_presentation_id: presentationId,
    minimum_quantity: integerOrNull(input?.minimum_quantity),
    maximum_quantity: integerOrNull(input?.maximum_quantity),
    price_per_presentation: numberOrNull(input?.price_per_presentation),
    label: nullableText(input?.label),
    active: input?.active !== false,
  };
}

export function priceTierRangesOverlap(left, right) {
  const leftMax = left.maximum_quantity == null ? Number.POSITIVE_INFINITY : Number(left.maximum_quantity);
  const rightMax = right.maximum_quantity == null ? Number.POSITIVE_INFINITY : Number(right.maximum_quantity);
  return Number(left.minimum_quantity) <= rightMax && Number(right.minimum_quantity) <= leftMax;
}

export function validatePriceTierPayload(input, presentationId, existingTiers = [], tierId = null) {
  const payload = normalizePriceTierPayload(input, presentationId);
  const errors = {};
  if (!presentationId) errors.sale_presentation_id = 'Selecciona una presentacion.';
  if (!(payload.minimum_quantity >= 1)) {
    errors.minimum_quantity = 'La cantidad minima debe ser un entero mayor a cero.';
  }
  if (
    payload.maximum_quantity != null
    && payload.maximum_quantity < payload.minimum_quantity
  ) {
    errors.maximum_quantity = 'El maximo debe ser mayor o igual al minimo.';
  }
  if (!(payload.price_per_presentation >= 0)) {
    errors.price_per_presentation = 'El precio no puede ser negativo.';
  }
  const overlaps = payload.active && existingTiers.some((tier) =>
    tier.id !== tierId && tier.active !== false && priceTierRangesOverlap(payload, tier));
  if (overlaps) errors.minimum_quantity = 'El rango se superpone con otro escalon activo.';
  return { valid: Object.keys(errors).length === 0, errors, payload };
}

export function createInventoryDraft(row = null, variant = null) {
  return {
    variant_id: row?.variant_id ?? variant?.id ?? '',
    sale_presentation_id: row?.sale_presentation_id ?? '',
    location_id: row?.location_id ?? '',
    quantity: row?.quantity ?? 0,
    reserved_quantity: row?.reserved_quantity ?? 0,
  };
}

export function normalizeInventoryPayload(input) {
  return {
    variant_id: nullableText(input?.variant_id),
    sale_presentation_id: nullableText(input?.sale_presentation_id),
    location_id: nullableText(input?.location_id),
    quantity: numberOrNull(input?.quantity),
    reserved_quantity: numberOrNull(input?.reserved_quantity) ?? 0,
  };
}

export function validateInventoryPayload(input, variant = null) {
  const payload = normalizeInventoryPayload(input);
  const errors = {};
  const selectedPresentation = variant?.presentations?.find(
    (presentation) => presentation.id === payload.sale_presentation_id,
  );
  const effectivePolicy = selectedPresentation?.inventory_policy
    || variant?.inventory_policy
    || 'shared_base_units';
  if (
    variant?.inventory_policy !== 'separate_by_presentation'
    && effectivePolicy !== 'separate_by_presentation'
  ) {
    payload.sale_presentation_id = null;
  }
  if (!payload.variant_id) errors.variant_id = 'Selecciona una variante.';
  if (!payload.location_id) errors.location_id = 'Selecciona una sucursal.';
  if (!(payload.quantity >= 0)) errors.quantity = 'La existencia no puede ser negativa.';
  if (!(payload.reserved_quantity >= 0)) {
    errors.reserved_quantity = 'La reserva no puede ser negativa.';
  } else if (payload.reserved_quantity > payload.quantity) {
    errors.reserved_quantity = 'La reserva no puede superar la existencia.';
  }
  if (variant?.inventory_policy === 'separate_by_presentation' && !payload.sale_presentation_id) {
    errors.sale_presentation_id = 'Selecciona la presentacion inventariada.';
  }
  if (payload.sale_presentation_id && !selectedPresentation) {
    errors.sale_presentation_id = 'La presentacion no pertenece a la variante.';
  } else if (payload.sale_presentation_id && effectivePolicy !== 'separate_by_presentation') {
    errors.sale_presentation_id = 'La presentacion usa inventario compartido.';
  }
  return { valid: Object.keys(errors).length === 0, errors, payload };
}
