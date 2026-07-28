import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  applySelection,
  createInitialSelection,
  getDimensionStates,
} from '../../services/catalog/variantSelection.js';

const EMPTY_VARIANTS = Object.freeze([]);

/**
 * Estado del selector Gama -> Color -> Medida -> Acabado -> Presentacion -> Cantidad.
 * Todas las actualizaciones pasan por la maquina de estados pura.
 */
export function useVariantSelection(variants, initialSelection = {}) {
  const list = Array.isArray(variants) ? variants : EMPTY_VARIANTS;
  const initialKey = JSON.stringify(initialSelection ?? {});
  const [selection, setSelection] = useState(
    () => createInitialSelection(list, initialSelection).selection,
  );

  useEffect(() => {
    setSelection(createInitialSelection(list, initialSelection).selection);
    // initialKey evita reiniciar por un objeto equivalente creado en render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants, initialKey]);

  const result = useMemo(
    () => applySelection(list, selection, {}),
    [list, selection],
  );
  const dimensionStates = useMemo(
    () => getDimensionStates(list, result.selection),
    [list, result.selection],
  );

  const updateSelection = useCallback((patch) => {
    setSelection((current) => applySelection(list, current, patch).selection);
  }, [list]);

  const reset = useCallback((nextInitial = initialSelection) => {
    setSelection(createInitialSelection(list, nextInitial).selection);
  }, [initialKey, list]);

  return {
    ...result,
    dimensionStates,
    updateSelection,
    selectLine: (lineId) => updateSelection({ lineId }),
    selectColor: (colorId) => updateSelection({ colorId }),
    selectSize: (sizeId) => updateSelection({ sizeId }),
    selectFinish: (finish) => updateSelection({ finish }),
    selectPresentation: (presentationId) => updateSelection({ presentationId }),
    setQuantity: (quantity) => updateSelection({ quantity }),
    reset,
  };
}
