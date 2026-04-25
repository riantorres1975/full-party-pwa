import { useCallback, useEffect, useState } from 'react';

export function useChartWidth() {
  const [node, setNode] = useState(null);
  const [width, setWidth] = useState(0);

  const containerRef = useCallback((element) => {
    setNode(element);
    if (!element) {
      setWidth(0);
    }
  }, []);

  useEffect(() => {
    if (!node) return undefined;

    let rafId = 0;

    const measure = () => {
      const nextWidth = Math.max(0, Math.floor(node.getBoundingClientRect().width));
      setWidth((prev) => (prev === nextWidth ? prev : nextWidth));
      return nextWidth;
    };

    const queueMeasure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    queueMeasure();

    let attempts = 0;
    const warmupIntervalId = window.setInterval(() => {
      attempts += 1;
      const nextWidth = measure();
      if (nextWidth > 0 || attempts >= 40) {
        window.clearInterval(warmupIntervalId);
      }
    }, 125);

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(queueMeasure);
      observer.observe(node);
    } else {
      window.addEventListener('resize', queueMeasure);
      window.addEventListener('orientationchange', queueMeasure);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.clearInterval(warmupIntervalId);
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener('resize', queueMeasure);
        window.removeEventListener('orientationchange', queueMeasure);
      }
    };
  }, [node]);

  return {
    containerRef,
    width,
    ready: width > 0,
  };
}
