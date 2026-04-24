import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Plus, Pencil, Check, X, Trash2 } from 'lucide-react';
import { categorias as categoriasDefault } from '../data/productos';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from './ui/ConfirmModal';

const triggerClass =
  'w-full bg-white rounded-2xl px-4 py-3 pr-10 text-sm font-body font-semibold ' +
  'text-ink-900 outline-none border-2 border-ink-200 ' +
  'focus:border-fiesta-magenta transition-colors flex items-center justify-between gap-2 text-left';

/**
 * Sustituye al <select> nativo: lista con altura máxima y scroll (no depende del overflow del padre).
 * @param {string} id — para asociar con <label htmlFor>
 * @param {string} value — id de categoría seleccionada
 * @param {(id: string) => void} onChange
 * @param {{ id: string, label: string }[]} [lista]
 * @param {{ id: string, label: string } | null} [opcionExtra]
 * @param {(value: string) => string | null | undefined} [onCreateOption]
 * @param {(id: string, nextLabel: string) => string | null | undefined} [onRenameOption]
 * @param {(id: string) => boolean | void} [onDeleteOption]
 * @param {(item: { id: string, label: string }) => boolean} [isOptionEditable]
 * @param {string} [searchPlaceholder]
 */
export default function SelectCategoria({
  id,
  value,
  onChange,
  lista = categoriasDefault,
  opcionExtra = null,
  onCreateOption = null,
  onRenameOption = null,
  onDeleteOption = null,
  isOptionEditable,
  searchPlaceholder = 'Buscar',
}) {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const {
    isOpen: confirmDeleteOpen,
    config: confirmDeleteConfig,
    confirm: confirmDelete,
    onConfirm: onConfirmDelete,
    onCancel: onCancelDelete,
  } = useConfirm();

  const [itemsLocales, setItemsLocales] = useState([]);

  useEffect(() => {
    const base = opcionExtra && !lista.some(c => c.id === opcionExtra.id)
      ? [opcionExtra, ...lista]
      : lista;
    setItemsLocales(base);
  }, [lista, opcionExtra]);

  const items = itemsLocales;

  const actual = items.find(c => c.id === value);
  const textoBoton = actual?.label ?? value ?? 'Selecciona categoría';

  const queryNormalizado = query.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!queryNormalizado) return items;
    return items.filter((item) => {
      const label = String(item.label || '').toLowerCase();
      const itemId = String(item.id || '').toLowerCase();
      return label.includes(queryNormalizado) || itemId.includes(queryNormalizado);
    });
  }, [items, queryNormalizado]);

  const existeExacto = items.some((item) => {
    const label = String(item.label || '').trim().toLowerCase();
    const itemId = String(item.id || '').trim().toLowerCase();
    return label === queryNormalizado || itemId === queryNormalizado;
  });
  const puedeAgregar = !!onCreateOption && queryNormalizado && !existeExacto;

  function updatePos() {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const viewportPadding = 8;
    const maxWidth = Math.max(220, window.innerWidth - viewportPadding * 2);
    const desiredWidth = Math.max(r.width, 260);
    const width = Math.min(desiredWidth, maxWidth);
    const maxLeft = window.innerWidth - viewportPadding - width;
    const left = Math.min(Math.max(r.left, viewportPadding), Math.max(viewportPadding, maxLeft));

    setPos({
      top: r.bottom + 4,
      left,
      width,
    });
  }

  useLayoutEffect(() => {
    if (!abierto) return;
    updatePos();
  }, [abierto]);

  useEffect(() => {
    if (abierto) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function onScrollOrResize() {
      updatePos();
    }
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [abierto]);

  useEffect(() => {
    function handlePointer(e) {
      const t = e.target;
      if (wrapRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setAbierto(false);
      setEditingId(null);
    }
    if (abierto) {
      document.addEventListener('mousedown', handlePointer);
      document.addEventListener('touchstart', handlePointer, { passive: true });
      return () => {
        document.removeEventListener('mousedown', handlePointer);
        document.removeEventListener('touchstart', handlePointer);
      };
    }
  }, [abierto]);

  function cerrarLista() {
    setAbierto(false);
    setEditingId(null);
    setEditingText('');
    setQuery('');
  }

  function seleccionar(idOpcion) {
    onChange(idOpcion);
    cerrarLista();
  }

  function agregarDesdeBusqueda() {
    const nuevoTexto = query.trim();
    if (!nuevoTexto || !onCreateOption) return;
    const nuevoId = onCreateOption(nuevoTexto) || nuevoTexto;
    setItemsLocales((prev) => {
      if (prev.some((item) => item.id === nuevoId)) return prev;
      return [...prev, { id: nuevoId, label: nuevoTexto }];
    });
    seleccionar(nuevoId);
  }

  function iniciarEdicion(item) {
    setEditingId(item.id);
    setEditingText(item.label);
  }

  function cancelarEdicion() {
    setEditingId(null);
    setEditingText('');
  }

  function guardarEdicion(item) {
    const textoFinal = editingText.trim();
    if (!textoFinal) return;

    let idFinal = item.id;
    if (onRenameOption) {
      idFinal = onRenameOption(item.id, textoFinal) || idFinal;
    }

    setItemsLocales((prev) => prev.map((opt) => (
      opt.id === item.id ? { ...opt, id: idFinal, label: textoFinal } : opt
    )));

    if (value === item.id && idFinal !== item.id) {
      onChange(idFinal);
    }

    cancelarEdicion();
    setQuery('');
  }

  function optionEditable(item) {
    if (typeof isOptionEditable === 'function') return !!isOptionEditable(item);
    return item.id !== '';
  }

  async function eliminarOpcion(item) {
    if (!onDeleteOption || !optionEditable(item)) return;

    cerrarLista();

    const confirmado = await confirmDelete({
      title: 'Eliminar opción',
      message: `¿Seguro que quieres eliminar "${item.label}" de la lista?`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmado) return;

    const eliminado = onDeleteOption(item.id);
    if (eliminado === false) return;

    setItemsLocales((prev) => prev.filter((opt) => opt.id !== item.id));

    if (value === item.id) {
      const remaining = items.filter((opt) => opt.id !== item.id);
      onChange(remaining[0]?.id ?? '');
    }
  }

  const listaNode =
    abierto &&
    createPortal(
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby={id}
          className="fixed z-[9999] rounded-2xl border-2 bg-admin-card border-admin-border py-2 shadow-xl overflow-x-hidden"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.width,
            boxShadow: '0 12px 40px rgba(26, 7, 51, 0.15)',
          }}
        >
          <li className="px-2 pb-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-2">
              <Search size={16} className="text-ink-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && puedeAgregar) {
                    e.preventDefault();
                    agregarDesdeBusqueda();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    cerrarLista();
                  }
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent py-2 text-sm font-medium text-ink-900 placeholder:text-ink-400 outline-none"
              />
              {puedeAgregar && (
                <button
                  type="button"
                  onClick={agregarDesdeBusqueda}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Agregar opción"
                  aria-label="Agregar opción"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          </li>

          <li className="max-h-56 overflow-y-auto overflow-x-hidden overscroll-y-contain [scrollbar-width:thin] [scrollbar-color:rgba(107,53,184,0.35)_transparent]">
            {filteredItems.length === 0 && (
              <p className="px-4 py-3 text-xs font-medium text-ink-500">Sin coincidencias.</p>
            )}

            {filteredItems.map((item) => {
              const seleccionada = value === item.id;
              const enEdicion = editingId === item.id;
              const editable = optionEditable(item);

              return (
                <div key={item.id} className="flex min-w-0 items-center gap-1 px-1.5 py-0.5">
                  {enEdicion ? (
                    <>
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm font-medium text-ink-900 outline-none focus:border-fiesta-magenta"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            guardarEdicion(item);
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelarEdicion();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => guardarEdicion(item)}
                        className="shrink-0 p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50"
                        aria-label="Guardar cambio"
                        title="Guardar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelarEdicion}
                        className="shrink-0 p-1.5 rounded-md text-ink-500 hover:bg-ink-100"
                        aria-label="Cancelar edición"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        role="option"
                        aria-selected={seleccionada}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          seleccionar(item.id);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          seleccionar(item.id);
                        }}
                        className={`min-w-0 flex-1 text-left rounded-lg px-3 py-2 text-sm font-body font-semibold transition-colors
                                   hover:bg-purple-50 active:bg-purple-100 text-admin-text
                                   ${seleccionada ? 'bg-purple-100 text-admin-text-secondary' : ''}`}
                      >
                        <span className="block truncate">{item.label}</span>
                      </button>
                      {editable && (
                        <>
                          <button
                            type="button"
                            onClick={() => iniciarEdicion(item)}
                            className="shrink-0 p-1.5 rounded-md text-sky-600 hover:bg-sky-50"
                            aria-label={`Editar ${item.label}`}
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          {onDeleteOption && (
                            <button
                              type="button"
                              onClick={() => eliminarOpcion(item)}
                              className="shrink-0 p-1.5 rounded-md text-rose-600 hover:bg-rose-50"
                              aria-label={`Eliminar ${item.label}`}
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </li>
      </ul>,
      document.body
    );

  return (
    <div ref={wrapRef} className="relative min-w-0 w-full">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => {
          if (abierto) {
            cerrarLista();
          } else {
            setAbierto(true);
          }
        }}
        className={triggerClass}
      >
        <span className="truncate">{textoBoton}</span>
        <ChevronDown
          size={18}
          className={`text-ink-400 flex-shrink-0 transition-transform duration-200 ${
            abierto ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {listaNode}
      <ConfirmModal
        open={confirmDeleteOpen}
        title={confirmDeleteConfig.title}
        message={confirmDeleteConfig.message}
        confirmLabel={confirmDeleteConfig.confirmLabel}
        cancelLabel={confirmDeleteConfig.cancelLabel}
        variant={confirmDeleteConfig.variant}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </div>
  );
}
