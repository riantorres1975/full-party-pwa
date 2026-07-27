// ─────────────────────────────────────────────────────────────────────────────
// useCatalogSearch — búsqueda del lado de Supabase con debounce.
// Devuelve tarjetas (mismo shape que el grid) listas para panel de
// resultados; Fuse.js se usa solo para refinamiento local si hace falta (§19).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { searchCards } from '../../services/catalog/searchRepository.js';
import { CatalogError } from '../../services/catalog/errors.js';
import { useDebounce } from '../useDebounce.js';

/**
 * @param {string} query - término de búsqueda (ya controlado por el llamador)
 * @param {{ limit?: number, debounceMs?: number, minLength?: number }} options
 */
export function useCatalogSearch(query, { limit = 20, debounceMs = 250, minLength = 2 } = {}) {
  const debouncedQuery = useDebounce(String(query ?? '').trim(), debounceMs);
  const [results, setResults] = useState({ cards: [], total: 0 });
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (debouncedQuery.length < minLength) {
      setResults({ cards: [], total: 0 });
      setSearching(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);

    searchCards(debouncedQuery, { limit, signal: controller.signal })
      .then((page) => {
        if (cancelled) return;
        setResults({ cards: page.cards, total: page.total });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof CatalogError && err.cause?.name === 'AbortError') return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedQuery, limit, minLength]);

  return {
    results: results.cards,
    total: results.total,
    searching,
    error,
    isActive: debouncedQuery.length >= minLength,
  };
}
