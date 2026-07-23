const DEFAULT_DELAY_MS = 20000;
const INTERACTION_EVENTS = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'scroll'];

export function deferSupabase(callback, delayMs = DEFAULT_DELAY_MS) {
  if (typeof window === 'undefined') return () => {};

  let cancelled = false;
  let started = false;
  let timeoutId;

  const removeTriggers = () => {
    INTERACTION_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, start);
    });
    if (timeoutId) window.clearTimeout(timeoutId);
  };

  const start = async () => {
    if (cancelled || started) return;
    started = true;
    removeTriggers();

    try {
      const module = await import('../lib/supabase');
      if (!cancelled) callback(module.supabase);
    } catch (error) {
      console.warn('[Supabase] No se pudo iniciar la sincronizacion diferida.', error);
    }
  };

  INTERACTION_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, start, { passive: true, once: true });
  });
  timeoutId = window.setTimeout(start, delayMs);

  return () => {
    cancelled = true;
    removeTriggers();
  };
}
