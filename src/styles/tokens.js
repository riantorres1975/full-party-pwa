/**
 * ════════════════════════════════════════════════════════════
 * Design Tokens — Full Party PWA
 * Fuente única de verdad para colores, gradientes, sombras,
 * espaciado y tipografía. Usar en lugar de valores hardcodeados.
 * ════════════════════════════════════════════════════════════
 */

// ── 1. PALETA PRINCIPAL ────────────────────────────────────
export const colors = {
  // Primarios (fiesta)
  pink:      '#F472B6',
  magenta:   '#ff3dac',
  purple:    '#a855f7',
  'purple-light': '#C084FC',
  cyan:      '#22D3EE',
  orange:    '#FB923C',
  green:     '#34D399',
  blue:      '#818CF8',
  yellow:    '#FDE047',

  // Texto
  textHead:  '#2D0D5A',
  textBody:  '#5B3080',
  textMuted: '#7B4FA6',

  // Superficies
  bgHero:     '#FEFAFF',
  bgBenefits: '#FEF3FF',
  bgSteps:    '#F5F3FF',
  bgReviews:  '#FFF5F9',
  bgBranches: '#F0FFFE',
  cream:      '#fff8fe',
  surfaceLavender: '#F5EEFF',

  // Utilidad
  borderSoft: '#EDE0F8',
  infoBlue:   '#0369A1',
  accentDeep: '#7C3AED',
  pinkDeep:   '#BE185D',
  white:      '#ffffff',

  // WhatsApp
  whatsappGreen: '#25d366',
  whatsappDark:  '#128c7e',
  whatsappBtn:   '#1aab56',

  // Facebook
  facebookBlue: '#1877F2',
};

// ── 2. GRADIENTES ──────────────────────────────────────────
export const gradients = {
  primary:    `linear-gradient(135deg, ${colors.magenta}, ${colors.purple})`,
  primaryAlt: `linear-gradient(135deg, ${colors.pink}, ${colors['purple-light']})`,
  whatsapp:   `linear-gradient(135deg, ${colors.whatsappGreen}, ${colors.whatsappDark})`,
  whatsappBtn:`linear-gradient(135deg, ${colors.whatsappGreen}, ${colors.whatsappBtn})`,
  facebook:   `linear-gradient(135deg, ${colors.facebookBlue}, #1251AE)`,
  success:    `linear-gradient(135deg, #25d366, #1db954)`,
  heroTitle:  `linear-gradient(135deg, ${colors.pink} 0%, ${colors.purple} 50%, ${colors.cyan} 100%)`,
  banner:     `linear-gradient(90deg, #f97316, #ec4899, ${colors.purple}, #f97316)`,
};

// ── 3. SOMBRAS ─────────────────────────────────────────────
export const shadows = {
  lavender:      `rgba(192,132,252,0.1)`,
  lavenderSoft:  `0 2px 16px rgba(192,132,252,0.1)`,
  lavenderMed:   `0 4px 20px rgba(192,132,252,0.22)`,
  accentSoft:    `0 4px 20px rgba(255, 61, 172, 0.27)`,
  successSoft:   `0 4px 20px rgba(37, 211, 102, 0.33)`,
  pinkGlow:      `0 2px 12px ${colors.pink}44`,
  pinkMed:       `0 2px 12px ${colors.pink}30`,
  pinkStrong:    `0 8px 24px ${colors.pink}44`,
  whatsappGlow:  `0 6px 20px rgba(37,211,102,0.5)`,
  card:          '0 2px 12px rgba(0,0,0,0.07)',
  cardHover:     '0 16px 40px rgba(0,0,0,0.1)',
  elevated:      '0 8px 24px rgba(0,0,0,0.12)',
  productHover:  '0 8px 24px rgba(168, 85, 247, 0.12)',
};

// ── 4. BORDES ──────────────────────────────────────────────
export const borders = {
  soft:       `1px solid ${colors.borderSoft}`,
  softPurple: `1px solid ${colors['purple-light']}22`,
  card:       `1px solid rgba(203, 156, 245, 0.26)`,
  input:      `1px solid var(--border-soft)`,
};

// ── 5. RADIUS ──────────────────────────────────────────────
export const radius = {
  sm:  '0.5rem',   // 8px
  md:  '0.75rem',  // 12px
  lg:  '1rem',     // 16px
  xl:  '1.15rem',  // ~18px
  '2xl': '1.25rem', // 20px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// ── 6. TIPOGRAFÍA ──────────────────────────────────────────
export const typography = {
  family: {
    display: '"Fredoka One", cursive',
    body:    '"Nunito", system-ui, sans-serif',
  },
  size: {
    '2xs': '10px',
    xs:    '11px',
    sm:    '12px',
    base:  '13px',
    md:    '14px',
    lg:    '16px',
    xl:    '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '32px',
    '5xl': '40px',
    '6xl': '48px',
    '7xl': '60px',
  },
};

// ── 7. TRANSICIONES ────────────────────────────────────────
export const transitions = {
  default: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  fast:    'all 0.2s ease',
  slow:    'all 0.4s ease',
};

// ── 8. Z-INDEX SCALE ───────────────────────────────────────
export const zIndex = {
  base:     0,
  confetti: 1,
  content:  2,
  nav:      50,
  drawer:   60,
  dropdown: 70,
  modal:    80,
  toast:    90,
  tooltip:  100,
};

// ── 9. HELPERS DE ESTILO INLINE ────────────────────────────
/** Devuelve un objeto de estilo para botones primarios */
export const btnPrimaryStyle = (overrides = {}) => ({
  background: gradients.primary,
  color: colors.white,
  borderRadius: radius['2xl'],
  boxShadow: shadows.accentSoft,
  ...overrides,
});

/** Devuelve un objeto de estilo para botones de WhatsApp */
export const btnWhatsAppStyle = (overrides = {}) => ({
  background: gradients.whatsapp,
  color: colors.white,
  borderRadius: radius['2xl'],
  boxShadow: shadows.whatsappGlow,
  ...overrides,
});

/** Devuelve un objeto de estilo para cards */
export const cardStyle = (overrides = {}) => ({
  background: colors.white,
  borderRadius: radius.xl,
  boxShadow: shadows.card,
  ...overrides,
});

// ── LEGACY EXPORT ──────────────────────────────────────────
/** Objeto C compatible con LandingPage.jsx existente.
 *  USO NUEVO: importa desde tokens.js directamente. */
export const C = {
  pink:    colors.pink,
  purple:  colors['purple-light'],
  green:   colors.green,
  orange:  colors.orange,
  cyan:    colors.cyan,
  blue:    colors.blue,
  yellow:  colors.yellow,
  bgHero:     colors.bgHero,
  bgBenefits: colors.bgBenefits,
  bgSteps:    colors.bgSteps,
  bgReviews:  colors.bgReviews,
  bgBranches: colors.bgBranches,
  textHead:   colors.textHead,
  textBody:   colors.textBody,
  textMuted:  colors.textMuted,
  surfaceLavender: colors.surfaceLavender,
  borderSoft: colors.borderSoft,
  infoBlue:   colors.infoBlue,
  accentDeep: colors.accentDeep,
  pinkDeep:   colors.pinkDeep,
  shadowLavender: shadows.lavender,
};
