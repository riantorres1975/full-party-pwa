import { useReveal } from '../../hooks/landing/useReveal';

/** Envuelve hijos con fade-in + slide al entrar en viewport */
export default function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, visible] = useReveal();
  const ty = direction === 'up' ? 28 : direction === 'down' ? -28 : 0;
  const tx = direction === 'left' ? 28 : direction === 'right' ? -28 : 0;
  return (
    <div
      ref={ref}
      className={`lp-reveal ${className}`}
      data-visible={visible}
      style={{ '--reveal-x': `${tx}px`, '--reveal-y': `${ty}px`, '--reveal-delay': `${delay}s` }}
    >
      {children}
    </div>
  );
}
