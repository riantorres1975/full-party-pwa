import { useState } from 'react';
import { AlertTriangle, Check, Package, Pencil, Save, Trash2, X, Zap } from 'lucide-react';
import { SIMBOLO_MONEDA } from '../../../data/productos';
import Toggle from '../../ui/Toggle';

function ProductThumbnail({ url, name, sizeClass = 'w-14 h-14' }) {
  const [failedUrl, setFailedUrl] = useState('');
  const failed = Boolean(url) && failedUrl === url;

  return (
    <div className={`${sizeClass} rounded-xl overflow-hidden flex-shrink-0 bg-admin-elevated border border-admin-border flex items-center justify-center`}>
      {!url || failed ? (
        <Package size={22} className="text-ink-300" />
      ) : (
        <img
          key={url}
          src={url}
          alt={name || ''}
          className="w-full h-full object-contain"
          onError={() => setFailedUrl(url)}
        />
      )}
    </div>
  );
}

function StockBadge({ product, t }) {
  if (product.stock_ilimitado !== false) {
    return (
      <span className="inline-flex items-center w-fit gap-1 text-[10px] font-body font-bold text-ink-500 bg-ink-50 px-1.5 py-0.5 rounded border border-ink-100">
        <span className="text-xs leading-none">∞</span> {t('admin.catalog.unlimited')}
      </span>
    );
  }

  const lowStock = Number(product.stock_actual) <= Number(product.stock_minimo);
  return (
    <span className={`inline-flex items-center w-fit gap-1 text-[10px] font-body font-bold px-1.5 py-0.5 rounded border ${
      lowStock
        ? 'text-red-700 bg-red-50 border-red-200'
        : 'text-ink-600 bg-ink-50 border-ink-200'
    }`}>
      {lowStock && <AlertTriangle size={10} strokeWidth={2.5} />}
      {lowStock
        ? `${product.stock_actual} ${t('admin.catalog.low')}`
        : t('admin.catalog.inStock', { count: product.stock_actual })}
    </span>
  );
}

function QualityBadge({ quality, t }) {
  if (!quality) return null;

  const issueLabels = quality.issues
    .map((issue) => t(`admin.catalog.qualityIssue.${issue}`))
    .join(', ');
  if (quality.isComplete && !quality.hasDuplicates) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-body font-black text-emerald-700">
        <Check size={10} strokeWidth={3} />
        {t('admin.catalog.qualityReady')}
      </span>
    );
  }

  const isBlocked = !quality.isReadyToPublish;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-body font-black ${
        isBlocked
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
      title={issueLabels}
    >
      <AlertTriangle size={10} strokeWidth={2.5} />
      {isBlocked
        ? t('admin.catalog.qualityNeedsFix')
        : t('admin.catalog.qualityReview')}
    </span>
  );
}

function SelectionCheckbox({ product, selected, onToggle, t }) {
  return (
    <label className="relative inline-flex items-center justify-center cursor-pointer" onClick={event => event.stopPropagation()}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(product.id)}
        className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label={`${t('admin.catalog.selectProduct')} ${product.nombre}`}
      />
      <span className="w-5 h-5 rounded-md border-2 border-admin-border bg-admin-card peer-checked:bg-fiesta-magenta peer-checked:border-fiesta-magenta peer-focus-visible:ring-2 peer-focus-visible:ring-fiesta-magenta peer-focus-visible:ring-offset-2 flex items-center justify-center transition-colors">
        {selected && <Check size={13} strokeWidth={3} className="text-white" />}
      </span>
    </label>
  );
}

