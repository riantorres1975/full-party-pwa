export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1">
        <h1 className="text-2xl font-display font-black text-admin-text mb-1">{title}</h1>
        {subtitle && (
          <p className="text-sm font-body text-admin-muted">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
