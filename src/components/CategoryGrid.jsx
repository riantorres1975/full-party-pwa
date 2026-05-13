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
  { match: ['globo', 'balloon'], emoji: '🎈' },
  { match: ['vela', 'candle'], emoji: '🕯️' },
  { match: ['cortina', 'lluvia'], emoji: '✨' },
  { match: ['guirnalda', 'banner'], emoji: '🎊' },
  { match: ['confeti', 'bazuca'], emoji: '🎉' },
  { match: ['letra'], emoji: '🔤' },
  { match: ['numero', 'número'], emoji: '🔢' },
  { match: ['set', 'kit'], emoji: '🎁' },
  { match: ['cumple'], emoji: '🎂' },
  { match: ['boda'], emoji: '💍' },
  { match: ['graduacion', 'graduación'], emoji: '🎓' },
  { match: ['accesorio'], emoji: '🧰' },
];

export function getCategoryEmoji(label = '') {
  const normalized = String(label).toLowerCase();
  return CATEGORY_EMOJI.find(({ match }) => match.some(word => normalized.includes(word)))?.emoji || '🎀';
}

export function CategoryCard({ category, index = 0, onSelect, compact = false }) {
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(category)}
      className="min-w-0 rounded-xl p-2 text-center transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-soft)',
        boxShadow: '0 2px 10px rgba(107,53,184,0.06)',
      }}
      aria-label={category.label}
    >
      <span
        className={`mx-auto flex items-center justify-center rounded-xl ${compact ? 'h-11 w-11 text-2xl' : 'h-14 w-14 text-[34px]'}`}
        style={{ background: color.bg, color: color.fg }}
        aria-hidden="true"
      >
        {getCategoryEmoji(category.label)}
      </span>
      <span className="mt-2 block min-h-[32px] text-[11px] font-body font-black leading-tight text-ink-700 line-clamp-2">
        {category.label}
      </span>
    </button>
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
