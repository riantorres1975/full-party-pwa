import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLanguage } from '../hooks/useLanguage';
import { CategoryCard } from './CategoryGrid';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function groupByLetter(categories) {
  return categories.reduce((acc, category) => {
    const first = normalizeText(category.label).charAt(0).toUpperCase() || '#';
    const letter = /[A-Z]/.test(first) ? first : '#';
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(category);
    return acc;
  }, {});
}

export default function CategoryBrowser({
  isOpen,
  categories,
  popularCategories,
  onClose,
  onSelectCategory,
}) {
  const [query, setQuery] = useState('');
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const { t } = useLanguage();
  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;
    document.documentElement.classList.add('overflow-hidden');
    const timeoutId = setTimeout(() => inputRef.current?.focus(), 180);
    return () => {
      clearTimeout(timeoutId);
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const filteredCategories = useMemo(() => {
    const q = normalizeText(query);
    const sorted = [...(categories || [])].sort((a, b) =>
      String(a.label || '').localeCompare(String(b.label || ''), 'es', { sensitivity: 'base' })
    );
    if (!q) return sorted;
    return sorted.filter(category => normalizeText(category.label).includes(q));
  }, [categories, query]);

  const popularIds = useMemo(
    () => new Set((popularCategories || []).map(category => category.id)),
    [popularCategories]
  );

  const alphabeticCategories = useMemo(
    () => filteredCategories.filter(category => query || !popularIds.has(category.id)),
    [filteredCategories, popularIds, query]
  );

  const grouped = useMemo(() => groupByLetter(alphabeticCategories), [alphabeticCategories]);
  const letters = Object.keys(grouped).sort();

  const handleSelect = (category) => {
    onSelectCategory?.(category);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={t('categories.browserTitle')}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <section
        ref={panelRef}
        className="absolute inset-x-0 bottom-0 top-0 flex flex-col overflow-hidden"
        style={{ background: 'var(--surface-primary)' }}
      >
        <div className="safe-top flex flex-shrink-0 items-center justify-between gap-3 border-b px-4 pb-3 pt-3"
             style={{ borderColor: 'var(--border-soft)' }}>
          <div className="min-w-0">
            <h2 className="font-display text-xl leading-tight text-ink-900">
              {t('categories.browserTitle')}
            </h2>
            <p className="text-xs font-body font-bold text-ink-400">
              {t('categories.browserSubtitle', { count: categories.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-ink-100"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-shrink-0 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={t('categories.searchPlaceholder', { count: categories.length })}
              className="w-full rounded-xl py-3 pl-10 pr-10 text-sm font-body font-bold outline-none transition-all"
              style={{
                background: 'var(--surface-input)',
                border: '1px solid var(--border-soft)',
                color: 'var(--text-primary)',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-400 transition-colors hover:text-fiesta-magenta"
                aria-label={t('common.clean')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] custom-scrollbar">
          {!query && popularCategories.length > 0 && (
            <section className="pb-4">
              <h3 className="mb-2 font-display text-base text-ink-900">
                {t('categories.popular')}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {popularCategories.slice(0, 8).map((category, index) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    index={index}
                    compact
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 font-display text-base text-ink-900">
              {query ? t('categories.searchResults') : t('categories.allAlphabetical')}
            </h3>

            {letters.length === 0 ? (
              <p className="rounded-xl px-4 py-8 text-center text-sm font-body font-bold text-ink-400"
                 style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)' }}>
                {t('search.noMatches')}
              </p>
            ) : (
              <div className="space-y-4">
                {letters.map(letter => (
                  <div key={letter}>
                    <div className="sticky top-0 z-10 mb-1 py-1 text-[11px] font-body font-black uppercase tracking-wider text-ink-400"
                         style={{ background: 'var(--surface-primary)' }}>
                      {letter}
                    </div>
                    <div className="overflow-hidden rounded-xl"
                         style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)' }}>
                      {grouped[letter].map(category => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleSelect(category)}
                          className="flex w-full items-center justify-between gap-3 border-b px-3.5 py-3 text-left last:border-b-0 transition-colors hover:bg-ink-50"
                          style={{ borderColor: 'var(--border-soft)' }}
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-body font-black text-ink-800">
                            {category.label}
                          </span>
                          <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-body font-black"
                                style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                            {t('categories.count', { count: category.count })}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
