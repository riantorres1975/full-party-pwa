import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export const CATEGORY_COLORS = [
  { bg: '#fce7f3', fg: '#be185d' },
  { bg: '#ede9fe', fg: '#6d28d9' },
  { bg: '#dbeafe', fg: '#1d4ed8' },
  { bg: '#dcfce7', fg: '#15803d' },
  { bg: '#fef3c7', fg: '#b45309' },
  { bg: '#cffafe', fg: '#0e7490' },
  { bg: '#ffe4e6', fg: '#be123c' },
  { bg: '#e0e7ff', fg: '#4338ca' },
  { bg: '#ffedd5', fg: '#c2410c' },
];

const CATEGORY_EMOJI = [
  { match: ['globo', 'balloon', 'foil', 'metalico', 'metálico'], emoji: '🎈' },
  { match: ['vela', 'candle'], emoji: '🕯️' },
  { match: ['cortina', 'lluvia'], emoji: '✨' },
  { match: ['guirnalda', 'banner', 'bandera'], emoji: '🎊' },
  { match: ['confeti', 'bazuca', 'canon', 'cañon', 'cañón'], emoji: '🎉' },
  { match: ['letra'], emoji: '🔤' },
  { match: ['numero', 'número'], emoji: '🔢' },
  { match: ['set', 'kit', 'paquete'], emoji: '🎁' },
  { match: ['cumple', 'pastel', 'pinata', 'piñata'], emoji: '🎂' },
  { match: ['boda', 'novia', 'novio'], emoji: '💍' },
  { match: ['graduacion', 'graduación'], emoji: '🎓' },
  { match: ['baby', 'bebe', 'bebé'], emoji: '🍼' },
  { match: ['plato', 'vaso', 'servilleta', 'mantel', 'desechable', 'cubierto', 'mesa'], emoji: '🍽️' },
  { match: ['dulce', 'dulcero', 'bolsa', 'sorpresa'], emoji: '🍬' },
  { match: ['luz', 'led', 'lampara', 'lámpara', 'neon', 'neón'], emoji: '💡' },
  { match: ['disfraz', 'mascara', 'máscara', 'antifaz', 'sombrero', 'gorro', 'corona'], emoji: '🎭' },
  { match: ['papel', 'crepe', 'pompon', 'pompón', 'abanico', 'flor'], emoji: '🌸' },
  { match: ['accesorio'], emoji: '🧰' },
];

export function getCategoryEmoji(label = '') {
  const normalized = String(label).toLowerCase();
  return CATEGORY_EMOJI.find(({ match }) => match.some(word => normalized.includes(word)))?.emoji || '🎀';
}

function CategoryArtwork({ category, color, compact }) {
  const imageUrl = typeof category.imagen === 'string' ? category.imagen.trim() : '';
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const showImage = imageUrl && imageUrl !== failedImageUrl;

  return (
    <span
      className={`relative mx-auto flex items-center justify-center overflow-hidden rounded-xl ${
        compact ? 'h-11 w-11 text-2xl' : 'h-14 w-14 text-[34px]'
      }`}
      style={{
        background: `linear-gradient(145deg, ${color.bg}, var(--surface-card))`,
        color: color.fg,
      }}
      aria-hidden="true"
      data-testid={showImage ? 'category-image' : 'category-icon'}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          width="112"
          height="112"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-1"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        getCategoryEmoji(category.label)
      )}
    </span>
  );
}

export function CategoryCard({ category, index = 0, onSelect, compact = false }) {
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(category)}
      data-testid="category-card"
      data-category-id={category.id}
      className="min-w-0 overflow-hidden rounded-xl p-2 text-center transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
      style={{
        height: compact ? 116 : 132,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-soft)',
        boxShadow: '0 2px 10px rgba(107,53,184,0.06)',
      }}
    >
      <CategoryArtwork category={category} color={color} compact={compact} />
      <span className="mt-2 block min-h-[32px] text-[11px] font-body font-black leading-tight text-ink-700 line-clamp-2">
        {category.label}
      </span>
      {category.count != null && (
        <span className="mt-0.5 block text-[10px] font-body font-bold text-ink-400">
          {category.count}
        </span>
      )}
    </button>
  );
}

export function CategoryGridSkeleton() {
  return (
    <section className="px-4 pb-2 pt-3 lg:hidden" aria-hidden="true">
      <div className="mb-2 flex h-[38px] items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-4 w-24 rounded-full bg-ink-100 skeleton-shimmer" />
          <div className="h-2.5 w-40 rounded-full bg-ink-100 skeleton-shimmer" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-ink-100 skeleton-shimmer" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="h-[132px] rounded-xl bg-ink-100 skeleton-shimmer" />
        ))}
      </div>

      <div className="mt-2 h-10 rounded-xl bg-ink-100 skeleton-shimmer" />
    </section>
  );
}

export default function CategoryGrid({ categories, totalCategories, onSelectCategory, onViewAll }) {
  const { t } = useLanguage();
  if (!categories?.length) return null;

  return (
    <section className="px-4 pt-3 pb-2 lg:hidden">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg leading-none text-ink-900">
            {t('categories.title')}
          </h2>
          <p className="mt-0.5 text-[11px] font-body font-bold text-ink-400">
            {t('categories.subtitle')}
          </p>
        </div>
        {totalCategories > categories.length && (
          <button
            type="button"
            onClick={onViewAll}
            className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-body font-black transition-all duration-200 active:scale-95"
            style={{
              color: 'var(--text-secondary)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-soft)',
            }}
          >
            {t('categories.viewAllShort', { count: totalCategories })}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {categories.slice(0, 9).map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            index={index}
            onSelect={onSelectCategory}
          />
        ))}
      </div>

      {totalCategories > categories.length && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-body font-black transition-all duration-200 active:scale-[0.98]"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--surface-card-alpha80)',
            border: '1px solid var(--border-soft)',
          }}
        >
          {t('categories.viewAll', { count: totalCategories })}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </section>
  );
}