function QuickEditor({ product, saving, onSave, onCancel, t }) {
  const [price, setPrice] = useState(String(product.precio ?? ''));
  const [stock, setStock] = useState(String(product.stock_actual ?? 0));
  const tracksStock = product.stock_ilimitado === false;

  const handleSubmit = async event => {
    event.preventDefault();
    const parsedPrice = Number(String(price).replace(',', '.'));
    const parsedStock = Number(stock);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return;
    if (tracksStock && (!Number.isFinite(parsedStock) || parsedStock < 0)) return;
    await onSave(product, {
      precio: parsedPrice,
      ...(tracksStock ? { stock_actual: Math.floor(parsedStock) } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 rounded-xl border border-fiesta-magenta/25 bg-fiesta-magenta/5 p-3">
      <label className="min-w-0">
        <span className="block text-[10px] font-body font-black uppercase tracking-wide text-admin-muted mb-1">
          {t('admin.catalog.price')}
        </span>
        <div className="flex items-center rounded-lg border border-admin-border bg-admin-card focus-within:border-fiesta-magenta">
          <span className="pl-2 text-xs font-bold text-admin-muted">{SIMBOLO_MONEDA}</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={event => setPrice(event.target.value)}
            className="w-full min-w-0 bg-transparent px-1.5 py-2 text-sm font-body font-bold text-admin-text outline-none"
            aria-label={t('admin.catalog.price')}
          />
        </div>
      </label>
      <label className="min-w-0">
        <span className="block text-[10px] font-body font-black uppercase tracking-wide text-admin-muted mb-1">
          {t('admin.catalog.stock')}
        </span>
        <input
          type="number"
          min="0"
          step="1"
          value={tracksStock ? stock : ''}
          onChange={event => setStock(event.target.value)}
          disabled={!tracksStock}
          placeholder={t('admin.catalog.unlimited')}
          className="w-full rounded-lg border border-admin-border bg-admin-card px-2 py-2 text-sm font-body font-bold text-admin-text outline-none focus:border-fiesta-magenta disabled:text-admin-muted disabled:bg-admin-elevated"
          aria-label={t('admin.catalog.stock')}
        />
      </label>
      <div className="col-span-2 flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body font-bold text-admin-muted hover:bg-admin-elevated disabled:opacity-50"
        >
          <X size={14} />
          {t('admin.catalog.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body font-black text-white bg-fiesta-magenta hover:brightness-105 disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? t('admin.catalog.saving') : t('admin.catalog.save')}
        </button>
      </div>
    </form>
  );
}

function ProductActions({ product, deleting, onQuickEdit, onEdit, onDelete, canEdit, canDelete, t }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 mt-1">
      {canEdit && (
        <button
          type="button"
          onClick={() => onQuickEdit(product)}
          className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-body font-bold text-fiesta-magenta bg-fiesta-magenta/5 border border-fiesta-magenta/20 hover:bg-fiesta-magenta/10 active:scale-95"
          title={t('admin.catalog.quickEdit')}
        >
          <Zap size={13} />
          <span className="hidden xl:inline">{t('admin.catalog.quick')}</span>
        </button>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-body font-bold text-admin-text-secondary bg-admin-card border border-admin-border hover:bg-admin-elevated hover:text-admin-text active:scale-95"
        >
          <Pencil size={13} />
          {t('admin.catalog.edit')}
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(product)}
          disabled={deleting}
          className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-body font-bold text-rose-600 hover:bg-rose-50 active:scale-95 disabled:opacity-50"
        >
          <Trash2 size={13} />
          <span className="hidden xl:inline">{deleting ? '...' : t('admin.catalog.delete')}</span>
        </button>
      )}
    </div>
  );
}

export function CatalogCards({
  products,
  qualityById,
  selectable,
  selectedIds,
  onToggleSelection,
  editingId,
  savingId,
  deletingId,
  toggleId,
  onQuickEdit,
  onQuickSave,
  onCancelQuickEdit,
  onEdit,
  onDelete,
  onToggleAvailability,
  canEdit,
  canDelete,
  t,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-24">
      {products.map(product => (
        <article
          key={product.id}
          className={`relative bg-admin-card rounded-2xl border p-4 flex flex-col gap-3 transition-all hover:shadow-card-hover ${
            selectedIds.has(product.id) ? 'border-fiesta-magenta ring-2 ring-fiesta-magenta/10' : 'border-admin-border'
          }`}
        >
          {selectable && (
            <div className="absolute top-3 right-3 z-10">
              <SelectionCheckbox
                product={product}
                selected={selectedIds.has(product.id)}
                onToggle={onToggleSelection}
                t={t}
              />
            </div>
          )}

          <div className={`flex gap-3 min-w-0 items-start ${selectable ? 'pr-7' : ''}`}>
            <ProductThumbnail url={product.imagen_url} name={product.nombre} sizeClass="w-16 h-16" />
            <div className="min-w-0 flex-1">
              <p className="font-body font-black text-admin-text text-sm leading-snug line-clamp-2" title={product.nombre}>
                {product.nombre}
              </p>
              <p className="text-[11px] font-body text-admin-muted mt-1 line-clamp-1">
                {product.marca || t('admin.catalog.noBrand')}
                <span className="mx-1.5 text-ink-200">·</span>
                {product.tamano || t('admin.catalog.noSize')}
              </p>
              {editingId !== product.id && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-body font-black text-admin-text">
                    {SIMBOLO_MONEDA}{Number(product.precio).toFixed(2)}
                  </p>
                  <StockBadge product={product} t={t} />
                  <QualityBadge quality={qualityById?.get(String(product.id))} t={t} />
                </div>
              )}
            </div>
          </div>

          {editingId === product.id && (
            <QuickEditor
              product={product}
              saving={savingId === product.id}
              onSave={onQuickSave}
              onCancel={onCancelQuickEdit}
              t={t}
            />
          )}

          <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-admin-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-body font-bold text-admin-text-secondary">
                {product.activo !== false ? t('admin.catalog.active') : t('admin.catalog.hidden')}
              </span>
              {canEdit && (
                <Toggle
                  checked={product.activo !== false}
                  disabled={toggleId === product.id}
                  onChange={() => onToggleAvailability(product)}
                />
              )}
            </div>
            <ProductActions
              product={product}
              deleting={deletingId === product.id}
              onQuickEdit={onQuickEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
              canDelete={canDelete}
              t={t}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

export function CatalogTable({
  products,
  qualityById,
  selectable,
  selectedIds,
  onToggleSelection,
  onToggleAll,
  editingId,
  savingId,
  deletingId,
  toggleId,
  onQuickEdit,
  onQuickSave,
  onCancelQuickEdit,
  onEdit,
  onDelete,
  onToggleAvailability,
  canEdit,
  canDelete,
  t,
}) {
  const allSelected = products.length > 0 && products.every(product => selectedIds.has(product.id));

  return (
    <div className="rounded-2xl border border-admin-border bg-admin-card overflow-x-auto mb-24">
      <table className="w-full min-w-[900px] text-left">
        <thead className="bg-admin-elevated border-b border-admin-border">
          <tr className="text-[11px] uppercase tracking-wide text-admin-muted font-body font-black">
            {selectable && (
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="w-4 h-4 accent-fiesta-magenta cursor-pointer"
                  aria-label={t('admin.catalog.selectAll')}
                />
              </th>
            )}
            <th className="px-3 py-3">{t('admin.catalog.product')}</th>
            <th className="px-3 py-3">{t('filters.category')}</th>
            <th className="px-3 py-3">{t('admin.catalog.price')}</th>
            <th className="px-3 py-3">{t('admin.catalog.stock')}</th>
            <th className="px-3 py-3">{t('admin.catalog.status')}</th>
            <th className="px-3 py-3 text-right">{t('admin.catalog.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border-soft">
          {products.map(product => (
            <TableProductRows
              key={product.id}
              product={product}
              quality={qualityById?.get(String(product.id))}
              selectable={selectable}
              selected={selectedIds.has(product.id)}
              onToggleSelection={onToggleSelection}
              editing={editingId === product.id}
              saving={savingId === product.id}
              deleting={deletingId === product.id}
              toggling={toggleId === product.id}
              onQuickEdit={onQuickEdit}
              onQuickSave={onQuickSave}
              onCancelQuickEdit={onCancelQuickEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleAvailability={onToggleAvailability}
              canEdit={canEdit}
              canDelete={canDelete}
              t={t}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableProductRows({
  product,
  quality,
  selectable,
  selected,
  onToggleSelection,
  editing,
  saving,
  deleting,
  toggling,
  onQuickEdit,
  onQuickSave,
  onCancelQuickEdit,
  onEdit,
  onDelete,
  onToggleAvailability,
  canEdit,
  canDelete,
  t,
}) {
  return (
    <>
      <tr className={`hover:bg-admin-elevated/60 transition-colors ${selected ? 'bg-fiesta-magenta/5' : ''}`}>
        {selectable && (
          <td className="px-4 py-3">
            <SelectionCheckbox product={product} selected={selected} onToggle={onToggleSelection} t={t} />
          </td>
        )}
        <td className="px-3 py-3">
          <div className="flex items-center gap-3 min-w-[240px]">
            <ProductThumbnail url={product.imagen_url} name={product.nombre} sizeClass="w-11 h-11" />
            <div className="min-w-0">
              <p className="text-sm font-body font-black text-admin-text line-clamp-1">{product.nombre}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-[11px] text-admin-muted line-clamp-1">{product.marca || t('admin.catalog.noBrand')}</p>
                <QualityBadge quality={quality} t={t} />
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-sm font-body text-admin-text-secondary">{product.categoria || '—'}</td>
        <td className="px-3 py-3 text-sm font-body font-black text-admin-text">{SIMBOLO_MONEDA}{Number(product.precio).toFixed(2)}</td>
        <td className="px-3 py-3"><StockBadge product={product} t={t} /></td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            {canEdit && (
              <Toggle
                checked={product.activo !== false}
                disabled={toggling}
                onChange={() => onToggleAvailability(product)}
              />
            )}
            <span className="text-xs font-body font-bold text-admin-text-secondary">
              {product.activo !== false ? t('admin.catalog.active') : t('admin.catalog.hidden')}
            </span>
          </div>
        </td>
        <td className="px-3 py-3">
          <div className="flex justify-end gap-1">
            {canEdit && (
              <button type="button" onClick={() => onQuickEdit(product)} className="p-2 rounded-lg text-fiesta-magenta hover:bg-fiesta-magenta/10" title={t('admin.catalog.quickEdit')}>
                <Zap size={15} />
              </button>
            )}
            {canEdit && (
              <button type="button" onClick={() => onEdit(product)} className="p-2 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-elevated" title={t('admin.catalog.edit')}>
                <Pencil size={15} />
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={() => onDelete(product)} disabled={deleting} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50" title={t('admin.catalog.delete')}>
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="bg-fiesta-magenta/5">
          {selectable && <td />}
          <td colSpan={6} className="px-3 py-3">
            <div className="max-w-md">
              <QuickEditor product={product} saving={saving} onSave={onQuickSave} onCancel={onCancelQuickEdit} t={t} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
