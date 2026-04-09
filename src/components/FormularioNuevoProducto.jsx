import { useState, useRef, useEffect } from 'react';
import { ImagePlus, Link2, Loader2, CheckCircle2, UploadCloud, X } from 'lucide-react';
import {
  categorias,
  marcas,
  tamanios,
  SIMBOLO_MONEDA,
  registrarCategoria,
  registrarMarca,
  registrarTamano,
} from '../data/productos';
import { insertarProducto, subirImagenProducto } from '../lib/productosAdmin';
import SelectCategoria from './SelectCategoria';
import GestorPrecios from './GestorPrecios';
import Toggle from './ui/Toggle';

const CATEGORIA_NUEVA_ID = '__agregar_nueva__';
const MARCA_NUEVA_ID = '__agregar_marca__';
const TAMANO_NUEVO_ID = '__agregar_tamano__';



export default function FormularioNuevoProducto({ onProductoCreado }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState(categorias[0]?.id ?? '');
  const [categoriaNueva, setCategoriaNueva] = useState('');
  const [marca, setMarca] = useState('Genérico');
  const [marcaNueva, setMarcaNueva] = useState('');
  const [tamano, setTamano] = useState('');
  const [tamanoNuevo, setTamanoNuevo] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [esNuevo, setEsNuevo] = useState(false);
  const [imagenUrl, setImagenUrl] = useState('');
  const [archivo, setArchivo] = useState(null);
  const fileRef = useRef(null);

  const [stockIlimitado, setStockIlimitado] = useState(true);
  const [stockActual, setStockActual] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [mayoreoActivo, setMayoreoActivo] = useState(false);
  const [preciosMayoreo, setPreciosMayoreo] = useState([
    { id: Date.now(), etiqueta: '', cantidad_minima: '', precio: '' },
  ]);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [previewLocal, setPreviewLocal] = useState(null);
  
  // Drag & Drop state
  const [dragHover, setDragHover] = useState(false);

  useEffect(() => {
    if (!archivo) {
      setPreviewLocal(null);
      return;
    }
    const url = URL.createObjectURL(archivo);
    setPreviewLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  function resetFormulario() {
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setCategoria(categorias[0]?.id ?? '');
    setCategoriaNueva('');
    setMarca('Genérico');
    setMarcaNueva('');
    setTamano('');
    setTamanoNuevo('');
    setDisponible(true);
    setEsNuevo(false);
    setImagenUrl('');
    setArchivo(null);
    setStockIlimitado(true);
    setStockActual('');
    setStockMinimo('5');
    setMayoreoActivo(false);
    setPreciosMayoreo([{ id: Date.now(), etiqueta: '', cantidad_minima: '', precio: '' }]);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito(false);
    setEnviando(true);

    try {
      let urlFinal = imagenUrl.trim() || null;
      const categoriaFinal =
        categoria === CATEGORIA_NUEVA_ID ? categoriaNueva.trim() : categoria;
      const marcaFinal = marca === MARCA_NUEVA_ID ? marcaNueva.trim() : marca;
      const tamanoFinal = tamano === TAMANO_NUEVO_ID ? tamanoNuevo.trim() : tamano;

      if (categoria === CATEGORIA_NUEVA_ID && !categoriaFinal) {
        throw new Error('Escribe el nombre de la nueva categoría.');
      }

      if (archivo) {
        urlFinal = await subirImagenProducto(archivo);
      }

      const precioBaseNum = Math.max(0, Number(precio) || 0);
      const filasMayoreo = (preciosMayoreo || []).map((item, idx) => {
        const etiqueta = String(item?.etiqueta ?? '').trim();
        const cantidadMinima = Number(item?.cantidad_minima);
        const precioEscala = Number(item?.precio);
        return {
          idx,
          etiqueta,
          cantidadMinima,
          precioEscala,
          vacia: !etiqueta && item?.cantidad_minima === '' && item?.precio === '',
        };
      });

      if (mayoreoActivo) {
        if (filasMayoreo.length === 0 || filasMayoreo.every(f => f.vacia)) {
          throw new Error('Activa mayoreo solo si capturas al menos una escala con etiqueta, cantidad y precio.');
        }

        const filaInvalida = filasMayoreo.find(f => {
          if (f.vacia) return true;
          return !f.etiqueta || !Number.isFinite(f.cantidadMinima) || f.cantidadMinima <= 0 || !Number.isFinite(f.precioEscala) || f.precioEscala <= 0;
        });

        if (filaInvalida) {
          throw new Error(`Revisa la escala ${filaInvalida.idx + 1}: etiqueta obligatoria y valores mayores a 0.`);
        }
      }

      const preciosParaGuardar = filasMayoreo
        .filter(f => !f.vacia)
        .map(f => ({
          etiqueta: f.etiqueta,
          cantidad_minima: f.cantidadMinima,
          precio: f.precioEscala,
        }));

      const preciosMayoreoFinal = mayoreoActivo
        ? (preciosParaGuardar.length > 0
            ? preciosParaGuardar
            : [{ etiqueta: '1 Pieza', cantidad_minima: 1, precio: precioBaseNum }])
        : [{ etiqueta: '1 Pieza', cantidad_minima: 1, precio: precioBaseNum }];

      await insertarProducto({
        nombre,
        descripcion,
        precio,
        categoria: categoriaFinal || null,
        marca: marcaFinal || null,
        tamano: tamanoFinal || null,
        imagen_url: urlFinal,
        stock_ilimitado: stockIlimitado,
        stock_actual: stockActual ? Number(stockActual) : 0,
        stock_minimo: stockMinimo ? Number(stockMinimo) : 5,
        es_nuevo: esNuevo,
        precios_mayoreo: preciosMayoreoFinal,
        activo: disponible,
      });

      if (categoria === CATEGORIA_NUEVA_ID && categoriaFinal) {
        registrarCategoria(categoriaFinal);
      }
      if (marca === MARCA_NUEVA_ID && marcaFinal) {
        registrarMarca(marcaFinal);
      }
      if (tamano === TAMANO_NUEVO_ID && tamanoFinal) {
        registrarTamano(tamanoFinal);
      }

      setExito(true);
      resetFormulario();
      onProductoCreado?.();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setEnviando(false);
    }
  }

  // Drag handlers
  const onDragOver = (e) => {
    e.preventDefault();
    setDragHover(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    setDragHover(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) {
      setArchivo(f);
      setImagenUrl('');
    }
  };

  const previewSrc = previewLocal || imagenUrl.trim() || null;

  return (
    <div className="min-h-full font-sans p-4 md:p-6 lg:p-8">
      {/* Contenedor Limpio */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-ink-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] w-full max-w-5xl mx-auto flex flex-col">
        
        {/* HEADER */}
        <div className="mb-6 border-b border-ink-100 pb-5">
          <h2 className="text-xl sm:text-2xl font-black text-ink-900 tracking-tight">Nuevo Artículo</h2>
          <p className="text-xs sm:text-sm font-medium text-ink-500 mt-1">Gemas de metadata y configuración total del producto.</p>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Grid Asimétrico */}
          <div className="md:grid md:grid-cols-[1fr_2fr] gap-x-8 items-start pb-8">
            
            {/* --- COLUMNA IZQUIERDA (Imagen y Toggles) --- */}
            <div className="flex flex-col gap-4 mb-8 md:mb-0">
              
              {/* Bloque: Imagen */}
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => { if (!archivo && !imagenUrl) fileRef.current?.click(); }}
                className={`aspect-square md:aspect-[4/3] bg-ink-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-ink-400 hover:border-ink-300 hover:bg-ink-100 transition-all cursor-pointer relative overflow-hidden group p-4 text-center
                  ${dragHover ? 'border-ink-900 bg-ink-100' : 'border-ink-200'}`}
              >
                {previewSrc ? (
                  <>
                    <img src={previewSrc} alt="Vista previa" className="w-full h-full object-cover absolute inset-0 rounded-2xl" />
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setArchivo(null); setImagenUrl(''); }}
                      className="absolute top-2 right-2 p-1.5 bg-ink-900/80 text-white rounded-full hover:bg-rose-500 transition-colors backdrop-blur-md shadow-sm"
                      title="Eliminar imagen"
                    >
                      <X size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/95 text-ink-900 text-[10px] font-bold rounded-lg shadow-sm backdrop-blur transition-colors"
                    >
                      Modificar
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-105 transition-all text-ink-500">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-xs font-bold text-ink-700 mb-0.5">Subir imagen</p>
                    <p className="text-[10px] font-medium text-ink-400">Clic o arrastrar</p>
                  </>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                onChange={e => {
                  const f = e.target.files?.[0];
                  setArchivo(f || null);
                  if (f) setImagenUrl('');
                }}
                className="hidden"
              />
              
              <div className="bg-ink-50 rounded-xl p-3 border border-transparent">
                <label htmlFor="fp-url" className="flex items-center gap-1 text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                  <Link2 size={12} /> URL externa
                </label>
                <input
                  id="fp-url"
                  type="url"
                  value={imagenUrl}
                  onChange={e => {
                    setImagenUrl(e.target.value);
                    if (e.target.value) setArchivo(null);
                  }}
                  placeholder="https://..."
                  disabled={!!archivo}
                  className="w-full bg-white border border-ink-100 rounded-lg px-3 py-2 text-xs font-medium text-ink-800 focus:border-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-200 transition-all shadow-sm disabled:opacity-50"
                />
              </div>

              {/* Toggles */}
              <div className="bg-ink-50 rounded-xl p-3 border border-transparent flex items-center justify-between w-full gap-3">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-ink-900 leading-tight">Disponible</h3>
                  <p className="text-[10px] font-medium text-ink-500">Venta activa</p>
                </div>
                <Toggle id="toggle-visibilidad" checked={disponible} onChange={() => setDisponible(v => !v)} />
              </div>

              <div className="bg-ink-50 rounded-xl p-3 border border-transparent flex items-center justify-between w-full gap-3">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-ink-900 leading-tight">Etiqueta Novedad</h3>
                  <p className="text-[10px] font-medium text-ink-500">Primero en tienda</p>
                </div>
                <Toggle id="toggle-nuevo" checked={esNuevo} onChange={() => setEsNuevo(v => !v)} />
              </div>
            </div>

            {/* --- COLUMNA DERECHA (Data) --- */}
            <div className="flex flex-col h-full min-w-0">
              
              {/* Grid Interno (Datos) */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
                
                {/* Fila 1 */}
                <div className="col-span-full md:col-span-4">
                  <label htmlFor="fp-nombre" className="block text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">
                    Nombre del producto *
                  </label>
                  <input
                    id="fp-nombre"
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ej. Set de globos..."
                    required
                    maxLength={200}
                    className="w-full bg-ink-50 border border-transparent rounded-lg px-3 py-2 text-sm font-medium text-ink-900 focus:bg-white focus:border-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-200 transition-all shadow-sm"
                  />
                </div>

                <div className="col-span-full md:col-span-2">
                  <label htmlFor="fp-precio" className="block text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">
                    Precio Menudeo *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 font-bold text-sm">{SIMBOLO_MONEDA}</span>
                    <input
                      id="fp-precio"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={precio}
                      onChange={e => setPrecio(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full bg-ink-50 border border-transparent rounded-lg pl-8 pr-3 py-2 text-sm font-medium text-ink-900 focus:bg-white focus:border-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-200 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Fila 2 */}
                <div className="col-span-full">
                  <label htmlFor="fp-desc" className="flex items-center justify-between text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">
                    <span>Descripción</span>
                    <span className="normal-case opacity-70">Opcional</span>
                  </label>
                  <textarea
                    id="fp-desc"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Detalles sobre las medidas, usos..."
                    rows={2}
                    className="w-full bg-ink-50 border border-transparent rounded-lg px-3 py-2 text-sm font-medium text-ink-900 focus:bg-white focus:border-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-200 transition-all resize-none shadow-sm"
                  />
                </div>

                {/* Fila 3 compartida */}
                <div className="col-span-full md:col-span-2">
                  <label htmlFor="fp-cat" className="block text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">
                    Categoría *
                  </label>
                  <SelectCategoria
                    id="fp-cat"
                    value={categoria}
                    onChange={value => {
                      setCategoria(value);
                      if (value !== CATEGORIA_NUEVA_ID) setCategoriaNueva('');
                    }}
                    lista={[
                      ...categorias,
                      { id: CATEGORIA_NUEVA_ID, label: '+ Agregar nueva...' },
                    ]}
                  />
                  {categoria === CATEGORIA_NUEVA_ID && (
                    <input
                      type="text"
                      value={categoriaNueva}
                      onChange={e => setCategoriaNueva(e.target.value)}
                      placeholder="Ej. Novedades"
                      className="w-full mt-2 bg-ink-50 border border-transparent rounded-lg px-3 py-2 text-sm font-medium text-ink-900 focus:border-ink-400 focus:ring-1 focus:ring-ink-200"
                      maxLength={80}
                      autoFocus
                    />
                  )}
                </div>

                <div className="col-span-full md:col-span-2">
                  <label htmlFor="fp-marca" className="block text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">
                    Marca
                  </label>
                  <SelectCategoria
                    id="fp-marca"
                    value={marca}
                    onChange={value => {
                      setMarca(value);
                      if (value !== MARCA_NUEVA_ID) setMarcaNueva('');
                    }}
                    lista={[
                      { id: '', label: 'Sin marca' },
                      ...marcas.map(m => ({ id: m, label: m })),
                      { id: MARCA_NUEVA_ID, label: '+ Agregar nueva...' },
                    ]}
                  />
                  {marca === MARCA_NUEVA_ID && (
                    <input
                      type="text"
                      value={marcaNueva}
                      onChange={e => setMarcaNueva(e.target.value)}
                      placeholder="Nueva marca"
                      className="w-full mt-2 bg-ink-50 border border-transparent rounded-lg px-3 py-2 text-sm font-medium focus:border-ink-400 focus:ring-1 focus:ring-ink-200"
                      autoFocus
                    />
                  )}
                </div>

                <div className="col-span-full md:col-span-2">
                  <label htmlFor="fp-tamano" className="block text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">
                    Tamaño
                  </label>
                  <SelectCategoria
                    id="fp-tamano"
                    value={tamano}
                    onChange={value => {
                      setTamano(value);
                      if (value !== TAMANO_NUEVO_ID) setTamanoNuevo('');
                    }}
                    lista={[
                      { id: '', label: 'Sin tamaño' },
                      ...tamanios.map(t => ({ id: t, label: t })),
                      { id: TAMANO_NUEVO_ID, label: '+ Agregar nueva...' },
                    ]}
                  />
                  {tamano === TAMANO_NUEVO_ID && (
                     <input
                      type="text"
                      value={tamanoNuevo}
                      onChange={e => setTamanoNuevo(e.target.value)}
                      placeholder="Nuevo tamaño"
                      className="w-full mt-2 bg-ink-50 border border-transparent rounded-lg px-3 py-2 text-sm font-medium focus:border-ink-400 focus:ring-1 focus:ring-ink-200"
                      autoFocus
                    />
                  )}
                </div>

                {/* Fila 5: Inventario */}
                <div className="col-span-full bg-ink-50 rounded-xl p-4 border border-ink-100 mt-2">
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800 leading-tight">Control de Inventario</h4>
                      <p className="text-xs font-medium text-gray-500">Si se activa, el producto no se agotará.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 shrink-0">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ilimitado</span>
                      <Toggle id="toggle-stock" checked={stockIlimitado} onChange={() => setStockIlimitado(v => !v)} />
                    </div>
                  </div>

                  {!stockIlimitado && (
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-gray-200 animate-fade-in">
                      <div className="flex flex-col justify-end h-full gap-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Actual</label>
                        <input
                          type="number"
                          min="0"
                          value={stockActual}
                          onChange={e => setStockActual(e.target.value)}
                          className="w-full bg-white border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex flex-col justify-end h-full gap-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Avisar cuando haya</label>
                        <input
                          type="number"
                          min="0"
                          value={stockMinimo}
                          onChange={e => setStockMinimo(e.target.value)}
                          className="w-full bg-white border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-full bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Precios por mayoreo</h4>
                      <p className="text-xs font-medium text-gray-500">
                        Activa solo si manejarás escalas por cantidad.
                      </p>
                    </div>
                    <Toggle
                      id="toggle-mayoreo"
                      checked={mayoreoActivo}
                      onChange={() => {
                        const activo = !mayoreoActivo;
                        setMayoreoActivo(activo);
                        if (activo) {
                          setPreciosMayoreo(prev => {
                            if (!Array.isArray(prev) || prev.length === 0) {
                              return [{ id: Date.now(), etiqueta: '', cantidad_minima: '', precio: '' }];
                            }
                            return prev;
                          });
                        }
                      }}
                    />
                  </div>

                  {mayoreoActivo && (
                    <div className="mt-4 animate-fade-in">
                      <GestorPrecios precios={preciosMayoreo} setPrecios={setPreciosMayoreo} />
                    </div>
                  )}
                </div>
                
              </div>

              {/* ACTION FOOTER */}
              <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-6 text-right">
                <div className="w-full text-center sm:text-right">
                  {error && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                      ⚠️ {error}
                    </span>
                  )}
                  {exito && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                      <CheckCircle2 size={16} /> Producto creado
                    </span>
                  )}
                </div>
                
                {/* Botón Guardar - Diseño Pill Right-Aligned */}
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full px-8 py-3 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {enviando && <Loader2 size={18} className="animate-spin" />}
                  {enviando ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
              
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
