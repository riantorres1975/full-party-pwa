import { useMemo } from 'react';

import {
  resolvePresentationPricing,
} from '../../services/catalog/pricing.js';
import {
  getQuantityError,
  normalizeQuantity,
} from '../../services/catalog/variantSelection.js';

/** Vista previa local; Supabase vuelve a calcular al validar y crear el pedido. */
export function usePresentationPricing(presentation, quantity) {
  return useMemo(() => {
    if (!presentation) {
      return {
        quantity: 1,
        pricing: null,
        quantityError: null,
      };
    }

    const normalizedQuantity = normalizeQuantity(presentation, quantity);
    return {
      quantity: normalizedQuantity,
      pricing: resolvePresentationPricing(presentation, normalizedQuantity),
      quantityError: getQuantityError(presentation, quantity),
    };
  }, [presentation, quantity]);
}
