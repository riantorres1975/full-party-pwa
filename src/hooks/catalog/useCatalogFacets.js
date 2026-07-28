import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getFacets } from '../../services/catalog/searchRepository.js';
import { CatalogError } from '../../services/catalog/errors.js';

export function useCatalogFacets(context = {}) {
  const contextKey = useMemo(() => JSON.stringify(context ?? {}), [context]);
  const contextRef = useRef(context);
  const abortRef = useRef(null);
  const [facets, setFacets] = useState({
    brands: [],
    lines: [],
    colorFamilies: [],
    colors: [],
    sizes: [],
    finishes: [],
    price: { min: null, max: null },
    availability: { inStock: 0, outOfStock: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  contextRef.current = context;

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const next = await getFacets(contextRef.current, { signal: controller.signal });
      setFacets(next);
      setError(null);
    } catch (err) {
      if (!(err instanceof CatalogError && err.cause?.name === 'AbortError')) setError(err);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => abortRef.current?.abort();
  }, [contextKey, refresh]);

  return { facets, loading, error, refresh };
}
