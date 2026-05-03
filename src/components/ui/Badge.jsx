/**
 * Badge.jsx — Badge unificado para toda la aplicación.
 *
 * Variantes:
 *  - new:      gradiente rosa-morado, blanco (productos nuevos)
 *  - discount: verde (descuento / precio mayoreo)
 *  - warning:  naranja-rojo (poco stock)
 *  - info:     fondo blanco, texto morado (información)
 *  - soldOut:  fondo oscuro, blanco (agotado)
 *  - neutral:  lavanda sutil (tags genéricos)
 *
 * Tamaños:
 *  - sm: text-[9px]  px-2 py-0.5
 *  - md: text-[10px] px-2.5 py-1
 *  - lg: text-xs     px-3 py-1.5
 */
import { gradients, shadows } from '../../styles/tokens';

const STYLES = {
  new: {
    classes: 'text-white rounded-full uppercase tracking-wider',
    background: gradients.primary,
    shadow: '0 2px 8px rgba(255, 61, 172, 0.35)',
  },
  discount: {
    classes: 'text-white rounded-full',
    background: 'linear-gradient(135deg, #16a34a, #059669)',
    shadow: 'none',
  },
  warning: {
    classes: 'text-white rounded-full',
    background: 'linear-gradient(135deg, #f97316, #dc2626)',
    shadow: 'none',
  },
  info: {
    classes: 'text-ink-800 rounded-full border backdrop-blur-sm',
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(168, 85, 247, 0.18)',
    shadow: 'none',
  },
  soldOut: {
    classes: 'text-white rounded-full backdrop-blur-sm',
    background: 'rgba(26, 7, 51, 0.8)',
    shadow: 'none',
  },
  neutral: {
    classes: 'text-ink-600 rounded-full',
    background: 'rgba(243, 232, 255, 0.8)',
    shadow: 'none',
  },
};

const SIZES = {
  sm:  'text-[9px] px-2 py-0.5 gap-0.5',
  md:  'text-[10px] px-2.5 py-1 gap-1',
  lg:  'text-xs px-3 py-1.5 gap-1',
};

export default function Badge({
  variant = 'neutral',
  size = 'md',
  pulse = false,
  icon = null,
  className = '',
  style = {},
  children,
}) {
  const v = STYLES[variant] || STYLES.neutral;
  const s = SIZES[size] || SIZES.md;

  const classes = [
    'inline-flex items-center font-body font-black',
    'whitespace-nowrap',
    pulse ? 'animate-pulse' : '',
    s,
    v.classes,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      style={{
        background: v.background,
        border: v.border,
        boxShadow: v.shadow,
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
}
