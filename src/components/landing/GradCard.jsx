/** Tarjeta con borde gradiente — hover gestionado por CSS (var --hover-shadow) */
export default function GradCard({ children, gradient, hoverColor = 'rgba(0,0,0,0.1)', className = '' }) {
  return (
    <div
      className={`lp-card ${className}`}
      style={{
        background:       `linear-gradient(white, white) padding-box, ${gradient} border-box`,
        border:           '2px solid transparent',
        borderRadius:     '1.25rem',
        boxShadow:        '0 6px 24px rgba(86, 26, 122, 0.08)',
        '--hover-shadow': `0 20px 44px ${hoverColor}`,
      }}
    >
      {children}
    </div>
  );
}
