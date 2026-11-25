import { useEffect, useRef, useState } from 'react';
import { Camera, PackagePlus, X } from 'lucide-react';

import { useDialogFocus } from '../../../hooks/useDialogFocus.js';
import {
  buildQuickProductRegistration,
  getQuickSaleLocations,
  QUICK_PHOTO_EXTENSIONS,
  QUICK_PRESENTATIONS,
} from '../../../services/catalog/adminQuickProduct.js';

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-base text-admin-text focus:border-fiesta-magenta focus:outline-none focus:ring-2 focus:ring-fiesta-magenta/30 disabled:opacity-60';
const BUTTON_CLASS = 'min-h-11 rounded-lg px-4 py-2.5 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-fiesta-magenta';

function Field({ name, label, error, children }) {
  return (
    <label className="grid content-start gap-1.5 text-sm font-bold text-admin-text">
      <span>{label}</span>
      {children}
      {error && <span id={`quick-error-${name}`} className="text-sm font-semibold text-red-500">{error}</span>}
    </label>
  );
}

export default function ProductQuickCreateDrawer({ lookups, onRegister, onAdvanced, onClose }) {
  const categories = lookups.categories.filter(({ active }) => active !== false);
  const locations = getQuickSaleLocations(lookups.locations);
  const [draft, setDraft] = useState(() => ({
    name: '', category: '', presentation: 'pieza', units: '', price: '', stock: '',
    location: locations.length === 1 ? locations[0].id : '',
    brand: '', description: '', photo: null, wholesale: false, wholesaleMin: '', wholesalePrice: '',
  }));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retryPending, setRetryPending] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const draftIdRef = useRef(null);
  const savingRef = useRef(false);
  const panelRef = useRef(null);
  const nameRef = useRef(null);
  const formRef = useRef(null);

  const close = () => {
    if (!savingRef.current) onClose();
  };
  useDialogFocus({ open: true, containerRef: panelRef, initialFocusRef: nameRef, onClose: close });

  useEffect(() => {
    if (!draft.photo || !QUICK_PHOTO_EXTENSIONS[draft.photo.type] || draft.photo.size > 5 * 1024 * 1024) {
      setPhotoPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(draft.photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [draft.photo]);

  const update = (name, value) => {
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError('');
  };

  const field = (name) => ({
    name,
    value: draft[name],
    onChange: (event) => update(name, event.target.value),
    className: INPUT_CLASS,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `quick-error-${name}` : undefined,
  });

  const submit = async (event) => {
    event.preventDefault();
    if (savingRef.current) return;

    draftIdRef.current ??= crypto.randomUUID();
    const productId = draftIdRef.current;
    const result = buildQuickProductRegistration(draft, productId, lookups);
    setErrors(result.errors);
    setSubmitError('');
    const firstError = Object.keys(result.errors)[0];
    if (firstError) {
      const input = formRef.current?.elements.namedItem(firstError);
      const options = input?.closest('details');
      if (options) options.open = true;
      input?.focus();
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await onRegister({ productId, product: result.product, row: result.row, photo: draft.photo });
    } catch (error) {
      const shouldRetry = retryPending || Boolean(error.readyToPublish);
      setRetryPending(shouldRetry);
      setSubmitError(shouldRetry
        ? 'Reintenta la publicación o cierra y revisa el estado del producto en la lista.'
        : error.message || 'No pudimos publicar el producto. Inténtalo de nuevo.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const presentationLabel = QUICK_PRESENTATIONS.find(({ value }) => value === draft.presentation)?.label.toLowerCase() || 'pieza';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#120720]/55" role="dialog" aria-modal="true" aria-labelledby="quick-product-title">
      <div ref={panelRef} tabIndex={-1} className="flex h-full w-full max-w-2xl min-w-0 flex-col bg-admin-card shadow-2xl">
        <header className="flex justify-between gap-4 border-b border-admin-border px-5 py-4 sm:px-7">
          <div>
            <h2 id="quick-product-title" className="text-2xl font-black text-admin-text">Nuevo producto</h2>
            <p className="mt-1 max-w-md text-sm text-admin-muted">Agrega un artículo con un precio y una forma de venta.</p>
          </div>
          <button type="button" onClick={close} disabled={saving} aria-label="Cerrar alta" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-admin-text hover:bg-admin-elevated disabled:opacity-50">
            <X size={22} />
          </button>
        </header>

        <form ref={formRef} className="flex min-h-0 flex-1 flex-col" onSubmit={submit} noValidate>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <fieldset disabled={saving || retryPending} className="grid min-w-0 gap-5 px-5 py-5 sm:px-7">
              <div className="grid gap-4">
                <Field name="name" label="Nombre del producto" error={errors.name}>
                  <input {...field('name')} ref={nameRef} required maxLength={120} placeholder="Ej. Vela de cumpleaños dorada" />
                </Field>
                <Field name="category" label="Categoría" error={errors.category}>
                  <select {...field('category')} required>
                    <option value="">Elige una categoría</option>
                    {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 border-t border-admin-border pt-5 sm:grid-cols-2">
                <Field name="presentation" label="¿Cómo lo vendes?" error={errors.presentation}>
                  <select {...field('presentation')}>
                    {QUICK_PRESENTATIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
                {draft.presentation !== 'pieza' && (
                  <Field name="units" label="Piezas que contiene" error={errors.units}>
                    <input {...field('units')} inputMode="numeric" required placeholder="Ej. 10" />
                  </Field>
                )}
                <Field name="price" label={`Precio por ${presentationLabel} (MXN)`} error={errors.price}>
                  <input {...field('price')} inputMode="decimal" required placeholder="Ej. 25.50" />
                </Field>
                <Field name="stock" label={draft.presentation === 'pieza' ? 'Piezas disponibles' : 'Envases o paquetes disponibles'} error={errors.stock}>
                  <input {...field('stock')} inputMode="numeric" required placeholder="Ej. 20" />
                </Field>
                <Field name="location" label="Sucursal con existencia" error={errors.location}>
                  <select {...field('location')} required>
                    <option value="">Elige una sucursal</option>
                    {locations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  {locations.length === 0 && <span className="font-normal text-admin-muted">Activa una sucursal de venta en Configuración.</span>}
                </Field>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-admin-border bg-admin-bg/45 p-4">
                {photoPreview
                  ? <img src={photoPreview} alt="Vista previa del producto" className="h-14 w-14 shrink-0 rounded-lg object-contain" />
                  : <Camera size={23} className="mt-0.5 shrink-0 text-admin-muted" aria-hidden="true" />}
                <div className="min-w-0 flex-1">
                  <Field name="photo" label="Foto del producto (opcional)" error={errors.photo}>
                    <input name="photo" type="file" accept={Object.keys(QUICK_PHOTO_EXTENSIONS).join(',')} onChange={(event) => update('photo', event.target.files?.[0] ?? null)} aria-invalid={errors.photo ? true : undefined} aria-describedby={errors.photo ? 'quick-error-photo' : undefined} className="w-full min-w-0 text-sm text-admin-muted file:mr-2 file:min-h-10 file:rounded-lg file:border-0 file:bg-admin-elevated file:px-3 file:font-bold file:text-admin-text" />
                  </Field>
                </div>
              </div>

              <details className="rounded-xl border border-admin-border p-4">
                <summary className="cursor-pointer py-1 text-sm font-black text-admin-text">Agregar marca, descripción o mayoreo</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field name="brand" label="Marca">
                    <select {...field('brand')}>
                      <option value="">Sin marca</option>
                      {lookups.brands.filter(({ active }) => active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </Field>
                  <Field name="description" label="Descripción corta">
                    <input {...field('description')} maxLength={180} />
                  </Field>
                  <label className="flex items-center gap-2 py-2 text-sm font-bold text-admin-text sm:col-span-2">
                    <input type="checkbox" checked={draft.wholesale} onChange={(event) => update('wholesale', event.target.checked)} />
                    Ofrecer un precio de mayoreo
                  </label>
                  {draft.wholesale && (
                    <>
                      <Field name="wholesaleMin" label="¿Desde cuántas se aplica?" error={errors.wholesaleMin}>
                        <input {...field('wholesaleMin')} inputMode="numeric" placeholder="Ej. 12" />
                      </Field>
                      <Field name="wholesalePrice" label={`Precio de mayoreo por ${presentationLabel} (MXN)`} error={errors.wholesalePrice}>
                        <input {...field('wholesalePrice')} inputMode="decimal" placeholder="Ej. 22.00" />
                      </Field>
                    </>
                  )}
                </div>
              </details>
            </fieldset>
          </div>

          <footer className="grid gap-2 border-t border-admin-border bg-admin-card px-5 py-3 sm:px-7">
            {submitError && <p role="alert" className="text-sm font-bold text-red-500">{submitError}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={onAdvanced} disabled={saving || retryPending} className={`${BUTTON_CLASS} text-admin-text underline underline-offset-4 disabled:opacity-50`}>
                Crear con colores o medidas
              </button>
              <button type="submit" disabled={saving} className={`${BUTTON_CLASS} inline-flex items-center gap-2 bg-[#a71962] text-white disabled:opacity-60`}>
                <PackagePlus size={18} aria-hidden="true" />
                {saving ? 'Publicando…' : retryPending ? 'Reintentar publicación' : 'Publicar producto'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
