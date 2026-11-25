export default function PageHeader({ title, subtitle, actions, accent = false }) {
  return (
    <header className={`mb-5 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-admin-border bg-admin-card px-4 py-4 sm:items-center sm:gap-4 sm:px-6 sm:py-5 ${accent ? 'bg-gradient-to-br from-violet-500/10 to-transparent' : ''}`}>
      <div className="min-w-0">
        <h1 className="text-2xl font-black leading-tight tracking-tight text-admin-text sm:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-admin-muted">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex max-w-full flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
