import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { C } from '../../styles/tokens';

/** Ítem de FAQ con acordeón */
export default function FaqItem({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-faq-item" data-open={String(open)}>
      <button
        onClick={() => setOpen(v => !v)}
        className="lp-faq-question w-full text-left flex items-center justify-between gap-4"
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
        <p className="lp-faq-answer text-sm leading-relaxed" style={{ color: C.textBody }}>
          {respuesta}
        </p>
      )}
    </div>
  );
}
