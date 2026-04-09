import { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  SIMBOLO_MONEDA,
  registrarCategoria,
  registrarMarca,
  registrarTamano,
} from '../data/productos';
import {
  actualizarDisponibilidadProducto,
  eliminarProducto,
} from '../lib/productosAdmin';
import FormularioNuevoProducto from './FormularioNuevoProducto';
import ModalEditarProducto from './ModalEditarProducto';
import Toggle from './ui/Toggle';
import ConfirmModal from './ui/ConfirmModal';
import { useToast } from './ui/ToastProvider';
import { useConfirm } from '../hooks/useConfirm';

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
  const [pestana, setPestana] = useState('nuevo');
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [editando, setEditando] = useState(null);
  const [toggleId, setToggleId] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  const fetchProductos = useCallback(async () => {
    setCargando(true);
    setErrorLista('');
    const { data, error } = await supabase
      .from('productos')
      .select('id,nombre,descripcion,precio,imagen_url,categoria,marca,tamano,activo,es_nuevo,stock_ilimitado,stock_actual,precios_mayoreo,created_at')
      .order('nombre', { ascending: true });

    if (error) {
      setErrorLista(error.message);
      setProductos([]);
    } else {
      const lista = data ?? [];
      lista.forEach(p => {
        registrarCategoria(p.categoria);
        registrarMarca(p.marca);
        registrarTamano(p.tamano);
      });
      setProductos(lista);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const productosEnAlerta = useMemo(() => {
    return productos.filter(p => p.stock_ilimitado === false && p.stock_actual <= (p.stock_minimo || 5));
  }, [productos]);

  const filtrados = useMemo(() => {
    let lista = productos;

    if (filtroActivo === 'stock-bajo') {
      lista = productosEnAlerta;
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
  }, [productos, busqueda, filtroActivo, productosEnAlerta]);

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

  return (
    <div className="space-y-4 sm:space-y-5 min-w-0">
      {/* Pestañas — segmented control pill SaaS */}
      <div className="flex bg-admin-elevated rounded-xl p-1 border border-admin-border w-fit">
        {[{ key: 'nuevo', label: 'Nuevo Artículo' }, { key: 'inventario', label: 'Inventario' }].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setPestana(tab.key)}
            className={`px-4 py-2 text-sm font-body font-bold rounded-lg transition-all duration-200 ${
              pestana === tab.key
                ? 'bg-admin-card text-admin-text shadow-card'
                : 'text-admin-muted hover:text-admin-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido con transición suave */}
      <div className="relative">
        {pestana === 'nuevo' && (
          <div className="animate-fade-in">
            <FormularioNuevoProducto onProductoCreado={fetchProductos} />
          </div>
        )}

        {pestana === 'inventario' && (
          <div className="animate-fade-in flex flex-col gap-4 min-h-0">
            <div className="relative shrink-0">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none"
              />
              <input
                type="search"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, marca, tamaño o categoría…"
                className="w-full bg-admin-card rounded-2xl pl-12 pr-4 py-3 text-sm font-body font-semibold
                           text-admin-text placeholder:text-admin-inactive outline-none border-2 border-admin-border
                           focus:border-fiesta-magenta transition-colors"
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4">
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
            </div>

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
          </div>
        )}
      </div>

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
