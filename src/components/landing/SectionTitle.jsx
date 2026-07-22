import { C } from '../../styles/tokens';

/** Título de sección reutilizable con eyebrow y barra gradiente */
export default function SectionTitle({ title, subtitle, eyebrow }) {
  return (
    <div className="text-center mb-12">
      {eyebrow && <span className="lp-eyebrow">{eyebrow}</span>}
      <h2 className="font-display text-3xl sm:text-4xl" style={{ color: C.textHead }}>{title}</h2>
      <span className="lp-title-bar" aria-hidden="true" />
      <p className="text-sm mt-3" style={{ color: C.textMuted }}>{subtitle}</p>
    </div>
  );
}
