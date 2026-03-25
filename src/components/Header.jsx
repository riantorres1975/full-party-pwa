import { NOMBRE_NEGOCIO } from '../data/productos';
import { usePWA } from '../hooks/usePWA';

export default function Header({ cantidadTotal, onAbrirCarrito }) {
  const { installPrompt, instalarApp } = usePWA();

  return (
    <header className="glass-panel sticky top-0 z-40 safe-top">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo / Nombre */}
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-float">🎉</span>
          <div>
            <h1 className="font-display text-2xl leading-tight"
                style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {NOMBRE_NEGOCIO}
            </h1>
            <p className="text-[10px] font-body font-bold tracking-widest uppercase text-ink-400">
              ✨ Catálogo Digital ✨
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {installPrompt && (
            <button
              onClick={instalarApp}
              className="hidden sm:flex items-center gap-1.5 text-xs font-body font-bold
                         text-fiesta-purple bg-ink-100 px-3 py-1.5 rounded-full
                         border-2 border-ink-200 transition-all duration-200 hover:bg-ink-200 active:scale-95"
              aria-label="Instalar app"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 18.5l-6-6m6 6l6-6m-6 6V3" />
              </svg>
              Instalar
            </button>
          )}

          {/* Botón carrito — wrapper con overflow visible para que el badge no se corte */}
          <div className="relative">
            <button
              onClick={onAbrirCarrito}
              className="relative p-2.5 rounded-full text-white transition-all duration-200 active:scale-90"
              style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}
              aria-label={`Carrito con ${cantidadTotal} productos`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
            {cantidadTotal > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center
                               text-[11px] font-body font-black bg-fiesta-yellow text-ink-900 rounded-full px-1
                               animate-cart-bounce border-2 border-white pointer-events-none">
                {cantidadTotal > 99 ? '99+' : cantidadTotal}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
