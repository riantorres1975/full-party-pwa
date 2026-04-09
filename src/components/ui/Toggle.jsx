export default function Toggle({ checked, onChange, disabled, id, size = 'md' }) {
  const sizes = {
    sm: { track: 'w-9 h-5', thumb: 'w-4 h-4', translate: 'translateX(1rem)' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translateX(1.25rem)' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative ${s.track} rounded-full flex-shrink-0 transition-colors duration-200
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-magenta focus-visible:ring-offset-2
                 disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{ background: checked ? '#22c55e' : '#d1d5db' }}
    >
      <span
        className={`absolute top-0.5 left-0.5 ${s.thumb} rounded-full bg-white shadow transition-transform duration-200`}
        style={{ transform: checked ? s.translate : 'translateX(0)' }}
      />
    </button>
  );
}
