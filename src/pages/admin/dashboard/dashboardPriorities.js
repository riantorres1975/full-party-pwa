export function calcularPrioridades(pedidos = [], stockAlerts = {}) {
  const activos = pedidos.filter((pedido) => pedido.estado !== 'Cancelado');
  const pagosPendientes = activos.filter((pedido) => pedido.pago_estado === 'pendiente');

  return {
    pedidosPorSurtir: activos.filter((pedido) => pedido.estado === 'Por Surtir').length,
    pagosPendientes: pagosPendientes.length,
    pagosPendientesTotal: pagosPendientes.reduce(
      (total, pedido) => total + (Number(pedido.total) || 0),
      0
    ),
    stockBajo: Number(stockAlerts.bajo) || 0,
    sinStock: Number(stockAlerts.sinStock) || 0,
  };
}
