export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-purple-50 border-2 border-purple-100 flex items-center justify-center mb-3">
          <Icon size={28} className="text-purple-300" />
        </div>
      )}
      <p className="font-body font-semibold text-xl text-admin-text-secondary">{title}</p>
      {description && (
        <p className="text-sm font-body text-admin-muted mt-1">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
