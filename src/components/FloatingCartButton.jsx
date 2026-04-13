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
          background: 'linear-gradient(135deg, #2563eb, #6366f1, #4338ca)',
          boxShadow: '0 8px 30px #2563eb44, 0 4px 15px #6366f133',
        }}
        aria-label={t('cart.viewCartAriaLabel')}
      >
        <div className="flex items-center gap-3">
          <span className="min-w-[28px] h-7 px-1.5 flex items-center justify-center
                           rounded-full font-body text-[12px] leading-none font-black tabular-nums border-2 border-white/55
                           bg-white text-[#2563eb]">
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
