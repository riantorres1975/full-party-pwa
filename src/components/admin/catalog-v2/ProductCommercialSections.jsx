import { useState } from 'react';
import {
  Boxes,
  Edit3,
  PackageOpen,
  Plus,
  Trash2,
  Warehouse,
} from 'lucide-react';
import {
  InventoryFormModal,
  PresentationFormModal,
  PriceTierFormModal,
  VariantFormModal,
} from './ProductCommercialForms.jsx';

function EmptyStep({ text, action }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-admin-border bg-admin-bg/40 px-6 text-center">
      <PackageOpen size={28} className="text-admin-inactive" />
      <p className="mt-3 max-w-sm text-sm font-bold text-admin-muted">{text}</p>
      {action}
    </div>
  );
}

function ActionButton({ label, onClick, icon: Icon = Plus }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-xl border border-fiesta-magenta/30 bg-fiesta-magenta/10 px-3 py-2 text-xs font-black text-fiesta-magenta hover:bg-fiesta-magenta/15">
      <Icon size={14} /> {label}
    </button>
  );
}

function IconButton({ label, onClick, danger = false, icon: Icon }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`rounded-lg p-2 ${danger ? 'text-admin-muted hover:bg-red-500/10 hover:text-red-500' : 'text-admin-muted hover:bg-admin-elevated hover:text-fiesta-magenta'}`}>
      <Icon size={14} />
    </button>
  );
}

export function VariantLabel({ variant }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-black text-admin-text">
        {[variant.line?.name, variant.color?.exact_name, variant.size?.name, variant.finish]
          .filter(Boolean)
          .join(' - ') || 'Variante simple'}
      </p>
      <p className="mt-0.5 truncate text-[10px] text-admin-muted">
        {variant.sku || 'Sin SKU'} - {variant.inventory_policy === 'separate_by_presentation'
          ? 'Inventario por presentacion'
          : 'Unidades base compartidas'}
      </p>
    </div>
  );
}

