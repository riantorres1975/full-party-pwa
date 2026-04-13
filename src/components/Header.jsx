import { Package, LayoutGrid, MoreHorizontal } from 'lucide-react';
import { NOMBRE_NEGOCIO } from '../data/productos';
import { usePWA } from '../hooks/usePWA';
import { useLanguage } from '../hooks/useLanguage';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useEffect, useRef, useState } from 'react';

export default function Header({ cantidadTotal, onAbrirCarrito, temaOscuro, onToggleTema, onRastreoClick, isAdmin = false }) {
  const { installPrompt, mostrarGuiaIOS, instalarApp } = usePWA();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);
  const { t, lang, setLang } = useLanguage();

  const mostrarBotonInstalar = !!installPrompt || mostrarGuiaIOS;

  function manejarInstalar() {
    if (installPrompt) {
      instalarApp();
      return;
    }

    if (mostrarGuiaIOS) {
      setShowIOSGuide(true);
      setTimeout(() => setShowIOSGuide(false), 5000);
    }
  }

  useEffect(() => {
    if (!menuAbierto) return;
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAbierto(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
    };
  }, [menuAbierto]);

  return (
    <div className="safe-top">
      <div className="max-w-[1500px] mx-auto px-4 lg:px-10 py-3 flex items-center justify-between gap-2">
        {/* Logo / Nombre */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="fp-header-balloon-wrap" aria-hidden>
            <svg viewBox="0 0 64 64" className="fp-header-balloon" role="img" aria-label="Globo">
              <defs>
                <linearGradient id="fpBalloonFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="fpBalloonKnot" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
              </defs>
              <ellipse cx="31" cy="24" rx="18" ry="20" fill="url(#fpBalloonFill)" />
              <ellipse cx="24" cy="18" rx="5" ry="7" fill="rgba(255,255,255,0.3)" />
              <path d="M28 43l3 5 5-4-4-2z" fill="url(#fpBalloonKnot)" />
              <path d="M31 48c5 4 1 8 6 11" stroke="#4338ca" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-2xl leading-tight"
                style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {NOMBRE_NEGOCIO}
            </h1>
            <p className="text-[10px] font-body font-bold tracking-widest uppercase text-ink-400">
              {t('header.subtitle')}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {mostrarBotonInstalar && (
            <button
              onClick={manejarInstalar}
              className="hidden sm:flex items-center gap-1.5 text-xs font-body font-bold
                         text-fiesta-purple bg-ink-100 px-2 sm:px-3 py-1.5 rounded-full
                         border-2 border-ink-200 transition-all duration-200 hover:bg-ink-200 active:scale-95"
              aria-label={t('header.installAriaLabel')}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 18.5l-6-6m6 6l6-6m-6 6V3" />
              </svg>
              <span className="hidden sm:inline">{t('header.install')}</span>
            </button>
          )}

          {/* Acceso rápido al admin */}
          {isAdmin && (
            <a
              href="#/admin"
              className="hidden sm:flex items-center gap-1.5 text-xs font-body font-bold px-2.5 py-1.5 rounded-full
                         border-2 transition-all duration-200 active:scale-95"
              style={{
                color: temaOscuro ? '#c4b5fd' : '#52278f',
                borderColor: temaOscuro ? '#363b64' : '#e0c4f8',
                background: temaOscuro ? 'rgba(42,15,80,0.5)' : '#f3e8ff',
              }}
              aria-label={t('header.adminAriaLabel')}
              title={t('header.admin')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('header.admin')}</span>
            </a>
          )}

          {/* Order tracking */}
          {onRastreoClick && (
            <button
              onClick={onRastreoClick}
              className="hidden sm:flex items-center gap-1 p-2 rounded-full transition-all duration-200 active:scale-90"
              style={{ color: 'var(--text-secondary)' }}
              aria-label={t('header.trackAriaLabel')}
              title={t('header.track')}
            >
              <Package className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-body font-bold">{t('header.track')}</span>
            </button>
          )}

          {/* Language toggle */}
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>

          {/* Theme toggle */}
          <div className="hidden sm:block">
            <ThemeToggle
              isDarkMode={temaOscuro}
              onToggle={onToggleTema}
              variant={temaOscuro ? 'catalogDark' : 'catalog'}
            />
          </div>

          {/* Menú móvil de acciones secundarias */}
          <div className="relative sm:hidden" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuAbierto(v => !v)}
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-95"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--surface-card)',
                color: 'var(--text-secondary)',
              }}
              aria-label="Más acciones"
              title="Más"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuAbierto && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-xl p-1.5 z-[70] border shadow-xl animate-fade-in"
                style={{ background: 'var(--surface-primary)', borderColor: 'var(--border-soft)' }}
              >
                {mostrarBotonInstalar && (
                  <button
                    type="button"
                    onClick={() => { manejarInstalar(); setMenuAbierto(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-body font-bold transition-colors hover:bg-ink-100"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {t('header.install')}
                  </button>
                )}

                {isAdmin && (
                  <a
                    href="#/admin"
                    onClick={() => setMenuAbierto(false)}
                    className="block w-full text-left px-3 py-2 rounded-lg text-xs font-body font-bold transition-colors hover:bg-ink-100"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {t('header.admin')}
                  </a>
                )}

                {onRastreoClick && (
                  <button
                    type="button"
                    onClick={() => { onRastreoClick(); setMenuAbierto(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-body font-bold transition-colors hover:bg-ink-100"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {t('header.track')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { onToggleTema?.(); setMenuAbierto(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-body font-bold transition-colors hover:bg-ink-100"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {temaOscuro ? 'Tema claro' : 'Tema oscuro'}
                </button>

                <button
                  type="button"
                  onClick={() => { setLang(lang === 'es' ? 'en' : 'es'); setMenuAbierto(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-body font-bold transition-colors hover:bg-ink-100"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {lang === 'es' ? 'Language: EN' : 'Idioma: ES'}
                </button>
              </div>
            )}
          </div>

          {/* Cart button */}
          <div className="relative overflow-visible">
            <button
              onClick={onAbrirCarrito}
              className="relative p-2.5 rounded-full text-white transition-all duration-200 active:scale-90"
              style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)' }}
              aria-label={t('header.cartAriaLabel', { count: cantidadTotal })}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
            {cantidadTotal > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] flex items-center justify-center
                               text-[12px] leading-none font-body font-black tabular-nums bg-white text-[#2563eb]
                               rounded-full px-1 animate-cart-bounce border-2 border-[#1b2140] shadow-[0_2px_8px_rgba(0,0,0,0.25)] pointer-events-none">
                {cantidadTotal > 99 ? '99+' : cantidadTotal}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* iOS install guide banner */}
      {showIOSGuide && (
        <div className="mx-4 mt-1 mb-0 px-3 py-2 rounded-xl text-xs font-body font-bold text-center animate-fade-in"
             style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}
             role="status"
             dangerouslySetInnerHTML={{ __html: t('header.iosGuide') }}
        />
      )}
    </div>
  );
}
