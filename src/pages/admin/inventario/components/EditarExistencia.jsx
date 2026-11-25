import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useDialogFocus } from '../../../../hooks/useDialogFocus';
import { useLanguage } from '../../../../hooks/useLanguage';
import { getAvailableStock, parseStockAmount } from '../../../../services/catalog/inventoryModel';

const formatStock = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 3 });
const inputStyle = 'w-full rounded-xl border border-admin-border bg-admin-input px-3 py-2.5 text-base font-bold text-admin-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-fiesta-magenta disabled:opacity-60';

export default function EditarExistencia({ producto, onClose, onSave }) {
  const { t } = useLanguage();
  const id = useId();
  const dialogRef = useRef(null);
  const stockRef = useRef(null);
  const minimumRef = useRef(null);
  const noticeRef = useRef(null);
  const savingRef = useRef(false);
  const [actual, setActual] = useState(producto);
  const [stock, setStock] = useState(String(producto.stock_actual));
  const [minimum, setMinimum] = useState(String(producto.stock_minimo));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [invalid, setInvalid] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  const close = () => { if (!savingRef.current) onClose(); };
  useDialogFocus({ open: true, containerRef: dialogRef, initialFocusRef: stockRef, onClose: close });
  useEffect(() => {
    if (!saving && notice) noticeRef.current?.focus();
  }, [notice, saving]);

  const amount = parseStockAmount(stock);
  const threshold = parseStockAmount(minimum);
  const stockChanged = amount !== actual.stock_actual;
  const minimumChanged = threshold !== actual.stock_minimo;

  function validateField(field, message, ref) {
    setInvalid({ field, message });
    ref.current?.focus();
  }

  async function submit(event) {
    event.preventDefault();
    if (savingRef.current || unavailable || (!stockChanged && !minimumChanged)) return;
    if (amount === null) return validateField('stock', t('inventario.editar.cantidadInvalida'), stockRef);
    if (amount < actual.stock_reservado) {
      return validateField('stock', t('inventario.editar.protegerReservas', { count: formatStock.format(actual.stock_reservado) }), stockRef);
    }
    if (threshold === null) return validateField('minimum', t('inventario.editar.cantidadInvalida'), minimumRef);

    setInvalid(null);
    setNotice('');
    savingRef.current = true;
    setSaving(true);
    const fields = {};
    if (stockChanged) fields.stock_actual = amount;
    if (minimumChanged) fields.stock_minimo = threshold;

    try {
      const { saved, current } = await onSave(actual, fields);
      if (saved) {
        onClose();
        return;
      }

      if (!current || current.location_id !== actual.location_id || current.variant_id !== actual.variant_id
        || current.sale_presentation_id !== actual.sale_presentation_id) {
        setUnavailable(true);
        setNotice(t('inventario.editar.noDisponible'));
        return;
      }

      setActual(current);
      if (!stockChanged) setStock(String(current.stock_actual));
      if (!minimumChanged) setMinimum(String(current.stock_minimo));
      setNotice(t('inventario.editar.conflicto'));
    } catch {
      setNotice(t('inventario.error'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-producto`} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-admin-border bg-admin-card shadow-elevated">
        <header className="flex items-start justify-between gap-4 border-b border-admin-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="text-lg font-black text-admin-text">{t('inventario.editar.titulo')}</h2>
            <p id={`${id}-producto`} className="mt-1 break-words text-sm font-bold text-admin-text-secondary">{actual.nombre}</p>
            <p className="mt-0.5 break-words text-xs text-admin-muted">{[actual.ubicacion, actual.presentacion, actual.sku && `SKU ${actual.sku}`].filter(Boolean).join(' · ')}</p>
          </div>
          <button type="button" disabled={saving} onClick={close} aria-label={t('common.close')} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-admin-muted hover:bg-admin-elevated disabled:opacity-50">
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        <form onSubmit={submit} className="space-y-4 p-4 sm:p-5">
          <dl className="grid grid-cols-3 gap-2 rounded-xl bg-admin-elevated px-3 py-2.5">
            <div>
              <dt className="text-xs font-semibold text-admin-muted">{t('inventario.editar.registrada')}</dt>
              <dd className="mt-0.5 break-all text-sm font-black text-admin-text">{formatStock.format(actual.stock_actual)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-admin-muted">{t('inventario.col.reservado')}</dt>
              <dd className="mt-0.5 break-all text-sm font-black text-admin-text">{formatStock.format(actual.stock_reservado)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-admin-muted">{t('inventario.col.disponible')}</dt>
              <dd className="mt-0.5 break-all text-sm font-black text-admin-text">{formatStock.format(actual.stock_disponible)}</dd>
            </div>
          </dl>

          {notice && <p ref={noticeRef} tabIndex={-1} role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-950">{notice}</p>}

          <div>
            <label htmlFor={`${id}-stock`} className="mb-1 block text-sm font-bold text-admin-text">{t('inventario.col.stockActual')}</label>
            <input ref={stockRef} id={`${id}-stock`} inputMode="decimal" autoComplete="off" value={stock} onChange={event => { setStock(event.target.value); setInvalid(null); }} disabled={saving || unavailable} aria-invalid={invalid?.field === 'stock'} aria-describedby={invalid?.field === 'stock' ? `${id}-error` : `${id}-stock-help`} className={inputStyle} />
            <p id={`${id}-stock-help`} className="mt-1 text-xs text-admin-muted">
              {amount !== null && amount >= actual.stock_reservado
                ? t('inventario.editar.disponibleAlGuardar', { count: formatStock.format(getAvailableStock(amount, actual.stock_reservado)) })
                : t('inventario.editar.fisicaAyuda')}
            </p>
            {invalid?.field === 'stock' && <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-bold text-admin-text">{invalid.message}</p>}
          </div>
          <div>
            <label htmlFor={`${id}-minimum`} className="mb-1 block text-sm font-bold text-admin-text">{t('inventario.col.stockMinimo')}</label>
            <input ref={minimumRef} id={`${id}-minimum`} inputMode="decimal" autoComplete="off" value={minimum} onChange={event => { setMinimum(event.target.value); setInvalid(null); }} disabled={saving || unavailable} aria-invalid={invalid?.field === 'minimum'} aria-describedby={invalid?.field === 'minimum' ? `${id}-error` : `${id}-minimum-help`} className={inputStyle} />
            <p id={`${id}-minimum-help`} className="mt-1 text-xs text-admin-muted">{t('inventario.editar.minimoActual', { count: formatStock.format(actual.stock_minimo) })}</p>
            {invalid?.field === 'minimum' && <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-bold text-admin-text">{invalid.message}</p>}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-admin-border pt-3">
            <button type="button" disabled={saving} onClick={close} className="min-h-11 rounded-xl border border-admin-border px-4 text-sm font-bold text-admin-text hover:bg-admin-elevated disabled:opacity-50">{t('common.cancel')}</button>
            <button type="submit" disabled={saving || unavailable || (!stockChanged && !minimumChanged)} className="min-h-11 rounded-xl bg-violet-700 px-4 text-sm font-black text-white hover:bg-violet-800 disabled:opacity-45">{t(saving ? 'admin.catalog.saving' : 'inventario.editar.guardar')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