export function VariantsStep({
  product,
  lookups,
  saving,
  canEdit,
  canDelete,
  actions,
}) {
  const [variantForm, setVariantForm] = useState(null);
  const [presentationForm, setPresentationForm] = useState(null);

  const removeVariant = async (variant) => {
    if (!window.confirm('Eliminar esta variante y sus presentaciones, precios e inventario?')) return;
    try {
      await actions.deleteVariant(variant.id);
    } catch {
      // The workspace already reports repository errors through its toast.
    }
  };

  const removePresentation = async (presentation) => {
    if (!window.confirm(`Eliminar la presentacion "${presentation.name}" y sus precios?`)) return;
    try {
      await actions.deletePresentation(presentation.id);
    } catch {
      // The workspace already reports repository errors through its toast.
    }
  };

  const addVariantAction = canEdit
    ? <ActionButton label="Agregar variante" onClick={() => setVariantForm({ variant: null })} />
    : null;

  if (!product?.variants?.length) {
    return (
      <>
        <EmptyStep text="Agrega la primera combinacion real de este producto." action={addVariantAction} />
        {variantForm && (
          <VariantFormModal product={product} variant={variantForm.variant} lookups={lookups} saving={saving} onSave={actions.saveVariant} onClose={() => setVariantForm(null)} />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-admin-muted">{product.variants.length} combinaciones validas</p>
        {addVariantAction}
      </div>
      {product.variants.map((variant) => (
        <article key={variant.id} className="rounded-2xl border border-admin-border bg-admin-bg/55 p-4">
          <div className="flex items-start justify-between gap-3">
            <VariantLabel variant={variant} />
            <div className="flex shrink-0 items-center gap-1">
              <span className={`rounded-full px-2 py-1 text-[10px] font-black ${variant.active === false ? 'bg-admin-elevated text-admin-inactive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                {variant.active === false ? 'Oculta' : 'Activa'}
              </span>
              {canEdit && <IconButton label={`Editar ${variant.sku || 'variante'}`} icon={Edit3} onClick={() => setVariantForm({ variant })} />}
              {canDelete && <IconButton label={`Eliminar ${variant.sku || 'variante'}`} icon={Trash2} danger onClick={() => removeVariant(variant)} />}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-admin-border bg-admin-card">
            <div className="flex items-center justify-between border-b border-admin-border px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-admin-muted">Presentaciones</p>
              {canEdit && (
                <button type="button" onClick={() => setPresentationForm({ variant, presentation: null })} className="inline-flex items-center gap-1 text-[10px] font-black text-fiesta-magenta">
                  <Plus size={12} /> Agregar
                </button>
              )}
            </div>
            {variant.presentations.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-admin-muted">Sin formas de venta.</p>
            ) : variant.presentations.map((presentation) => (
              <div key={presentation.id} className="flex items-center justify-between gap-3 border-b border-admin-border px-3 py-2.5 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-admin-text">{presentation.name}</p>
                  <p className="text-[10px] text-admin-muted">{presentation.base_units_total} {presentation.base_unit} - ${presentation.base_price.toFixed(2)}</p>
                </div>
                <div className="flex shrink-0">
                  {canEdit && <IconButton label={`Editar ${presentation.name}`} icon={Edit3} onClick={() => setPresentationForm({ variant, presentation })} />}
                  {canDelete && <IconButton label={`Eliminar ${presentation.name}`} icon={Trash2} danger onClick={() => removePresentation(presentation)} />}
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}

      {variantForm && (
        <VariantFormModal product={product} variant={variantForm.variant} lookups={lookups} saving={saving} onSave={actions.saveVariant} onClose={() => setVariantForm(null)} />
      )}
      {presentationForm && (
        <PresentationFormModal variant={presentationForm.variant} presentation={presentationForm.presentation} saving={saving} onSave={actions.savePresentation} onClose={() => setPresentationForm(null)} />
      )}
    </div>
  );
}

export function PricingStep({
  product,
  saving,
  canEdit,
  canDelete,
  actions,
}) {
  const [presentationForm, setPresentationForm] = useState(null);
  const [tierForm, setTierForm] = useState(null);
  const presentations = product?.variants?.flatMap((variant) =>
    variant.presentations.map((presentation) => ({ variant, presentation }))) ?? [];

  const removeTier = async (tier) => {
    if (!window.confirm('Eliminar este escalon de precio?')) return;
    try {
      await actions.deletePriceTier(tier.id);
    } catch {
      // The workspace already reports repository errors through its toast.
    }
  };

  if (!presentations.length) {
    return <EmptyStep text="Agrega primero una presentacion desde la seccion Variantes." />;
  }

  return (
    <div className="space-y-4">
      {presentations.map(({ variant, presentation }) => (
        <article key={presentation.id} className="rounded-2xl border border-admin-border bg-admin-bg/55 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-admin-text">{presentation.name}</p>
              <p className="mt-0.5 text-[10px] text-admin-muted">
                {presentation.base_units_total} {presentation.base_unit} - {variant.sku || 'Sin SKU'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-black text-fiesta-magenta">${presentation.base_price.toFixed(2)}</p>
              {canEdit && <IconButton label={`Editar precio de ${presentation.name}`} icon={Edit3} onClick={() => setPresentationForm({ variant, presentation })} />}
            </div>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-admin-border bg-admin-card">
            <div className="flex items-center justify-between border-b border-admin-border px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-admin-muted">Precios por cantidad</p>
              {canEdit && (
                <button type="button" onClick={() => setTierForm({ presentation, tier: null })} className="inline-flex items-center gap-1 text-[10px] font-black text-fiesta-magenta">
                  <Plus size={12} /> Agregar escalon
                </button>
              )}
            </div>
            {presentation.tiers.length === 0 ? (
              <p className="px-3 py-3 text-xs text-admin-muted">Sin precio de mayoreo.</p>
            ) : presentation.tiers.map((tier) => (
              <div key={tier.id} className="flex items-center justify-between gap-3 border-b border-admin-border px-3 py-2 last:border-0">
                <span className="text-xs text-admin-muted">
                  Desde {tier.minimum_quantity}{tier.maximum_quantity ? ` hasta ${tier.maximum_quantity}` : ' en adelante'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-xs font-black text-admin-text">${tier.price_per_presentation.toFixed(2)}</span>
                  {canEdit && <IconButton label="Editar escalon" icon={Edit3} onClick={() => setTierForm({ presentation, tier })} />}
                  {canDelete && <IconButton label="Eliminar escalon" icon={Trash2} danger onClick={() => removeTier(tier)} />}
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}

      {presentationForm && (
        <PresentationFormModal variant={presentationForm.variant} presentation={presentationForm.presentation} saving={saving} onSave={actions.savePresentation} onClose={() => setPresentationForm(null)} />
      )}
      {tierForm && (
        <PriceTierFormModal presentation={tierForm.presentation} tier={tierForm.tier} saving={saving} onSave={actions.savePriceTier} onClose={() => setTierForm(null)} />
      )}
    </div>
  );
}

export function InventoryStep({
  product,
  lookups,
  saving,
  canEdit,
  canDelete,
  actions,
}) {
  const [inventoryForm, setInventoryForm] = useState(null);
  const rows = product?.variants?.flatMap((variant) =>
    variant.inventory.map((inventory) => ({ variant, inventory }))) ?? [];

  const removeInventory = async (row) => {
    if (!window.confirm('Eliminar esta existencia de la sucursal?')) return;
    try {
      await actions.deleteInventory(row.id);
    } catch {
      // The workspace already reports repository errors through its toast.
    }
  };

  const addAction = canEdit && product?.variants?.length
    ? <ActionButton label="Agregar existencia" icon={Warehouse} onClick={() => setInventoryForm({ row: null, variant: product.variants[0] })} />
    : null;

  if (!rows.length) {
    return (
      <>
        <EmptyStep text={product?.variants?.length ? 'Captura existencias por sucursal.' : 'Agrega primero una variante.'} action={addAction} />
        {inventoryForm && (
          <InventoryFormModal product={product} row={inventoryForm.row} initialVariant={inventoryForm.variant} lookups={lookups} saving={saving} onSave={actions.saveInventory} onClose={() => setInventoryForm(null)} />
        )}
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-admin-muted">{rows.length} registros por sucursal</p>
        {addAction}
      </div>
      {rows.map(({ variant, inventory }) => {
        const presentation = variant.presentations.find(
          (item) => item.id === inventory.sale_presentation_id,
        );
        return (
          <article key={inventory.id} className="grid grid-cols-[minmax(0,1fr)_70px_70px_auto] items-center gap-3 rounded-xl border border-admin-border bg-admin-bg/55 p-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-admin-text">{inventory.location?.name || 'Sucursal'}</p>
              <p className="truncate text-[10px] text-admin-muted">
                {variant.sku || variant.color?.exact_name || 'Variante'}
                {presentation ? ` - ${presentation.name}` : ''}
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
            <div className="flex">
              {canEdit && <IconButton label="Editar inventario" icon={Edit3} onClick={() => setInventoryForm({ row: inventory, variant })} />}
              {canDelete && <IconButton label="Eliminar inventario" icon={Trash2} danger onClick={() => removeInventory(inventory)} />}
            </div>
          </article>
        );
      })}

      {inventoryForm && (
        <InventoryFormModal product={product} row={inventoryForm.row} initialVariant={inventoryForm.variant} lookups={lookups} saving={saving} onSave={actions.saveInventory} onClose={() => setInventoryForm(null)} />
      )}
    </div>
  );
}
