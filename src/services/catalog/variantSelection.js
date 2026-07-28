// ─────────────────────────────────────────────────────────────────────────────
// Lógica PURA de selección de variantes del catálogo V2.
// Sin dependencias de Supabase ni React: es la máquina de estados del selector
// Gama → Color → Medida → Acabado/Atributo → Presentación → Cantidad.
//
// Reglas:
//  - Solo se pueden elegir combinaciones que EXISTEN como variante activa.
//  - Al elegir gama, los colores se limitan a esa gama (y así en cascada).
//  - Cuando una dimensión queda con una sola opción válida, se auto-selecciona.
//  - Productos sin gama/color/medida/acabado ocultan esos selectores.
// ─────────────────────────────────────────────────────────────────────────────

export const EMPTY_SELECTION = Object.freeze({
  lineId: null,
  colorId: null,
  sizeId: null,
  finish: null,
  presentationId: null,
  quantity: 1,
});

function dimensionValue(variant, dimension) {
  return variant?.[dimension] ?? null;
}

/** ¿El producto usa cada dimensión? (al menos una variante la tiene no nula) */
export function getDimensionPresence(variants) {
  const list = Array.isArray(variants) ? variants : [];
  return {
    hasLines: list.some((v) => v.line_id != null),
    hasColors: list.some((v) => v.color_id != null),
    hasSizes: list.some((v) => v.size_id != null),
    hasFinishes: list.some((v) => v.finish != null),
  };
}

const DIMENSIONS = [
  { selectionKey: 'lineId', variantKey: 'line_id', presenceKey: 'hasLines', labels: { name: 'line_name', slug: 'line_slug' } },
  { selectionKey: 'colorId', variantKey: 'color_id', presenceKey: 'hasColors', labels: { name: 'color_name', slug: 'color_slug', hex: 'color_hex' } },
  { selectionKey: 'sizeId', variantKey: 'size_id', presenceKey: 'hasSizes', labels: { name: 'size_name', slug: null } },
  { selectionKey: 'finish', variantKey: 'finish', presenceKey: 'hasFinishes', labels: { name: 'finish', slug: null } },
];

function matchesSelection(variant, selection, dimensions) {
  return dimensions.every((dim) => {
    const wanted = selection[dim.selectionKey];
    if (wanted == null) return true; // dimensión sin elegir: no filtra
    return dimensionValue(variant, dim.variantKey) === wanted;
  });
}

/** Variantes candidatas dada la selección parcial actual. */
export function getCandidateVariants(variants, selection) {
  const list = Array.isArray(variants) ? variants : [];
  return list.filter((v) => matchesSelection(v, selection ?? EMPTY_SELECTION, DIMENSIONS));
}

function toOptions(variants, dimension, labelKeys) {
  const seen = new Map();
  for (const variant of variants) {
    const id = dimensionValue(variant, dimension);
    if (id == null || seen.has(id)) continue;
    seen.set(id, {
      id,
      name: variant[labelKeys.name] ?? null,
      slug: labelKeys.slug ? variant[labelKeys.slug] ?? null : null,
      hex: labelKeys.hex ? variant[labelKeys.hex] ?? null : undefined,
    });
  }
  return [...seen.values()].sort((a, b) =>
    String(a.name ?? '').localeCompare(String(b.name ?? ''), 'es', { sensitivity: 'base' }),
  );
}

/**
 * Opciones disponibles por dimensión, calculadas en cascada:
 * cada dimensión se filtra por las dimensiones ANTERIORES ya elegidas.
 */
