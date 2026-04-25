import { useState, useRef, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useBreadcrumbValue } from '../../contexts/BreadcrumbContext';

export default function Topbar() {
  const { t } = useLanguage();
  const breadcrumb = useBreadcrumbValue();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const shortcutLabel = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
    ? 'Cmd+K'
    : 'Ctrl+K';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  return (
    <div className="sticky top-0 z-20 bg-admin-card border-b border-admin-border">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 lg:px-5 lg:max-w-none">
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-body font-bold text-admin-muted uppercase tracking-wider">
              Admin
            </span>
            {breadcrumb.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <ChevronRight size={14} className="text-admin-muted" />
                <span className={`text-xs font-body font-bold ${
                  idx === breadcrumb.length - 1 ? 'text-admin-text' : 'text-admin-muted'
                }`}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Search + actions */}
        <div className="flex items-center gap-2">
          {/* Search button */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors"
              title={`${t('admin.topbar.search')} (${shortcutLabel})`}
            >
              <Search size={20} />
            </button>

            {/* Dropdown popover */}
            {searchOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-96 bg-admin-card border border-admin-border rounded-lg shadow-lg z-20 p-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t('admin.topbar.search')}
                      className="w-full bg-admin-input rounded-lg pl-9 pr-3 py-2 text-sm font-body font-semibold
                                 text-admin-text placeholder:text-admin-inactive outline-none border-2
                                 border-admin-border focus:border-fiesta-magenta transition-colors"
                    />
                  </div>
                  <div className="mt-3 text-xs font-body text-admin-muted text-center">
                    {t('admin.topbar.searchSoon')}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            className="px-3 py-2 rounded-lg text-sm font-body font-bold text-admin-text bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors"
            title={t('admin.topbar.new')}
          >
            {t('admin.topbar.new')}
          </button>
        </div>
      </div>
    </div>
  );
}
