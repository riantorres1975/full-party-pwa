import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

const SHOW_AFTER_PX = 700;

export default function CatalogBackToTop({ scrollRef }) {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;

    const isInternalScroll = /(auto|scroll|overlay)/.test(window.getComputedStyle(node).overflowY)
      && node.scrollHeight > node.clientHeight;
    const target = isInternalScroll ? node : window;
    const readScrollTop = () => (isInternalScroll ? node.scrollTop : window.scrollY);
    const updateVisibility = () => setVisible(readScrollTop() > SHOW_AFTER_PX);

    updateVisibility();
    target.addEventListener('scroll', updateVisibility, { passive: true });
    return () => target.removeEventListener('scroll', updateVisibility);
  }, [scrollRef]);

  const goToTop = () => {
    const node = scrollRef.current;
    node?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={goToTop}
      className={`absolute bottom-24 right-5 z-40 hidden min-h-11 items-center gap-2 rounded-full px-4 font-body text-xs font-black text-white shadow-lg transition-all duration-200 lg:flex ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--shadow-accent-soft)' }}
      aria-label={t('catalog.backToTop')}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
      {t('catalog.backToTop')}
    </button>
  );
}
