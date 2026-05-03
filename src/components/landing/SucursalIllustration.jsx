/** Ilustración SVG festiva para el encabezado de la tarjeta de sucursal */
export default function SucursalIllustration({ color, accent, id }) {
  const gid = `sg-${id}`;
  return (
    <svg
      viewBox="0 0 300 150"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={color}  stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.14" />
        </linearGradient>
      </defs>

      {/* Fondo */}
      <rect width="300" height="150" fill={`url(#${gid})`} />

      {/* Cuerda de guirnalda */}
      <path d="M0,22 Q75,36 150,22 Q225,8 300,22"
        fill="none" stroke={color} strokeWidth="1.4" opacity="0.4" />

      {/* Banderines triangulares */}
      {[12,48,84,120,156,192,228,264].map((x, i) => (
        <polygon
          key={i}
          points={`${x},22 ${x+20},22 ${x+10},40`}
          fill={i % 2 === 0 ? color : accent}
          opacity="0.55"
        />
      ))}

      {/* Globo izquierdo */}
      <ellipse cx="32" cy="95" rx="18" ry="22" fill={color}  opacity="0.38" />
      <ellipse cx="26" cy="87" rx="5"  ry="6"  fill="white"  opacity="0.22" />
      <path d="M32,117 Q30,126 34,130 Q30,132 32,138"
        stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.38" />

      {/* Globo derecho */}
      <ellipse cx="268" cy="90" rx="18" ry="22" fill={accent} opacity="0.38" />
      <ellipse cx="262" cy="82" rx="5"  ry="6"  fill="white"  opacity="0.22" />
      <path d="M268,112 Q266,121 270,125 Q266,127 268,133"
        stroke={accent} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.38" />

      {/* Confeti — círculos */}
      {[
        [65, 55, 5, color, 0.45], [240, 50, 6, accent, 0.4],
        [50, 115, 4, accent, 0.38], [255, 118, 5, color, 0.4],
        [190, 48, 3.5, color, 0.5], [110, 130, 4, accent, 0.35],
      ].map(([x, y, r, c, op], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={op} />
      ))}

      {/* Confeti — rombos */}
      {[
        [85, 105, color, 0.38], [215, 112, accent, 0.35],
        [160, 135, color, 0.3], [280, 60, accent, 0.4],
        [20, 60, color, 0.35],
      ].map(([x, y, c, op], i) => (
        <rect key={i} x={x-5} y={y-5} width="10" height="10"
          fill={c} opacity={op} transform={`rotate(45,${x},${y})`} />
      ))}

      {/* Estrellas */}
      {[[70, 42], [232, 40], [95, 135], [205, 130]].map(([x, y], i) => (
        <text key={i} x={x} y={y} fontSize="13"
          fill={i % 2 === 0 ? color : accent} opacity="0.6" textAnchor="middle">★</text>
      ))}

      {/* Círculo central (fondo del ícono) */}
      <circle cx="150" cy="90" r="36" fill="white" opacity="0.5" />
      <circle cx="150" cy="90" r="26" fill="white" opacity="0.45" />

      {/* Pin de mapa estilizado */}
      <path
        d="M150,68 C139,68 130,77 130,88 C130,103 150,115 150,115 C150,115 170,103 170,88 C170,77 161,68 150,68 Z"
        fill={color} opacity="0.85"
      />
      <circle cx="150" cy="88" r="7" fill="white" opacity="0.95" />
    </svg>
  );
}
