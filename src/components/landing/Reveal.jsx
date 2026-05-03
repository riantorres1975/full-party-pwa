import { useReveal } from '../../hooks/landing/useReveal';

/** Envuelve hijos con fade-in + slide al entrar en viewport */
export default function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, visible] = useReveal();
  const ty = direction === 'up' ? 28 : direction === 'down' ? -28 : 0;
  const tx = direction === 'left' ? 28 : direction === 'right' ? -28 : 0;
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translate(0,0)' : `translate(${tx}px,${ty}px)`,
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
