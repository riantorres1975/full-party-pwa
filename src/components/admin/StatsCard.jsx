export default function StatsCard({ label, value, trend, icon: Icon, variant = 'default', onClick }) {
  const variants = {
    default: { bg: '#f3e8ff', color: '#6b35b8' },
    success: { bg: '#dcfce7', color: '#22c55e' },
    warning: { bg: '#fef9c3', color: '#eab308' },
    danger: { bg: '#fee2e2', color: '#ef4444' },
    info: { bg: '#dbeafe', color: '#3b82f6' },
  };

  const style = variants[variant] || variants.default;

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-2xl p-4 text-left transition-all duration-200 active:scale-95 border overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.color}33`,
      }}
    >
      {/* Accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full" style={{ background: style.color }} />

      {/* Icon circle */}
      {Icon && (
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${style.color}11` }}>
          <Icon size={20} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-body font-black text-xl leading-none tabular-nums">{value}</p>
        <p className="text-xs font-body font-bold mt-0.5 truncate opacity-75">{label}</p>
      </div>

      {trend && (
        <div className="flex-shrink-0 text-xs font-body font-bold">{trend}</div>
      )}
    </button>
  );
}
