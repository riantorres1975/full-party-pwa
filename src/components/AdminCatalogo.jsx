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

const TAB_STYLE = {
  activo: {
    background: 'linear-gradient(135deg, #6b35b8, #a855f7)',
    color: 'white',
    boxShadow: '0 4px 14px rgba(107, 53, 184, 0.45)',
  },
  inactivo: {
    background: 'white',
    color: '#6b35b8',
    border: '2px solid #e0c4f8',
  },
};

function ToggleDisponible({ activo, disabled, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      disabled={disabled}
      onClick={onToggle}
      className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-magenta focus-visible:ring-offset-2
                 disabled:opacity-50"
      style={{ background: activo ? '#22c55e' : '#d1d5db' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: activo ? 'translateX(1.25rem)' : 'translateX(0)' }}
      />
    </button>
  );
}

export default function AdminCatalogo() {
  const [pestana, setPestana] = useState('nuevo');
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [verStockBajo, setVerStockBajo] = useState(false);
  const [editando, setEditando] = useState(null);
  const [toggleId, setToggleId] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  const fetchProductos = useCallback(async () => {
    setCargando(true);
    setErrorLista('');
    const { data, error } = await supabase
      .from('productos')
      .select('*')
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
    
    if (verStockBajo) {
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
  }, [productos, busqueda, verStockBajo, productosEnAlerta]);

  async function handleToggleDisponibilidad(p) {
    const siguiente = !p.activo;
    setProductos(prev => prev.map(x => (x.id === p.id ? { ...x, activo: siguiente } : x)));
    setToggleId(p.id);
    try {
      await actualizarDisponibilidadProducto(p.id, siguiente);
    } catch (err) {
      setProductos(prev => prev.map(x => (x.id === p.id ? { ...x, activo: p.activo } : x)));
      alert(err.message || 'No se pudo actualizar');
    } finally {
      setToggleId(null);
    }
  }

  async function handleEliminar(p) {
    if (!window.confirm(`¿Eliminar "${p.nombre}" del catálogo? Esta acción no se puede deshacer.`)) {
      return;
    }
    setEliminandoId(p.id);
    try {
      await eliminarProducto(p.id);
      setProductos(prev => prev.filter(x => x.id !== p.id));
    } catch (err) {
      alert(err.message || 'No se pudo eliminar');
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 min-w-0">
      {/* Pestañas — estilo pills */}
      <div
        className="flex p-1 rounded-2xl gap-1 w-full min-w-0 sm:w-auto sm:inline-flex"
        style={{ background: 'rgba(255,255,255,0.9)', border: '2px solid #e0c4f8' }}
      >
        <button
          type="button"
          onClick={() => setPestana('nuevo')}
          className="flex-1 sm:flex-none min-w-0 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-body font-black
                     transition-all duration-200 active:scale-[0.98]"
          style={pestana === 'nuevo' ? TAB_STYLE.activo : TAB_STYLE.inactivo}
        >
          Nuevo Artículo
        </button>
        <button
          type="button"
          onClick={() => setPestana('inventario')}
          className="flex-1 sm:flex-none min-w-0 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-body font-black
                     transition-all duration-200 active:scale-[0.98]"
          style={pestana === 'inventario' ? TAB_STYLE.activo : TAB_STYLE.inactivo}
        >
          Inventario
        </button>
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
            {productosEnAlerta.length > 0 && (
              <button
                type="button"
                onClick={() => setVerStockBajo(!verStockBajo)}
                className={`self-start flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-bold text-sm transition-all shadow-sm
                  ${verStockBajo 
                    ? 'bg-red-500 text-white border-2 border-transparent' 
                    : 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'}`}
              >
                <AlertTriangle size={18} />
                {productosEnAlerta.length} {productosEnAlerta.length === 1 ? 'Artículo con' : 'Artículos con'} Stock Bajo
              </button>
            )}

            <div className="relative shrink-0">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none"
              />
              <input
                type="search"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, marca, tamaño o categoría…"
                className="w-full bg-white rounded-2xl pl-12 pr-4 py-3 text-sm font-body font-semibold
                           text-ink-900 placeholder:text-ink-300 outline-none border-2 border-ink-200
                           focus:border-fiesta-magenta transition-colors"
              />
            </div>

            {cargando && (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-6 h-6 rounded-full border-[3px] border-ink-200 border-t-fiesta-magenta animate-spin" />
                <span className="text-sm font-body font-bold text-ink-400">Cargando inventario…</span>
              </div>
            )}

            {!cargando && errorLista && (
              <div className="bg-white rounded-2xl p-5 border-2 border-red-100 text-center">
                <p className="text-sm font-body font-bold text-red-500">⚠️ {errorLista}</p>
                <button
                  type="button"
                  onClick={fetchProductos}
                  className="mt-3 text-xs font-body font-black text-ink-500 underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!cargando && !errorLista && filtrados.length === 0 && (
              <div className="text-center py-14 bg-white rounded-2xl border-2 border-purple-100">
                <p className="text-3xl mb-2">📭</p>
                <p className="font-body font-bold text-ink-500">
                  {busqueda ? 'Ningún producto coincide con la búsqueda.' : 'Sin productos aún.'}
                </p>
              </div>
            )}

            {!cargando && !errorLista && filtrados.length > 0 && (
              <div
                className="space-y-3 overflow-y-auto overscroll-y-contain min-h-0 pr-1 -mr-0.5
                           [scrollbar-width:thin] [scrollbar-color:rgba(107,53,184,0.35)_transparent]
                           max-h-[calc(100dvh-15.5rem)] sm:max-h-[calc(100dvh-13rem)]"
              >
                {filtrados.map(p => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border-2 border-purple-100 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4
                               transition-shadow hover:shadow-md"
                    style={{ boxShadow: '0 2px 12px rgba(107, 53, 184, 0.06)' }}
                  >
                    <div className="flex gap-3 flex-1 min-w-0 items-center">
                      <div
                        className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-ink-50 border-2 border-ink-100
                                   flex items-center justify-center"
                      >
                        <MiniaturaProducto url={p.imagen_url} nombre={p.nombre} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body font-black text-ink-900 text-sm leading-snug line-clamp-2">
                          {p.nombre}
                        </p>
                        <p className="text-[11px] font-body text-ink-500 mt-0.5">
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
                        <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                          <p className="text-sm font-body font-black" style={{ color: '#6b35b8' }}>
                            {SIMBOLO_MONEDA}
                            {Number(p.precio).toFixed(2)}
                          </p>
                          {p.stock_ilimitado !== false ? (
                            <span className="inline-flex items-center w-fit gap-1 text-[11px] font-body font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              <span className="text-[14px] leading-none mb-[1px]">∞</span> Ilimitado
                            </span>
                          ) : (
                            Number(p.stock_actual) <= Number(p.stock_minimo) ? (
                              <span className="inline-flex items-center w-fit gap-1 text-[11px] font-body font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 shadow-sm">
                                <AlertTriangle size={12} strokeWidth={2.5} className="text-red-500" />
                                {p.stock_actual} - Stock Bajo
                              </span>
                            ) : (
                              <span className="inline-flex items-center w-fit gap-1 text-[11px] font-body font-bold text-ink-600 bg-ink-50 px-1.5 py-0.5 rounded border border-ink-200">
                                {p.stock_actual} en stock
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:justify-end sm:flex-shrink-0 border-t sm:border-t-0 border-ink-100 pt-3 sm:pt-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-body font-bold text-ink-400 whitespace-nowrap">
                          Disponible
                        </span>
                        <ToggleDisponible
                          activo={p.activo !== false}
                          disabled={toggleId === p.id}
                          onToggle={() => handleToggleDisponibilidad(p)}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                        <button
                          type="button"
                          onClick={() => setEditando(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body font-black
                                     text-white transition-all active:scale-95"
                          style={{
                            background: 'linear-gradient(135deg, #8b5cf6, #6b35b8)',
                            boxShadow: '0 2px 10px rgba(107, 53, 184, 0.35)',
                          }}
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(p)}
                          disabled={eliminandoId === p.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body font-black
                                     text-rose-700 transition-all active:scale-95 disabled:opacity-50"
                          style={{
                            background: '#fff1f2',
                            border: '2px solid #fecdd3',
                          }}
                        >
                          <Trash2 size={14} />
                          {eliminandoId === p.id ? '…' : 'Eliminar'}
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
    </div>
  );
}