export function getDimensionStates(variants, selection) {
  const list = Array.isArray(variants) ? variants : [];
  const presence = getDimensionPresence(list);
  const states = {};

  const dimensionOrder = DIMENSIONS.map((dimension) => dimension.variantKey);
  DIMENSIONS.forEach((dim, index) => {
    const previousDims = dimensionOrder.slice(0, index);
    const candidates = list.filter((v) =>
      previousDims.every((prev) => {
        const prevSelectionKey = DIMENSIONS[dimensionOrder.indexOf(prev)].selectionKey;
        const wanted = selection[prevSelectionKey];
        if (wanted == null) return true;
        return dimensionValue(v, prev) === wanted;
      }),
    );
    states[dim.selectionKey] = {
      visible: presence[dim.presenceKey],
      options: toOptions(candidates, dim.variantKey, dim.labels),
      value: selection[dim.selectionKey] ?? null,
    };
  });

  return states;
}

/** Busca la variante exacta para la selección (nulos deben coincidir con nulos). */
export function findVariant(variants, selection) {
  const list = Array.isArray(variants) ? variants : [];
  const found = list.filter(
    (v) =>
      (v.line_id ?? null) === (selection.lineId ?? null) &&
      (v.color_id ?? null) === (selection.colorId ?? null) &&
      (v.size_id ?? null) === (selection.sizeId ?? null) &&
      (v.finish ?? null) === (selection.finish ?? null),
  );
  return found.length === 1 ? found[0] : null;
}

/**
 * Aplica un cambio de selección y NORMALIZA en cascada:
 *  - limpia las dimensiones dependientes que dejaron de ser válidas,
 *  - auto-selecciona cuando una dimensión queda con una única opción,
 *  - resuelve la variante y su presentación cuando la combinación es única.
 *
 * patch: { lineId?, colorId?, sizeId?, finish?, presentationId?, quantity? }
 */
export function applySelection(variants, selection, patch) {
  const list = Array.isArray(variants) ? variants : [];
  const safePatch = patch ?? {};
  let next = { ...EMPTY_SELECTION, ...selection, ...safePatch };

  // Cambiar una dimensión invalida las dependientes.
  if (Object.prototype.hasOwnProperty.call(safePatch, 'lineId')) {
    if (!Object.prototype.hasOwnProperty.call(safePatch, 'colorId')) next.colorId = null;
    if (!Object.prototype.hasOwnProperty.call(safePatch, 'sizeId')) next.sizeId = null;
    if (!Object.prototype.hasOwnProperty.call(safePatch, 'finish')) next.finish = null;
    next.presentationId = null;
  }
  if (Object.prototype.hasOwnProperty.call(safePatch, 'colorId')) {
    if (!Object.prototype.hasOwnProperty.call(safePatch, 'sizeId')) next.sizeId = null;
    if (!Object.prototype.hasOwnProperty.call(safePatch, 'finish')) next.finish = null;
    next.presentationId = null;
  }
  if (Object.prototype.hasOwnProperty.call(safePatch, 'sizeId')) {
    if (!Object.prototype.hasOwnProperty.call(safePatch, 'finish')) next.finish = null;
    next.presentationId = null;
  }
  if (Object.prototype.hasOwnProperty.call(safePatch, 'finish')) {
    next.presentationId = null;
  }
  if (Object.prototype.hasOwnProperty.call(safePatch, 'presentationId')) {
    next.presentationId = safePatch.presentationId;
  }

  // Cascada: si una dimensión visible tiene una sola opción válida, se elige sola.
  for (const dim of DIMENSIONS) {
    const states = getDimensionStates(list, next);
    const state = states[dim.selectionKey];
    if (!state?.visible) {
      next[dim.selectionKey] = null;
      continue;
    }
    const currentValid = state.options.some((o) => o.id === next[dim.selectionKey]);
    if (!currentValid) next[dim.selectionKey] = null;
    if (next[dim.selectionKey] == null && state.options.length === 1) {
      next[dim.selectionKey] = state.options[0].id;
    }
  }

  const variant = findVariant(list, next);
  const presentations = Array.isArray(variant?.presentations) ? variant.presentations : [];

  // La presentación elegida debe existir en la variante resuelta.
  if (next.presentationId != null && !presentations.some((p) => p.id === next.presentationId)) {
    next.presentationId = null;
  }
  // Auto-selección de presentación cuando solo hay una.
  if (variant && next.presentationId == null && presentations.length === 1) {
    next.presentationId = presentations[0].id;
  }
  // Sin variante resuelta no hay presentación válida.
  if (!variant) next.presentationId = null;

  const presentation = presentations.find((p) => p.id === next.presentationId) ?? null;
  const quantity = normalizeQuantity(presentation, next.quantity);
  if (quantity !== next.quantity) next = { ...next, quantity };

  return {
    selection: next,
    variant,
    presentation,
    presentations,
    complete: isSelectionComplete(list, next),
  };
}

