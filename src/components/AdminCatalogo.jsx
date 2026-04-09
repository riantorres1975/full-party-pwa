import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Package, Pencil, Trash2, Search, AlertTriangle, Plus, X, Tag, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { guardedQuery } from '../lib/supabaseGuard';
import {
  SIMBOLO_MONEDA,
  registrarCategoria,
  registrarMarca,
  registrarTamano,
} from '../data/productos';
import {
  actualizarDisponibilidadProducto,
  eliminarProducto,
  renameCategoria,
  eliminarCategoria,
} from '../lib/productosAdmin';
import FormularioNuevoProducto from './FormularioNuevoProducto';
import ModalEditarProducto from './ModalEditarProducto';
import Toggle from './ui/Toggle';
import ConfirmModal from './ui/ConfirmModal';
import { useToast } from './ui/ToastProvider';
import { useConfirm } from '../hooks/useConfirm';
import { useDebounce } from '../hooks/useDebounce';

function MiniaturaProducto({ url, nombre }) {
  const [fallo, setFallo] = useState(false);
  if (!url || fallo) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Package size={24} className="text-ink-300" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={nombre || ''}
      className="w-full h-full object-cover"
      onError={() => setFallo(true)}
    />
  );
}

export default function AdminCatalogo() {
  const toast = useToast();
  const { isOpen: confirmOpen, config: confirmConfig, confirm: confirmDialog, onConfirm, onCancel } = useConfirm();
  const [creando, setCreando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const busqueda = useDebounce(busquedaInput, 300);
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [editando, setEditando] = useState(null);
  const [toggleId, setToggleId] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const PAGE_SIZE = 100;

  const fetchProductos = useCallback(async (page = 0, append = false) => {
    if (!append) setCargando(true);
    setErrorLista('');
    const from = page * PAGE_SIZE;
    const { data, error, count } = await guardedQuery((client) =>
      client
        .from('productos')
        .select('*', { count: 'exact' })
        .order('nombre', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)
    );

    if (error) {
      setErrorLista(error.message);
      if (!append) setProductos([]);
    } else {
      const lista = data ?? [];
      lista.forEach(p => {
        registrarCategoria(p.categoria);
        registrarMarca(p.marca);
        registrarTamano(p.tamano);
      });
      setProductos(prev => append ? [...prev, ...lista] : lista);
      setHayMas((count ?? 0) > from + PAGE_SIZE);
      setPagina(page);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const [showCatMgr, setShowCatMgr] = useState(false);
  const [catEditando, setCatEditando] = useState(null);
  const [catNuevoNombre, setCatNuevoNombre] = useState('');
  const [catGuardando, setCatGuardando] = useState(null);

  const productosEnAlerta = useMemo(() => {
    return productos.filter(p => p.stock_ilimitado === false && p.stock_actual <= (p.stock_minimo || 5));
  }, [productos]);

  const productosNuevos = useMemo(() => {
    return productos.filter(p => p.es_nuevo === true);
  }, [productos]);

  const todasCategorias = useMemo(() => {
    const seen = new Set();
    productos.forEach(p => { if (p.categoria) seen.add(p.categoria); });
    return Array.from(seen).sort();
  }, [productos]);

  const filtrados = useMemo(() => {
    let lista = productos;

    if (filtroActivo === 'stock-bajo') {
      lista = productosEnAlerta;
    } else if (filtroActivo === 'nuevo') {
      lista = productosNuevos;
    }

    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    
    return lista.filter(p => {
      const n = (p.nombre || '').toLowerCase();
      const m = (p.marca || '').toLowerCase();
      const t = (p.tamano || '').toLowerCase();
      const c = (p.categoria || '').toLowerCase();
      return n.includes(q) || m.includes(q) || t.includes(q) || c.includes(q);
    });
  }, [productos, busqueda, filtroActivo, productosEnAlerta, productosNuevos]);

  async function handleToggleDisponibilidad(p) {
    const siguiente = !p.activo;
    setProductos(prev => prev.map(x => (x.id === p.id ? { ...x, activo: siguiente } : x)));
    setToggleId(p.id);
    try {
      await actualizarDisponibilidadProducto(p.id, siguiente);
    } catch (err) {
      setProductos(prev => prev.map(x => (x.id === p.id ? { ...x, activo: p.activo } : x)));
      toast.error(err.message || 'No se pudo actualizar');
    } finally {
      setToggleId(null);
    }
  }

  async function handleEliminar(p) {
    const ok = await confirmDialog({
      title: '¿Eliminar producto?',
      message: `"${p.nombre}" se eliminará del catálogo. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    setEliminandoId(p.id);
    try {
      await eliminarProducto(p.id);
      setProductos(prev => prev.filter(x => x.id !== p.id));
      toast.success(`"${p.nombre}" eliminado`);
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar');
    } finally {
      setEliminandoId(null);
    }
  }

  async function handleRenameCategoria(vieja) {
    const nueva = catNuevoNombre.trim();
    if (!nueva || nueva === vieja) { setCatEditando(null); return; }
    setCatGuardando(vieja);
    try {
      await renameCategoria(vieja, nueva);
      setProductos(prev => prev.map(p => p.categoria === vieja ? { ...p, categoria: nueva } : p));
      toast.success(`Categoría renombrada a "${nueva}"`);
      setCatEditando(null);
      setCatNuevoNombre('');
    } catch (err) {
      toast.error(err.message || 'Error al renombrar');
    } finally {
      setCatGuardando(null);
    }
  }

  async function handleEliminarCategoria(nombre) {
    const ok = await confirmDialog({
      title: '¿Eliminar categoría?',
      message: `Los productos con la categoría "${nombre}" quedarán sin categoría. ¿Continuar?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    setCatGuardando(nombre);
    try {
      await eliminarCategoria(nombre);
      setProductos(prev => prev.map(p => p.categoria === nombre ? { ...p, categoria: null } : p));
      toast.success(`Categoría "${nombre}" eliminada`);
    } catch (err) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setCatGuardando(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 min-w-0">
      {/* Toolbar: buscador + botón nuevo */}
      <div className="animate-fade-in flex flex-col gap-4 min-h-0">
        <div className="flex gap-2 items-center shrink-0">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none"
            />
            <input
              type="search"
              value={busquedaInput}
              onChange={e => setBusquedaInput(e.target.value)}
              placeholder="Buscar por nombre, marca, tamaño o categoría…"
              className="w-full bg-admin-card rounded-2xl pl-12 pr-4 py-3 text-sm font-body font-semibold
                         text-admin-text placeholder:text-admin-inactive outline-none border-2 border-admin-border
                         focus:border-fiesta-magenta transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-body font-black
                       text-white transition-all duration-200 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)', boxShadow: '0 4px 14px #ff3dac33' }}
          >
            <Plus size={18} strokeWidth={3} />
            <span className="hidden sm:inline">Nuevo Artículo</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCatMgr(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-body font-black
                       border-2 transition-all duration-200 active:scale-95"
            style={{ borderColor: '#c084fc', color: '#7c3aed', background: '#faf5ff' }}
            title="Gestionar categorías"
          >
            <Tag size={18} />
            <span className="hidden sm:inline">Categorías</span>
          </button>
        </div>

            <div className="flex gap-2 overflow-x-auto pb-4 items-center">
              <button
                type="button"
                onClick={() => setFiltroActivo('todos')}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-body font-black border-2 transition-colors"
                style={filtroActivo === 'todos'
                  ? { background: '#6b35b8', color: 'white', borderColor: '#6b35b8' }
                  : { background: '#f3f4f6', color: '#6b7280', borderColor: '#e5e7eb' }}
              >
                Todos
              </button>

              <button
                type="button"
                onClick={() => setFiltroActivo('stock-bajo')}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-black border-2 transition-colors"
                style={filtroActivo === 'stock-bajo'
                  ? { background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }
                  : { background: 'white', color: '#dc2626', borderColor: '#fecaca' }}
              >
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Stock Bajo ({productosEnAlerta.length})
              </button>

              <button
                type="button"
                onClick={() => setFiltroActivo('nuevo')}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-black border-2 transition-colors"
                style={filtroActivo === 'nuevo'
                  ? { background: '#f0fdf4', color: '#166534', borderColor: '#86efac' }
                  : { background: 'white', color: '#16a34a', borderColor: '#bbf7d0' }}
              >
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Nuevos ({productosNuevos.length})
              </button>
            </div>

            {/* Modal gestión de categorías */}
            {showCatMgr && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => { if (e.target === e.currentTarget) { setShowCatMgr(false); setCatEditando(null); } }}>
                <div className="bg-admin-card border border-admin-border rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border shrink-0">
                    <div className="flex items-center gap-2">
                      <Tag size={18} className="text-purple-500" />
                      <h2 className="text-base font-body font-black text-admin-text">Gestionar Categorías</h2>
                    </div>
                    <button onClick={() => { setShowCatMgr(false); setCatEditando(null); setCatNuevoNombre(''); }} className="text-admin-muted hover:text-admin-text transition-colors" aria-label="Cerrar">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="overflow-y-auto px-4 py-3 space-y-2 flex-1">
                    {todasCategorias.length === 0 && (
                      <p className="text-sm text-admin-muted text-center py-6">No hay categorías todavía</p>
                    )}
                    {todasCategorias.map(cat => (
                      <div key={cat} className="flex items-center gap-2 bg-admin-elevated rounded-xl px-3 py-2 border border-admin-border">
                        {catEditando === cat ? (
                          <>
                            <input
                              autoFocus
                              type="text"
                              value={catNuevoNombre}
                              onChange={e => setCatNuevoNombre(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRenameCategoria(cat);
                                if (e.key === 'Escape') { setCatEditando(null); setCatNuevoNombre(''); }
                              }}
                              className="flex-1 bg-admin-card border border-admin-border rounded-lg px-2 py-1 text-sm font-body text-admin-text outline-none focus:border-purple-400"
                            />
                            <button
                              onClick={() => handleRenameCategoria(cat)}
                              disabled={catGuardando === cat}
                              className="shrink-0 text-emerald-600 hover:text-emerald-500 disabled:opacity-40 transition-colors"
                              aria-label="Confirmar"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => { setCatEditando(null); setCatNuevoNombre(''); }}
                              className="shrink-0 text-admin-muted hover:text-admin-text transition-colors"
                              aria-label="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-body font-bold text-admin-text truncate">{cat}</span>
                            <span className="text-xs text-admin-muted shrink-0">{productos.filter(p => p.categoria === cat).length} prod.</span>
                            <button
                              onClick={() => { setCatEditando(cat); setCatNuevoNombre(cat); }}
                              className="shrink-0 text-admin-muted hover:text-purple-500 transition-colors"
                              aria-label={`Renombrar ${cat}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleEliminarCategoria(cat)}
                              disabled={catGuardando === cat}
                              className="shrink-0 text-admin-muted hover:text-red-500 disabled:opacity-40 transition-colors"
                              aria-label={`Eliminar ${cat}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {cargando && (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 rounded-full border-[3px] border-admin-border border-t-fiesta-magenta animate-spin" />
                <span className="text-sm font-body font-bold text-admin-muted">Cargando inventario…</span>
              </div>
            )}

            {!cargando && errorLista && (
              <div className="bg-admin-card rounded-2xl p-5 border-2 border-red-100 text-center">
                <p className="text-sm font-body font-bold text-red-500">⚠️ {errorLista}</p>
                <button
                  type="button"
                  onClick={fetchProductos}
                  className="mt-3 text-xs font-body font-black text-admin-muted underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!cargando && !errorLista && filtrados.length === 0 && (
              <div className="text-center py-14 bg-admin-card rounded-2xl border-2 border-admin-border">
                <p className="text-3xl mb-2">📭</p>
                <p className="font-body font-bold text-admin-muted">
                  {busqueda ? 'Ningún producto coincide con la búsqueda.' : 'Sin productos aún.'}
                </p>
              </div>
            )}

            {!cargando && !errorLista && filtrados.length > 0 && (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto overscroll-y-contain min-h-0 pr-1 -mr-0.5
                           [scrollbar-width:thin] max-h-[calc(100dvh-15.5rem)] sm:max-h-[calc(100dvh-13rem)] pb-24"
              >
                {filtrados.map(p => (
                  <div
                    key={p.id}
                    className="bg-admin-card rounded-2xl border border-admin-border p-4 flex flex-col gap-4
                               transition-shadow hover:shadow-card-hover"
                  >
                    <div className="flex gap-3 min-w-0 items-start">
                      <div
                        className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-admin-elevated border border-admin-border
                                   flex items-center justify-center"
                      >
                        <MiniaturaProducto url={p.imagen_url} nombre={p.nombre} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body font-black text-admin-text text-sm leading-snug line-clamp-2" title={p.nombre}>
                          {p.nombre}
                        </p>
                        <p className="text-[11px] font-body text-admin-muted mt-1 line-clamp-1">
                          {p.marca ? (
                            <span>Marca: {p.marca}</span>
                          ) : (
                            <span className="text-ink-300">Sin marca</span>
                          )}
                          <span className="mx-1.5 text-ink-200">·</span>
                          {p.tamano ? (
                            <span>Tamaño: {p.tamano}</span>
                          ) : (
                            <span className="text-ink-300">Sin tamaño</span>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-body font-black text-admin-text">
                            {SIMBOLO_MONEDA}
                            {Number(p.precio).toFixed(2)}
                          </p>
                          {p.stock_ilimitado !== false ? (
                            <span className="inline-flex items-center w-fit gap-0.5 text-[10px] font-body font-bold text-ink-500 bg-ink-50 px-1.5 py-0.5 rounded border border-ink-100">
                              <span className="text-[12px] leading-none mb-[1px]">∞</span> Ilimitado
                            </span>
                          ) : (
                            Number(p.stock_actual) <= Number(p.stock_minimo) ? (
                              <span className="inline-flex items-center w-fit gap-1 text-[10px] font-body font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                <AlertTriangle size={10} strokeWidth={2.5} />
                                {p.stock_actual} Bajo
                              </span>
                            ) : (
                              <span className="inline-flex items-center w-fit gap-1 text-[10px] font-body font-bold text-ink-600 bg-ink-50 px-1.5 py-0.5 rounded border border-ink-200">
                                {p.stock_actual} en stock
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-admin-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-body font-bold text-admin-text-secondary">
                          {p.activo !== false ? 'Activo' : 'Oculto'}
                        </span>
                        <Toggle
                          checked={p.activo !== false}
                          disabled={toggleId === p.id}
                          onChange={() => handleToggleDisponibilidad(p)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setEditando(p)}
                          className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-body font-bold
                                     text-admin-text-secondary bg-admin-card border border-admin-border transition-colors hover:bg-admin-elevated hover:text-admin-text active:scale-95"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(p)}
                          disabled={eliminandoId === p.id}
                          className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-body font-bold
                                     text-rose-600 bg-admin-card transition-colors hover:bg-rose-50 hover:text-rose-700 active:scale-95 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          {eliminandoId === p.id ? '…' : 'Borrar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botón cargar más */}
            {!cargando && hayMas && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  type="button"
                  onClick={() => fetchProductos(pagina + 1, true)}
                  className="px-6 py-2.5 rounded-xl text-sm font-body font-bold text-admin-text-secondary
                             bg-admin-elevated hover:bg-admin-input border border-admin-border transition-colors"
                >
                  Cargar más productos
                </button>
              </div>
            )}
          </div>

      {/* Modal Nuevo Artículo */}
      {creando && createPortal(
        <div
          className="fixed inset-0 z-50 overflow-y-auto animate-fade-in"
          style={{ background: 'rgba(26, 7, 51, 0.55)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Nuevo artículo"
          onClick={(e) => { if (e.target === e.currentTarget) setCreando(false); }}
        >
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="relative w-full max-w-5xl bg-white sm:rounded-2xl shadow-2xl sm:my-4">
              <button
                type="button"
                onClick={() => setCreando(false)}
                className="sticky top-3 float-right mr-3 z-10 p-2 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-500 transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
              <FormularioNuevoProducto isModal onProductoCreado={() => { fetchProductos(); setCreando(false); }} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {editando && (
        <ModalEditarProducto
          producto={editando}
          onClose={() => setEditando(null)}
          onGuardado={() => {
            fetchProductos();
            setEditando(null);
          }}
        />
      )}
      <ConfirmModal
        open={confirmOpen}
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...confirmConfig}
      />
    </div>
  );
}
