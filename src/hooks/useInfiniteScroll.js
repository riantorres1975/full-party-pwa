import { useState, useEffect, useRef, useCallback } from 'react';

const INITIAL_COUNT = 12;
const BATCH_SIZE    = 12;

/**
 * useInfiniteScroll
 * Expone:
 *  - visibleCount   → cuántos items mostrar actualmente
 *  - sentinelRef    → ref para el elemento centinela (div al final del grid)
 *  - hayMas         → boolean: ¿quedan items por mostrar?
 *  - cargando       → boolean: true durante el breve flash de carga
 *  - reset()        → llama al cambiar el array (búsqueda/filtros)
 */
export function useInfiniteScroll(totalItems) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [cargando,     setCargando]     = useState(false);
  const sentinelRef = useRef(null);
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

  // Conectar IntersectionObserver al centinela (montaje único)
  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) cargarMasRef.current?.();
      },
      { rootMargin: '200px' }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, []); // stable — only mount/unmount

  return { visibleCount, sentinelRef, hayMas, cargando, reset };
}
