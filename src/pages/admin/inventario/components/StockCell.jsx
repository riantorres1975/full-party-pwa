import { useState, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

export default function StockCell({ value, field, onCommit, disabled = false, min = 0 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);

  const commit = () => {
    const num = parseInt(draft, 10);
    const next = Number.isNaN(num) ? value : Math.max(min, num);
    setDraft(String(next));
    setEditing(false);
    if (next !== value) onCommit(next);
  };

  const adjust = (delta) => {
    const next = Math.max(min, value + delta);
    onCommit(next);
  };

  if (disabled) {
    return <span className="text-admin-muted text-sm font-body">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => adjust(-1)}
        className="w-6 h-6 flex items-center justify-center rounded-md text-admin-muted hover:bg-admin-elevated hover:text-admin-text transition-colors"
        aria-label="-1"
      >
        <Minus size={12} />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={draft}
          min={min}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
          }}
          className="w-14 text-center text-sm font-body font-bold text-admin-text bg-admin-bg border border-fiesta-magenta/50 rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-fiesta-magenta/40"
          autoFocus
        />
      ) : (
        <button
          onClick={() => { setDraft(String(value)); setEditing(true); }}
          className="w-14 text-center text-sm font-body font-bold text-admin-text hover:bg-admin-elevated rounded-md px-1 py-0.5 transition-colors"
          title="Click para editar"
        >
          {value}
        </button>
      )}

      <button
        onClick={() => adjust(+1)}
        className="w-6 h-6 flex items-center justify-center rounded-md text-admin-muted hover:bg-admin-elevated hover:text-admin-text transition-colors"
        aria-label="+1"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}
