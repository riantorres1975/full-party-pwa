import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useBreadcrumbValue } from '../../contexts/BreadcrumbContext';
import { useLanguage } from '../../hooks/useLanguage';
import { adminNavigation } from './adminNavigation';

export default function Topbar() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const breadcrumb = useBreadcrumbValue();
  const section = adminNavigation.find(item => item.path === pathname);
  const sectionLabel = section ? t(section.label) : breadcrumb?.at(-1);

  return (
    <header className="z-20 shrink-0 border-b border-admin-border bg-admin-card">
      <div className="mx-auto flex min-h-14 max-w-screen-2xl items-center justify-between gap-2 px-3 sm:px-4 lg:min-h-16 lg:px-6">
        <nav aria-label={t('admin.breadcrumb')} className="min-w-0">
          <ol className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold sm:gap-2 sm:text-sm">
            <li className="shrink-0">
              <Link to="/admin" className="text-admin-muted hover:text-admin-text hover:underline">Full Party</Link>
            </li>
            {sectionLabel && (
              <li aria-current="page" className="flex min-w-0 items-center gap-1.5 text-admin-text sm:gap-2">
                <ChevronRight size={14} className="shrink-0 text-admin-muted" aria-hidden="true" />
                <span className="truncate">{sectionLabel}</span>
              </li>
            )}
          </ol>
        </nav>
        <Link to="/catalogo" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-admin-border px-2.5 text-xs font-bold text-admin-text-secondary hover:bg-admin-elevated">
          {t('admin.publicCatalog')} <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
