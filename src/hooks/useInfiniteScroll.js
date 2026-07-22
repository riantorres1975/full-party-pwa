import { useCallback, useEffect, useRef, useState } from 'react';

export function getCatalogPagePlan(viewportWidth) {
  const width = Number.isFinite(viewportWidth) ? viewportWidth : 1024;

  if (width < 640) return { initial: 6, batch: 8 };
  if (width < 1024) return { initial: 12, batch: 12 };
  if (width < 1536) return { initial: 12, batch: 20 };
  return { initial: 16, batch: 28 };
}

function getCurrentPagePlan() {
  return getCatalogPagePlan(typeof window === 'undefined' ? 1024 : window.innerWidth);
}

function getScrollRoot(node, selector) {
  if (!selector || typeof window === 'undefined') return null;
  const candidate = node.closest(selector);
  if (!candidate) return null;

  const { overflowY } = window.getComputedStyle(candidate);
  return /(auto|scroll|overlay)/.test(overflowY) ? candidate : null;
}

export function useInfiniteScroll(totalItems, {
  resetKey = totalItems,
  rootSelector = '[data-catalog-scroll-root]',
} = {}) {
  const [visibleCount, setVisibleCount] = useState(() => (
    Math.min(getCurrentPagePlan().initial, totalItems)
  ));
  const [cargando, setCargando] = useState(false);
  const observerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pendingRef = useRef(false);
  const totalRef = useRef(totalItems);

  totalRef.current = totalItems;
  const hayMas = visibleCount < totalItems;
  const nextCount = Math.min(getCurrentPagePlan().batch, Math.max(0, totalItems - visibleCount));

  const reset = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    pendingRef.current = false;
    setCargando(false);
    setVisibleCount(Math.min(getCurrentPagePlan().initial, totalRef.current));
  }, []);

  useEffect(() => {
    reset();
  }, [reset, resetKey]);

  const cargarMas = useCallback(() => {
    if (pendingRef.current || visibleCount >= totalRef.current) return;

    pendingRef.current = true;
    setCargando(true);
    animationFrameRef.current = window.requestAnimationFrame(() => {
      const { batch } = getCurrentPagePlan();
      setVisibleCount((current) => Math.min(current + batch, totalRef.current));
      animationFrameRef.current = null;
      pendingRef.current = false;
      setCargando(false);
    });
  }, [visibleCount]);

  const sentinelRef = useCallback((node) => {
    observerRef.current?.disconnect();
    if (!node || !('IntersectionObserver' in window)) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) cargarMas();
      },
      {
        root: getScrollRoot(node, rootSelector),
        rootMargin: '600px 0px',
      },
    );
    observerRef.current.observe(node);
  }, [cargarMas, rootSelector]);

  useEffect(() => () => {
    observerRef.current?.disconnect();
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  return {
    visibleCount: Math.min(visibleCount, totalItems),
    sentinelRef,
    hayMas,
    cargando,
    cargarMas,
    nextCount,
  };
}
