import { useState } from 'react';
import { X, CheckCircle, CreditCard, Banknote, Smartphone, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

const METODOS = [
  { value: 'transferencia', icon: Smartphone },
  { value: 'efectivo',      icon: Banknote },
  { value: 'tarjeta',       icon: CreditCard },
  { value: 'otro',          icon: MoreHorizontal },
];

export default function ModalConfirmarPago({ pedido, onConfirm, onClose, guardando }) {
  const { t } = useLanguage();
  const [metodo, setMetodo] = useState(pedido?.metodo_pago || '');
  const [notas, setNotas] = useState(pedido?.pago_notas || '');

  if (!pedido) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ metodo_pago: metodo || null, notas: notas.trim() || null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-admin-card border border-admin-border shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <div>
              <p className="font-body font-bold text-admin-text text-sm">{t('pagos.modal.title')}</p>
              <p className="text-xs text-admin-muted font-body">{pedido.folio} · {pedido.cliente_nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-admin-muted hover:bg-admin-elevated transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Total */}
          <div className="rounded-xl bg-admin-elevated border border-admin-border px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-admin-muted font-body">{t('pagos.col.total')}</span>
            <span className="font-body font-black text-lg text-admin-text">
              ${Number(pedido.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Método de pago */}
          <div>
            <label className="text-xs font-body font-bold text-admin-muted uppercase tracking-wide mb-2 block">
              {t('pagos.modal.metodo')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {METODOS.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMetodo(metodo === value ? '' : value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-body font-bold transition-all ${
                    metodo === value
                      ? 'border-fiesta-magenta bg-fiesta-magenta/10 text-fiesta-magenta'
                      : 'border-admin-border bg-admin-elevated text-admin-muted hover:text-admin-text'
                  }`}
                >
                  <Icon size={15} />
                  {t(`pagos.metodo.${value}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-body font-bold text-admin-muted uppercase tracking-wide mb-2 block">
              {t('pagos.modal.notas')}
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder={t('pagos.modal.notasPlaceholder')}
              rows={2}
              className="w-full text-sm font-body bg-admin-elevated border border-admin-border rounded-xl px-3 py-2 text-admin-text placeholder-admin-muted resize-none focus:outline-none focus:border-fiesta-magenta transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-admin-border text-sm font-body font-bold text-admin-muted hover:text-admin-text hover:bg-admin-elevated transition-colors"
            >
              {t('pagos.modal.cancelar')}
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-body font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {guardando ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle size={15} />
              )}
              {t('pagos.modal.confirmar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
