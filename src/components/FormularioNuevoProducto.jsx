import { useState, useRef, useEffect } from 'react';
import { ImagePlus, Link2, Loader2, CheckCircle2 } from 'lucide-react';
import { categorias, SIMBOLO_MONEDA } from '../data/productos';
import { insertarProducto, subirImagenProducto } from '../lib/productosAdmin';
import SelectCategoria from './SelectCategoria';

const inputBase =
  'w-full bg-white rounded-2xl px-4 py-3 text-sm font-body font-semibold ' +
  'text-ink-900 placeholder:text-ink-300 outline-none border-2 border-ink-200 ' +
  'focus:border-fiesta-magenta transition-colors';

export default function FormularioNuevoProducto({ onProductoCreado }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState(categorias[0]?.id ?? '');
  const [marca, setMarca] = useState('');
  const [tamano, setTamano] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [imagenUrl, setImagenUrl] = useState('');
  const [archivo, setArchivo] = useState(null);
  const fileRef = useRef(null);

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
    setMarca('');
    setTamano('');
    setDisponible(true);
    setImagenUrl('');
    setArchivo(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito(false);
    setEnviando(true);

    try {
      let urlFinal = imagenUrl.trim() || null;

      if (archivo) {
        urlFinal = await subirImagenProducto(archivo);
      }

      await insertarProducto({
        nombre,
        descripcion,
        precio,
        categoria: categoria || null,
        marca,
        tamano,
        imagen_url: urlFinal,
        activo: disponible,
      });

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
                 max-h-[calc(100dvh-19rem)] sm:max-h-[calc(100dvh-15.5rem)] md:max-h-[calc(100dvh-13rem)]"
      style={{ boxShadow: '0 4px 24px rgba(107, 53, 184, 0.08)' }}
    >
      <div className="shrink-0 flex items-start gap-2 sm:gap-3 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-purple-100/80">
        <span className="text-3xl flex-shrink-0">📦</span>
        <div>
          <h2 className="font-display text-lg text-ink-900">Nuevo artículo</h2>
          <p className="text-xs font-body text-ink-400 mt-0.5 leading-relaxed">
            Los datos se guardan en Supabase. La disponibilidad controla si el artículo se muestra como
            disponible o agotado en el catálogo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 sm:px-6 py-3 space-y-3
                     [scrollbar-width:thin] [scrollbar-color:rgba(107,53,184,0.35)_transparent] pr-2 -mr-0.5"
        >
        <div>
          <label htmlFor="fp-nombre" className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
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
          <label htmlFor="fp-desc" className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
            Descripción
          </label>
          <textarea
            id="fp-desc"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Detalles para tus clientes…"
            rows={3}
            className={`${inputBase} resize-y min-h-[70px]`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <div className="min-w-0">
            <label htmlFor="fp-precio" className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
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
            <label htmlFor="fp-cat" className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
              Categoría
            </label>
            <SelectCategoria
              id="fp-cat"
              value={categoria}
              onChange={setCategoria}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-0">
          <div className="min-w-0">
            <label htmlFor="fp-marca" className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
              Marca <span className="font-normal text-ink-400">(opcional)</span>
            </label>
            <input
              id="fp-marca"
              type="text"
              value={marca}
              onChange={e => setMarca(e.target.value)}
              placeholder="Ej. Sempertex"
              maxLength={120}
              className={inputBase}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="fp-tamano" className="block text-xs font-body font-black text-ink-600 mb-1.5 pl-1">
              Tamaño <span className="font-normal text-ink-400">(opcional)</span>
            </label>
            <input
              id="fp-tamano"
              type="text"
              value={tamano}
              onChange={e => setTamano(e.target.value)}
              placeholder="Ej. 12 pulgadas"
              maxLength={120}
              className={inputBase}
            />
          </div>
        </div>

        {/* Disponibilidad — activo en BD */}
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
              <p className="text-[11px] font-body text-ink-400 mt-0.5 leading-relaxed">
                Si desmarcas, el artículo se mostrará como agotado en el catálogo (sin cantidades en inventario).
              </p>
            </div>
          </label>
        </div>

        {/* Imagen: URL o archivo */}
        <div className="rounded-2xl p-3 sm:p-4 border-2 border-dashed border-purple-200 min-w-0"
             style={{ background: 'linear-gradient(180deg, #fefcff 0%, #f8f4ff 100%)' }}>
          <p className="text-xs font-body font-black text-ink-700 mb-2 flex items-center gap-2">
            <ImagePlus size={16} className="text-fiesta-magenta" />
            Imagen del producto
          </p>

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
              <label htmlFor="fp-url" className="flex items-center gap-1.5 text-[11px] font-body font-bold text-ink-500 mb-1">
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
                className={`${inputBase} ${archivo ? 'opacity-50' : ''}`}
              />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-body font-bold text-ink-500 mb-1">
                  Seleccionar archivo
                </p>
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
              <p className="text-[10px] font-body text-ink-400 mt-1">
                Si eliges archivo, se usará en lugar del enlace. Requiere bucket <code className="text-purple-700">productos-imagenes</code> en Supabase.
              </p>
              </div>
            </div>

          {previewSrc && (
            <div className="mt-3 flex justify-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-ink-100 bg-ink-50">
                <img src={previewSrc} alt="Vista previa" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
        </div>

        <div
          className="shrink-0 px-4 sm:px-6 pb-3 sm:pb-5 pt-3 space-y-2 border-t border-purple-100"
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
            className="w-full py-3.5 rounded-2xl font-body font-black text-base text-white
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
      </div>
      </form>
    </div>
  );
}
