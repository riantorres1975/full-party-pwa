export function obtenerEscalasMayoreo(producto) {
  if (!producto) return [];
  let escalas = producto.precios_mayoreo;
  if (typeof escalas === 'string') {
    try {
      escalas = JSON.parse(escalas);
    } catch {
      escalas = [];
    }
  }

  if (!Array.isArray(escalas) || escalas.length === 0) return [];

  return escalas
    .map(e => ({
      cantidad_minima: Number(e?.cantidad_minima) || 0,
      precio: Number(e?.precio),
    }))
    .filter(e => e.cantidad_minima > 0 && Number.isFinite(e.precio) && e.precio >= 0)
    .sort((a, b) => a.cantidad_minima - b.cantidad_minima);
}

export function obtenerPrecioAplicable(producto, cantidadEnCarrito) {
  const precioBase = Number(producto?.precio) || 0;
  if (!producto) return precioBase;

  const nivel = [...obtenerEscalasMayoreo(producto)]
    .reverse()
    .find(e => cantidadEnCarrito >= e.cantidad_minima);
  return nivel ? nivel.precio : precioBase;
}

export function obtenerSiguienteEscalaMayoreo(producto, cantidadEnCarrito) {
  if (!producto || cantidadEnCarrito < 1) return null;

  const precioActual = obtenerPrecioAplicable(producto, cantidadEnCarrito);
  const siguiente = obtenerEscalasMayoreo(producto).find(
    (escala) => escala.cantidad_minima > cantidadEnCarrito && escala.precio < precioActual,
  );

  if (!siguiente) return null;
  return {
    ...siguiente,
    faltantes: siguiente.cantidad_minima - cantidadEnCarrito,
  };
}
