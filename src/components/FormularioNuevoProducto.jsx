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
      className="bg-white rounded-2xl border-2 border-purple-100 flex flex-col min-h-0 overflow-hidden
                 h-full"
      style={{ boxShadow: '0 4px 24px rgba(107, 53, 184, 0.08)' }}
    >
      <div className="shrink-0 flex items-start gap-2 sm:gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-2.5 border-b border-purple-100/80 [@media(max-height:720px)]:pt-3 [@media(max-height:720px)]:pb-2">
        <span className="text-3xl flex-shrink-0">📦</span>
        <div>
          <h2 className="font-display text-lg text-ink-900">Nuevo artículo</h2>
          <p className="text-xs font-body text-ink-400 mt-0.5 leading-relaxed">
            Los datos se guardan en Supabase. La disponibilidad controla si el artículo se muestra como
            disponible o agotado en el catálogo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="flex-1 px-4 sm:px-6 py-3 sm:py-4 [@media(max-height:720px)]:py-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start [@media(max-height:720px)]:gap-3">
            <div className="space-y-2.5 min-w-0 [@media(max-height:720px)]:space-y-2">
              <div>
                <label htmlFor="fp-nombre" className="block text-xs font-body font-black text-ink-600 mb-1 pl-1">
                  Nombre del producto
                </label>
                <input
                  id="fp-nombre"
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Globo metálico corazón"
                  required
                  maxLength={200}
                  className={inputBase}
                />
              </div>

              <div>
                <label htmlFor="fp-desc" className="block text-xs font-body font-black text-ink-600 mb-1 pl-1">
                  Descripción
                </label>
                <textarea
                  id="fp-desc"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Detalles para tus clientes…"
                  rows={2}
                  className={`${inputBase} resize-none min-h-[56px]`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
                <div className="min-w-0">
                  <label htmlFor="fp-precio" className="block text-xs font-body font-black text-ink-600 mb-1 pl-1">
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
                    className={inputBase}
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="fp-cat" className="block text-xs font-body font-black text-ink-600 mb-1 pl-1">
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
                      placeholder="Nombre de la nueva categoría"
                      className={`${inputBase} mt-1.5`}
                      maxLength={80}
                      autoFocus
                    />
                  )}
                </div>
              </div>

              <div
                className="rounded-2xl px-3 py-2 border-2 border-ink-100"
                style={{ background: '#faf8ff' }}
              >
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={disponible}
                    onChange={e => setDisponible(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded-md border-2 border-ink-300 text-emerald-600
                               focus:ring-2 focus:ring-fiesta-magenta focus:ring-offset-1 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-body font-black text-ink-800 leading-tight">Disponible en tienda</p>
                    <p className="text-[10px] font-body text-ink-400 mt-0.5 leading-snug">
                      Si desmarcas, el artículo se mostrará como agotado en el catálogo.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2.5 min-w-0 [@media(max-height:720px)]:space-y-2">
              <div>
                <label htmlFor="fp-marca" className="block text-xs font-body font-black text-ink-600 mb-1 pl-1">
                  Marca <span className="font-normal text-ink-400">(opcional)</span>
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
                    placeholder="Nombre de la nueva marca"
                    maxLength={120}
                    className={`${inputBase} mt-1.5`}
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label htmlFor="fp-tamano" className="block text-xs font-body font-black text-ink-600 mb-1 pl-1">
                  Tamaño <span className="font-normal text-ink-400">(opcional)</span>
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
                    placeholder="Nombre del nuevo tamaño"
                    maxLength={120}
                    className={`${inputBase} mt-1.5`}
                    autoFocus
                  />
                )}
              </div>

              <div className="rounded-2xl p-2 border-2 border-dashed border-purple-200 min-w-0"
                   style={{ background: 'linear-gradient(180deg, #fefcff 0%, #f8f4ff 100%)' }}>
                <p className="text-xs font-body font-black text-ink-700 mb-1.5 flex items-center gap-1.5">
                  <ImagePlus size={15} className="text-fiesta-magenta" />
                  Imagen del producto
                </p>

                <div className="w-full max-w-[240px] sm:max-w-[260px] [@media(max-height:720px)]:max-w-[190px] mx-auto aspect-square rounded-2xl border-2 border-dashed border-purple-300/80 bg-white/70 overflow-hidden relative">
                  {previewSrc ? (
                    <img src={previewSrc} alt="Vista previa" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
                      <ImagePlus size={44} className="text-fiesta-magenta" />
                      <p className="text-[11px] font-body font-bold text-ink-500 leading-snug">
                        JPG, PNG, GIF, WEBP o AVIF
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-2 w-full max-w-[240px] sm:max-w-[260px] [@media(max-height:720px)]:max-w-[190px] mx-auto">
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
                    className="w-full py-2 rounded-xl border-2 border-purple-200 bg-purple-100/85 text-xs font-body font-black text-purple-800 hover:bg-purple-200 transition-colors"
                  >
                    {archivo ? 'Cambiar archivo' : 'Seleccionar archivo'}
                  </button>
                  {archivo && (
                    <p className="text-[10px] font-body text-ink-500 mt-1 text-center truncate px-1">{archivo.name}</p>
                  )}
                </div>

                <div className="mt-2 w-full max-w-[240px] sm:max-w-[260px] [@media(max-height:720px)]:max-w-[190px] mx-auto">
                  <label htmlFor="fp-url" className="flex items-center gap-1.5 text-[11px] font-body font-bold text-ink-500 mb-1 pl-0.5">
                    <Link2 size={12} /> Enlace (URL)
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
                    className={`${inputCompact} ${archivo ? 'opacity-50' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-4 sm:px-6 pt-4 pb-2 border-t border-purple-100">
          <div className="bg-[#faf8ff] rounded-2xl p-4 border-2 border-ink-100">
            <label className="flex items-center gap-3 cursor-pointer select-none mb-3">
              <input
                type="checkbox"
                checked={stockIlimitado}
                onChange={e => setStockIlimitado(e.target.checked)}
                className="w-5 h-5 rounded-md border-2 border-ink-300 text-emerald-600 focus:ring-2 focus:ring-fiesta-magenta focus:ring-offset-1 shrink-0"
              />
              <div>
                <p className="text-sm font-body font-black text-ink-800">Stock Ilimitado</p>
              </div>
            </label>
            
            {!stockIlimitado && (
              <div className="flex gap-4 animate-fade-in mt-1">
                <div className="flex-1">
                  <label className="block text-xs font-body font-black text-ink-600 mb-1 pl-1">Cantidad en Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={stockActual}
                    onChange={e => setStockActual(e.target.value)}
                    className={inputBase}
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-body font-black text-ink-600 mb-1 pl-1">Avisar cuando queden menos de...</label>
                  <input
                    type="number"
                    min="0"
                    value={stockMinimo}
                    onChange={e => setStockMinimo(e.target.value)}
                    className={inputBase}
                    placeholder="5"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="shrink-0 px-4 sm:px-6 pb-3 sm:pb-4 pt-2.5 space-y-2 border-t border-purple-100 [@media(max-height:720px)]:pt-2 [@media(max-height:720px)]:pb-2.5"
          style={{
            background: 'linear-gradient(180deg, rgba(250,248,255,0.95) 0%, #ffffff 40%)',
          }}
        >
          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-body font-bold text-red-600 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.25)' }}
            >
              ⚠️ {error}
            </div>
          )}

          {exito && (
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-body font-bold text-emerald-700"
              style={{ background: '#ecfdf5', border: '2px solid #a7f3d0' }}
            >
              <CheckCircle2 size={18} />
              Producto guardado correctamente.
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3 rounded-2xl font-body font-black text-base text-white [@media(max-height:720px)]:py-2.5
                       transition-all duration-200 active:scale-[0.99] disabled:opacity-60
                       flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
              boxShadow: enviando ? 'none' : '0 4px 20px #ff3dac44',
            }}
          >
            {enviando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando…
              </>
            ) : (
              'Guardar en el catálogo'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
