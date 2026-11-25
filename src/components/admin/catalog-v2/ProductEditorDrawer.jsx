import { useEffect, useRef, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  PackageOpen,
  Save,
  Store,
  WandSparkles,
  X,
} from 'lucide-react';
import {
  createAdminProductDraft,
  PRODUCT_GROUP_MODES,
  validateAdminProductPayload,
} from '../../../services/catalog/adminProductModel.js';
import { slugifyCatalogValue } from '../../../services/catalog/adminCatalogModel.js';
import {
  InventoryStep,
  PricingStep,
  VariantsStep,
} from './ProductCommercialSections.jsx';
import ProductBulkTools from './ProductBulkTools.jsx';
import ConfirmModal from '../../ui/ConfirmModal';
import { useConfirm } from '../../../hooks/useConfirm';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

const STEPS = [
  { id: 'general', label: 'Datos del producto', icon: PackageOpen },
  { id: 'variants', label: 'Variantes', icon: Boxes },
  { id: 'commercial', label: 'Precios', icon: CircleDollarSign },
  { id: 'inventory', label: 'Inventario', icon: Store },
  { id: 'bulk', label: 'Masivo', icon: WandSparkles },
];

function buildDraft(product) {
  const draft = createAdminProductDraft();
  if (!product) return draft;
  for (const key of Object.keys(draft)) draft[key] = product[key] ?? draft[key];
  return draft;
}

