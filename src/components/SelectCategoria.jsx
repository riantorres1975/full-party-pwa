import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { categorias as categoriasDefault } from '../data/productos';

const triggerClass =
  'w-full bg-white rounded-2xl px-4 py-3 pr-10 text-sm font-body font-semibold ' +
  'text-ink-900 outline-none border-2 border-ink-200 ' +
  'focus:border-fiesta-magenta transition-colors flex items-center justify-between gap-2 text-left';

/**
 * Sustituye al <select> nativo: lista con altura máxima y scroll (no depende del overflow del padre).
 * @param {string} id — para asociar con <label htmlFor>
 * @param {string} value — id de categoría seleccionada
 * @param {(id: string) => void} onChange
 * @param {{ id: string, label: string }[]} [lista]
 * @param {{ id: string, label: string } | null} [opcionExtra]
 */
export default function SelectCategoria({
  id,
  value,
  onChange,
  lista = categoriasDefault,
  opcionExtra = null,
}) {
  const [abierto, setAbierto] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const items =
    opcionExtra && !lista.some(c => c.id === opcionExtra.id)
      ? [opcionExtra, ...lista]
      : lista;

  const actual = items.find(c => c.id === value);
  const textoBoton = actual?.label ?? value ?? 'Selecciona categoría';

  function updatePos() {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 160),
    });
  }

  useLayoutEffect(() => {
    if (!abierto) return;
    updatePos();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function onScrollOrResize() {
      updatePos();
    }
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [abierto]);

  useEffect(() => {
    function handlePointer(e) {
      const t = e.target;
      if (wrapRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setAbierto(false);
    }
    if (abierto) {
      document.addEventListener('mousedown', handlePointer);
      document.addEventListener('touchstart', handlePointer, { passive: true });
      return () => {
        document.removeEventListener('mousedown', handlePointer);
        document.removeEventListener('touchstart', handlePointer);
      };
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto) { setFocusIndex(-1); return; }
    function onKey(e) {
      switch (e.key) {
        case 'Escape':
          setAbierto(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Home':
          e.preventDefault();
          setFocusIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusIndex(items.length - 1);
          break;
        case 'Enter':
          if (focusIndex >= 0 && focusIndex < items.length) {
            e.preventDefault();
            onChange(items[focusIndex].id);
            setAbierto(false);
          }
          break;
        default:
          break;
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [abierto, focusIndex, items, onChange]);

  const listaNode =
    abierto &&
    createPortal(
      <ul
        ref={listRef}
        role="listbox"
        aria-labelledby={id}
        className="fixed z-[9999] max-h-52 overflow-y-auto overscroll-y-contain rounded-2xl border-2 border-ink-200
                   bg-white py-1 shadow-xl [scrollbar-width:thin] [scrollbar-color:rgba(107,53,184,0.35)_transparent]"
        style={{
          top: pos.top,
          left: pos.left,
          width: pos.width,
          boxShadow: '0 12px 40px rgba(26, 7, 51, 0.15)',
        }}
      >
        {items.map((c, index) => {
          const seleccionada = value === c.id;
          const focused = index === focusIndex;
          return (
            <li key={c.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={seleccionada}
                data-focused={focused || undefined}
                onClick={() => {
                  onChange(c.id);
                  setAbierto(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-body font-semibold transition-colors
                           hover:bg-purple-50 active:bg-purple-100
                           data-[focused]:bg-purple-50 data-[focused]:outline data-[focused]:outline-2 data-[focused]:-outline-offset-2 data-[focused]:outline-purple-400"
                style={
                  seleccionada
                    ? { background: '#f3e8ff', color: '#5b21b6' }
                    : { color: '#1f2937' }
                }
              >
                {c.label}
              </button>
            </li>
          );
        })}
      </ul>,
      document.body
    );

  return (
    <div ref={wrapRef} className="relative min-w-0 w-full">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => setAbierto(v => !v)}
        className={triggerClass}
      >
        <span className="truncate">{textoBoton}</span>
        <ChevronDown
          size={18}
          className={`text-ink-400 flex-shrink-0 transition-transform duration-200 ${
            abierto ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {listaNode}
    </div>
  );
}
