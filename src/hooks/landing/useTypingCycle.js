import { useState, useEffect } from 'react';

const DEFAULT_TYPING = { typeSpeed: 85, eraseSpeed: 48, holdMs: 2400, pauseMs: 380 };

/** Typewriter que cicla entre palabras: escribe → pausa → borra → repite */
export function useTypingCycle(words, opts = DEFAULT_TYPING) {
  const { typeSpeed, eraseSpeed, holdMs, pauseMs } = opts;
  const [suffix, setSuffix] = useState(words[0]);
  const [phase,  setPhase]  = useState('hold');
  const [idx,    setIdx]    = useState(0);

  useEffect(() => {
    let t;
    if (phase === 'hold') {
      t = setTimeout(() => setPhase('erasing'), holdMs);
    } else if (phase === 'erasing') {
      if (suffix.length > 0) {
        t = setTimeout(() => setSuffix(s => s.slice(0, -1)), eraseSpeed);
      } else {
        setIdx(i => (i + 1) % words.length);
        setPhase('pause');
      }
    } else if (phase === 'pause') {
      t = setTimeout(() => setPhase('typing'), pauseMs);
    } else if (phase === 'typing') {
      const target = words[idx];
      if (suffix.length < target.length) {
        t = setTimeout(() => setSuffix(target.slice(0, suffix.length + 1)), typeSpeed);
      } else {
        setPhase('hold');
      }
    }
    return () => clearTimeout(t);
  }, [phase, suffix, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  return { suffix, showCursor: phase !== 'hold' };
}
