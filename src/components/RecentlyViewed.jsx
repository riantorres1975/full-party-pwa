import { Clock3 } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { useLanguage } from '../hooks/useLanguage';

export default function RecentlyViewed({ products = [], onSelectProduct }) {
  const { t } = useLanguage();
  if (products.length === 0) return null;

  return (
    <section className="px-3 pt-2 sm:px-4 lg:flex lg:items-center lg:gap-2 lg:px-0 lg:pt-1.5" aria-labelledby="recently-viewed-title">
      <div className="mb-2 flex items-center gap-1.5 lg:mb-0 lg:flex-shrink-0">
        <Clock3 className="h-3.5 w-3.5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
        <h2
          id="recently-viewed-title"
          className="text-xs font-body font-black"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('catalog.recentlyViewed')}
        </h2>
      </div>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1 lg:min-w-0 lg:flex-1">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelectProduct?.(product)}
            className="flex min-h-14 min-w-[10.5rem] max-w-[12rem] items-center gap-2 rounded-xl border p-1.5 text-left transition-colors hover:bg-purple-50/50 focus-visible:ring-2 lg:min-h-12 lg:min-w-[9.5rem]"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--border-soft)',
            }}
            aria-label={t('catalog.openRecentProduct', { name: product.nombre })}
          >
            <OptimizedImage
              src={product.imagen_url}
              alt=""
              fallbackText={product.nombre}
              aspectClass="aspect-square"
              containerClass="h-11 w-11 flex-shrink-0 rounded-lg lg:h-10 lg:w-10"
              imgWidth={120}
              quality={70}
            />
            <span className="line-clamp-2 text-[11px] font-body font-black leading-tight text-ink-800">
              {product.nombre}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
