import { SIMBOLO_MONEDA } from '../data/productos';
import { useLanguage } from '../hooks/useLanguage';

export default function FloatingCartButton({ cantidadTotal, total, onAbrir }) {
  const { t } = useLanguage();
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
        aria-label={t('cart.viewCartAriaLabel')}
      >
        <div className="flex items-center gap-3">
          <span className="min-w-[28px] h-7 px-1.5 flex items-center justify-center
                           rounded-full font-body text-[12px] leading-none font-black tabular-nums border-2 border-white/55
                           bg-[#ffe55c] text-[#4b1d7a]">
            {cantidadTotal > 99 ? '99+' : cantidadTotal}
          </span>
          <span className="font-body font-black text-sm">{t('cart.viewCart')}</span>
        </div>
        <span className="font-body font-black text-base">
          {SIMBOLO_MONEDA}{total.toFixed(2)}
        </span>
      </button>
    </div>
  );
}
