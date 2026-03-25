import { supabase } from './supabase';

/** Bucket público para fotos de producto (crear en Supabase + políticas; ver supabase_storage_productos.sql) */
export const BUCKET_IMAGENES_PRODUCTOS = 'productos-imagenes';

/**
 * ID único para rutas de archivo. `crypto.randomUUID()` solo existe en contextos seguros (HTTPS / localhost);
 * en HTTP (p. ej. IP en la red local) hay que usar un respaldo.
 */
function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Sube un archivo al bucket de imágenes y devuelve la URL pública.
 * Requiere bucket `productos-imagenes` y políticas de Storage para usuarios autenticados.
 */
export async function subirImagenProducto(file) {
  if (!file || !(file instanceof File)) {
    throw new Error('Selecciona un archivo de imagen válido.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext) ? ext : 'jpg';
  const path = `${randomId()}.${safeExt}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET_IMAGENES_PRODUCTOS)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`,
    });

  if (upErr) {
    throw new Error(
      upErr.message.includes('Bucket not found') || upErr.message.includes('not found')
        ? 'El bucket de imágenes no está configurado en Supabase. Usa una URL externa o ejecuta supabase_storage_productos.sql'
        : `No se pudo subir la imagen: ${upErr.message}`
    );
  }

  const { data } = supabase.storage.from(BUCKET_IMAGENES_PRODUCTOS).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Inserta un producto en la tabla `productos`.
 * @param {object} payload
 * @param {string} payload.nombre
 * @param {string} [payload.descripcion]
 * @param {number} payload.precio
 * @param {string} [payload.categoria]
 * @param {string|null} [payload.marca] — opcional; vacío → null
 * @param {string|null} [payload.tamano] — opcional; vacío → null (columna `tamano` en BD)
 * @param {string|null} [payload.imagen_url]
 * @param {boolean} [payload.activo=true] — true = disponible en tienda
 */
export async function insertarProducto({
  nombre,
  descripcion,
  precio,
  categoria,
  marca,
  tamano,
  imagen_url,
  activo = true,
}) {
  const precioNum = typeof precio === 'string' ? parseFloat(precio.replace(',', '.')) : Number(precio);
  if (!nombre?.trim()) throw new Error('El nombre del producto es obligatorio.');
  if (Number.isNaN(precioNum) || precioNum < 0) throw new Error('Indica un precio válido (mayor o igual a 0).');

  const marcaStr = typeof marca === 'string' ? marca.trim() : '';
  const tamanoStr = typeof tamano === 'string' ? tamano.trim() : '';

  const row = {
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || null,
    precio: precioNum,
    categoria: categoria?.trim() || null,
    marca: marcaStr || null,
    tamano: tamanoStr || null,
    imagen_url: imagen_url?.trim() || null,
    activo,
  };

  const { data, error } = await supabase.from('productos').insert(row).select().single();

  if (error) {
    throw new Error(error.message || 'No se pudo guardar el producto.');
  }

  return data;
}

/**
 * Actualiza un producto existente (mismos campos que insertar, excepto id).
 */
export async function actualizarProducto(id, {
  nombre,
  descripcion,
  precio,
  categoria,
  marca,
  tamano,
  imagen_url,
  activo,
}) {
  if (!id) throw new Error('Falta el id del producto.');
  const precioNum = typeof precio === 'string' ? parseFloat(precio.replace(',', '.')) : Number(precio);
  if (!nombre?.trim()) throw new Error('El nombre del producto es obligatorio.');
  if (Number.isNaN(precioNum) || precioNum < 0) throw new Error('Indica un precio válido (mayor o igual a 0).');

  const marcaStr = typeof marca === 'string' ? marca.trim() : '';
  const tamanoStr = typeof tamano === 'string' ? tamano.trim() : '';

  const row = {
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || null,
    precio: precioNum,
    categoria: categoria?.trim() || null,
    marca: marcaStr || null,
    tamano: tamanoStr || null,
    imagen_url: imagen_url?.trim() || null,
    activo: activo !== false,
  };

  const { data, error } = await supabase.from('productos').update(row).eq('id', id).select().single();

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar el producto.');
  }

  return data;
}

/** Solo cambia disponibilidad (activo) — útil para toggles en inventario. */
export async function actualizarDisponibilidadProducto(id, activo) {
  const { data, error } = await supabase
    .from('productos')
    .update({ activo: !!activo })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar la disponibilidad.');
  }

  return data;
}

export async function eliminarProducto(id) {
  if (!id) throw new Error('Falta el id del producto.');
  const { error } = await supabase.from('productos').delete().eq('id', id);

  if (error) {
    throw new Error(error.message || 'No se pudo eliminar el producto.');
  }
}
