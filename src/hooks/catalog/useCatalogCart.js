import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addCatalogCartItem,
  buildCatalogCartItem,
  CATALOG_CART_STORAGE_KEY,
  getCatalogCartTotal,
  LEGACY_CART_STORAGE_KEY,
  parseCatalogCart,
  serializeCatalogCart,
  updateCatalogCartQuantity,
} from '../../services/catalog/cart.js';
import { validateCart as validateCatalogCart } from '../../services/catalog/pricingRepository.js';

function readCart() {
  if (typeof window === 'undefined') return [];
  return parseCatalogCart(window.localStorage.getItem(CATALOG_CART_STORAGE_KEY));
}

function hasLegacyCart() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export function useCatalogCart() {
  const [items, setItems] = useState(readCart);
  const [legacyCartDetected, setLegacyCartDetected] = useState(hasLegacyCart);
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    try {
      if (items.length === 0) {
        window.localStorage.removeItem(CATALOG_CART_STORAGE_KEY);
      } else {
        window.localStorage.setItem(
          CATALOG_CART_STORAGE_KEY,
          serializeCatalogCart(items),
        );
      }
    } catch {
      // localStorage may be unavailable in private browsing.
    }
  }, [items]);

  const invalidate = useCallback(() => {
    setValidation(null);
    setValidationError(null);
  }, []);

  const addSelection = useCallback((selection) => {
    let incoming;
    try {
      incoming = buildCatalogCartItem(selection);
    } catch (error) {
      return { ok: false, message: error.message };
    }

    const existing = items.find((item) => item.key === incoming.key);
    const available = incoming.presentation.availableQuantity;
    const requested = (existing?.quantity || 0) + incoming.quantity;
    if (available != null && requested > available) {
      return {
        ok: false,
        message: `Solo hay ${available} presentaciones disponibles.`,
      };
    }

    setItems((current) => addCatalogCartItem(current, incoming));
    invalidate();
    return { ok: true, item: incoming };
  }, [invalidate, items]);

  const setQuantity = useCallback((key, quantity) => {
    setItems((current) => updateCatalogCartQuantity(current, key, quantity));
    invalidate();
  }, [invalidate]);

  const removeItem = useCallback((key) => {
    setItems((current) => current.filter((item) => item.key !== key));
    invalidate();
  }, [invalidate]);

  const clear = useCallback(() => {
    setItems([]);
    invalidate();
  }, [invalidate]);

  const dismissLegacyCart = useCallback(() => {
    try {
      window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    } catch {
      // The notice can still be dismissed if storage is unavailable.
    }
    setLegacyCartDetected(false);
  }, []);

  const validate = useCallback(async () => {
    setValidating(true);
    setValidationError(null);
    try {
      const result = await validateCatalogCart(items);
      setValidation(result);
      return result;
    } catch (error) {
      setValidationError(error);
      throw error;
    } finally {
      setValidating(false);
    }
  }, [items]);

  const total = useMemo(() => getCatalogCartTotal(items), [items]);
  const quantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  return {
    items,
    total,
    quantity,
    legacyCartDetected,
    validation,
    validating,
    validationError,
    addSelection,
    setQuantity,
    removeItem,
    clear,
    dismissLegacyCart,
    validate,
  };
}
