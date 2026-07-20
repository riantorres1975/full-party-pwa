import { validarTelefonoMX } from '../../../utils/validarTelefono.js';

function normalizeWhatsapp(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('521')) return digits.slice(3);
  if (digits.length === 12 && digits.startsWith('52')) return digits.slice(2);
  return digits;
}

function isValidHttpUrl(value = '') {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateTiendaConfig(info, sucursales, redes) {
  const errors = {};

  if (!info.nombre.trim()) {
    errors['tienda-nombre'] = 'tienda.validacion.nombre';
  }

  if (!validarTelefonoMX(normalizeWhatsapp(info.whatsapp)).valido) {
    errors['tienda-whatsapp'] = 'tienda.validacion.whatsapp';
  }

  if (!isValidHttpUrl(info.maps_url)) {
    errors['tienda-maps-url'] = 'tienda.validacion.url';
  }

  sucursales.forEach((sucursal) => {
    if (!sucursal.nombre.trim()) {
      errors[`sucursal-${sucursal.id}-nombre`] = 'tienda.validacion.sucursalNombre';
    }
    if (!sucursal.direccion.trim()) {
      errors[`sucursal-${sucursal.id}-direccion`] = 'tienda.validacion.sucursalDireccion';
    }
    if (!isValidHttpUrl(sucursal.maps_url)) {
      errors[`sucursal-${sucursal.id}-maps-url`] = 'tienda.validacion.url';
    }
    if (!isValidHttpUrl(sucursal.facebook)) {
      errors[`sucursal-${sucursal.id}-facebook`] = 'tienda.validacion.url';
    }
  });

  Object.entries(redes).forEach(([network, value]) => {
    if (!isValidHttpUrl(value)) {
      errors[`redes-${network}`] = 'tienda.validacion.url';
    }
  });

  return errors;
}