function RelationSelect({ label, value, options, error, required, onChange }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black text-admin-text">
        {label}{required && <span className="text-fiesta-magenta"> *</span>}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border bg-admin-input px-3 py-2.5 text-sm text-admin-text outline-none ${
          error ? 'border-red-400' : 'border-admin-border focus:border-fiesta-magenta'
        }`}
      >
        <option value="">Sin seleccionar</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
      {error && <span className="mt-1 block text-[11px] font-bold text-red-500">{error}</span>}
    </label>
  );
}

export default function ProductEditorDrawer({
  product,
  initialStep = 'general',
  lookups,
  saving,
  canEdit,
  canDelete,
  onSave,
  commercialActions,
  onBulkApply,
  onClose,
}) {
  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState(() => buildDraft(product));
  const [errors, setErrors] = useState({});
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  const panelRef = useRef(null);
  const confirmingRef = useRef(false);
  const { isOpen, config, confirm, onConfirm, onCancel } = useConfirm();
  const dirty = canEdit && JSON.stringify(draft) !== JSON.stringify(buildDraft(product));

  const close = async () => {
    if (saving || confirmingRef.current) return;
    if (dirty) {
      confirmingRef.current = true;
      const accepted = await confirm({
        title: 'Descartar cambios del producto',
        message: 'Se perderán los cambios de la ficha que todavía no guardaste.',
        confirmLabel: 'Descartar cambios',
        variant: 'warning',
      });
      confirmingRef.current = false;
      if (!accepted) return;
    }
    onClose();
  };

  useFocusTrap(panelRef, true, 'first', close);

  useEffect(() => {
    setDraft(buildDraft(product));
    setErrors({});
    setSlugTouched(Boolean(product?.slug));
  }, [product?.id]);

  const update = (name, value) => {
    setDraft((current) => {
      const next = { ...current, [name]: value };
      if (name === 'name' && !slugTouched) next.slug = slugifyCatalogValue(value);
      return next;
    });
    if (name === 'slug') setSlugTouched(Boolean(value));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async () => {
    const result = validateAdminProductPayload(draft);
    if (!result.valid) {
      setErrors(result.errors);
      setStep('general');
      return;
    }
    const saved = await onSave(result.payload, product?.id ?? null);
    if (saved) {
      setDraft(buildDraft(saved));
      if (!product) setStep('variants');
    }
  };

  const inputClass = 'w-full rounded-xl border border-admin-border bg-admin-input px-3 py-2.5 text-sm text-admin-text outline-none focus:border-fiesta-magenta';

  return (
    <>
    <div className="fixed inset-0 z-50 flex justify-end bg-[#120720]/55 backdrop-blur-[2px]">
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="product-editor-title" className="flex h-full w-full max-w-4xl flex-col border-l border-admin-border bg-admin-card shadow-2xl">
        <header className="border-b border-admin-border px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="product-editor-title" className="break-words text-xl font-black text-admin-text">
                {product?.name || 'Nuevo producto con opciones'}
              </h2>
              {product && <p className="mt-1 text-sm font-bold text-admin-muted">{product.active ? 'Publicado' : 'Borrador'}</p>}
            </div>
            <button type="button" onClick={close} disabled={saving} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-admin-muted hover:bg-admin-elevated disabled:opacity-50" aria-label="Cerrar editor">
              <X size={20} />
            </button>
          </div>
          {product && (
            <nav aria-label="Secciones del producto" className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {STEPS.map((item) => {
                const Icon = item.icon;
                const active = step === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => setStep(item.id)} aria-pressed={active} disabled={saving || (!canEdit && item.id === 'bulk')} className={`inline-flex min-h-10 min-w-max items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${active ? 'border-violet-700 bg-violet-700 text-white' : 'border-admin-border text-admin-text-secondary hover:bg-admin-elevated'} disabled:opacity-50`}>
                    <Icon size={14} /> {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {step === 'general' && (
            <fieldset disabled={!canEdit || saving} className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-xs font-black text-admin-text">Nombre *</span>
                    <input value={draft.name} onChange={(event) => update('name', event.target.value)} className={inputClass} />
                    {errors.name && <span className="mt-1 block text-[11px] font-bold text-red-500">{errors.name}</span>}
                  </label>
                  <RelationSelect label="Categoría" value={draft.category_id} options={lookups.categories} error={errors.category_id} required onChange={(value) => update('category_id', value)} />
                  <RelationSelect label="Marca" value={draft.brand_id} options={lookups.brands} onChange={(value) => update('brand_id', value)} />
                </div>
                <label className="block">
                  <span className="mb-1.5 flex justify-between text-xs font-black text-admin-text">Descripción corta <span className="font-normal text-admin-muted">{draft.short_description.length}/180</span></span>
                  <textarea rows={2} maxLength={180} value={draft.short_description} onChange={(event) => update('short_description', event.target.value)} className={`${inputClass} resize-none`} />
                </label>
                <details open={errors.slug ? true : undefined} className="rounded-xl border border-admin-border p-3">
                  <summary className="cursor-pointer text-sm font-black text-admin-text">Más opciones del producto</summary>
                  <div className="mt-4 grid gap-4">
                    <label>
                      <span className="mb-1.5 block text-xs font-black text-admin-text">Dirección del producto</span>
                      <input value={draft.slug} onChange={(event) => update('slug', event.target.value)} className={inputClass} />
                      {errors.slug && <span className="mt-1 block text-[11px] font-bold text-red-500">{errors.slug}</span>}
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-black text-admin-text">Cómo mostrarlo en el catálogo</span>
                      <select value={draft.listing_group_mode} onChange={(event) => update('listing_group_mode', event.target.value)} className={inputClass}>
                        {PRODUCT_GROUP_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-black text-admin-text">Mostrar como nuevo hasta</span>
                      <input type="date" value={draft.new_until || ''} onChange={(event) => update('new_until', event.target.value)} className={inputClass} />
                    </label>
                    <label className="block">
                    <span className="mb-1.5 block text-xs font-black text-admin-text">Descripción completa</span>
                    <textarea rows={5} value={draft.description} onChange={(event) => update('description', event.target.value)} className={`${inputClass} resize-none`} />
                    </label>
                    <label className="block">
                    <span className="mb-1.5 block text-xs font-black text-admin-text">Enlace a la foto</span>
                    <input type="url" value={draft.main_image_url} onChange={(event) => update('main_image_url', event.target.value)} className={inputClass} placeholder="https://..." />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-xs font-black text-admin-text">Título para buscadores</span>
                      <input maxLength={70} value={draft.seo_title} onChange={(event) => update('seo_title', event.target.value)} className={inputClass} />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-black text-admin-text">Descripción para buscadores</span>
                      <input maxLength={170} value={draft.seo_description} onChange={(event) => update('seo_description', event.target.value)} className={inputClass} />
                    </label>
                    </div>
                  </div>
                </details>
              </div>

              <aside className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-bg/50">
                  <div className="aspect-square bg-admin-elevated">
                    {draft.main_image_url ? <img src={draft.main_image_url} alt="" className="h-full w-full object-contain p-5" /> : <div className="flex h-full items-center justify-center text-admin-inactive"><PackageOpen size={42} /></div>}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-black text-admin-text">{draft.name || 'Nombre del producto'}</p>
                    <p className="mt-1 text-[11px] text-admin-muted">{draft.short_description || 'La descripción corta aparecerá en la tarjeta.'}</p>
                  </div>
                </div>
                {[['featured', 'Producto destacado'], ['active', 'Publicado']].map(([name, label]) => (
                  <button key={name} type="button" aria-pressed={draft[name]} onClick={() => update(name, !draft[name])} className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-xs font-black ${draft[name] ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'border-admin-border text-admin-muted'}`}>
                    {label}
                    {draft[name] ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
                  </button>
                ))}
              </aside>
            </fieldset>
          )}
          {step === 'variants' && (
            <VariantsStep product={product} lookups={lookups} saving={saving} canEdit={canEdit} canDelete={canDelete} actions={commercialActions} />
          )}
          {step === 'commercial' && (
            <PricingStep product={product} saving={saving} canEdit={canEdit} canDelete={canDelete} actions={commercialActions} />
          )}
          {step === 'inventory' && (
            <InventoryStep product={product} lookups={lookups} saving={saving} canEdit={canEdit} canDelete={canDelete} actions={commercialActions} />
          )}
          {step === 'bulk' && (
            <ProductBulkTools
              product={product}
              lookups={lookups}
              saving={saving}
              onApply={onBulkApply}
            />
          )}
        </div>

        {canEdit && (step === 'general' || dirty) && (
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-admin-border bg-admin-bg/70 px-5 py-4 sm:px-7">
            {dirty && <p className="mr-auto text-xs font-bold text-admin-muted">Cambios sin guardar</p>}
            <button type="button" onClick={submit} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-black text-white hover:bg-violet-800 disabled:opacity-50">
              <Save size={16} aria-hidden="true" /> {saving ? 'Guardando…' : product ? 'Guardar cambios' : 'Guardar y configurar opciones'}
            </button>
          </footer>
        )}
      </div>
    </div>
    <ConfirmModal open={isOpen} {...config} onConfirm={onConfirm} onCancel={onCancel} />
    </>
  );
}
