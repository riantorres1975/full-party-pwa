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

const CATEGORIA_NUEVA_ID = '__agregar_nueva__';
const MARCA_NUEVA_ID = '__agregar_marca__';
const TAMANO_NUEVO_ID = '__agregar_tamano__';

// Helper component for modern Toggle Switch
function CustomToggle({ checked, onChange, id }) {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer shrink-0">
      <input id={id} type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300/50 rounded-full peer peer-checked:after:translate-x-[100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-400 shadow-inner"></div>
    </label>
  );
}

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
    <div className="min-h-full font-sans text-gray-800 p-4 md:p-8 pt-4">
      {/* Contenedor Limpio (Tarjeta Blanca sin overflow-hidden) */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-6xl mx-auto flex flex-col">
        
        {/* HEADER */}
        <div className="mb-8 border-b border-gray-100 pb-5">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Nuevo Artículo</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Configura el diseño, costo y organización del inventario.</p>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Grid Asimétrico */}
          <div className="md:grid md:grid-cols-12 md:gap-8 items-start pb-12">
            
            {/* --- COLUMNA IZQUIERDA (md:col-span-4) --- */}
            <div className="md:col-span-4 flex flex-col gap-5 mb-8 md:mb-0">
              
              {/* Bloque: Imagen */}
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => { if (!archivo && !imagenUrl) fileRef.current?.click(); }}
                className={`aspect-square md:aspect-auto md:min-h-[320px] bg-gray-50 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer relative overflow-hidden group p-4 text-center
                  ${dragHover ? 'border-purple-400 bg-purple-50 scale-[1.02]' : 'border-gray-200'}`}
              >
                {previewSrc ? (
                  <>
                    <img src={previewSrc} alt="Vista previa" className="w-full h-full object-cover absolute inset-0 rounded-3xl" />
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setArchivo(null); setImagenUrl(''); }}
                      className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors backdrop-blur-md shadow-lg"
                      title="Eliminar imagen"
                    >
                      <X size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 text-gray-900 text-xs font-bold rounded-full shadow-lg backdrop-blur hover:bg-white transition-colors"
                    >
                      Cambiar foto
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 group-hover:shadow-md transition-all">
                      <UploadCloud size={28} className={dragHover ? 'text-purple-500' : 'text-purple-400'} />
                    </div>
                    <p className="text-sm font-bold text-gray-600 mb-1">Subir imagen</p>
                    <p className="text-xs font-medium text-gray-400">Arrastra o haz clic aquí</p>
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
              
              <div className="bg-gray-50 rounded-2xl p-4 border border-transparent">
                <label htmlFor="fp-url" className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <Link2 size={12} /> URL externa (Opcional)
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
                  className="w-full bg-white border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm disabled:opacity-50"
                />
              </div>

              {/* Bloque: Tarjetita Disponible */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-transparent flex items-center justify-between w-full gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-800 leading-tight">Disponible</h3>
                  <p className="text-xs font-medium text-gray-500">Venta activa</p>
                </div>
                <CustomToggle id="toggle-visibilidad" checked={disponible} onChange={e => setDisponible(e.target.checked)} />
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 border border-transparent flex items-center justify-between w-full gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-800 leading-tight">Etiqueta Nuevo</h3>
                  <p className="text-xs font-medium text-gray-500">Se muestra primero en tienda</p>
                </div>
                <CustomToggle id="toggle-nuevo" checked={esNuevo} onChange={e => setEsNuevo(e.target.checked)} />
              </div>
            </div>

            {/* --- COLUMNA DERECHA (md:col-span-8) --- */}
            <div className="md:col-span-8 flex flex-col h-full">
              
              {/* Grid Interno (Datos) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                
                {/* Fila 1 */}
                <div className="col-span-full">
                  <label htmlFor="fp-nombre" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Nombre del producto *
                  </label>
                  <input
                    id="fp-nombre"
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ej. Set de globos metálicos dorados"
                    required
                    maxLength={200}
                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                  />
                </div>

                {/* Fila 2 */}
                <div className="col-span-full">
                  <label htmlFor="fp-desc" className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    <span>Descripción</span>
                    <span className="font-medium normal-case text-gray-400">Opcional</span>
                  </label>
                  <textarea
                    id="fp-desc"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Añade detalles útiles para tus clientes..."
                    rows={2}
                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all resize-none shadow-sm"
                  />
                </div>

                {/* Fila 3 compartida (Precio y Cat) */}
                <div>
                  <label htmlFor="fp-precio" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Precio de Venta *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{SIMBOLO_MONEDA}</span>
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
                      className="w-full bg-gray-50 border border-transparent rounded-xl pl-9 pr-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="fp-cat" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
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
                      className="w-full mt-2 bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                      maxLength={80}
                      autoFocus
                    />
                  )}
                </div>

                {/* Fila 4 compartida (Marca y Tamaño) */}
                <div>
                  <label htmlFor="fp-marca" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
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
                      className="w-full mt-2 bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                      autoFocus
                    />
                  )}
                </div>

                <div>
                  <label htmlFor="fp-tamano" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
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
                      className="w-full mt-2 bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                      autoFocus
                    />
                  )}
                </div>

                {/* Fila 5: Inventario */}
                <div className="col-span-full bg-gray-50 rounded-2xl p-5 border border-transparent mt-2">
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800 leading-tight">Control de Inventario</h4>
                      <p className="text-xs font-medium text-gray-500">Si se activa, el producto no se agotará.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 shrink-0">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ilimitado</span>
                      <CustomToggle id="toggle-stock" checked={stockIlimitado} onChange={e => setStockIlimitado(e.target.checked)} />
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
                    <CustomToggle
                      id="toggle-mayoreo"
                      checked={mayoreoActivo}
                      onChange={e => {
                        const activo = e.target.checked;
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
