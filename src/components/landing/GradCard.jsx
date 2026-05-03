/** Tarjeta con borde gradiente — hover gestionado por CSS (var --hover-shadow) */
export default function GradCard({ children, gradient, hoverColor = 'rgba(0,0,0,0.1)', className = '' }) {
  return (
    <div
      className={`lp-card ${className}`}
      style={{
        background:       `linear-gradient(white, white) padding-box, ${gradient} border-box`,
        border:           '2px solid transparent',
        borderRadius:     '1rem',
        boxShadow:        '0 2px 12px rgba(0,0,0,0.07)',
        '--hover-shadow': `0 16px 40px ${hoverColor}`,
      }}
    >
      {children}
    </div>
  );
}
