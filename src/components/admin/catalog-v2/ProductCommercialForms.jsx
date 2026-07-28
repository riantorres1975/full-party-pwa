import { useState } from 'react';
import { CheckCircle2, Save, X } from 'lucide-react';
import {
  createInventoryDraft,
  createPresentationDraft,
  createPriceTierDraft,
  createVariantDraft,
  INVENTORY_POLICIES,
  PRESENTATION_TYPES,
  validateInventoryPayload,
  validatePresentationPayload,
  validatePriceTierPayload,
  validateVariantPayload,
} from '../../../services/catalog/adminCommercialModel.js';

const INPUT_CLASS = 'w-full rounded-xl border border-admin-border bg-admin-input px-3 py-2.5 text-sm text-admin-text outline-none focus:border-fiesta-magenta';

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-admin-text">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] font-bold text-red-500">{error}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, error, emptyLabel = 'Sin seleccionar' }) {
  return (
    <Field label={label} error={error}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={INPUT_CLASS}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </Field>
  );
}

function ActiveButton({ active, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-xs font-black ${
        active
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
          : 'border-admin-border text-admin-muted'
      }`}
    >
      Registro activo
      {active && <CheckCircle2 size={16} />}
    </button>
  );
}

function FormModal({ title, subtitle, saving, onClose, onSubmit, children }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[70] flex items-center justify-center bg-[#120720]/65 p-3 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-admin-border bg-admin-card shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-admin-border px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-fiesta-magenta">{subtitle}</p>
            <h3 className="mt-1 text-lg font-black text-admin-text">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-admin-muted hover:bg-admin-elevated" aria-label="Cerrar formulario">
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        <footer className="flex justify-end border-t border-admin-border bg-admin-bg/60 px-5 py-4">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function lookupOptions(items, labelKey = 'name') {
  return items.map((item) => ({ value: item.id, label: item[labelKey] }));
}

export function VariantFormModal({
  product,
  variant,
  lookups,
  saving,
  onSave,
  onClose,
}) {
  const [draft, setDraft] = useState(() => createVariantDraft(variant));
  const [errors, setErrors] = useState({});
  const update = (name, value) => {
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };
  const lines = lookups.lines.filter((line) => !product.brand_id || line.brand_id === product.brand_id);

  const submit = async (event) => {
    event.preventDefault();
    const result = validateVariantPayload(draft, product.id);
    if (!result.valid) return setErrors(result.errors);
    try {
      await onSave(result.payload, variant?.id ?? null);
      onClose();
    } catch {
      // The workspace already reports repository errors through its toast.
    }
  };

  return (
    <FormModal title={variant ? 'Editar variante' : 'Nueva variante'} subtitle={product.name} saving={saving} onClose={onClose} onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Gama o linea" value={draft.line_id} onChange={(value) => update('line_id', value)} options={lookupOptions(lines)} />
        <SelectField label="Color exacto" value={draft.color_id} onChange={(value) => update('color_id', value)} options={lookupOptions(lookups.colors, 'exact_name')} />
        <SelectField label="Medida" value={draft.size_id} onChange={(value) => update('size_id', value)} options={lookupOptions(lookups.sizes)} />
        <Field label="Acabado">
          <input value={draft.finish} onChange={(event) => update('finish', event.target.value)} className={INPUT_CLASS} placeholder="Mate, brillante..." />
        </Field>
        <Field label="SKU" error={errors.sku}>
          <input value={draft.sku} onChange={(event) => update('sku', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Codigo de barras">
          <input value={draft.barcode} onChange={(event) => update('barcode', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Imagen de la variante">
            <input type="url" value={draft.image_url} onChange={(event) => update('image_url', event.target.value)} className={INPUT_CLASS} placeholder="https://..." />
          </Field>
        </div>
        <SelectField label="Politica de inventario" value={draft.inventory_policy} onChange={(value) => update('inventory_policy', value)} options={INVENTORY_POLICIES} emptyLabel="Selecciona una politica" />
        <div className="self-end">
          <ActiveButton active={draft.active} onChange={(value) => update('active', value)} />
        </div>
      </div>
    </FormModal>
  );
}

export function PresentationFormModal({
  variant,
  presentation,
  saving,
  onSave,
  onClose,
}) {
  const [draft, setDraft] = useState(() => createPresentationDraft(presentation));
  const [errors, setErrors] = useState({});
  const availableParents = variant.presentations.filter((item) => item.id !== presentation?.id);
  const presentationPolicies = variant.inventory_policy === 'separate_by_presentation'
    ? INVENTORY_POLICIES.filter((policy) => policy.value === 'separate_by_presentation')
    : INVENTORY_POLICIES;

  const update = (name, value) => {
    setDraft((current) => {
      const next = { ...current, [name]: value };
      if (name === 'contained_quantity' && current.content_mode === 'direct') {
        next.base_units_total = value;
      }
      if (name === 'content_mode' && value === 'direct') {
        next.base_units_total = next.contained_quantity || 1;
      }
      if (name === 'contains_presentation_id' || name === 'contains_quantity') {
        const parentId = name === 'contains_presentation_id' ? value : current.contains_presentation_id;
        const quantity = Number(name === 'contains_quantity' ? value : current.contains_quantity);
        const parent = availableParents.find((item) => item.id === parentId);
        if (parent && quantity > 0) next.base_units_total = parent.base_units_total * quantity;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const result = validatePresentationPayload(draft, variant.id);
    if (!result.valid) return setErrors(result.errors);
    try {
      await onSave(variant.id, result.payload, presentation?.id ?? null);
      onClose();
    } catch {
      // The workspace already reports repository errors through its toast.
    }
  };

  return (
    <FormModal title={presentation ? 'Editar presentacion' : 'Nueva presentacion'} subtitle={variant.sku || 'Variante'} saving={saving} onClose={onClose} onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre *" error={errors.name}>
          <input value={draft.name} onChange={(event) => update('name', event.target.value)} className={INPUT_CLASS} placeholder="Bolsa de 100 piezas" />
        </Field>
        <SelectField label="Tipo *" value={draft.presentation_type} onChange={(value) => update('presentation_type', value)} options={PRESENTATION_TYPES.map((type) => ({ value: type, label: type }))} error={errors.presentation_type} emptyLabel="Selecciona un tipo" />
        <SelectField
          label="Forma del contenido"
          value={draft.content_mode}
          onChange={(value) => update('content_mode', value)}
          options={[
            { value: 'direct', label: 'Contiene unidades directamente' },
            { value: 'composed', label: 'Contiene otra presentacion' },
          ]}
          emptyLabel="Selecciona la forma"
        />
        <Field label="Unidad base">
          <input value={draft.base_unit} onChange={(event) => update('base_unit', event.target.value)} className={INPUT_CLASS} placeholder="pieza" />
        </Field>

        {draft.content_mode === 'direct' ? (
          <>
            <Field label="Cantidad contenida *" error={errors.contained_quantity}>
              <input type="number" min="0.001" step="0.001" value={draft.contained_quantity} onChange={(event) => update('contained_quantity', event.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Unidad contenida *" error={errors.contained_unit}>
              <input value={draft.contained_unit} onChange={(event) => update('contained_unit', event.target.value)} className={INPUT_CLASS} placeholder="pieza, lata, ml..." />
            </Field>
          </>
        ) : (
          <>
            <SelectField label="Presentacion contenida *" value={draft.contains_presentation_id} onChange={(value) => update('contains_presentation_id', value)} options={availableParents.map((item) => ({ value: item.id, label: item.name }))} error={errors.contains_presentation_id} />
            <Field label="Cantidad de presentaciones *" error={errors.contains_quantity}>
              <input type="number" min="0.001" step="0.001" value={draft.contains_quantity} onChange={(event) => update('contains_quantity', event.target.value)} className={INPUT_CLASS} />
            </Field>
          </>
        )}

        <Field label="Unidades base totales *" error={errors.base_units_total}>
          <input type="number" min="0.001" step="0.001" value={draft.base_units_total} onChange={(event) => update('base_units_total', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Precio normal *" error={errors.base_price}>
          <input type="number" min="0" step="0.01" value={draft.base_price} onChange={(event) => update('base_price', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Precio de comparacion">
          <input type="number" min="0" step="0.01" value={draft.compare_at_price} onChange={(event) => update('compare_at_price', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="SKU de presentacion">
          <input value={draft.sku} onChange={(event) => update('sku', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Codigo de barras">
          <input value={draft.barcode} onChange={(event) => update('barcode', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <SelectField label="Politica propia" value={draft.inventory_policy} onChange={(value) => update('inventory_policy', value)} options={presentationPolicies} emptyLabel="Heredar de la variante" />
        <Field label="Compra minima" error={errors.minimum_order_quantity}>
          <input type="number" min="1" step="1" value={draft.minimum_order_quantity} onChange={(event) => update('minimum_order_quantity', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Incremento" error={errors.quantity_step}>
          <input type="number" min="1" step="1" value={draft.quantity_step} onChange={(event) => update('quantity_step', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Compra maxima" error={errors.maximum_order_quantity}>
          <input type="number" min="1" step="1" value={draft.maximum_order_quantity} onChange={(event) => update('maximum_order_quantity', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Orden">
          <input type="number" step="1" value={draft.sort_order} onChange={(event) => update('sort_order', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <div className="self-end">
          <ActiveButton active={draft.active} onChange={(value) => update('active', value)} />
        </div>
      </div>
    </FormModal>
  );
}

export function PriceTierFormModal({
  presentation,
  tier,
  saving,
  onSave,
  onClose,
}) {
  const [draft, setDraft] = useState(() => createPriceTierDraft(tier));
  const [errors, setErrors] = useState({});
  const update = (name, value) => {
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };
  const submit = async (event) => {
    event.preventDefault();
    const result = validatePriceTierPayload(
      draft,
      presentation.id,
      presentation.tiers,
      tier?.id ?? null,
    );
    if (!result.valid) return setErrors(result.errors);
    try {
      await onSave(presentation.id, result.payload, tier?.id ?? null);
      onClose();
    } catch {
      // The workspace already reports repository errors through its toast.
    }
  };

  return (
    <FormModal title={tier ? 'Editar escalon' : 'Nuevo escalon'} subtitle={presentation.name} saving={saving} onClose={onClose} onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Desde *" error={errors.minimum_quantity}>
          <input type="number" min="1" step="1" value={draft.minimum_quantity} onChange={(event) => update('minimum_quantity', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Hasta" error={errors.maximum_quantity}>
          <input type="number" min="1" step="1" value={draft.maximum_quantity} onChange={(event) => update('maximum_quantity', event.target.value)} className={INPUT_CLASS} placeholder="Sin limite" />
        </Field>
        <Field label="Precio por presentacion *" error={errors.price_per_presentation}>
          <input type="number" min="0" step="0.01" value={draft.price_per_presentation} onChange={(event) => update('price_per_presentation', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Etiqueta">
          <input value={draft.label} onChange={(event) => update('label', event.target.value)} className={INPUT_CLASS} placeholder="Mayoreo" />
        </Field>
        <div className="sm:col-span-2">
          <ActiveButton active={draft.active} onChange={(value) => update('active', value)} />
        </div>
      </div>
    </FormModal>
  );
}

export function InventoryFormModal({
  product,
  row,
  initialVariant,
  lookups,
  saving,
  onSave,
  onClose,
}) {
  const [draft, setDraft] = useState(() => createInventoryDraft(row, initialVariant));
  const [errors, setErrors] = useState({});
  const selectedVariant = product.variants.find((variant) => variant.id === draft.variant_id);
  const separatePresentations = selectedVariant?.presentations?.filter(
    (presentation) =>
      (presentation.inventory_policy || selectedVariant.inventory_policy)
      === 'separate_by_presentation',
  ) ?? [];
  const update = (name, value) => {
    setDraft((current) => ({
      ...current,
      [name]: value,
      ...(name === 'variant_id' ? { sale_presentation_id: '' } : {}),
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };
  const submit = async (event) => {
    event.preventDefault();
    const result = validateInventoryPayload(draft, selectedVariant);
    if (!result.valid) return setErrors(result.errors);
    try {
      await onSave(result.payload, row?.id ?? null);
      onClose();
    } catch {
      // The workspace already reports repository errors through its toast.
    }
  };

  return (
    <FormModal title={row ? 'Editar inventario' : 'Nueva existencia'} subtitle={product.name} saving={saving} onClose={onClose} onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Variante *" value={draft.variant_id} onChange={(value) => update('variant_id', value)} options={product.variants.map((variant) => ({ value: variant.id, label: variant.sku || [variant.line?.name, variant.color?.exact_name, variant.size?.name].filter(Boolean).join(' - ') || 'Variante simple' }))} error={errors.variant_id} />
        <SelectField label="Sucursal *" value={draft.location_id} onChange={(value) => update('location_id', value)} options={lookupOptions(lookups.locations)} error={errors.location_id} />
        {separatePresentations.length > 0 && (
          <div className="sm:col-span-2">
            <SelectField label={`Presentacion inventariada${selectedVariant?.inventory_policy === 'separate_by_presentation' ? ' *' : ''}`} value={draft.sale_presentation_id} onChange={(value) => update('sale_presentation_id', value)} options={separatePresentations.map((item) => ({ value: item.id, label: item.name }))} error={errors.sale_presentation_id} emptyLabel={selectedVariant?.inventory_policy === 'separate_by_presentation' ? 'Selecciona una presentacion' : 'Unidades base compartidas'} />
          </div>
        )}
        <Field label="Existencia *" error={errors.quantity}>
          <input type="number" min="0" step="0.001" value={draft.quantity} onChange={(event) => update('quantity', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Cantidad reservada" error={errors.reserved_quantity}>
          <input type="number" min="0" step="0.001" value={draft.reserved_quantity} onChange={(event) => update('reserved_quantity', event.target.value)} className={INPUT_CLASS} />
        </Field>
        <p className="sm:col-span-2 rounded-xl bg-admin-bg px-3 py-2 text-[11px] text-admin-muted">
          {draft.sale_presentation_id
            ? 'La cantidad se expresa en numero de presentaciones.'
            : 'La cantidad se expresa en unidades base compartidas.'}
        </p>
      </div>
    </FormModal>
  );
}
