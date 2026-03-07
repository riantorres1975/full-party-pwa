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

  const hayMas = visibleCount < totalItems;

  // Resetear al inicio cuando cambia el dataset (filtros / búsqueda)
  const reset = useCallback(() => {
    setVisibleCount(INITIAL_COUNT);
    setCargando(false);
  }, []);

  // Cargar siguiente batch con un pequeño delay para mostrar el spinner
  const cargarMas = useCallback(() => {
    if (cargando || !hayMas) return;
    setCargando(true);
    // rAF garantiza que el spinner se pinte antes de agregar los items
    requestAnimationFrame(() => {
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + BATCH_SIZE, totalItems));
        setCargando(false);
      }, 300);
    });
  }, [cargando, hayMas, totalItems]);

  // Conectar IntersectionObserver al centinela
  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) cargarMas();
      },
      { rootMargin: '200px' }   // empieza a cargar 200px antes del borde
    );

    observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [cargarMas]);

  return { visibleCount, sentinelRef, hayMas, cargando, reset };
}
