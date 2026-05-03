/**
 * Button.jsx — Botón unificado para toda la aplicación.
 *
 * Variantes:
 *  - primary:   gradiente rosa-morado (CTAs principales)
 *  - whatsapp:  gradiente verde WhatsApp
 *  - outline:   borde morado, fondo transparente
 *  - ghost:     sin borde ni fondo
 *  - danger:    rojo (destructivo)
 *
 * Tamaños:
 *  - sm:  pills, acciones pequeñas
 *  - md:  tarjetas, nav
 *  - lg:  CTAs
 *  - xl:  hero CTAs
 */
import { forwardRef } from 'react';
import { gradients, shadows } from '../../styles/tokens';

const STYLES = {
  primary: {
    classes: 'text-white border-transparent',
    background: gradients.primary,
    shadow: shadows.accentSoft,
  },
  whatsapp: {
    classes: 'text-white border-transparent',
    background: gradients.whatsappBtn,
    shadow: shadows.whatsappGlow,
  },
  outline: {
    classes: 'bg-transparent text-ink-600 border-purple-300 hover:border-fiesta-magenta hover:text-fiesta-magenta',
    background: undefined,
    shadow: 'none',
  },
  ghost: {
    classes: 'bg-transparent border-transparent text-ink-600 hover:bg-purple-50',
    background: undefined,
    shadow: 'none',
  },
  danger: {
    classes: 'text-white border-transparent',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    shadow: '0 4px 15px rgba(239, 68, 68, 0.35)',
  },
  facebook: {
    classes: 'text-white border-transparent',
    background: '#1251AE',
    shadow: 'none',
  },
  tiktok: {
    classes: 'text-white border-transparent',
    background: '#010101',
    shadow: 'none',
  },
};

const SIZES = {
  sm:  'text-xs px-3 py-1.5 rounded-xl gap-1',
  md:  'text-sm px-4 py-2.5 rounded-xl gap-1.5',
  lg:  'text-base px-6 py-3.5 rounded-2xl gap-2',
  xl:  'text-lg px-8 py-4 rounded-2xl gap-2.5',
};

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    as: Component = 'button',
    pulse = false,
    fullWidth = false,
    iconLeft = null,
    iconRight = null,
    className = '',
    style = {},
    disabled = false,
    children,
    ...props
  },
  ref,
) {
  const v = STYLES[variant] || STYLES.primary;
  const s = SIZES[size] || SIZES.md;
  const isLink = Component === 'a';
  const isDisabled = disabled || props['aria-disabled'];

  const classes = [
    'inline-flex items-center justify-center font-body font-black',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fiesta-purple',
    pulse ? 'btn-pink-pulse' : '',
    fullWidth ? 'w-full' : '',
    isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:shadow-lg hover:-translate-y-0.5',
    s,
    v.classes,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component
      ref={ref}
      className={classes}
      style={{
        background: v.background,
        boxShadow: isDisabled ? 'none' : v.shadow,
        ...style,
      }}
      disabled={!isLink && isDisabled ? true : undefined}
      aria-disabled={isDisabled ? 'true' : undefined}
      {...props}
    >
      {iconLeft}
      <span>{children}</span>
      {iconRight}
    </Component>
  );
});

export default Button;
