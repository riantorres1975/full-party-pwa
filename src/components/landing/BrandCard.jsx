import { useState } from 'react';
import { C } from '../../styles/tokens';

/** Tarjeta de marca con efecto gris → color gestionado por estado */
export default function BrandCard({ nombre, desc, color, emoji }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center bg-white lp-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border:      `2px solid ${hovered ? color : '#E9DEFF'}`,
        boxShadow:   hovered ? `0 12px 32px ${color}28` : '0 2px 10px rgba(0,0,0,0.05)',
        filter:      hovered ? 'none' : 'grayscale(30%)',
        transition:  'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform:   hovered ? 'translateY(-5px) scale(1.03)' : 'translateY(0) scale(1)',
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300"
        style={{ background: hovered ? `${color}18` : C.surfaceLavender, border: `2px solid ${hovered ? color : '#E9DEFF'}` }}
      >
        <span style={{ filter: hovered ? 'none' : 'saturate(0.5)' }}>{emoji}</span>
      </div>
      <p className="font-display text-sm transition-colors duration-300" style={{ color: hovered ? C.textHead : '#7A6090' }}>{nombre}</p>
      <p className="text-xs transition-colors duration-300"              style={{ color: hovered ? C.textMuted : '#BBA8D4' }}>{desc}</p>
    </div>
  );
}
