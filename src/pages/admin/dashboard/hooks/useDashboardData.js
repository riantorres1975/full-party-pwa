import { useState, useEffect, useCallback, useRef } from 'react';
import { guardedQuery } from '../../../../lib/supabaseGuard';

const DAY_MS = 24 * 60 * 60 * 1000;

export function useDashboardData({ desde, hasta }) {
  const [data, setData] = useState({
    kpis: { ingresos: 0, pedidos: 0, ticketPromedio: 0, clientesUnicos: 0 },
    kpisAnterior: { ingresos: 0, pedidos: 0, ticketPromedio: 0, clientesUnicos: 0 },
    ventasDiarias: [],
    pedidosPorEstado: [],
    topProductos: [],
    ultimosPedidos: [],
    stockAlerts: { bajo: 0, sinStock: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const fetchDashboardData = useCallback(async () => {
    if (!desde || !hasta) return;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // Normalizar límites y calcular periodo anterior equivalente (sin solape)
      const desdeActual = startOfDay(desde);
      const hastaActual = endOfDay(hasta);
      const diasPeriodo = getInclusiveDaySpan(desdeActual, hastaActual);
      const hastaAnterior = endOfDay(addDays(desdeActual, -1));
      const desdeAnterior = startOfDay(addDays(desdeActual, -diasPeriodo));

      const [resultadoActual, resultadoAnterior, resultadoInventario] = await Promise.all([
        guardedQuery((client) =>
          client
            .from('pedidos')
            .select('id,folio,estado,total,pago_estado,cliente_telefono,created_at,detalles_json')
            .gte('created_at', desdeActual.toISOString())
            .lte('created_at', hastaActual.toISOString())
        ),
        guardedQuery((client) =>
          client
            .from('pedidos')
            .select('id,folio,estado,total,pago_estado,cliente_telefono,created_at,detalles_json')
            .gte('created_at', desdeAnterior.toISOString())
            .lte('created_at', hastaAnterior.toISOString())
        ),
        guardedQuery((client) =>
          client
            .from('catalog_inventory')
            .select('id,quantity,reserved_quantity,low_stock_threshold')
        ),
      ]);

      if (requestId !== requestIdRef.current) return;

      const { data: pedidosActual, error: errActual } = resultadoActual;
      const { data: pedidosAnterior, error: errAnterior } = resultadoAnterior;

      if (errActual) throw new Error(errActual.message);
      if (errAnterior) throw new Error(errAnterior.message);

      const productosInventario = resultadoInventario.error ? [] : (resultadoInventario.data || []);
      if (resultadoInventario.error) {
        console.warn('[useDashboardData] No se pudieron cargar alertas de inventario', resultadoInventario.error.message);
      }

      const actual = pedidosActual || [];
      const anterior = pedidosAnterior || [];

      // Los indicadores financieros solo consideran dinero efectivamente cobrado.
      const pedidosCobrados = actual.filter(p => p.estado !== 'Cancelado' && p.pago_estado === 'confirmado');
      const ingresos = pedidosCobrados.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
      const ticketPromedio = pedidosCobrados.length > 0 ? ingresos / pedidosCobrados.length : 0;
      const clientesUnicos = new Set(actual.map(p => normalizarTelefono(p.cliente_telefono)).filter(Boolean)).size;

      // Calcular KPIs periodo anterior
      const pedidosCobrados_Ant = anterior.filter(p => p.estado !== 'Cancelado' && p.pago_estado === 'confirmado');
      const ingresos_Ant = pedidosCobrados_Ant.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
      const ticketPromedio_Ant = pedidosCobrados_Ant.length > 0 ? ingresos_Ant / pedidosCobrados_Ant.length : 0;
      const clientesUnicos_Ant = new Set(anterior.map(p => normalizarTelefono(p.cliente_telefono)).filter(Boolean)).size;

      // Ventas diarias
      const ventasPorDia = {};
      pedidosCobrados.forEach(p => {
        const fecha = toLocalDateKey(p.created_at);
        if (!fecha) return;
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
      pedidosCobrados.forEach(p => {
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
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          folio: p.folio ?? null,
          cliente_telefono: p.cliente_telefono,
          estado: p.estado,
          total: p.total,
          created_at: p.created_at,
        }));

      const stockAlerts = productosInventario.reduce((acc, producto) => {
        const disponible = Math.max(
          0,
          (Number(producto.quantity) || 0) - (Number(producto.reserved_quantity) || 0),
        );
        const minimo = Number(producto.low_stock_threshold) || 0;
        if (disponible <= 0) acc.sinStock += 1;
        else if (disponible <= minimo) acc.bajo += 1;
        return acc;
      }, { bajo: 0, sinStock: 0 });

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
        stockAlerts,
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('[useDashboardData]', err);
      setError(err.message || 'Error al cargar datos del dashboard');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
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

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getInclusiveDaySpan(desde, hasta) {
  const diff = startOfDay(hasta).getTime() - startOfDay(desde).getTime();
  return Math.max(1, Math.floor(diff / DAY_MS) + 1);
}

function toLocalDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