/** Selección inicial: auto-colapsa dimensiones de una sola opción. */
export function createInitialSelection(variants, initial = {}) {
  return applySelection(variants, EMPTY_SELECTION, initial);
}

/**
 * La selección está completa cuando todas las dimensiones VISIBLES tienen
 * valor y se resuelve exactamente una variante. La presentación es obligatoria
 * solo si la variante tiene presentaciones.
 */
export function isSelectionComplete(variants, selection) {
  const list = Array.isArray(variants) ? variants : [];
  const presence = getDimensionPresence(list);
  if (presence.hasLines && selection.lineId == null) return false;
  if (presence.hasColors && selection.colorId == null) return false;
  if (presence.hasSizes && selection.sizeId == null) return false;
  if (presence.hasFinishes && selection.finish == null) return false;
  const variant = findVariant(list, selection);
  if (!variant) return false;
  const presentations = Array.isArray(variant.presentations) ? variant.presentations : [];
  if (presentations.length > 0 && selection.presentationId == null) return false;
  return true;
}

/** Ajusta la cantidad a mínimo/step/máximo de la presentación. */
export function normalizeQuantity(presentation, quantity) {
  const min = Math.max(
    1,
    Number(presentation?.minimumOrderQuantity ?? presentation?.minimum_order_quantity) || 1,
  );
  const step = Math.max(
    1,
    Number(presentation?.quantityStep ?? presentation?.quantity_step) || 1,
  );
  const rawMax = presentation?.maximumOrderQuantity ?? presentation?.maximum_order_quantity;
  const max = rawMax != null && Number.isFinite(Number(rawMax))
    ? Number(rawMax)
    : null;

  let qty = Math.floor(Number(quantity));
  if (!Number.isFinite(qty) || qty < min) qty = min;
  if (step > 1 && qty > min) {
    qty = min + Math.floor((qty - min) / step) * step;
  }
  if (max != null && qty > max) {
    qty = min + Math.max(0, Math.floor((max - min) / step)) * step;
  }
  return Math.max(min, qty);
}

/** Error de cantidad para mostrar en UI (mismo criterio que el servidor). */
export function getQuantityError(presentation, quantity) {
  if (!presentation) return null;
  const min = Math.max(
    1,
    Number(presentation.minimumOrderQuantity ?? presentation.minimum_order_quantity) || 1,
  );
  const step = Math.max(
    1,
    Number(presentation.quantityStep ?? presentation.quantity_step) || 1,
  );
  const rawMax = presentation.maximumOrderQuantity ?? presentation.maximum_order_quantity;
  const max = rawMax != null && Number.isFinite(Number(rawMax))
    ? Number(rawMax)
    : null;
  const qty = Math.floor(Number(quantity));

  if (!Number.isFinite(qty) || qty < min) {
    return { code: 'min_quantity', message: `La cantidad mínima es ${min}` };
  }
  if (max != null && qty > max) {
    return { code: 'max_quantity', message: `La cantidad máxima es ${max}` };
  }
  if (step > 1 && (qty - min) % step !== 0) {
    return { code: 'quantity_step', message: `La cantidad debe avanzar de ${step} en ${step} desde el mínimo` };
  }
  return null;
}
