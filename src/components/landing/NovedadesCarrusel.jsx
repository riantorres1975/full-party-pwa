import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { C } from '../../styles/tokens';
import OptimizedImage from '../OptimizedImage';
import Badge from '../ui/Badge';

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

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const c = w >= 900 ? 4 : w >= 620 ? 3 : 2;
      setCols(c);
      setCardW((w - CARD_GAP * (c - 1)) / c);
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
    if (paused || !hasOverflow || !inView) return;
    const t = setInterval(goNext, CARRUSEL_INTERVAL);
    return () => clearInterval(t);
  }, [paused, hasOverflow, inView, goNext]);

  const translateX = -(idx * (cardW + CARD_GAP));
  const dotIdx = idx % realLen;

  if (realLen === 0) return null;

  return (
    <div
      className="lp-novedades-shell"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
              key={`${p.id}-${i}`}
              to="/catalogo"
              className="lp-novedad-card group flex flex-col flex-shrink-0"
              style={{
                width: cardW || `calc(${100 / cols}% - ${CARD_GAP}px)`,
                animationDelay: `${(i % cols) * 70}ms`,
              }}
              aria-label={`Ver ${p.nombre} en el catalogo`}
            >
              <div className="lp-novedad-media relative flex items-center justify-center overflow-hidden">
                <div className="lp-novedad-glow" aria-hidden="true" />
                <OptimizedImage
                  src={p.imagen_url}
                  alt={p.nombre}
                  aspectClass="w-full h-full aspect-auto"
                  className="lp-novedad-img w-full h-full"
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.10))' }}
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="new" size="md" icon={<Sparkles size={9} aria-hidden="true" />}>Nuevo</Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="info" size="md">Mayoreo</Badge>
                </div>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-xl"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${C.pink}12, transparent 70%)` }}
                />
              </div>

              <div className="lp-novedad-info p-4 flex flex-col flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: C.purple }}>
                  {p.categoria || 'Articulo'}
                </p>
                <h3 className="font-display text-sm leading-snug flex-1 line-clamp-2" style={{ color: C.textHead }}>
                  {p.nombre}
                </h3>
                <div className="mt-3 flex items-center justify-between gap-3">
                  {Number.isFinite(Number(p.precio)) && Number(p.precio) > 0 ? (
                    <span className="lp-novedad-price">
                      Desde {MXN_COMPACT.format(Number(p.precio))}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="lp-novedad-cta">
                    Ver <ArrowRight size={10} aria-hidden="true" />
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

          <div className="lp-novedades-dots">
            {novedades.map((_, i) => (
              <button
                key={i}
                onClick={() => { setAnimating(true); setIdx(i); }}
                aria-label={`Producto ${i + 1}`}
                className="lp-novedades-dot"
                style={{
                  width: i === dotIdx ? 22 : 7,
                  background: i === dotIdx ? `linear-gradient(90deg, ${C.pink}, ${C.purple})` : `${C.pink}40`,
                }}
              />
            ))}
          </div>

          <button onClick={goNext} aria-label="Siguiente" className="lp-novedades-arrow" style={{ color: C.pink }}>
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
