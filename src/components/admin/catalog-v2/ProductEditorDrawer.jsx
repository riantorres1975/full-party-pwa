import { useEffect, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  PackageOpen,
  Save,
  Store,
  X,
} from 'lucide-react';
import {
  createAdminProductDraft,
  getAdminProductReadiness,
  PRODUCT_GROUP_MODES,
  validateAdminProductPayload,
} from '../../../services/catalog/adminProductModel.js';
import { slugifyCatalogValue } from '../../../services/catalog/adminCatalogModel.js';
import {
  InventoryStep,
  PricingStep,
  VariantsStep,
} from './ProductCommercialSections.jsx';

const STEPS = [
  { id: 'general', label: 'Informacion', icon: PackageOpen },
  { id: 'variants', label: 'Variantes', icon: Boxes },
  { id: 'commercial', label: 'Precios', icon: CircleDollarSign },
  { id: 'inventory', label: 'Inventario', icon: Store },
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
  lookups,
  saving,
  canEdit,
  canDelete,
  onSave,
  commercialActions,
  onClose,
}) {
  const [step, setStep] = useState('general');
  const [draft, setDraft] = useState(() => buildDraft(product));
  const [errors, setErrors] = useState({});
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  const readiness = getAdminProductReadiness(product);

  useEffect(() => {
    setDraft(buildDraft(product));
    setErrors({});
    setStep('general');
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
    await onSave(result.payload, product?.id ?? null);
  };

  const inputClass = 'w-full rounded-xl border border-admin-border bg-admin-input px-3 py-2.5 text-sm text-admin-text outline-none focus:border-fiesta-magenta';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#120720]/55 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="product-editor-title">
      <div className="flex h-full w-full max-w-4xl flex-col border-l border-admin-border bg-admin-card shadow-2xl">
        <header className="border-b border-admin-border px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fiesta-magenta">Editor de producto</p>
              <h2 id="product-editor-title" className="mt-1 truncate text-xl font-black text-admin-text">
                {product?.name || 'Nuevo producto'}
              </h2>
              {product && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-admin-elevated">
                    <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-600" style={{ width: `${readiness.percent}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-admin-muted">{readiness.percent}% listo</span>
                </div>
              )}
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-admin-muted hover:bg-admin-elevated" aria-label="Cerrar editor">
              <X size={20} />
            </button>
          </div>
          <nav aria-label="Secciones del producto" className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {STEPS.map((item) => {
              const Icon = item.icon;
              const active = step === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setStep(item.id)} disabled={!product && item.id !== 'general'} className={`inline-flex min-w-max items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${active ? 'border-fiesta-magenta/40 bg-fiesta-magenta/10 text-fiesta-magenta' : 'border-admin-border text-admin-muted hover:bg-admin-elevated'} disabled:opacity-35`}>
                  <Icon size={14} /> {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {step === 'general' && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-xs font-black text-admin-text">Nombre *</span>
                    <input value={draft.name} onChange={(event) => update('name', event.target.value)} className={inputClass} />
                    {errors.name && <span className="mt-1 block text-[11px] font-bold text-red-500">{errors.name}</span>}
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-black text-admin-text">Slug *</span>
                    <input value={draft.slug} onChange={(event) => update('slug', event.target.value)} className={inputClass} />
                    {errors.slug && <span className="mt-1 block text-[11px] font-bold text-red-500">{errors.slug}</span>}
                  </label>
                  <RelationSelect label="Categoria" value={draft.category_id} options={lookups.categories} error={errors.category_id} required onChange={(value) => update('category_id', value)} />
                  <RelationSelect label="Marca" value={draft.brand_id} options={lookups.brands} onChange={(value) => update('brand_id', value)} />
                  <label>
                    <span className="mb-1.5 block text-xs font-black text-admin-text">Agrupacion publica</span>
                    <select value={draft.listing_group_mode} onChange={(event) => update('listing_group_mode', event.target.value)} className={inputClass}>
                      {PRODUCT_GROUP_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-black text-admin-text">Nuevo hasta</span>
                    <input type="date" value={draft.new_until || ''} onChange={(event) => update('new_until', event.target.value)} className={inputClass} />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 flex justify-between text-xs font-black text-admin-text">Descripcion corta <span className="font-normal text-admin-muted">{draft.short_description.length}/180</span></span>
                  <textarea rows={2} maxLength={180} value={draft.short_description} onChange={(event) => update('short_description', event.target.value)} className={`${inputClass} resize-none`} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black text-admin-text">Descripcion completa</span>
                  <textarea rows={5} value={draft.description} onChange={(event) => update('description', event.target.value)} className={`${inputClass} resize-none`} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black text-admin-text">Imagen principal</span>
                  <input type="url" value={draft.main_image_url} onChange={(event) => update('main_image_url', event.target.value)} className={inputClass} placeholder="https://..." />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-xs font-black text-admin-text">Titulo SEO</span>
                    <input maxLength={70} value={draft.seo_title} onChange={(event) => update('seo_title', event.target.value)} className={inputClass} />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-black text-admin-text">Descripcion SEO</span>
                    <input maxLength={170} value={draft.seo_description} onChange={(event) => update('seo_description', event.target.value)} className={inputClass} />
                  </label>
                </div>
              </div>

              <aside className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-bg/50">
                  <div className="aspect-square bg-admin-elevated">
                    {draft.main_image_url ? <img src={draft.main_image_url} alt="" className="h-full w-full object-contain p-5" /> : <div className="flex h-full items-center justify-center text-admin-inactive"><PackageOpen size={42} /></div>}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-black text-admin-text">{draft.name || 'Nombre del producto'}</p>
                    <p className="mt-1 text-[11px] text-admin-muted">{draft.short_description || 'La descripcion corta aparecera en la tarjeta.'}</p>
                  </div>
                </div>
                {[['featured', 'Producto destacado'], ['active', 'Publicado']].map(([name, label]) => (
                  <button key={name} type="button" onClick={() => update(name, !draft[name])} className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-xs font-black ${draft[name] ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'border-admin-border text-admin-muted'}`}>
                    {label}
                    {draft[name] ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
                  </button>
                ))}
              </aside>
            </div>
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
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-admin-border bg-admin-bg/70 px-5 py-4 sm:px-7">
          <p className="hidden text-[11px] text-admin-muted sm:block">Los precios e inventario se administran por variante y presentacion.</p>
          <button type="button" onClick={submit} disabled={!canEdit || saving || step !== 'general'} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-pink-500/20 disabled:cursor-not-allowed disabled:opacity-40">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar producto'}
          </button>
        </footer>
      </div>
    </div>
  );
}
