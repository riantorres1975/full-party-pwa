import { useState, useRef, useCallback } from 'react';

function getInitialCount() {
  if (typeof window === 'undefined') return 8;
  return window.innerWidth < 768 ? 4 : 12;
}

function getBatchSize() {
  if (typeof window === 'undefined') return 8;
  return window.innerWidth < 768 ? 6 : 12;
}

/**
 * useInfiniteScroll
 * Expone:
 *  - visibleCount   → cuántos items mostrar actualmente
 *  - sentinelRef    → callback ref para el elemento centinela (div al final del grid)
 *  - hayMas         → boolean: ¿quedan items por mostrar?
 *  - cargando       → boolean: true durante el breve flash de carga
 *  - reset()        → llama al cambiar el array (búsqueda/filtros)
 */
export function useInfiniteScroll(totalItems) {
  const [visibleCount, setVisibleCount] = useState(() => getInitialCount());
  const [cargando,     setCargando]     = useState(false);
  const observerRef = useRef(null);
  const totalRef    = useRef(totalItems);

  totalRef.current = totalItems;
  const hayMas = visibleCount < totalItems;

  // Reset to first page when dataset changes (filters/search)
  const reset = useCallback(() => {
    setVisibleCount(getInitialCount());
    setCargando(false);
  }, []);

  // Cargar siguiente batch sin delay artificial
  const cargarMasRef = useRef(null);
  cargarMasRef.current = () => {
    if (cargando || visibleCount >= totalRef.current) return;
    setCargando(true);
    requestAnimationFrame(() => {
      const batchSize = getBatchSize();
      setVisibleCount(prev => Math.min(prev + batchSize, totalRef.current));
      setCargando(false);
    });
  };

  // Callback ref: reconecta el observer cada vez que el sentinel se monta/desmonta
  const sentinelRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) cargarMasRef.current?.();
      },
      { rootMargin: '200px' }
    );
    observerRef.current.observe(node);
  }, []);

  return { visibleCount, sentinelRef, hayMas, cargando, reset };
}
