import { C } from '../../styles/tokens';

/** Título de sección reutilizable */
export default function SectionTitle({ title, subtitle }) {
  return (
    <div className="text-center mb-12">
      <h2 className="font-display text-3xl sm:text-4xl mb-2" style={{ color: C.textHead }}>{title}</h2>
      <p className="text-sm" style={{ color: C.textMuted }}>{subtitle}</p>
    </div>
  );
}
