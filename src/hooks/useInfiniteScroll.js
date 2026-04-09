import { useState, useRef, useCallback } from 'react';

const INITIAL_COUNT = 12;
const BATCH_SIZE    = 12;

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
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [cargando,     setCargando]     = useState(false);
  const observerRef = useRef(null);
  const totalRef    = useRef(totalItems);

  totalRef.current = totalItems;
  const hayMas = visibleCount < totalItems;

  // Resetear al inicio cuando cambia el dataset (filtros / búsqueda)
  const reset = useCallback(() => {
    setVisibleCount(INITIAL_COUNT);
    setCargando(false);
  }, []);

  // Cargar siguiente batch sin delay artificial
  const cargarMasRef = useRef(null);
  cargarMasRef.current = () => {
    if (cargando || visibleCount >= totalRef.current) return;
    setCargando(true);
    requestAnimationFrame(() => {
      setVisibleCount(prev => Math.min(prev + BATCH_SIZE, totalRef.current));
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
