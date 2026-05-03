import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C } from '../../styles/tokens';
import StarRating from './StarRating';

const REVIEW_INTERVAL_MS = 5000;

/** Carrusel automático de reseñas estilo Google Maps */
export default function ReviewsCarousel({ resenas }) {
  const [idx,    setIdx]    = useState(0);
  const [animCls, setAnimCls] = useState('review-enter');
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((nextIdx) => {
    setAnimCls('review-exit');
    setTimeout(() => {
      setIdx(nextIdx);
      setAnimCls('review-enter');
    }, 320);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      goTo((idx + 1) % resenas.length);
    }, REVIEW_INTERVAL_MS);
    return () => clearInterval(t);
  }, [idx, resenas.length, goTo, paused]);

  const r = resenas[idx];

  return (
    <div
      className="max-w-2xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="lp-review-stage">
        {/* Tarjeta de reseña activa */}
        <div
          key={r.id}
          className={`${animCls} lp-review-card rounded-3xl p-7 bg-white text-left`}
          style={{ boxShadow: `0 4px 24px ${r.color}22, 0 1px 6px rgba(0,0,0,0.06)`, border: `1.5px solid ${r.color}22` }}
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${r.color}, ${C.purple})` }}
              aria-hidden="true"
            >
              {r.inicial}
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm truncate" style={{ color: C.textHead }}>{r.nombre}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating count={r.stars} />
                <span className="text-xs" style={{ color: C.textMuted }}>{r.fecha}</span>
              </div>
            </div>
            {/* Google logo */}
            <div className="ml-auto flex-shrink-0">
              <span className="text-xs font-black tracking-tight" style={{
                background:            'linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor:  'transparent',
                backgroundClip:       'text',
              }} aria-label="Google">Google</span>
            </div>
          </div>

          {/* Texto */}
          <p className="text-sm leading-relaxed" style={{ color: C.textBody }}>
            "{r.texto}"
          </p>
        </div>
      </div>

      {/* Controles: prev · dots · next */}
      <div className="flex items-center justify-center gap-2 mt-5">
        <button
          onClick={() => goTo((idx - 1 + resenas.length) % resenas.length)}
          aria-label="Reseña anterior"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors lp-scale-hover"
          style={{ background: `${C.pink}18`, color: C.pink }}
        >
          <ChevronLeft size={16} />
        </button>

        {resenas.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ver reseña ${i + 1}`}
            aria-current={i === idx ? 'true' : undefined}
            className="transition-all duration-300 rounded-full"
            style={{
              width:      i === idx ? 20 : 8,
              height:     8,
              background: i === idx ? C.pink : `${C.pink}44`,
            }}
          />
        ))}

        <button
          onClick={() => goTo((idx + 1) % resenas.length)}
          aria-label="Siguiente reseña"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors lp-scale-hover"
          style={{ background: `${C.pink}18`, color: C.pink }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Rating global */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <StarRating count={5} />
        <span className="font-black text-sm" style={{ color: C.textHead }}>4.9</span>
        <span className="text-xs" style={{ color: C.textMuted }}>· {resenas.length} reseñas en Google Maps</span>
      </div>
    </div>
  );
}
