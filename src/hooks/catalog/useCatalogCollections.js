import { useCallback, useEffect, useRef, useState } from 'react';

import { listCollections } from '../../services/catalog/collectionsRepository.js';

export function useCatalogCollections() {
  const mountedRef = useRef(true);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await listCollections();
      if (!mountedRef.current) return;
      setCollections(next);
      setError(null);
    } catch (err) {
      if (mountedRef.current) setError(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  return { collections, loading, error, refresh };
}
