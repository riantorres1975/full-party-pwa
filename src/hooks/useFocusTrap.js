import { useEffect } from 'react';

const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * useFocusTrap — traps keyboard focus inside a container (WCAG 2.4.3).
 * @param {React.RefObject} ref   — ref to the modal/dialog container
 * @param {boolean}         active — whether the trap is active
 */
export function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const el = ref.current;
    const previouslyFocused = document.activeElement;

    // Focus the first focusable element
    requestAnimationFrame(() => {
      const nodes = el.querySelectorAll(FOCUSABLE);
      nodes[0]?.focus();
    });

    function trap(e) {
      if (e.key !== 'Tab') return;
      const nodes = el.querySelectorAll(FOCUSABLE);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last  = nodes[nodes.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }

    el.addEventListener('keydown', trap);

    return () => {
      el.removeEventListener('keydown', trap);
      previouslyFocused?.focus?.();
    };
  }, [active, ref]);
}
