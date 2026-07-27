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

function VariantLabel({ variant }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-black text-admin-text">
        {[variant.line?.name, variant.color?.exact_name, variant.size?.name]
          .filter(Boolean)
          .join(' · ') || 'Variante simple'}
      </p>
      <p className="mt-0.5 truncate text-[10px] text-admin-muted">
        {variant.sku || 'Sin SKU'} · {variant.inventory_policy === 'separate_by_presentation'
          ? 'Inventario por presentacion'
          : 'Unidades base compartidas'}
      </p>
    </div>
  );
}

function VariantsStep({ product }) {
  if (!product?.variants?.length) {
    return <EmptyStep text="Guarda el producto y agrega sus combinaciones reales en el siguiente bloque." />;
  }
  return (
    <div className="space-y-3">
      {product.variants.map((variant) => (
        <article key={variant.id} className="rounded-2xl border border-admin-border bg-admin-bg/55 p-4">
          <div className="flex items-center justify-between gap-3">
            <VariantLabel variant={variant} />
            <span className={`rounded-full px-2 py-1 text-[10px] font-black ${
              variant.active === false
                ? 'bg-admin-elevated text-admin-inactive'
                : 'bg-emerald-500/10 text-emerald-600'
            }`}>
              {variant.active === false ? 'Oculta' : 'Activa'}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-admin-card p-3">
              <p className="text-[10px] uppercase tracking-wide text-admin-muted">Presentaciones</p>
              <p className="mt-1 text-lg font-black text-admin-text">{variant.presentations.length}</p>
            </div>
            <div className="rounded-xl bg-admin-card p-3">
              <p className="text-[10px] uppercase tracking-wide text-admin-muted">Disponible</p>
              <p className="mt-1 text-lg font-black text-admin-text">
                {variant.inventory.reduce((sum, row) => sum + row.available_quantity, 0)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function CommercialStep({ product }) {
  const presentations = product?.variants?.flatMap((variant) =>
    variant.presentations.map((presentation) => ({ variant, presentation }))) ?? [];
  if (!presentations.length) return <EmptyStep text="Este producto aun no tiene presentaciones de venta." />;

  return (
    <div className="space-y-3">
      {presentations.map(({ variant, presentation }) => (
        <article key={presentation.id} className="rounded-2xl border border-admin-border bg-admin-bg/55 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-admin-text">{presentation.name}</p>
              <p className="mt-0.5 text-[10px] text-admin-muted">
                {presentation.base_units_total} {presentation.base_unit} · {variant.sku || 'Sin SKU'}
              </p>
            </div>
            <p className="text-lg font-black text-fiesta-magenta">
              ${presentation.base_price.toFixed(2)}
            </p>
          </div>
          {presentation.tiers.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-admin-border bg-admin-card">
              {presentation.tiers.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between border-b border-admin-border px-3 py-2 text-xs last:border-0">
                  <span className="text-admin-muted">
                    Desde {tier.minimum_quantity}{tier.maximum_quantity ? ` hasta ${tier.maximum_quantity}` : ''}
                  </span>
                  <span className="font-black text-admin-text">${tier.price_per_presentation.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function InventoryStep({ product }) {
  const rows = product?.variants?.flatMap((variant) =>
    variant.inventory.map((inventory) => ({ variant, inventory }))) ?? [];
  if (!rows.length) return <EmptyStep text="No hay existencias capturadas para este producto." />;
  return (
    <div className="space-y-2">
      {rows.map(({ variant, inventory }) => (
        <article key={inventory.id} className="grid grid-cols-[minmax(0,1fr)_70px_70px] items-center gap-3 rounded-xl border border-admin-border bg-admin-bg/55 p-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-admin-text">
              {inventory.location?.name || 'Sucursal'}
            </p>
            <p className="truncate text-[10px] text-admin-muted">
              {variant.sku || variant.color?.exact_name || 'Variante'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase text-admin-muted">Total</p>
            <p className="text-sm font-black text-admin-text">{inventory.quantity}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase text-admin-muted">Disponible</p>
            <p className="text-sm font-black text-emerald-600">{inventory.available_quantity}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyStep({ text }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-admin-border bg-admin-bg/40 px-6 text-center">
      <PackageOpen size={28} className="text-admin-inactive" />
      <p className="mt-3 max-w-sm text-sm font-bold text-admin-muted">{text}</p>
    </div>
  );
}

export default function ProductEditorDrawer({
  product,
  lookups,
  saving,
  canEdit,
  onSave,
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
  }, [product]);

  const update = (name, value) => {
    setDraft((current) => {
      const next = { ...current, [name]: value };
      if (name === 'name' && !slugTouched) next.slug = slugifyCatalogValue(value);
      return next;
    });
    if (name === 'slug') setSlugTouched(Boolean(value));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
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
      <form onSubmit={submit} className="flex h-full w-full max-w-4xl flex-col border-l border-admin-border bg-admin-card shadow-2xl">
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
          {step === 'variants' && <VariantsStep product={product} />}
          {step === 'commercial' && <CommercialStep product={product} />}
          {step === 'inventory' && <InventoryStep product={product} />}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-admin-border bg-admin-bg/70 px-5 py-4 sm:px-7">
          <p className="hidden text-[11px] text-admin-muted sm:block">Los precios e inventario se administran por variante y presentacion.</p>
          <button type="submit" disabled={!canEdit || saving || step !== 'general'} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-pink-500/20 disabled:cursor-not-allowed disabled:opacity-40">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar producto'}
          </button>
        </footer>
      </form>
    </div>
  );
}
