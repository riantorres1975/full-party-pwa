import { supabase } from './supabase';
import { guardedQuery, throwIfSessionError } from './supabaseGuard';

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

function errorColumnaFamiliaMayoreoInexistente(error) {
  const msg = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toUpperCase();
  const sinColumnaFamilia = msg.includes('familia_mayoreo') && (msg.includes('column') || msg.includes('schema cache'));
  return code === 'PGRST204' || sinColumnaFamilia;
}

function errorColumnaPreciosMayoreoInexistente(error) {
  const msg = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toUpperCase();
  return code === 'PGRST204' || (msg.includes('precios_mayoreo') && (msg.includes('column') || msg.includes('schema cache')));
}

function errorColumnaEsNuevoInexistente(error) {
  const msg = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toUpperCase();
  return code === 'PGRST204' || (msg.includes('es_nuevo') && (msg.includes('column') || msg.includes('schema cache')));
}

/** Tamaño máximo para imágenes de producto: 5 MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Extensiones y MIME types permitidos */
const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/** Magic bytes de formatos de imagen válidos */
const IMAGE_SIGNATURES = [
  [0xFF, 0xD8, 0xFF],                   // JPEG
  [0x89, 0x50, 0x4E, 0x47],             // PNG
  [0x47, 0x49, 0x46],                   // GIF
  [0x52, 0x49, 0x46, 0x46],             // WebP (RIFF container)
];

/**
 * Valida que los primeros bytes del archivo correspondan a un formato de imagen real.
 * Previene subir archivos maliciosos renombrados con extensión de imagen.
 */
async function validateImageSignature(file) {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return IMAGE_SIGNATURES.some(sig =>
    sig.every((byte, i) => bytes[i] === byte)
  );
}

/**
 * Sube un archivo al bucket de imágenes y devuelve la URL pública.
 * Valida: tipo, tamaño, extensión y magic bytes del archivo.
 * Requiere bucket `productos-imagenes` y políticas de Storage para usuarios autenticados.
 */
