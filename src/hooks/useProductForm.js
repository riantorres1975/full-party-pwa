import { useState, useRef, useEffect, useCallback } from 'react';
import { categorias } from '../data/productos';
import { toTitleCase } from '../utils/normalizar';
import { subirImagenProducto } from '../lib/productosAdmin';

export const CATEGORIA_NUEVA_ID = '__agregar_nueva__';
export const MARCA_NUEVA_ID = '__agregar_marca__';
export const TAMANO_NUEVO_ID = '__agregar_tamano__';
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function parsearPreciosMayoreo(producto) {
  const valor = producto?.precios_mayoreo ?? producto?.familia_mayoreo;
  let lista = [];

  if (Array.isArray(valor)) {
    lista = valor;
  } else if (typeof valor === 'string' && valor.trim()) {
    try {
      const parsed = JSON.parse(valor);
      if (Array.isArray(parsed)) lista = parsed;
    } catch { lista = []; }
  }

  const normalizados = lista
    .map((item, index) => ({
      id: item?.id ?? `${Date.now()}-${index}`,
      etiqueta: String(item?.etiqueta ?? '').trim(),
      cantidad_minima: Math.max(1, Number(item?.cantidad_minima) || 1),
      precio: Math.max(0, Number(item?.precio) || 0),
    }))
    .filter(item => item.id != null);

  if (normalizados.length > 0) return normalizados;
  return [{ id: Date.now(), etiqueta: '', cantidad_minima: '', precio: '' }];
}

const emptyRow = () => ({ id: Date.now(), etiqueta: '', cantidad_minima: '', precio: '' });

/**
 * Hook compartido para los formularios de crear y editar producto.
 * Centraliza estado, validación inline, construcción de payload y subida de imagen.
 *
 * @param {object|null} producto — producto existente (modo edición) o null (modo creación)
 */
