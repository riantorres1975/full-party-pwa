function normalizar(valor) {
  return typeof valor === 'string' ? valor.trim().toLocaleLowerCase('es-MX') : '';
}

function puntuarSimilitud(producto, seleccionado) {
  let puntuacion = 0;

  if (normalizar(producto.categoria) === normalizar(seleccionado.categoria)) puntuacion += 100;
  if (normalizar(producto.marca) === normalizar(seleccionado.marca)) puntuacion += 20;
  if (normalizar(producto.tamano) === normalizar(seleccionado.tamano)) puntuacion += 10;

  const precio = Number(producto.precio);
  const precioSeleccionado = Number(seleccionado.precio);
  if (precio > 0 && precioSeleccionado > 0) {
    const diferenciaRelativa = Math.abs(precio - precioSeleccionado) / precioSeleccionado;
    if (diferenciaRelativa <= 0.25) puntuacion += 2;
  }

  return puntuacion;
}

export function obtenerProductosRelacionados(productos, seleccionado, limite = 3) {
  if (!seleccionado || !Array.isArray(productos) || limite <= 0) return [];

  const idSeleccionado = String(seleccionado.id);
  const indiceSeleccionado = productos.findIndex(
    (producto) => String(producto.id) === idSeleccionado,
  );
  const total = productos.length;

  return productos
    .map((producto, indice) => ({
      producto,
      puntuacion: puntuarSimilitud(producto, seleccionado),
      distancia: indiceSeleccionado >= 0
        ? (indice - indiceSeleccionado + total) % total
        : indice + 1,
    }))
    .filter(({ producto, distancia }) => (
      String(producto.id) !== idSeleccionado &&
      producto.activo !== false &&
      distancia > 0
    ))
    .sort((a, b) => b.puntuacion - a.puntuacion || a.distancia - b.distancia)
    .slice(0, limite)
    .map(({ producto }) => producto);
}
