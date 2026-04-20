import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { guardedQuery } from '../../../../lib/supabaseGuard';

export function useDashboardData({ desde, hasta }) {
  const [data, setData] = useState({
    kpis: { ingresos: 0, pedidos: 0, ticketPromedio: 0, clientesUnicos: 0 },
    kpisAnterior: { ingresos: 0, pedidos: 0, ticketPromedio: 0, clientesUnicos: 0 },
    ventasDiarias: [],
    pedidosPorEstado: [],
    topProductos: [],
    ultimosPedidos: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!desde || !hasta) return;

    setLoading(true);
    setError(null);

    try {
      // Calcular periodo anterior para comparación
      const diasPeriodo = Math.floor((hasta - desde) / (1000 * 60 * 60 * 24));
      const desdeAnterior = new Date(desde.getTime() - diasPeriodo * 24 * 60 * 60 * 1000);
      const hastaAnterior = desde;

      // Query periodo actual
      const { data: pedidosActual, error: errActual } = await guardedQuery((client) =>
        client
          .from('pedidos')
          .select('id,estado,total,cliente_telefono,created_at,detalles_json')
          .gte('created_at', desde.toISOString())
          .lte('created_at', hasta.toISOString())
      );

      // Query periodo anterior
      const { data: pedidosAnterior, error: errAnterior } = await guardedQuery((client) =>
        client
          .from('pedidos')
          .select('id,estado,total,cliente_telefono,created_at,detalles_json')
          .gte('created_at', desdeAnterior.toISOString())
          .lte('created_at', hastaAnterior.toISOString())
      );

      if (errActual) throw new Error(errActual.message);
      if (errAnterior) throw new Error(errAnterior.message);

      const actual = pedidosActual || [];
      const anterior = pedidosAnterior || [];

      // Calcular KPIs (excluyendo cancelados de ingresos)
      const pedidosNoCancel = actual.filter(p => p.estado !== 'Cancelado');
      const ingresos = pedidosNoCancel.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
      const ticketPromedio = pedidosNoCancel.length > 0 ? ingresos / pedidosNoCancel.length : 0;
      const clientesUnicos = new Set(actual.map(p => normalizarTelefono(p.cliente_telefono))).size;

      // Calcular KPIs periodo anterior
      const pedidosNoCancel_Ant = anterior.filter(p => p.estado !== 'Cancelado');
      const ingresos_Ant = pedidosNoCancel_Ant.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
      const ticketPromedio_Ant = pedidosNoCancel_Ant.length > 0 ? ingresos_Ant / pedidosNoCancel_Ant.length : 0;
      const clientesUnicos_Ant = new Set(anterior.map(p => normalizarTelefono(p.cliente_telefono))).size;

      // Ventas diarias
      const ventasPorDia = {};
      actual.forEach(p => {
        if (p.estado === 'Cancelado') return;
        const fecha = p.created_at.split('T')[0];
        if (!ventasPorDia[fecha]) ventasPorDia[fecha] = { fecha, total: 0, pedidos: 0 };
        ventasPorDia[fecha].total += Number(p.total) || 0;
        ventasPorDia[fecha].pedidos += 1;
      });
      const ventasDiarias = Object.values(ventasPorDia).sort((a, b) => a.fecha.localeCompare(b.fecha));

      // Pedidos por estado
      const estadoCounts = {};
      actual.forEach(p => {
        estadoCounts[p.estado] = (estadoCounts[p.estado] || 0) + 1;
      });
      const pedidosPorEstado = Object.entries(estadoCounts).map(([estado, count]) => ({ estado, count }));

      // Top productos
      const productoCounts = {};
      actual.forEach(p => {
        if (p.estado === 'Cancelado') return;
        const items = Array.isArray(p.detalles_json) ? p.detalles_json : [];
        items.forEach(item => {
          const key = item.id || item.nombre;
          if (!key) return;
          if (!productoCounts[key]) {
            productoCounts[key] = {
              id: item.id,
              nombre: item.nombre,
              cantidad: 0,
              ingresos: 0,
              imagen_url: item.imagen_url,
            };
          }
          productoCounts[key].cantidad += Number(item.cantidad) || 0;
          productoCounts[key].ingresos += (Number(item.precio) || 0) * (Number(item.cantidad) || 0);
        });
      });
      const topProductos = Object.values(productoCounts)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

      // Últimos 5 pedidos
      const ultimosPedidos = actual
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          folio: p.folio || `#${p.id.substring(0, 8)}`,
          cliente_telefono: p.cliente_telefono,
          estado: p.estado,
          total: p.total,
          created_at: p.created_at,
        }));

      setData({
        kpis: {
          ingresos,
          pedidos: actual.length,
          ticketPromedio: Math.round(ticketPromedio),
          clientesUnicos,
        },
        kpisAnterior: {
          ingresos: ingresos_Ant,
          pedidos: anterior.length,
          ticketPromedio: Math.round(ticketPromedio_Ant),
          clientesUnicos: clientesUnicos_Ant,
        },
        ventasDiarias,
        pedidosPorEstado,
        topProductos,
        ultimosPedidos,
      });
    } catch (err) {
      console.error('[useDashboardData]', err);
      setError(err.message || 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { ...data, loading, error, refetch: fetchDashboardData };
}

function normalizarTelefono(tel) {
  if (!tel) return '';
  return tel.replace(/[\s\-\(\)]/g, '');
}
