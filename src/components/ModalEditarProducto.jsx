import { useState, useRef, useEffect } from 'react';
import { X, ImagePlus, Link2, Loader2 } from 'lucide-react';
import {
  categorias,
  marcas,
  tamanios,
  SIMBOLO_MONEDA,
  registrarCategoria,
  registrarMarca,
  registrarTamano,
} from '../data/productos';
import { actualizarProducto, subirImagenProducto } from '../lib/productosAdmin';
import SelectCategoria from './SelectCategoria';

const CATEGORIA_NUEVA_ID = '__agregar_nueva__';
const MARCA_NUEVA_ID = '__agregar_marca__';
const TAMANO_NUEVO_ID = '__agregar_tamano__';

const inputBase =
  'w-full bg-white rounded-2xl px-4 py-3 text-sm font-body font-semibold ' +
  'text-ink-900 placeholder:text-ink-300 outline-none border-2 border-ink-200 ' +
  'focus:border-fiesta-magenta transition-colors';

export default function ModalEditarProducto({ producto, onClose, onGuardado }) {
  const [nombre, setNombre] = useState(producto.nombre ?? '');
  const [descripcion, setDescripcion] = useState(producto.descripcion ?? '');
  const [precio, setPrecio] = useState(
    producto.precio != null ? String(producto.precio) : ''
  );
  const catInicial = producto.categoria || categorias[0]?.id || '';
  const [categoria, setCategoria] = useState(catInicial);
  const [categoriaNueva, setCategoriaNueva] = useState('');
  const [marca, setMarca] = useState(producto.marca ?? 'Genérico');
  const [marcaNueva, setMarcaNueva] = useState('');
  const [tamano, setTamano] = useState(producto.tamano ?? '');
  const [tamanoNuevo, setTamanoNuevo] = useState('');
  const [disponible, setDisponible] = useState(producto.activo !== false);
  const [stockIlimitado, setStockIlimitado] = useState(producto.stock_ilimitado !== false);
  const [stockActual, setStockActual] = useState(producto.stock_actual != null ? String(producto.stock_actual) : '');
  const [stockMinimo, setStockMinimo] = useState(producto.stock_minimo != null ? String(producto.stock_minimo) : '5');
  const [imagenUrl, setImagenUrl] = useState(producto.imagen_url ?? '');
  const [archivo, setArchivo] = useState(null);
  const fileRef = useRef(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
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

      await actualizarProducto(producto.id, {
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

      onGuardado?.();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setEnviando(false);
    }
  }

  const previewSrc = previewLocal || imagenUrl.trim() || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(26, 7, 51, 0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-editar-titulo"
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto border-2 border-purple-100 shadow-2xl"
        style={{ boxShadow: '0 24px 60px rgba(26, 7, 51, 0.25)' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-ink-100 bg-white rounded-t-2xl sm:rounded-t-3xl">
          <h2 id="modal-editar-titulo" className="font-display text-base text-ink-900 pl-1">
            Editar artículo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
              Nombre del producto
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              maxLength={200}
              className={inputBase}
            />
          </div>

          <div>
            <label className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              className={`${inputBase} resize-y min-h-[88px]`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
                Precio ({SIMBOLO_MONEDA})
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                required
                className={inputBase}
              />
            </div>
            <div>
              <label
                htmlFor="modal-fp-cat"
                className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1"
              >
                Categoría
              </label>
              <SelectCategoria
                id="modal-fp-cat"
                value={categoria}
                onChange={value => {
                  setCategoria(value);
                  if (value !== CATEGORIA_NUEVA_ID) setCategoriaNueva('');
                }}
                lista={[
                  ...categorias,
                  { id: CATEGORIA_NUEVA_ID, label: '+ Agregar nueva...' },
                ]}
                opcionExtra={
                  producto.categoria &&
                  !categorias.some(c => c.id === producto.categoria)
                    ? { id: producto.categoria, label: `${producto.categoria} (actual)` }
                    : null
                }
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
                Marca <span className="font-normal text-ink-400">(opcional)</span>
              </label>
              <SelectCategoria
                id="modal-fp-marca"
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
                opcionExtra={
                  producto.marca && !marcas.some(m => m === producto.marca)
                    ? { id: producto.marca, label: `${producto.marca} (actual)` }
                    : null
                }
              />
              {marca === MARCA_NUEVA_ID && (
                <input
                  type="text"
                  value={marcaNueva}
                  onChange={e => setMarcaNueva(e.target.value)}
                  maxLength={120}
                  placeholder="Nombre de la nueva marca"
                  className={`${inputBase} mt-1.5`}
                  autoFocus
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
                Tamaño <span className="font-normal text-ink-400">(opcional)</span>
              </label>
              <SelectCategoria
                id="modal-fp-tamano"
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
                opcionExtra={
                  producto.tamano && !tamanios.some(t => t === producto.tamano)
                    ? { id: producto.tamano, label: `${producto.tamano} (actual)` }
                    : null
                }
              />
              {tamano === TAMANO_NUEVO_ID && (
                <input
                  type="text"
                  value={tamanoNuevo}
                  onChange={e => setTamanoNuevo(e.target.value)}
                  maxLength={120}
                  placeholder="Nombre del nuevo tamaño"
                  className={`${inputBase} mt-1.5`}
                  autoFocus
                />
              )}
            </div>
          </div>

          <div
            className="rounded-2xl px-4 py-3 border-2 border-ink-100"
            style={{ background: '#faf8ff' }}
          >
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={disponible}
                onChange={e => setDisponible(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded-md border-2 border-ink-300 text-emerald-600
                           focus:ring-2 focus:ring-fiesta-magenta focus:ring-offset-1 shrink-0"
              />
              <div>
                <p className="text-sm font-body font-black text-ink-800">Disponible en tienda</p>
              </div>
            </label>
          </div>

          <div
            className="rounded-2xl p-4 border-2 border-dashed border-purple-200"
            style={{ background: 'linear-gradient(180deg, #fefcff 0%, #f8f4ff 100%)' }}
          >
            <p className="text-xs font-body font-black text-ink-700 mb-3 flex items-center gap-2">
              <ImagePlus size={16} className="text-fiesta-magenta" />
              Imagen del producto
            </p>
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-body font-bold text-ink-500 mb-1">
                  <Link2 size={12} /> Enlace (URL)
                </label>
                <input
                  type="url"
                  value={imagenUrl}
                  onChange={e => {
                    setImagenUrl(e.target.value);
                    if (e.target.value) setArchivo(null);
                  }}
                  disabled={!!archivo}
                  className={`${inputBase} ${archivo ? 'opacity-50' : ''}`}
                />
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
                className="block w-full min-w-0 max-w-full text-xs font-body text-ink-600
                           file:block file:w-full file:max-w-full sm:file:inline-flex sm:file:w-auto
                           file:mr-0 file:mb-2 sm:file:mr-3 sm:file:mb-0
                           file:py-2.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black
                           file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200"
              />
            </div>
            {previewSrc && (
              <div className="mt-3 flex justify-center">
                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-ink-100 bg-ink-50">
                  <img src={previewSrc} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-body font-bold text-red-600"
              style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.25)' }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* SECCIÓN INVENTARIO */}
          <div className="col-span-1 sm:col-span-2 bg-slate-50/50 border border-slate-200 rounded-xl p-4 sm:p-5 mt-1">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={stockIlimitado}
                onChange={e => setStockIlimitado(e.target.checked)}
                className="w-5 h-5 rounded-md border-2 border-ink-300 text-emerald-600 focus:ring-2 focus:ring-fiesta-magenta focus:ring-offset-1 shrink-0"
              />
              <span className="text-sm font-body font-black text-ink-800 leading-none mt-0.5">Stock Ilimitado</span>
            </label>
            
            {!stockIlimitado && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 animate-fade-in">
                <div className="w-full">
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
                <div className="w-full">
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

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-body font-black text-sm text-ink-600
                         border-2 border-ink-200 hover:bg-ink-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 py-3 rounded-2xl font-body font-black text-sm text-white
                         disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                boxShadow: enviando ? 'none' : '0 4px 16px #ff3dac44',
              }}
            >
              {enviando ? <Loader2 size={18} className="animate-spin" /> : null}
              {enviando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
