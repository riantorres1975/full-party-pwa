import { C } from '../../styles/tokens';

/** Tarjeta de marca con interacción gestionada por CSS. */
export default function BrandCard({ nombre, desc, color, emoji }) {
  return (
    <div
      className="lp-brand-card rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
      style={{ '--brand-accent': color }}
    >
      <div className="lp-brand-mark w-16 h-16 rounded-2xl flex items-center justify-center text-3xl">
        <span>{emoji}</span>
      </div>
      <p className="font-display text-sm" style={{ color: C.textHead }}>{nombre}</p>
      <p className="text-xs" style={{ color: C.textMuted }}>{desc}</p>
    </div>
  );
}
