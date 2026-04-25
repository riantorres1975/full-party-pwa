import { useLanguage } from '../../../hooks/useLanguage';

export default function DataTableEmpty({ icon: Icon, title, description }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {Icon && (
        <Icon size={48} className="text-admin-muted mb-3" />
      )}
      <h3 className="text-lg font-body font-bold text-admin-text mb-1">
        {title || t('datatable.empty.title')}
      </h3>
      <p className="text-sm text-admin-text-secondary text-center max-w-xs">
        {description || t('datatable.empty.description')}
      </p>
    </div>
  );
}
