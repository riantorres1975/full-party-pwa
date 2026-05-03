import { C } from '../../styles/tokens';

const LETTER_COLORS = [C.pink, C.purple, C.green, C.orange, C.cyan, C.blue, C.yellow];

/**
 * Cada carácter de `text` con un color diferente del logo,
 * ciclando por LETTER_COLORS según la posición del carácter.
 */
export default function ColorLetters({ text }) {
  return (
    <>
      {[...text].map((char, i) => (
        <span
          key={i}
          style={{ color: char === ' ' ? 'inherit' : LETTER_COLORS[i % LETTER_COLORS.length] }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </>
  );
}
