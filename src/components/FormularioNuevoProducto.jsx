import { useState, useRef, useEffect } from 'react';
import { ImagePlus, Link2, Loader2, CheckCircle2 } from 'lucide-react';
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

const CATEGORIA_NUEVA_ID = '__agregar_nueva__';
const MARCA_NUEVA_ID = '__agregar_marca__';
const TAMANO_NUEVO_ID = '__agregar_tamano__';

const inputBase =
  'w-full bg-white rounded-2xl px-4 py-2.5 text-sm font-body font-semibold ' +
  'text-ink-900 placeholder:text-ink-300 outline-none border-2 border-ink-200 ' +
  'focus:border-fiesta-magenta transition-colors';

const inputCompact =
  'w-full bg-white rounded-xl px-3 py-2 text-xs font-body font-semibold ' +
  'text-ink-900 placeholder:text-ink-300 outline-none border-2 border-ink-200 ' +
  'focus:border-fiesta-magenta transition-colors';

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
  const [imagenUrl, setImagenUrl] = useState('');
  const [archivo, setArchivo] = useState(null);
  const fileRef = useRef(null);

  const [stockIlimitado, setStockIlimitado] = useState(true);
  const [stockActual, setStockActual] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [previewLocal, setPreviewLocal] = useState(null);

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
    setImagenUrl('');
    setArchivo(null);
    setStockIlimitado(true);
    setStockActual('');
    setStockMinimo('5');
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

  const previewSrc = previewLocal || imagenUrl.trim() || null;

  return (
    <div
      className="bg-white rounded-2xl border-2 border-purple-100 flex flex-col"
      style={{ boxShadow: '0 4px 24px rgba(107, 53, 184, 0.08)' }}
    >
      {/* HEADER */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-purple-100/80 bg-slate-50/50">
        <span className="text-xl leading-none">📦</span>
        <div>
          <h2 className="font-display text-[15px] text-ink-900 leading-tight">Nuevo artículo</h2>
        </div>
      </div>

      {/* FORM BODY - Sin overflow-hidden para no cortar selects */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-4">
        
        {/* GRID DE 4 COLUMNAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5 items-start">
          
          {/* COLUMNA 1: Imagen y Estado */}
          <div className="flex flex-col gap-3">
            <div className="rounded-xl p-2.5 border-2 border-dashed border-purple-200 bg-purple-50/30">
              <p className="text-[11px] font-body font-black text-ink-700 mb-1.5 flex items-center gap-1.5">
                <ImagePlus size={14} className="text-fiesta-magenta" />
                Imagen
              </p>

              <div className="w-full aspect-square relative rounded-xl border border-dashed border-purple-300 bg-white overflow-hidden mb-2">
                {previewSrc ? (
                  <img src={previewSrc} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-3 text-center">
                    <ImagePlus size={24} className="text-fiesta-magenta opacity-80" />
                    <p className="text-[10px] font-body font-bold text-ink-500 leading-snug">
                      Subir foto
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
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
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-1.5 rounded-lg border border-purple-200 bg-purple-100/80 text-[10px] font-body font-black text-purple-800 hover:bg-purple-200 transition-colors"
                >
                  {archivo ? 'Cambiar' : 'Explorar…'}
                </button>
                
                <div className="pt-0.5">
                  <label htmlFor="fp-url" className="flex items-center gap-1 text-[10px] font-body font-bold text-ink-500 mb-1 pl-0.5">
                    <Link2 size={10} /> O enlazada (URL)
                  </label>
                  <input
                    id="fp-url"
                    type="url"
                    value={imagenUrl}
                    onChange={e => {
                      setImagenUrl(e.target.value);
                      if (e.target.value) setArchivo(null);
                    }}
                    placeholder="https://…"
                    disabled={!!archivo}
                    className={`w-full bg-white rounded-lg px-2 py-1.5 text-[11px] font-body font-semibold text-ink-900 placeholder:text-ink-300 outline-none border border-ink-200 focus:border-fiesta-magenta transition-colors ${archivo ? 'opacity-50' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl px-3 py-2 border border-ink-100 bg-slate-50/70">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={disponible}
                  onChange={e => setDisponible(e.target.checked)}
                  className="w-4 h-4 rounded-md border-2 border-ink-300 text-emerald-600 focus:ring-2 focus:ring-fiesta-magenta shrink-0"
                />
                <span className="text-[11px] font-body font-black text-ink-800 leading-none mt-0.5">Disponible en tienda</span>
              </label>
            </div>
          </div>

          {/* COLUMNA 2: Datos Principales */}
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="fp-nombre" className="block text-[11px] font-body font-black text-ink-600 mb-1 pl-1">
                Nombre del producto
              </label>
              <input
                id="fp-nombre"
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Globo metálico..."
                required
                maxLength={200}
                className="w-full bg-white rounded-lg px-2.5 py-1.5 text-[11px] font-body font-semibold text-ink-900 placeholder:text-ink-300 outline-none border border-ink-200 focus:border-fiesta-magenta transition-colors"
              />
            </div>

            <div>
              <label htmlFor="fp-desc" className="block text-[11px] font-body font-black text-ink-600 mb-1 pl-1">
                Descripción
              </label>
              <textarea
                id="fp-desc"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Detalles del producto…"
                rows={2}
                className="w-full bg-white rounded-lg px-2.5 py-1.5 text-[11px] font-body font-semibold text-ink-900 placeholder:text-ink-300 outline-none border border-ink-200 focus:border-fiesta-magenta transition-colors resize-none min-h-[46px]"
              />
            </div>

            <div>
              <label htmlFor="fp-precio" className="block text-[11px] font-body font-black text-ink-600 mb-1 pl-1">
                Precio ({SIMBOLO_MONEDA})
              </label>
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
                className="w-full bg-white rounded-lg px-2.5 py-1.5 text-[11px] font-body font-semibold text-ink-900 placeholder:text-ink-300 outline-none border border-ink-200 focus:border-fiesta-magenta transition-colors"
              />
            </div>
          </div>

          {/* COLUMNA 3: Categorización */}
          <div className="flex flex-col gap-3 relative z-20">
            <div>
              <label htmlFor="fp-cat" className="block text-[11px] font-body font-black text-ink-600 mb-1 pl-1">
                Categoría
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
                  placeholder="Nombre categoría"
                  className="w-full bg-white rounded-lg px-2.5 py-1.5 text-[11px] font-body font-semibold text-ink-900 placeholder:text-ink-300 outline-none border border-ink-200 focus:border-fiesta-magenta transition-colors mt-1.5"
                  maxLength={80}
                  autoFocus
                />
              )}
            </div>

            <div>
              <label htmlFor="fp-marca" className="block text-[11px] font-body font-black text-ink-600 mb-1 pl-1">
                Marca <span className="font-normal text-ink-400">(opc)</span>
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
                  placeholder="Nombre marca"
                  className="w-full bg-white rounded-lg px-2.5 py-1.5 text-[11px] font-body font-semibold text-ink-900 placeholder:text-ink-300 outline-none border border-ink-200 focus:border-fiesta-magenta transition-colors mt-1.5"
                  autoFocus
                />
              )}
            </div>

            <div>
              <label htmlFor="fp-tamano" className="block text-[11px] font-body font-black text-ink-600 mb-1 pl-1">
                Tamaño <span className="font-normal text-ink-400">(opc)</span>
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
                  placeholder="Nombre tamaño"
                  className="w-full bg-white rounded-lg px-2.5 py-1.5 text-[11px] font-body font-semibold text-ink-900 placeholder:text-ink-300 outline-none border border-ink-200 focus:border-fiesta-magenta transition-colors mt-1.5"
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* COLUMNA 4: Inventario */}
          <div className="flex flex-col gap-3">
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3">
              <label className="flex items-center gap-2 cursor-pointer select-none mb-3">
                <input
                  type="checkbox"
                  checked={stockIlimitado}
                  onChange={e => setStockIlimitado(e.target.checked)}
                  className="w-4 h-4 rounded-md border-2 border-ink-300 text-emerald-600 focus:ring-2 focus:ring-fiesta-magenta shrink-0"
                />
                <span className="text-[11px] font-body font-black text-ink-800 leading-none mt-0.5">Stock Ilimitado</span>
              </label>
              
              {!stockIlimitado && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-body font-black text-ink-600 mb-1 pl-1">Cantidad Actual</label>
                    <input
                      type="number"
                      min="0"
                      value={stockActual}
                      onChange={e => setStockActual(e.target.value)}
                      className="w-full bg-white rounded-lg px-2.5 py-1.5 text-[11px] font-body font-semibold text-ink-900 placeholder:text-ink-300 outline-none border border-ink-200 focus:border-fiesta-magenta transition-colors"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-body font-black text-ink-600 mb-1 pl-1">Avisar cuando quede...</label>
                    <input
                      type="number"
                      min="0"
                      value={stockMinimo}
                      onChange={e => setStockMinimo(e.target.value)}
                      className="w-full bg-white rounded-lg px-2.5 py-1.5 text-[11px] font-body font-semibold text-ink-900 placeholder:text-ink-300 outline-none border border-ink-200 focus:border-fiesta-magenta transition-colors"
                      placeholder="5"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 3. BOTÓN Y MENSAJES FINALES: Fuera del grid principal */}
        <div className="col-span-full pt-3 mt-1 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-purple-100">
          {/* Mensajes */}
          <div className="flex-1 min-w-0">
            {error && (
              <div className="inline-flex rounded-lg px-3 py-1.5 text-[11px] font-body font-bold text-red-600 bg-red-50 border border-red-200 animate-fade-in">
                ⚠️ {error}
              </div>
            )}
            {exito && (
              <div className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-body font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 animate-fade-in">
                <CheckCircle2 size={14} /> Producto guardado.
              </div>
            )}
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            disabled={enviando}
            className="w-full md:w-auto md:min-w-[200px] py-2 px-6 rounded-xl font-body font-black text-[12px] text-white
                       transition-all duration-200 active:scale-95 disabled:opacity-60
                       flex items-center justify-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
              boxShadow: enviando ? 'none' : '0 4px 14px #ff3dac44',
            }}
          >
            {enviando ? <Loader2 size={14} className="animate-spin" /> : null}
            {enviando ? 'Guardando…' : 'Guardar Producto'}
          </button>
        </div>
        
      </form>
    </div>
  );
}
