import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { C } from '../../styles/tokens';
import OptimizedImage from '../OptimizedImage';
import Badge from '../ui/Badge';

const CARRUSEL_INTERVAL = 3800;
const CARD_GAP = 16;
const MXN_COMPACT = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

export default function NovedadesCarrusel({ novedades }) {
  const containerRef  = useRef(null);
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [cols, setCols]     = useState(4);
  const [cardW, setCardW]   = useState(0);

  // Calcula ancho de card y columnas según el contenedor real
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

  // Cuando el rail llega a los clones, salta sin transición al índice real
  const handleTransitionEnd = useCallback(() => {
    if (!hasOverflow) return;
    if (idx >= realLen) {
      setAnimating(false);
      setIdx(idx % realLen);
    }
  }, [idx, realLen, hasOverflow]);

  // Re-activa transición tras el salto instantáneo
  useEffect(() => {
    if (!animating) {
      const t = setTimeout(() => setAnimating(true), 30);
      return () => clearTimeout(t);
    }
  }, [animating]);

  // Auto-avance
  useEffect(() => {
    if (paused || !hasOverflow || !inView) return;
    const t = setInterval(goNext, CARRUSEL_INTERVAL);
    return () => clearInterval(t);
  }, [paused, hasOverflow, inView, goNext]);

  const translateX = -(idx * (cardW + CARD_GAP));
  const dotIdx     = idx % realLen;

  if (realLen === 0) return null;

  return (
    <div
      className="lp-novedades-shell"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Rail deslizante */}
      <div ref={containerRef} className="overflow-hidden">
        <div
          className="flex"
          style={{
            gap:       CARD_GAP,
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
              aria-label={`Ver ${p.nombre} en el catálogo`}
            >

              {/* Imagen */}
              <div
                className="lp-novedad-media relative flex items-center justify-center overflow-hidden"
              >
                <div className="lp-novedad-glow" aria-hidden="true" />
                <OptimizedImage
                  src={p.imagen_url}
                  alt={p.nombre}
                  aspectClass="w-full h-full aspect-auto"
                  className="lp-novedad-img w-full h-full"
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.10))' }}
                />
                {/* Badge Nuevo */}
                <div className="absolute top-2.5 left-2.5">
                  <Badge variant="new" size="md" icon={<Sparkles size={9} aria-hidden="true" />}>Nuevo</Badge>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <Badge variant="info" size="md">Mayoreo</Badge>
                </div>
                {/* Brillo en hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-xl"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${C.pink}12, transparent 70%)` }}
                />
              </div>

              {/* Info */}
              <div
                className="p-3.5 flex flex-col flex-1"
                style={{ borderTop: `1px solid ${C.pink}20` }}
              >
                <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: C.purple }}>
                  {p.categoria || 'Artículo'}
                </p>
                <h3 className="font-display text-xs leading-snug flex-1 line-clamp-2" style={{ color: C.textHead }}>
                  {p.nombre}
                </h3>
                {Number.isFinite(Number(p.precio)) && Number(p.precio) > 0 && (
                  <span
                    className="mt-2 inline-flex items-center w-fit text-[11px] font-black px-2 py-1 rounded-lg"
                    style={{
                      color: '#b42372',
                      background: `linear-gradient(135deg, ${C.pink}18, ${C.purple}16)`,
                      border: `1px solid ${C.pink}30`,
                    }}
                  >
                    Desde {MXN_COMPACT.format(Number(p.precio))}
                  </span>
                )}
                <span
                  className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-black group-hover:gap-2 transition-all"
                  style={{ color: C.pink }}
                >
                  Ver en catálogo <ArrowRight size={10} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Controles */}
      {hasOverflow && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button onClick={goPrev} aria-label="Anterior"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'white', color: C.pink, boxShadow: `0 2px 12px ${C.pink}30`, border: `1.5px solid ${C.pink}40` }}>
            <ChevronLeft size={17} />
          </button>

          <div className="flex gap-1.5">
            {novedades.map((_, i) => (
              <button
                key={i}
                onClick={() => { setAnimating(true); setIdx(i); }}
                aria-label={`Producto ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i === dotIdx ? 22 : 7,
                  height:     7,
                  background: i === dotIdx ? `linear-gradient(90deg, ${C.pink}, ${C.purple})` : `${C.pink}40`,
                  boxShadow:  i === dotIdx ? `0 2px 6px ${C.pink}55` : 'none',
                }}
              />
            ))}
          </div>

          <button onClick={goNext} aria-label="Siguiente"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'white', color: C.pink, boxShadow: `0 2px 12px ${C.pink}30`, border: `1.5px solid ${C.pink}40` }}>
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
