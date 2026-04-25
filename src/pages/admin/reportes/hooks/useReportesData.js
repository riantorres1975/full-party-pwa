import { useState, useEffect, useCallback } from 'react';
import { guardedQuery } from '../../../../lib/supabaseGuard';

export function useReportesData(anio) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const desde = new Date(anio, 0, 1, 0, 0, 0, 0);
      const hasta = new Date(anio, 11, 31, 23, 59, 59, 999);

      const { data: pedidos, error: err } = await guardedQuery((client) =>
        client
          .from('pedidos')
          .select('id,cliente_nombre,cliente_telefono,tipo_entrega,total,estado,detalles_json,created_at')
          .gte('created_at', desde.toISOString())
          .lte('created_at', hasta.toISOString())
      );
      if (err) throw new Error(err.message);

      const rows = pedidos || [];
      const noCancel = rows.filter((p) => p.estado !== 'Cancelado');

      // ── Ventas mensuales ──
      const meses = Array.from({ length: 12 }, (_, i) => ({
        mes: i,
        pedidos: 0,
        ingresos: 0,
        cancelados: 0,
      }));
      rows.forEach((p) => {
        const m = new Date(p.created_at).getMonth();
        if (p.estado === 'Cancelado') {
          meses[m].cancelados += 1;
        } else {
          meses[m].pedidos += 1;
          meses[m].ingresos += Number(p.total) || 0;
        }
      });
      meses.forEach((m) => {
        m.ticketPromedio = m.pedidos > 0 ? m.ingresos / m.pedidos : 0;
      });

      // ── Productos ranking ──
      const prodMap = {};
      noCancel.forEach((p) => {
        const items = Array.isArray(p.detalles_json) ? p.detalles_json : [];
        items.forEach((item) => {
          const key = item.id || item.nombre;
          if (!key) return;
          if (!prodMap[key]) {
            prodMap[key] = {
              id: item.id,
              nombre: item.nombre,
              imagen_url: item.imagen_url || null,
              cantidad: 0,
              ingresos: 0,
            };
          }
          prodMap[key].cantidad += Number(item.cantidad) || 0;
          prodMap[key].ingresos += (Number(item.precio) || 0) * (Number(item.cantidad) || 0);
        });
      });
      const totalIngresosProductos = Object.values(prodMap).reduce((s, p) => s + p.ingresos, 0);
      const productosRanking = Object.values(prodMap)
        .map((p) => ({ ...p, pct: totalIngresosProductos > 0 ? (p.ingresos / totalIngresosProductos) * 100 : 0 }))
        .sort((a, b) => b.ingresos - a.ingresos);

      // ── Clientes frecuentes ──
      const clienteMap = {};
      noCancel.forEach((p) => {
        const key = normTel(p.cliente_telefono) || p.cliente_nombre || '?';
        if (!clienteMap[key]) {
          clienteMap[key] = { nombre: p.cliente_nombre || '—', telefono: p.cliente_telefono || '—', pedidos: 0, ingresos: 0 };
        }
        clienteMap[key].pedidos += 1;
        clienteMap[key].ingresos += Number(p.total) || 0;
      });
      const clientesFrecuentes = Object.values(clienteMap)
        .sort((a, b) => b.pedidos - a.pedidos)
        .slice(0, 20);

      // ── Tipo de entrega ──
      const entregaMap = {};
      noCancel.forEach((p) => {
        const k = p.tipo_entrega || 'Sin especificar';
        if (!entregaMap[k]) entregaMap[k] = { tipo: k, pedidos: 0, ingresos: 0 };
        entregaMap[k].pedidos += 1;
        entregaMap[k].ingresos += Number(p.total) || 0;
      });
      const tipoEntrega = Object.values(entregaMap).sort((a, b) => b.pedidos - a.pedidos);

      // ── Resumen general ──
      const ingresosTotales = noCancel.reduce((s, p) => s + (Number(p.total) || 0), 0);
      const resumen = {
        totalPedidos: rows.length,
        pedidosCompletados: noCancel.length,
        cancelados: rows.length - noCancel.length,
        tasaCancelacion: rows.length > 0 ? ((rows.length - noCancel.length) / rows.length) * 100 : 0,
        ingresos: ingresosTotales,
        ticketPromedio: noCancel.length > 0 ? ingresosTotales / noCancel.length : 0,
        clientesUnicos: new Set(rows.map((p) => normTel(p.cliente_telefono))).size,
      };

      setData({ meses, productosRanking, clientesFrecuentes, tipoEntrega, resumen });
    } catch (e) {
      console.error('[useReportesData]', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [anio]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

function normTel(tel) {
  return tel ? tel.replace(/[\s\-\(\)]/g, '') : '';
}
