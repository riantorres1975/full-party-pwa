import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * useFocusTrap — traps keyboard focus inside a container (WCAG 2.4.3).
 * @param {React.RefObject} ref   — ref to the modal/dialog container
 * @param {boolean}         active — whether the trap is active
 * @param {'first'|'container'} initialFocus — where focus starts when opened
 * @param {(e: KeyboardEvent) => void} [onEscape] — optional Escape-to-close handler
 */
export function useFocusTrap(ref, active, initialFocus = 'first', onEscape) {
  // Se guarda en ref para no reactivar el efecto si el caller pasa una
  // función con identidad nueva en cada render.
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active || !ref.current) return;

    const el = ref.current;
    const previouslyFocused = document.activeElement;

    const focusFrame = requestAnimationFrame(() => {
      if (initialFocus === 'container') {
        el.focus({ preventScroll: true });
        return;
      }

      const nodes = el.querySelectorAll(FOCUSABLE);
      nodes[0]?.focus({ preventScroll: true });
    });

    function trap(e) {
      if (e.key === 'Escape' && typeof onEscapeRef.current === 'function') {
        e.stopPropagation();
        onEscapeRef.current(e);
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = el.querySelectorAll(FOCUSABLE);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last  = nodes[nodes.length - 1];

      if (document.activeElement === el) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }

    el.addEventListener('keydown', trap);

    return () => {
      cancelAnimationFrame(focusFrame);
      el.removeEventListener('keydown', trap);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, ref, initialFocus]);
}
