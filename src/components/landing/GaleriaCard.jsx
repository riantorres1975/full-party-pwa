/** Tarjeta de galería con flotación, zoom e iluminación en CSS puro */
export default function GaleriaCard({ img, cliente, evento, emoji, color, accent, floatDur = 5, floatDelay = 0 }) {
  return (
    <div
      className="lp-galeria-card"
      style={{
        aspectRatio:    '4/5',
        '--gal-shadow': `0 24px 48px ${color}40`,
      }}
    >
      {/* Envoltorio que recibe la animación de flotación */}
      <div
        className="lp-galeria-float w-full h-full relative"
        style={{
          '--float-dur':   `${floatDur}s`,
          '--float-delay': `${floatDelay}s`,
        }}
      >
        {img ? (
          <img
            src={img}
            alt={`Decoración de ${cliente} — ${evento}`}
            loading="lazy"
          />
        ) : (
          /* Placeholder festivo */
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3 select-none"
            style={{ background: `linear-gradient(145deg, ${color}22, ${accent}18)`, border: `2px dashed ${color}44` }}
          >
            <span className="absolute top-3 right-3 text-lg opacity-40" aria-hidden="true">✨</span>
            <span className="absolute bottom-5 left-3 text-lg opacity-30" aria-hidden="true">🎊</span>
            <span className="absolute top-7 left-5 text-sm opacity-25"  aria-hidden="true">⭐</span>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: `${color}20`, border: `2px solid ${color}33` }}
            >
              {emoji}
            </div>
            <p className="font-display text-xs text-center px-3" style={{ color }}>
              Comparte tu fiesta
            </p>
          </div>
        )}

        {/* Overlay con nombre y tipo de evento */}
        <div
          className="lp-galeria-overlay absolute inset-0 flex flex-col justify-end p-4 z-10"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 58%)' }}
        >
          <span
            className="text-xs font-black px-2.5 py-1 rounded-full self-start mb-1.5"
            style={{ background: `${color}CC`, color: 'white' }}
          >
            {evento}
          </span>
          <p className="text-white font-bold text-xs">{cliente}</p>
        </div>
      </div>
    </div>
  );
}
