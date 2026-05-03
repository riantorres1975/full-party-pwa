/** Globo SVG decorativo */
export default function Balloon({ color, size = 48, rotate = 0 }) {
  return (
    <svg
      width={size}
      height={size * 1.35}
      viewBox="0 0 60 81"
      fill="none"
      aria-hidden="true"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <ellipse cx="30" cy="30" rx="22" ry="26" fill={color} opacity="0.85" />
      <ellipse cx="22" cy="22" rx="6"  ry="7"  fill="white" opacity="0.22" />
      <path d="M30 56 Q28 62 32 66 Q28 68 30 74" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.65" />
      <circle cx="30" cy="57" r="2" fill={color} opacity="0.55" />
    </svg>
  );
}
