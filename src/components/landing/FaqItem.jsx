import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C } from '../../styles/tokens';

/** Ítem de FAQ con acordeón */
export default function FaqItem({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: `${C.purple}22` }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left flex items-center justify-between py-4 gap-4"
        style={{ color: C.textHead }}
        aria-expanded={open}
      >
        <span className="font-bold text-sm">{pregunta}</span>
        <ChevronDown
          size={16}
          className="lp-faq-chevron flex-shrink-0"
          data-open={String(open)}
          style={{ color: C.pink }}
          aria-hidden="true"
        />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed" style={{ color: C.textBody }}>
          {respuesta}
        </p>
      )}
    </div>
  );
}