export function useProductForm(producto = null) {
  const isEdit = !!producto;

  // ── Estado de campos ──────────────────────────────────────────
  const [nombre, setNombre] = useState(isEdit ? (producto.nombre ?? '') : '');
  const [descripcion, setDescripcion] = useState(isEdit ? (producto.descripcion ?? '') : '');
  const [precio, setPrecio] = useState(isEdit ? (producto.precio != null ? String(producto.precio) : '') : '');

  const [categoria, setCategoria] = useState(isEdit ? (producto.categoria || categorias[0]?.id || '') : (categorias[0]?.id ?? ''));
  const [categoriaNueva, setCategoriaNueva] = useState('');
  const [marca, setMarca] = useState(isEdit ? (producto.marca ?? 'Genérico') : 'Genérico');
  const [marcaNueva, setMarcaNueva] = useState('');
  const [tamano, setTamano] = useState(isEdit ? (producto.tamano ?? '') : '');
  const [tamanoNuevo, setTamanoNuevo] = useState('');

  const [disponible, setDisponible] = useState(isEdit ? (producto.activo !== false) : true);
  const [esNuevo, setEsNuevo] = useState(isEdit ? (producto.es_nuevo === true) : false);

  const [imagenUrl, setImagenUrl] = useState(isEdit ? (producto.imagen_url ?? '') : '');
  const [archivo, setArchivo] = useState(null);
  const fileRef = useRef(null);

  const [stockIlimitado, setStockIlimitado] = useState(isEdit ? (producto.stock_ilimitado !== false) : true);
  const [stockActual, setStockActual] = useState(isEdit ? (producto.stock_actual != null ? String(producto.stock_actual) : '') : '');
  const [agregarStock, setAgregarStock] = useState('');
  const [stockMinimo, setStockMinimo] = useState(isEdit ? (producto.stock_minimo != null ? String(producto.stock_minimo) : '5') : '5');

  const preciosIniciales = isEdit ? parsearPreciosMayoreo(producto) : [emptyRow()];
  const [mayoreoActivo, setMayoreoActivo] = useState(
    isEdit ? preciosIniciales.some(p => Number(p?.cantidad_minima) > 1) : false
  );
  const [preciosMayoreo, setPreciosMayoreo] = useState(preciosIniciales);

  // ── Estado del formulario ─────────────────────────────────────
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [previewLocal, setPreviewLocal] = useState(null);
  const [dragHover, setDragHover] = useState(false);

  // ── Validación inline ─────────────────────────────────────────
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'nombre':
        if (!value || !value.trim()) return 'El nombre es obligatorio.';
        if (value.length > 200) return 'Máximo 200 caracteres.';
        return '';
      case 'precio':
        if (value === '' || value == null) return 'El precio es obligatorio.';
        if (Number(value) < 0) return 'No puede ser negativo.';
        return '';
      case 'stockActual':
        if (!stockIlimitado && (value === '' || Number(value) < 0)) return 'Stock inválido.';
        return '';
      case 'categoriaNueva':
        if (categoria === CATEGORIA_NUEVA_ID && (!value || !value.trim())) return 'Escribe el nombre de la nueva categoría.';
        return '';
      default:
        return '';
    }
  }, [stockIlimitado, categoria]);

  const handleBlur = useCallback((name) => {
    const valueMap = { nombre, precio, stockActual, categoriaNueva };
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, valueMap[name]) }));
  }, [nombre, precio, stockActual, categoriaNueva, validateField]);

  // ── Vista previa de imagen ────────────────────────────────────
  useEffect(() => {
    if (!archivo) { setPreviewLocal(null); return; }
    const url = URL.createObjectURL(archivo);
    setPreviewLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const previewSrc = previewLocal || imagenUrl.trim() || null;

  // ── Validación de archivo ─────────────────────────────────────
  function validateAndSetFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(`La imagen excede el límite de 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    setArchivo(file);
    setImagenUrl('');
    setError('');
  }

  // ── Drag handlers ─────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDragHover(true); };
  const onDragLeave = (e) => { e.preventDefault(); setDragHover(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setDragHover(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
    else setArchivo(null);
  };

  // ── Setters con limpieza de "nuevos" ──────────────────────────
  const handleSetCategoria = (value) => {
    setCategoria(value);
    if (value !== CATEGORIA_NUEVA_ID) setCategoriaNueva('');
  };
  const handleSetMarca = (value) => {
    setMarca(value);
    if (value !== MARCA_NUEVA_ID) setMarcaNueva('');
  };
  const handleSetTamano = (value) => {
    setTamano(value);
    if (value !== TAMANO_NUEVO_ID) setTamanoNuevo('');
  };

  // ── Construir payload validado ────────────────────────────────
  async function buildPayload() {
    const categoriaFinal = toTitleCase(
      categoria === CATEGORIA_NUEVA_ID ? categoriaNueva : categoria
    );
    const marcaFinal = toTitleCase(
      marca === MARCA_NUEVA_ID ? marcaNueva : marca
    );
    const tamanoFinal = toTitleCase(
      tamano === TAMANO_NUEVO_ID ? tamanoNuevo : tamano
    );

    if (!nombre.trim()) throw new Error('El nombre del producto es obligatorio.');
    if (categoria === CATEGORIA_NUEVA_ID && !categoriaFinal) {
      throw new Error('Escribe el nombre de la nueva categoría.');
    }

    let urlFinal = imagenUrl.trim() || null;
    if (archivo) {
      urlFinal = await subirImagenProducto(archivo, { nombreProducto: nombre });
    }

    const precioBaseNum = Math.max(0, Number(precio) || 0);
    const filasMayoreo = (preciosMayoreo || []).map((item, idx) => {
      const etiqueta = String(item?.etiqueta ?? '').trim();
      const cantidadMinima = Number(item?.cantidad_minima);
      const precioEscala = Number(item?.precio);
      return {
        idx, etiqueta, cantidadMinima, precioEscala,
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
      .map(f => ({ etiqueta: f.etiqueta, cantidad_minima: f.cantidadMinima, precio: f.precioEscala }));

    const preciosMayoreoFinal = mayoreoActivo
      ? (preciosParaGuardar.length > 0 ? preciosParaGuardar : [{ etiqueta: '1 Pieza', cantidad_minima: 1, precio: precioBaseNum }])
      : [{ etiqueta: '1 Pieza', cantidad_minima: 1, precio: precioBaseNum }];

    return {
      nombre: toTitleCase(nombre),
      descripcion,
      precio,
      categoria: categoriaFinal || null,
      marca: marcaFinal || null,
      tamano: tamanoFinal || null,
      imagen_url: urlFinal,
      stock_ilimitado: stockIlimitado,
      stock_actual: isEdit
        ? (Number(stockActual) || 0) + (Number(agregarStock) || 0)
        : (stockActual ? Number(stockActual) : 0),
      stock_minimo: stockMinimo ? Number(stockMinimo) : 5,
      es_nuevo: esNuevo,
      precios_mayoreo: preciosMayoreoFinal,
      activo: disponible,
    };
  }

  // ── Reset ─────────────────────────────────────────────────────
  function reset() {
    setNombre(''); setDescripcion(''); setPrecio('');
    setCategoria(categorias[0]?.id ?? ''); setCategoriaNueva('');
    setMarca('Genérico'); setMarcaNueva('');
    setTamano(''); setTamanoNuevo('');
    setDisponible(true); setEsNuevo(false);
    setImagenUrl(''); setArchivo(null);
    setStockIlimitado(true); setStockActual(''); setAgregarStock(''); setStockMinimo('5');
    setMayoreoActivo(false);
    setPreciosMayoreo([emptyRow()]);
    setTouched({}); setFieldErrors({});
    setError(''); setExito(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return {
    // Fields
    nombre, setNombre,
    descripcion, setDescripcion,
    precio, setPrecio,
    categoria, setCategoria: handleSetCategoria,
    categoriaNueva, setCategoriaNueva,
    marca, setMarca: handleSetMarca,
    marcaNueva, setMarcaNueva,
    tamano, setTamano: handleSetTamano,
    tamanoNuevo, setTamanoNuevo,
    disponible, setDisponible,
    esNuevo, setEsNuevo,
    imagenUrl, setImagenUrl,
    archivo, setArchivo,
    fileRef,
    stockIlimitado, setStockIlimitado,
    stockActual, setStockActual,
    agregarStock, setAgregarStock,
    stockMinimo, setStockMinimo,
    mayoreoActivo, setMayoreoActivo,
    preciosMayoreo, setPreciosMayoreo,
    // Form state
    enviando, setEnviando,
    error, setError,
    exito, setExito,
    // Image
    previewLocal, previewSrc,
    dragHover, onDragOver, onDragLeave, onDrop, onFileChange,
    validateAndSetFile,
    // Validation
    touched, fieldErrors, handleBlur,
    // Helpers
    buildPayload, reset, isEdit,
  };
}
