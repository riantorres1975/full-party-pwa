import { ChevronRight } from 'lucide-react';
import { useBreadcrumbValue } from '../../contexts/BreadcrumbContext';

export default function Topbar() {
  const breadcrumb = useBreadcrumbValue();

  return (
    <div className="sticky top-0 z-20 bg-admin-card border-b border-admin-border">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 lg:px-5 lg:max-w-none">
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}
