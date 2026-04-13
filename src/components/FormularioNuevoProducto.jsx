import { UploadCloud, X, Loader2, CheckCircle2, Link2 } from 'lucide-react';
import {
  categorias,
  marcas,
  tamanios,
  SIMBOLO_MONEDA,
  registrarCategoria,
  registrarMarca,
  registrarTamano,
} from '../data/productos';
import { insertarProducto } from '../lib/productosAdmin';
import SelectCategoria from './SelectCategoria';
import GestorPrecios from './GestorPrecios';
import Toggle from './ui/Toggle';
import {
  useProductForm,
  CATEGORIA_NUEVA_ID,
  MARCA_NUEVA_ID,
  TAMANO_NUEVO_ID,
} from '../hooks/useProductForm';
import { useLanguage } from '../hooks/useLanguage';



export default function FormularioNuevoProducto({ onProductoCreado, isModal = false }) {
  const { t } = useLanguage();
  const form = useProductForm(null);
  const {
    nombre, setNombre, descripcion, setDescripcion, precio, setPrecio,
    categoria, setCategoria, categoriaNueva, setCategoriaNueva,
    marca, setMarca, marcaNueva, setMarcaNueva,
    tamano, setTamano, tamanoNuevo, setTamanoNuevo,
    disponible, setDisponible, esNuevo, setEsNuevo,
    imagenUrl, setImagenUrl, archivo, setArchivo, fileRef,
    stockIlimitado, setStockIlimitado, stockActual, setStockActual,
    stockMinimo, setStockMinimo,
    mayoreoActivo, setMayoreoActivo, preciosMayoreo, setPreciosMayoreo,
    enviando, setEnviando, error, setError, exito, setExito,
    previewSrc, dragHover, onDragOver, onDragLeave, onDrop, onFileChange,
    touched, fieldErrors, handleBlur,
    buildPayload, reset,
  } = form;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito(false);
    setEnviando(true);
    try {
      const payload = await buildPayload();
      await insertarProducto(payload);

      if (categoria === CATEGORIA_NUEVA_ID && payload.categoria) registrarCategoria(payload.categoria);
      if (marca === MARCA_NUEVA_ID && payload.marca) registrarMarca(payload.marca);
      if (tamano === TAMANO_NUEVO_ID && payload.tamano) registrarTamano(payload.tamano);

      setExito(true);
      reset();
      onProductoCreado?.();
    } catch (err) {
      setError(err.message || t('admin.catalog.saveError'));
    } finally {
      setEnviando(false);
    }
  }


  return (
    <div className={isModal ? 'font-sans p-4 md:p-6' : 'min-h-full font-sans p-4 md:p-6 lg:p-8'}>
      <div className={`${isModal ? '' : 'bg-white rounded-2xl border border-ink-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'} p-6 md:p-8 w-full max-w-5xl mx-auto flex flex-col`}>
        
        {/* HEADER */}
        <div className="mb-6 border-b border-ink-100 pb-5">
          <h2 className="text-xl sm:text-2xl font-black text-ink-900 tracking-tight">{t('admin.catalog.newItem')}</h2>
          <p className="text-xs sm:text-sm font-medium text-ink-500 mt-1">{t('admin.form.subtitle')}</p>
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
                    <img src={previewSrc} alt="Vista previa" className="w-full h-full object-contain absolute inset-0 rounded-2xl" />
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
                      <p className="text-xs font-bold text-ink-700 mb-0.5">{t('admin.form.uploadImage')}</p>
                      <p className="text-[10px] font-medium text-ink-400">{t('admin.form.clickOrDrag')}</p>
                  </>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                onChange={onFileChange}
                className="hidden"
              />
              
              <div className="bg-ink-50 rounded-xl p-3 border border-transparent">
                <label htmlFor="fp-url" className="flex items-center gap-1 text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1.5">
                  <Link2 size={12} /> {t('admin.form.externalUrl')}
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
                  <h3 className="text-xs font-bold text-ink-900 leading-tight">{t('admin.catalog.active')}</h3>
                  <p className="text-[10px] font-medium text-ink-500">{t('admin.form.activeSale')}</p>
                </div>
                <Toggle id="toggle-visibilidad" checked={disponible} onChange={() => setDisponible(v => !v)} />
              </div>

              <div className="bg-ink-50 rounded-xl p-3 border border-transparent flex items-center justify-between w-full gap-3">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-ink-900 leading-tight">{t('admin.form.newTag')}</h3>
                  <p className="text-[10px] font-medium text-ink-500">{t('admin.form.firstInStore')}</p>
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
                    {t('admin.form.productName')} *
                  </label>
                  <input
                    id="fp-nombre"
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    onBlur={() => handleBlur('nombre')}
                    placeholder="Ej. Nombre del producto..."
                    required
                    maxLength={200}
                    className={`w-full bg-ink-50 border rounded-lg px-3 py-2 text-sm font-medium text-ink-900 focus:bg-white focus:border-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-200 transition-all shadow-sm ${touched.nombre && fieldErrors.nombre ? 'border-red-400' : 'border-transparent'}`}
                  />
                  {touched.nombre && fieldErrors.nombre && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{fieldErrors.nombre}</p>
                  )}
                </div>

                <div className="col-span-full md:col-span-2">
                  <label htmlFor="fp-precio" className="block text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">
                    {t('admin.form.retailPrice')} *
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
                      onBlur={() => handleBlur('precio')}
                      placeholder="0.00"
                      required
                      className={`w-full bg-ink-50 border rounded-lg pl-8 pr-3 py-2 text-sm font-medium text-ink-900 focus:bg-white focus:border-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-200 transition-all shadow-sm ${touched.precio && fieldErrors.precio ? 'border-red-400' : 'border-transparent'}`}
                    />
                  </div>
                  {touched.precio && fieldErrors.precio && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{fieldErrors.precio}</p>
                  )}
                </div>

                {/* Fila 2 */}
                <div className="col-span-full">
                  <label htmlFor="fp-desc" className="flex items-center justify-between text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">
                    <span>{t('admin.form.description')}</span>
                    <span className="normal-case opacity-70">{descripcion.length}/150</span>
                  </label>
                  <textarea
                    id="fp-desc"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    maxLength={150}
                    placeholder="Detalles sobre las medidas, usos..."
                    rows={2}
                    className="w-full bg-ink-50 border border-transparent rounded-lg px-3 py-2 text-sm font-medium text-ink-900 focus:bg-white focus:border-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-200 transition-all resize-none shadow-sm"
                  />
                </div>

                {/* Fila 3 compartida */}
                <div className="col-span-full md:col-span-2">
                  <label htmlFor="fp-cat" className="block text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">
                    {t('filters.category')} *
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
                       { id: CATEGORIA_NUEVA_ID, label: t('admin.form.addNewOption') },
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
                    {t('filters.brand')}
                  </label>
                  <SelectCategoria
                    id="fp-marca"
                    value={marca}
                    onChange={value => {
                      setMarca(value);
                      if (value !== MARCA_NUEVA_ID) setMarcaNueva('');
                    }}
                    lista={[
                       { id: '', label: t('admin.catalog.noBrand') },
                      ...marcas.map(m => ({ id: m, label: m })),
                       { id: MARCA_NUEVA_ID, label: t('admin.form.addNewOption') },
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
                    {t('filters.size')}
                  </label>
                  <SelectCategoria
                    id="fp-tamano"
                    value={tamano}
                    onChange={value => {
                      setTamano(value);
                      if (value !== TAMANO_NUEVO_ID) setTamanoNuevo('');
                    }}
                    lista={[
                       { id: '', label: t('admin.catalog.noSize') },
                      ...tamanios.map(t => ({ id: t, label: t })),
                       { id: TAMANO_NUEVO_ID, label: t('admin.form.addNewOption') },
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
                      <h4 className="text-sm font-bold text-gray-800 leading-tight">{t('admin.form.inventoryControl')}</h4>
                      <p className="text-xs font-medium text-gray-500">{t('admin.form.inventoryHelp')}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 shrink-0">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t('admin.catalog.unlimited')}</span>
                      <Toggle id="toggle-stock" checked={stockIlimitado} onChange={() => setStockIlimitado(v => !v)} />
                    </div>
                  </div>

                  {!stockIlimitado && (
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-gray-200 animate-fade-in">
                      <div className="flex flex-col justify-end h-full gap-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.form.currentStock')}</label>
                        <input
                          type="number"
                          min="0"
                          value={stockActual}
                          onChange={e => setStockActual(e.target.value)}
                          className="w-full bg-white border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex flex-col justify-end h-full gap-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.form.warnAt')}</label>
                        <input
                          type="number"
                          min="0"
                          value={stockMinimo}
                          onChange={e => setStockMinimo(e.target.value)}
                          className="w-full bg-white border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-full bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{t('product.wholesalePrices')}</h4>
                      <p className="text-xs font-medium text-gray-500">
                        {t('admin.form.wholesaleHelp')}
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
                      <CheckCircle2 size={16} /> {t('admin.form.productCreated')}
                    </span>
                  )}
                </div>
                
                {/* Botón Guardar - Diseño Pill Right-Aligned */}
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-bold rounded-full px-8 py-3 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {enviando && <Loader2 size={18} className="animate-spin" />}
                  {enviando ? t('admin.catalog.saving') : t('admin.form.saveProduct')}
                </button>
              </div>
              
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
