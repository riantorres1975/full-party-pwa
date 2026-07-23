import { startTransition, useCallback, useEffect, useRef, useState } from 'react';

const OBSERVER_REARM_DELAY_MS = 400;

export function getCatalogPagePlan(viewportWidth) {
  const width = Number.isFinite(viewportWidth) ? viewportWidth : 1024;

  if (width < 640) return { initial: 6, batch: 12 };
  if (width < 1024) return { initial: 12, batch: 16 };
  if (width < 1536) return { initial: 12, batch: 24 };
  return { initial: 16, batch: 32 };
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
  hasMoreRemote = false,
  onLoadMore,
  remoteLoading = false,
  remoteError = false,
} = {}) {
  const [visibleCount, setVisibleCount] = useState(() => (
    Math.min(getCurrentPagePlan().initial, totalItems)
  ));
  const [cargando, setCargando] = useState(false);
  const [sentinelNode, setSentinelNode] = useState(null);
  const observerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const proximityFrameRef = useRef(null);
  const rearmTimerRef = useRef(null);
  const sentinelNodeRef = useRef(null);
  const checkProximityRef = useRef(null);
  const pendingRef = useRef(false);
  const totalRef = useRef(totalItems);
  const visibleCountRef = useRef(visibleCount);
  const hasMoreRemoteRef = useRef(hasMoreRemote);
  const onLoadMoreRef = useRef(onLoadMore);
  const remoteLoadingRef = useRef(remoteLoading);
  const remoteErrorRef = useRef(remoteError);

  totalRef.current = totalItems;
  hasMoreRemoteRef.current = hasMoreRemote;
  onLoadMoreRef.current = onLoadMore;
  remoteLoadingRef.current = remoteLoading;
  remoteErrorRef.current = remoteError;
  const hayMas = visibleCount < totalItems || hasMoreRemote;
  const nextCount = visibleCount < totalItems
    ? Math.min(getCurrentPagePlan().batch, Math.max(0, totalItems - visibleCount))
    : getCurrentPagePlan().batch;

  const reset = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (rearmTimerRef.current !== null) {
      window.clearTimeout(rearmTimerRef.current);
      rearmTimerRef.current = null;
    }
    pendingRef.current = false;
    setCargando(false);
    const next = Math.min(getCurrentPagePlan().initial, totalRef.current);
    visibleCountRef.current = next;
    setVisibleCount(next);
  }, []);

  useEffect(() => {
    visibleCountRef.current = visibleCount;
  }, [visibleCount]);

  const rearmProximityCheck = useCallback(() => {
    rearmTimerRef.current = window.setTimeout(() => {
      rearmTimerRef.current = null;
      checkProximityRef.current?.();
    }, OBSERVER_REARM_DELAY_MS);
  }, []);

  const cargarMas = useCallback(() => {
    if (pendingRef.current || remoteLoadingRef.current) return;

    if (visibleCountRef.current >= totalRef.current) {
      if (!hasMoreRemoteRef.current || !onLoadMoreRef.current) return;
      pendingRef.current = true;
      setCargando(true);
      Promise.resolve(onLoadMoreRef.current())
        .catch(() => {
          // The catalog keeps the loaded page and can retry on the next intersection.
        })
        .finally(() => {
          pendingRef.current = false;
          setCargando(false);
          rearmProximityCheck();
        });
      return;
    }

    pendingRef.current = true;
    if (rearmTimerRef.current !== null) window.clearTimeout(rearmTimerRef.current);
    setCargando(true);
    animationFrameRef.current = window.requestAnimationFrame(() => {
      const { batch } = getCurrentPagePlan();
      const next = Math.min(visibleCountRef.current + batch, totalRef.current);
      visibleCountRef.current = next;
      startTransition(() => {
        setVisibleCount(next);
      });
      animationFrameRef.current = null;
      pendingRef.current = false;
      setCargando(false);

      // If the appended row still leaves the sentinel near the viewport, keep
      // filling the catalog automatically instead of requiring another click.
      rearmProximityCheck();
    });
  }, [rearmProximityCheck]);

  const checkProximity = useCallback(() => {
    const node = sentinelNodeRef.current;
    const noLocalOrRemoteItems = (
      visibleCountRef.current >= totalRef.current
      && !hasMoreRemoteRef.current
    );
    if (
      !node
      || pendingRef.current
      || remoteLoadingRef.current
      || remoteErrorRef.current
      || noLocalOrRemoteItems
    ) return;

    const root = getScrollRoot(node, rootSelector);
    const rootBottom = root?.getBoundingClientRect().bottom ?? window.innerHeight;
    if (node.getBoundingClientRect().top <= rootBottom + 600) cargarMas();
  }, [cargarMas, rootSelector]);

  checkProximityRef.current = checkProximity;

  useEffect(() => {
    reset();

    // Recheck an already-visible sentinel after resetting a search or sort.
    // IntersectionObserver does not emit again while its intersection state
    // remains unchanged.
    rearmTimerRef.current = window.setTimeout(() => {
      rearmTimerRef.current = null;
      checkProximityRef.current?.();
    }, 0);
  }, [cargarMas, reset, resetKey]);

  const sentinelRef = useCallback((node) => {
    sentinelNodeRef.current = node;
    setSentinelNode(node);
  }, []);

  useEffect(() => {
    if (!sentinelNode) return undefined;

    const root = getScrollRoot(sentinelNode, rootSelector);
    const scheduleCheck = () => {
      if (proximityFrameRef.current !== null) return;
      proximityFrameRef.current = window.requestAnimationFrame(() => {
        proximityFrameRef.current = null;
        checkProximityRef.current?.();
      });
    };
    const scrollTarget = root || window;
    scrollTarget.addEventListener('scroll', scheduleCheck, { passive: true });
    window.addEventListener('resize', scheduleCheck, { passive: true });

    if (typeof window.IntersectionObserver === 'function') {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) scheduleCheck();
        },
        { root, rootMargin: '600px 0px' },
      );
      observerRef.current.observe(sentinelNode);
    }

    scheduleCheck();

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      scrollTarget.removeEventListener('scroll', scheduleCheck);
      window.removeEventListener('resize', scheduleCheck);
      if (proximityFrameRef.current !== null) {
        window.cancelAnimationFrame(proximityFrameRef.current);
        proximityFrameRef.current = null;
      }
    };
  }, [rootSelector, sentinelNode]);

  useEffect(() => {
    checkProximityRef.current?.();
  }, [hasMoreRemote, remoteError, remoteLoading, totalItems]);

  useEffect(() => () => {
    observerRef.current?.disconnect();
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    if (proximityFrameRef.current !== null) {
      window.cancelAnimationFrame(proximityFrameRef.current);
    }
    if (rearmTimerRef.current !== null) window.clearTimeout(rearmTimerRef.current);
  }, []);

  return {
    visibleCount: Math.min(visibleCount, totalItems),
    sentinelRef,
    hayMas,
    cargando: cargando || remoteLoading,
    cargarMas,
    nextCount,
  };
}
