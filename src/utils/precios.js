export function obtenerPrecioAplicable(producto, cantidadEnCarrito) {
  const precioBase = Number(producto?.precio) || 0;
  if (!producto) return precioBase;

  let escalas = producto.precios_mayoreo;
  if (typeof escalas === 'string') {
    try {
      escalas = JSON.parse(escalas);
    } catch {
      escalas = [];
    }
  }

  if (!Array.isArray(escalas) || escalas.length === 0) return precioBase;

  const escalasValidas = escalas
    .map(e => ({
      cantidad_minima: Number(e?.cantidad_minima) || 0,
      precio: Number(e?.precio),
    }))
    .filter(e => e.cantidad_minima > 0 && Number.isFinite(e.precio) && e.precio >= 0)
    .sort((a, b) => b.cantidad_minima - a.cantidad_minima);

  const nivel = escalasValidas.find(e => cantidadEnCarrito >= e.cantidad_minima);
  return nivel ? nivel.precio : precioBase;
}
