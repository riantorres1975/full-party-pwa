import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Image,
  Pencil,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import Toggle from '../../ui/Toggle';
import {
  buildCategoryDraft,
  moveCategory,
} from '../../../utils/categoryConfig';

function uniqueCategoryImages(products, categoryId) {
  const seen = new Set();
  return (Array.isArray(products) ? products : [])
    .filter((product) => product.categoria === categoryId && product.imagen_url)
    .filter((product) => {
      const url = String(product.imagen_url).trim();
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

function CategoryPreview({ category, count }) {
  const imageUrl = category?.imageUrl || category?.fallbackImageUrl;

  return (
    <div className="mx-auto w-full max-w-[180px] rounded-2xl border border-admin-border bg-admin-card p-3 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            width="160"
            height="160"
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <Image size={28} className="text-purple-400" aria-hidden="true" />
        )}
      </div>
      <p className="mt-2 line-clamp-2 min-h-[32px] text-xs font-black leading-tight text-admin-text">
        {category?.label || category?.id}
      </p>
      <p className="mt-1 text-[10px] font-bold text-admin-muted">{count} productos</p>
      {category?.description && (
        <p className="mt-2 line-clamp-3 text-[10px] leading-snug text-admin-text-secondary">
          {category.description}
        </p>
      )}
    </div>
  );
}

export default function CategoryManagerModal({
  isOpen,
  categories,
  products,
  config,
  canEditCatalog,
  canDeleteCategory,
  canConfigure,
  saving,
  busyCategory,
  onClose,
  onSave,
  onRename,
  onDelete,
}) {
  const preparedDraft = useMemo(
    () => buildCategoryDraft(categories, products, config),
    [categories, config, products],
  );
  const [draft, setDraft] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [renameMode, setRenameMode] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDraft(preparedDraft);
    setSelectedId((current) => (
      preparedDraft.some(({ id }) => id === current)
        ? current
        : preparedDraft[0]?.id || ''
    ));
    setRenameMode(false);
  }, [isOpen, preparedDraft]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selected = draft.find(({ id }) => id === selectedId) || draft[0];
  const selectedIndex = draft.findIndex(({ id }) => id === selected?.id);
  const imageOptions = uniqueCategoryImages(products, selected?.id);
  const productCount = products.filter((product) => product.categoria === selected?.id).length;

  const updateSelected = (changes) => {
    if (!selected) return;
    setDraft((current) => current.map((item) => (
      item.id === selected.id ? { ...item, ...changes } : item
    )));
  };

  const handleRename = async () => {
    const nextName = renameValue.trim();
    if (!selected || !nextName || nextName === selected.id) {
      setRenameMode(false);
      return;
    }
    if (draft.some(({ id }) => id !== selected.id && id.toLowerCase() === nextName.toLowerCase())) {
      return;
    }

    const nextDraft = await onRename?.(selected.id, nextName, draft);
    if (Array.isArray(nextDraft)) {
      setDraft(nextDraft);
      setSelectedId(nextName);
      setRenameMode(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const nextDraft = await onDelete?.(selected.id, draft);
    if (Array.isArray(nextDraft)) {
      setDraft(nextDraft);
      setSelectedId(nextDraft[Math.max(0, selectedIndex - 1)]?.id || '');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(15, 3, 32, 0.62)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-manager-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-admin-border bg-admin-card shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-admin-border px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Tag size={20} />
            </span>
            <div className="min-w-0">
              <h2 id="category-manager-title" className="truncate text-base font-black text-admin-text sm:text-lg">
                Categorías del catálogo
              </h2>
              <p className="text-xs text-admin-muted">
                Ordena, personaliza y elige qué categorías verá el cliente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-admin-muted transition-colors hover:bg-admin-elevated hover:text-admin-text"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto border-b border-admin-border bg-admin-bg/60 p-3 md:border-b-0 md:border-r">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-admin-muted">
                {draft.length} categorías
              </span>
              <span className="text-[10px] text-admin-muted">Usa las flechas para ordenar</span>
            </div>

            <div className="space-y-2">
              {draft.map((category, index) => {
                const categoryCount = products.filter((product) => product.categoria === category.id).length;
                const imageUrl = category.imageUrl || category.fallbackImageUrl;
                const active = selected?.id === category.id;

                return (
                  <div
                    key={category.id}
                    className={`flex items-center gap-2 rounded-2xl border p-2 transition-colors ${
                      active
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-admin-border bg-admin-card hover:border-purple-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(category.id);
                        setRenameMode(false);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-admin-elevated">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-full w-full object-contain p-1" />
                        ) : (
                          <Image size={18} className="text-admin-muted" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-admin-text">
                          {category.label}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-admin-muted">
                          {category.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                          {category.visible ? 'Visible' : 'Oculta'} · {categoryCount}
                        </span>
                      </span>
                    </button>

                    <div className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        disabled={!canConfigure || index === 0}
                        onClick={() => setDraft((current) => moveCategory(current, category.id, -1))}
                        className="rounded p-1 text-admin-muted hover:bg-white hover:text-purple-600 disabled:opacity-25"
                        aria-label={`Subir ${category.label}`}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={!canConfigure || index === draft.length - 1}
                        onClick={() => setDraft((current) => moveCategory(current, category.id, 1))}
                        className="rounded p-1 text-admin-muted hover:bg-white hover:text-purple-600 disabled:opacity-25"
                        aria-label={`Bajar ${category.label}`}
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-4 sm:p-6">
            {!selected ? (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-admin-muted">
                No hay categorías disponibles.
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_210px]">
                <div className="space-y-5">
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-purple-500">
                          Categoría interna
                        </p>
                        <h3 className="text-lg font-black text-admin-text">{selected.id}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-admin-muted">
                          {selected.visible ? 'Visible' : 'Oculta'}
                        </span>
                        <Toggle
                          size="sm"
                          checked={selected.visible}
                          disabled={!canConfigure}
                          onChange={() => updateSelected({ visible: !selected.visible })}
                        />
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black text-admin-text">Nombre para clientes</span>
                      <input
                        type="text"
                        maxLength={80}
                        value={selected.label}
                        disabled={!canConfigure}
                        onChange={(event) => updateSelected({ label: event.target.value })}
                        className="w-full rounded-xl border border-admin-border bg-admin-bg px-3 py-2.5 text-sm text-admin-text outline-none transition-colors focus:border-purple-400 disabled:opacity-60"
                      />
                    </label>

                    <label className="mt-4 block">
                      <span className="mb-1.5 flex items-center justify-between text-xs font-black text-admin-text">
                        Descripción breve
                        <span className="font-normal text-admin-muted">{selected.description.length}/220</span>
                      </span>
                      <textarea
                        rows={3}
                        maxLength={220}
                        value={selected.description}
                        disabled={!canConfigure}
                        onChange={(event) => updateSelected({ description: event.target.value })}
                        placeholder="Ej. Globos resistentes para arcos, centros de mesa y decoraciones."
                        className="w-full resize-none rounded-xl border border-admin-border bg-admin-bg px-3 py-2.5 text-sm text-admin-text outline-none transition-colors focus:border-purple-400 disabled:opacity-60"
                      />
                    </label>
                  </section>

                  <section className="rounded-2xl border border-admin-border bg-admin-elevated p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Image size={17} className="text-purple-500" />
                      <div>
                        <h4 className="text-sm font-black text-admin-text">Imagen de portada</h4>
                        <p className="text-[11px] text-admin-muted">
                          Selecciona un producto representativo o conserva la opción automática.
                        </p>
                      </div>
                    </div>
                    <select
                      value={selected.imageUrl}
                      disabled={!canConfigure}
                      onChange={(event) => updateSelected({ imageUrl: event.target.value })}
                      className="w-full rounded-xl border border-admin-border bg-admin-card px-3 py-2.5 text-sm text-admin-text outline-none focus:border-purple-400 disabled:opacity-60"
                    >
                      <option value="">Automática · primer producto con imagen</option>
                      {imageOptions.map((product) => (
                        <option key={`${product.id}-${product.imagen_url}`} value={product.imagen_url}>
                          {product.nombre}
                        </option>
                      ))}
                    </select>
                    {imageOptions.length === 0 && (
                      <p className="mt-2 text-[11px] font-bold text-amber-600">
                        Esta categoría todavía no tiene productos con imagen.
                      </p>
                    )}
                  </section>

                  <section className="flex flex-wrap items-center gap-2 border-t border-admin-border pt-4">
                    {renameMode ? (
                      <>
                        <input
                          autoFocus
                          type="text"
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') handleRename();
                            if (event.key === 'Escape') setRenameMode(false);
                          }}
                          className="min-w-[220px] flex-1 rounded-xl border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-text outline-none focus:border-purple-400"
                        />
                        <button
                          type="button"
                          onClick={handleRename}
                          disabled={busyCategory === selected.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                        >
                          <Check size={15} /> Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenameMode(false)}
                          className="rounded-xl border border-admin-border px-3 py-2 text-xs font-black text-admin-muted"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={!canEditCatalog}
                          onClick={() => {
                            setRenameValue(selected.id);
                            setRenameMode(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-admin-border px-3 py-2 text-xs font-black text-admin-text transition-colors hover:border-purple-300 hover:text-purple-600 disabled:opacity-40"
                        >
                          <Pencil size={14} /> Renombrar categoría
                        </button>
                        <button
                          type="button"
                          disabled={!canDeleteCategory || busyCategory === selected.id}
                          onClick={handleDelete}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </>
                    )}
                  </section>
                </div>

                <aside className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 p-4">
                  <p className="mb-3 text-center text-[10px] font-black uppercase tracking-wider text-purple-500">
                    Vista previa móvil
                  </p>
                  <CategoryPreview category={selected} count={productCount} />
                  <p className="mt-3 text-center text-[10px] leading-snug text-admin-muted">
                    La descripción aparecerá al entrar a esta categoría.
                  </p>
                </aside>
              </div>
            )}
          </main>
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-admin-border bg-admin-bg/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[11px] text-admin-muted">
            {!canConfigure
              ? 'Solo un administrador puede cambiar la presentación pública.'
              : 'Los productos y sus categorías internas no cambian al guardar esta presentación.'}
          </p>
          <button
            type="button"
            disabled={!canConfigure || saving || draft.length === 0}
            onClick={() => onSave?.(draft)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-purple-200 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando…' : 'Guardar presentación'}
          </button>
        </footer>
      </div>
    </div>
  );
}
