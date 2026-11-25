// ─────────────────────────────────────────────────────────────────────────────
// Lógica PURA de precios por presentación (catálogo V2).
//
// Espeja EXACTAMENTE el algoritmo del servidor (catalog_resolve_price en
// 005_catalog_functions.sql) para que la UI muestre precios al instante con
// los datos del detalle (que ya incluye los escalones). El servidor SIEMPRE
// recalcula al validar el carrito y al crear el pedido; este módulo nunca es
// la fuente canónica, solo la vista previa inmediata.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeTiers(tiers) {
  return (Array.isArray(tiers) ? tiers : [])
    .map((t) => ({
      minimumQuantity: Number(t?.minimumQuantity ?? t?.minimum_quantity) || 0,
      maximumQuantity: (t?.maximumQuantity ?? t?.maximum_quantity) != null
        && Number.isFinite(Number(t?.maximumQuantity ?? t?.maximum_quantity))
        ? Number(t?.maximumQuantity ?? t?.maximum_quantity)
        : null,
      pricePerPresentation: Number(t?.pricePerPresentation ?? t?.price_per_presentation),
      label: t?.label ?? null,
    }))
    .filter(
      (t) =>
        t.minimumQuantity >= 1 &&
        Number.isFinite(t.pricePerPresentation) &&
        t.pricePerPresentation >= 0,
    )
    .sort((a, b) => a.minimumQuantity - b.minimumQuantity);
}

/**
 * Precio unitario aplicado para una cantidad.
 * Mismo algoritmo que catalog_resolve_price: mayor escalón cuyo mínimo ≤ cantidad;
 * si no hay escalón alcanzado, el precio base.
 */
export function resolveUnitPrice(presentation, quantity) {
  const basePrice = Number(presentation?.basePrice ?? presentation?.base_price) || 0;
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const tiers = normalizeTiers(presentation?.tiers);

  const applied = [...tiers].reverse().find((t) => qty >= t.minimumQuantity);
  return {
    quantity: qty,
    unitPrice: applied ? applied.pricePerPresentation : basePrice,
    basePrice,
    tierLabel: applied?.label ?? null,
    tierMinimum: applied?.minimumQuantity ?? null,
  };
}

/** Siguiente nivel más barato alcanzable y cuánto falta (para "te faltan N"). */
export function resolveNextTier(presentation, quantity) {
  const { unitPrice } = resolveUnitPrice(presentation, quantity);
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const next = normalizeTiers(presentation?.tiers).find(
    (t) => t.minimumQuantity > qty && t.pricePerPresentation < unitPrice,
  );
  if (!next) return null;
  return {
    minimumQuantity: next.minimumQuantity,
    missing: next.minimumQuantity - qty,
    price: next.pricePerPresentation,
    label: next.label,
  };
}

/** Price ranges on valid order quantities, including the base price. */
export function getPresentationPriceBreaks(presentation) {
  const minimum = Math.max(1, Number(presentation?.minimumOrderQuantity) || 1);
  const step = Math.max(1, Number(presentation?.quantityStep) || 1);
  const configuredMaximum = presentation?.maximumOrderQuantity;
  const maximum = configuredMaximum == null
    ? null
    : minimum + Math.floor((configuredMaximum - minimum) / step) * step;
  if (maximum != null && maximum < minimum) return [];

  const starts = [minimum];
  for (const tier of normalizeTiers(presentation?.tiers)) {
    const aligned = minimum + Math.max(0, Math.ceil((tier.minimumQuantity - minimum) / step)) * step;
    if ((maximum == null || aligned <= maximum) && !starts.includes(aligned)) starts.push(aligned);
  }
  return starts.map((quantity, index) => ({
    minimum: quantity,
    maximum: index < starts.length - 1 ? starts[index + 1] - step : maximum,
    unitPrice: resolveUnitPrice(presentation, quantity).unitPrice,
  }));
}

/** Subtotal de línea redondeado a 2 decimales (igual que el servidor). */
export function computeSubtotal(unitPrice, quantity) {
  const qty = Math.max(0, Number(quantity) || 0);
  return Math.round(Number(unitPrice || 0) * qty * 100) / 100;
}

/** Resumen completo de precio para una presentación + cantidad. */
export function resolvePresentationPricing(presentation, quantity) {
  const resolved = resolveUnitPrice(presentation, quantity);
  return {
    ...resolved,
    subtotal: computeSubtotal(resolved.unitPrice, resolved.quantity),
    nextTier: resolveNextTier(presentation, resolved.quantity),
    totalUnits:
      Number.isFinite(Number(presentation?.baseUnitsTotal ?? presentation?.base_units_total))
        ? Number(presentation?.baseUnitsTotal ?? presentation?.base_units_total) * resolved.quantity
        : null,
  };
}

/** Identidad de renglón de carrito V2: variante + presentación (§21). */
export function buildCartLineKey(variantId, salePresentationId) {
  return `${String(variantId)}::${String(salePresentationId)}`;
}