export async function subirImagenProducto(file) {
  if (!file || !(file instanceof File)) {
    throw new Error('Selecciona un archivo de imagen válido.');
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`La imagen excede el límite de 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
  }

  // Validar MIME type
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error('Formato de imagen no permitido. Usa JPG, PNG, GIF, WebP o AVIF.');
  }

  // Validar magic bytes (previene archivos renombrados)
  const validSignature = await validateImageSignature(file);
  if (!validSignature) {
    throw new Error('El archivo no parece ser una imagen válida.');
  }

  const path = `${randomId()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET_IMAGENES_PRODUCTOS)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (upErr) {
    console.error('[subirImagen]', upErr.message);
    throw new Error(
      upErr.message.includes('Bucket not found') || upErr.message.includes('not found')
        ? 'El bucket de imágenes no está configurado en Supabase.'
        : 'No se pudo subir la imagen. Intenta de nuevo.'
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
  stock_ilimitado = true,
  stock_actual = 0,
  stock_minimo = 5,
  es_nuevo = false,
  precios_mayoreo,
  familia_mayoreo,
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
    stock_ilimitado: stock_ilimitado !== false,
    stock_actual: Number(stock_actual),
    stock_minimo: Number(stock_minimo),
    es_nuevo: es_nuevo === true,
    activo,
  };

  if (Array.isArray(precios_mayoreo)) {
    row.precios_mayoreo = precios_mayoreo;
  } else if (typeof familia_mayoreo === 'string' && familia_mayoreo.trim()) {
    row.familia_mayoreo = familia_mayoreo;
  }

  let { data, error } = await supabase.from('productos').insert(row).select().single();

  if (error && row.familia_mayoreo && errorColumnaFamiliaMayoreoInexistente(error)) {
    const { familia_mayoreo: _omitFamiliaMayoreo, precios_mayoreo: _omitPreciosMayoreo, ...rowSinMayoreo } = row;
    ({ data, error } = await supabase.from('productos').insert(rowSinMayoreo).select().single());
  }

  if (error && row.precios_mayoreo && errorColumnaPreciosMayoreoInexistente(error)) {
    throw new Error('La columna precios_mayoreo no está disponible en la API de Supabase (schema cache). Recarga el proyecto/API y vuelve a intentar.');
  }

  if (error && errorColumnaEsNuevoInexistente(error)) {
    const { es_nuevo: _omitEsNuevo, ...rowSinEsNuevo } = row;
    ({ data, error } = await supabase.from('productos').insert(rowSinEsNuevo).select().single());
  }

  await throwIfSessionError(error);

  if (error) {
    console.error('[insertarProducto]', error.code, error.message);
    throw new Error('No se pudo guardar el producto. Intenta de nuevo.');
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
  stock_ilimitado,
  stock_actual,
  stock_minimo,
  es_nuevo,
  precios_mayoreo,
  familia_mayoreo,
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
    stock_ilimitado: stock_ilimitado !== false,
    stock_actual: stock_actual != null ? Number(stock_actual) : null,
    stock_minimo: stock_minimo != null ? Number(stock_minimo) : null,
    es_nuevo: es_nuevo === true,
    activo: activo !== false,
  };

  if (Array.isArray(precios_mayoreo)) {
    row.precios_mayoreo = precios_mayoreo;
  } else if (typeof familia_mayoreo === 'string' && familia_mayoreo.trim()) {
    row.familia_mayoreo = familia_mayoreo;
  }

  // Remove keys with null if we don't want to omit them? Let's just pass them. In this case, passing null for numbers clears them. Better to ensure numbers.
  if (row.stock_actual === null) delete row.stock_actual;
  if (row.stock_minimo === null) delete row.stock_minimo;

  let { data, error } = await supabase.from('productos').update(row).eq('id', id).select().single();

  if (error && row.familia_mayoreo && errorColumnaFamiliaMayoreoInexistente(error)) {
    const { familia_mayoreo: _omitFamiliaMayoreo, precios_mayoreo: _omitPreciosMayoreo, ...rowSinMayoreo } = row;
    ({ data, error } = await supabase.from('productos').update(rowSinMayoreo).eq('id', id).select().single());
  }

  if (error && row.precios_mayoreo && errorColumnaPreciosMayoreoInexistente(error)) {
    throw new Error('La columna precios_mayoreo no está disponible en la API de Supabase (schema cache). Recarga el proyecto/API y vuelve a intentar.');
  }

  if (error && errorColumnaEsNuevoInexistente(error)) {
    const { es_nuevo: _omitEsNuevo, ...rowSinEsNuevo } = row;
    ({ data, error } = await supabase.from('productos').update(rowSinEsNuevo).eq('id', id).select().single());
  }

  await throwIfSessionError(error);

  if (error) {
    console.error('[actualizarProducto]', error.code, error.message);
    throw new Error('No se pudo actualizar el producto. Intenta de nuevo.');
  }

  return data;
}

/** Solo cambia disponibilidad (activo) — útil para toggles en inventario. */
export async function renameCategoria(vieja, nueva) {
  throwIfSessionError(await guardedQuery(() =>
    supabase.from('productos').update({ categoria: nueva }).eq('categoria', vieja)
  ));
}

export async function eliminarCategoria(nombre) {
  throwIfSessionError(await guardedQuery(() =>
    supabase.from('productos').update({ categoria: null }).eq('categoria', nombre)
  ));
}

export async function renameMarca(vieja, nueva) {
  throwIfSessionError(await guardedQuery(() =>
    supabase.from('productos').update({ marca: nueva }).eq('marca', vieja)
  ));
}

export async function eliminarMarca(nombre) {
  throwIfSessionError(await guardedQuery(() =>
    supabase.from('productos').update({ marca: null }).eq('marca', nombre)
  ));
}

export async function renameTamano(viejo, nuevo) {
  throwIfSessionError(await guardedQuery(() =>
    supabase.from('productos').update({ tamano: nuevo }).eq('tamano', viejo)
  ));
}

export async function eliminarTamano(nombre) {
  throwIfSessionError(await guardedQuery(() =>
    supabase.from('productos').update({ tamano: null }).eq('tamano', nombre)
  ));
}

export async function actualizarDisponibilidadProducto(id, activo) {
  const { data, error } = await supabase
    .from('productos')
    .update({ activo: !!activo })
    .eq('id', id)
    .select()
    .single();

  await throwIfSessionError(error);

  if (error) {
    console.error('[actualizarDisponibilidad]', error.code, error.message);
    throw new Error('No se pudo actualizar la disponibilidad.');
  }

  return data;
}

export async function eliminarProducto(id) {
  if (!id) throw new Error('Falta el id del producto.');
  const { error } = await supabase.from('productos').delete().eq('id', id);

  await throwIfSessionError(error);

  if (error) {
    console.error('[eliminarProducto]', error.code, error.message);
    throw new Error('No se pudo eliminar el producto.');
  }
}
