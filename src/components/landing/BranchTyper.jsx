import { useState, useEffect, useRef } from 'react';
import { useTypingCycle } from '../../hooks/landing/useTypingCycle';
import ColorLetters from './ColorLetters';
import { C } from '../../styles/tokens';

const BURST_EMOJIS = ['🎉', '🎊', '✨', '⭐', '🌟', '🎈', '🎀', '🎁'];

/** Nombre de tienda animado con efecto typewriter y explosión de confeti */
export default function BranchTyper({ branchNames = ['Francisco Villa', 'Sol Naciente'] }) {
  const { suffix, showCursor } = useTypingCycle(branchNames);
  const [burst, setBurst]     = useState([]);
  const prevLenRef            = useRef(0);

  // Dispara confeti cada vez que empieza a escribirse una nueva sucursal
  useEffect(() => {
    if (prevLenRef.current === 0 && suffix.length === 1) {
      const particles = Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * 360;
        const dist  = 55 + (i % 3) * 22;
        return {
          id:    i,
          emoji: BURST_EMOJIS[i],
          bx:    Math.cos((angle * Math.PI) / 180) * dist,
          by:    Math.sin((angle * Math.PI) / 180) * dist - 10,
          br:    i * 45 + 15,
        };
      });
      setBurst(particles);
      const t = setTimeout(() => setBurst([]), 850);
      return () => clearTimeout(t);
    }
    prevLenRef.current = suffix.length;
  }, [suffix.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative font-display leading-tight text-center select-none">

      {/* ── Partículas de confeti ── */}
      {burst.map(p => (
        <span
          key={p.id}
          className="lp-burst-particle absolute pointer-events-none"
          aria-hidden="true"
          style={{
            left:      '50%',
            top:       '40%',
            fontSize:  '1.3rem',
            '--bx':    `${p.bx}px`,
            '--by':    `${p.by}px`,
            '--br':    `${p.br}deg`,
            zIndex:    20,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Línea 1 — "Full Party" grande y estático */}
      <div className="text-5xl sm:text-6xl lg:text-7xl">
        <ColorLetters text="Full Party" />
      </div>

      {/* Línea 2 — "Suc. " fijo + nombre escrito letra a letra */}
      <div
        className="flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl mt-2"
        style={{ minHeight: '1.25em' }}
      >
        <span className="font-display" style={{ color: C.textBody }}>Suc.&nbsp;</span>
        <ColorLetters text={suffix} />
        <span
          className="cursor-blink inline-block rounded-sm self-center ml-0.5"
          style={{ width: 2, height: '0.8em', background: C.pink, opacity: showCursor ? 1 : 0 }}
        />
      </div>
    </div>
  );
}
