import { SIMBOLO_MONEDA } from '../data/productos';

export default function FloatingCartButton({ cantidadTotal, total, onAbrir }) {
  if (cantidadTotal === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-4 z-40 sm:max-w-sm sm:left-auto sm:right-6 sm:inset-x-auto mx-auto safe-bottom animate-slide-up">
      <button
        onClick={onAbrir}
        className="w-full flex items-center justify-between gap-4
                   text-white px-5 py-4 rounded-2xl
                   transition-all duration-200 active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #ff3dac, #a855f7, #6b35b8)',
          boxShadow: '0 8px 30px #ff3dac55, 0 4px 15px #a855f744',
        }}
        aria-label="Ver carrito"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 flex items-center justify-center
                           rounded-full font-body text-xs font-black border-2 border-white/50
                           bg-fiesta-yellow text-ink-900">
            {cantidadTotal}
          </span>
          <span className="font-body font-black text-sm">🛒 Ver mi pedido</span>
        </div>
        <span className="font-body font-black text-base">
          {SIMBOLO_MONEDA}{total.toFixed(2)}
        </span>
      </button>
    </div>
  );
}
