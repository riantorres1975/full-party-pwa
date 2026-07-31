import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ChevronLeft, ChevronRight, Layers3, Palette, Ruler,
} from 'lucide-react';
import { C } from '../../styles/tokens';
import OptimizedImage from '../OptimizedImage';

const CARRUSEL_INTERVAL = 3800;
const CARD_GAP = 18;
const MXN_COMPACT = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

export default function NovedadesCarrusel({ novedades }) {
  const containerRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [cols, setCols] = useState(4);
  const [cardW, setCardW] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const c = w >= 900 ? 4 : w >= 620 ? 3 : 1;
      setCols(c);
      setCardW(c === 1 ? w : (w - CARD_GAP * (c - 1)) / c);
    }

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '160px 0px' },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const realLen = novedades.length;
  const hasOverflow = realLen > cols;
  const items = useMemo(() => {
    if (!hasOverflow) return novedades;
    return [...novedades, ...novedades.slice(0, cols)];
  }, [novedades, cols, hasOverflow]);

  const goNext = useCallback(() => {
    if (!hasOverflow) {
      setIdx(i => (i + 1) % Math.max(realLen, 1));
      return;
    }
    setAnimating(true);
    setIdx(i => i + 1);
  }, [hasOverflow, realLen]);

  const goPrev = useCallback(() => {
    if (!hasOverflow) {
      setIdx(i => (i - 1 + Math.max(realLen, 1)) % Math.max(realLen, 1));
      return;
    }
    setAnimating(true);
    setIdx(i => Math.max(0, i - 1));
  }, [hasOverflow, realLen]);

  const handleTransitionEnd = useCallback(() => {
    if (!hasOverflow) return;
    if (idx >= realLen) {
      setAnimating(false);
      setIdx(idx % realLen);
    }
  }, [idx, realLen, hasOverflow]);

  useEffect(() => {
    if (!animating) {
      const t = setTimeout(() => setAnimating(true), 30);
      return () => clearTimeout(t);
    }
  }, [animating]);

  useEffect(() => {
    if (paused || !hasOverflow || !inView || cols === 1) return;
    const t = setInterval(goNext, CARRUSEL_INTERVAL);
    return () => clearInterval(t);
  }, [paused, hasOverflow, inView, goNext, cols]);

  const translateX = -(idx * (cardW + CARD_GAP));
  const dotIdx = idx % realLen;

  if (realLen === 0) return null;

  return (
    <div
      className="lp-novedades-shell"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStartX.current == null) return;
        const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
        const delta = touchStartX.current - endX;
        touchStartX.current = null;
        if (Math.abs(delta) < 42) return;
        if (delta > 0) goNext();
        else goPrev();
      }}
    >
      <div ref={containerRef} className="lp-novedades-window overflow-hidden">
        <div
          className="flex"
          style={{
            gap: CARD_GAP,
            transform: cardW ? `translateX(${translateX}px)` : 'none',
            transition: animating ? 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
            willChange: 'transform',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {items.map((p, i) => (
            <Link
              key={`${p.groupKey}-${i}`}
              to={`/catalogo?producto=${encodeURIComponent(p.slug ?? '')}${p.lineSlug ? `&gama=${encodeURIComponent(p.lineSlug)}` : ''}`}
              className="lp-novedad-card group flex flex-col flex-shrink-0"
              style={{
                width: cardW || `calc(${100 / cols}% - ${CARD_GAP}px)`,
                animationDelay: `${(i % cols) * 70}ms`,
              }}
              aria-label={`Ver ${p.name} en el catalogo`}
            >
              <div className="lp-novedad-media relative flex items-center justify-center overflow-hidden">
                <div className="lp-novedad-glow" aria-hidden="true" />
                <OptimizedImage
                  src={p.imageUrl}
                  alt={p.name}
                  aspectClass="w-full h-full aspect-auto"
                  className="lp-novedad-img w-full h-full"
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.10))' }}
                />
                <span className="lp-novedad-status lp-novedad-status--new">
                  <Sparkles size={10} aria-hidden="true" /> Nuevo
                </span>
                {p.inStock && (
                  <span className="lp-novedad-status lp-novedad-status--stock">
                    <i aria-hidden="true" /> Disponible
                  </span>
                )}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-xl"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${C.pink}12, transparent 70%)` }}
                />
              </div>

              <div className="lp-novedad-info p-4 flex flex-col flex-1">
                <p className="lp-novedad-line">
                  {p.lineName || p.brandName || 'Articulo'}
                </p>
                <h3 className="font-display text-sm leading-snug flex-1 line-clamp-2" style={{ color: C.textHead }}>
                  {p.name}
                </h3>
                <div className="lp-novedad-facts" aria-label="Opciones disponibles">
                  {p.colorCount > 0 && <span><Palette size={12} /> {p.colorCount} colores</span>}
                  {p.sizes.length > 0 && (
                    <span><Ruler size={12} /> {p.sizes.length} {p.sizes.length === 1 ? 'medida' : 'medidas'}</span>
                  )}
                  <span><Layers3 size={12} /> Mayoreo</span>
                </div>
                <div className="lp-novedad-footer">
                  {Number.isFinite(Number(p.minPrice)) && Number(p.minPrice) > 0 ? (
                    <span className="lp-novedad-price">
                      <small>Desde</small>
                      <strong>{MXN_COMPACT.format(Number(p.minPrice))}</strong>
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="lp-novedad-cta">
                    {p.requiresOptions ? 'Elegir opciones' : 'Ver producto'} <ArrowRight size={12} aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {hasOverflow && (
        <div className="lp-novedades-controls">
          <button onClick={goPrev} aria-label="Anterior" className="lp-novedades-arrow" style={{ color: C.pink }}>
            <ChevronLeft size={17} />
          </button>

          <div className="lp-novedades-progress" aria-live="polite">
            <span>{dotIdx + 1} de {realLen}</span>
            <div aria-hidden="true">
              <i style={{ width: `${((dotIdx + 1) / realLen) * 100}%` }} />
            </div>
          </div>

          <button onClick={goNext} aria-label="Siguiente" className="lp-novedades-arrow" style={{ color: C.pink }}>
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
