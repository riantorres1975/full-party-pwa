export function summarizeSoldProducts(orders) {
  const products = new Map();
  for (const order of orders) {
    if (!Array.isArray(order.detalles_json)) continue;
    for (const item of order.detalles_json) {
      const key = item?.product_id || item?.id || item?.nombre;
      const quantity = Number(item?.cantidad_surtida ?? (item?.encontrado === false ? 0 : item?.cantidad));
      if (!key || !Number.isFinite(quantity) || quantity <= 0) continue;
      const price = Number(item.precio_surtido ?? item.precio) || 0;
      const product = products.get(key) ?? {
        id: key, nombre: item.nombre, imagen_url: item.imagen_url ?? null, cantidad: 0, ingresos: 0,
      };
      product.cantidad += quantity;
      product.ingresos += price * quantity;
      products.set(key, product);
    }
  }
  return [...products.values()];
}
