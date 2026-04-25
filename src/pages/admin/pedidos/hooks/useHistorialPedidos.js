import { useState, useMemo, useEffect, useCallback } from 'react';
import { ESTADOS_HISTORIAL } from '../../../../lib/estadoMeta';

const ESTADOS_CON_FECHA_HISTORIAL = new Set(['Enviado', 'Cancelado']);
const FECHAS_HISTORIAL_STORAGE_KEY = 'admin.pedidos.historialFechas.v1';

function leerFechasHistorialPersistidas() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(FECHAS_HISTORIAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function guardarFechasHistorialPersistidas(fechas) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FECHAS_HISTORIAL_STORAGE_KEY, JSON.stringify(fechas));
  } catch {
    // Ignore storage errors (private mode/quota)
  }
}

function obtenerClaveFechaHistorial(pedido) {
  if (!pedido?.id) return null;
  return `${pedido.id}:${pedido.estado}`;
}

function obtenerFechaCanonicaPorEstado(pedido) {
  if (!pedido) return null;
  if (pedido.estado === 'Enviado') return pedido.fecha_envio ?? null;
  if (pedido.estado === 'Cancelado') return pedido.fecha_cancelado ?? null;
  return null;
}

export function obtenerFechaHistorial(pedido, fechasPersistidas = {}) {
  if (!pedido) return null;

  let fechaBase = pedido.created_at;

  if (ESTADOS_CON_FECHA_HISTORIAL.has(pedido.estado)) {
    const clave = obtenerClaveFechaHistorial(pedido);
    const fechaCanonica = obtenerFechaCanonicaPorEstado(pedido);
    fechaBase = fechaCanonica || (clave ? fechasPersistidas[clave] : null) || pedido.updated_at || pedido.created_at;
  }

  if (!fechaBase) return null;
  const fecha = new Date(fechaBase);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function useHistorialPedidos(allPedidos) {
  const [estadoFiltro, setEstadoFiltro] = useState('Enviado');
  const [rangoFecha, setRangoFecha] = useState(30);
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  const [fechasPersistidas, setFechasPersistidas] = useState(() => leerFechasHistorialPersistidas());

  useEffect(() => {
    if (!allPedidos?.length) return;

    setFechasPersistidas((prev) => {
      let changed = false;
      const next = { ...prev };

      allPedidos.forEach((pedido) => {
        if (!ESTADOS_CON_FECHA_HISTORIAL.has(pedido.estado)) return;
        const clave = obtenerClaveFechaHistorial(pedido);
        if (!clave) return;

        const fechaCanonica = obtenerFechaCanonicaPorEstado(pedido);
        if (fechaCanonica) {
          if (next[clave] !== fechaCanonica) {
            next[clave] = fechaCanonica;
            changed = true;
          }
          return;
        }

        if (!next[clave]) {
          const fallback = pedido.updated_at || pedido.created_at;
          if (fallback) {
            next[clave] = fallback;
            changed = true;
          }
        }
      });

      if (changed) {
        guardarFechasHistorialPersistidas(next);
        return next;
      }

      return prev;
    });
  }, [allPedidos]);

  const getFechaHistorial = useCallback(
    (pedido) => obtenerFechaHistorial(pedido, fechasPersistidas),
    [fechasPersistidas]
  );

  const filtered = useMemo(() => {
    if (!allPedidos) return [];

    let result = allPedidos.filter(p =>
      estadoFiltro === 'todos'
        ? ESTADOS_HISTORIAL.includes(p.estado)
        : p.estado === estadoFiltro
    );

    const ahora = new Date();
    let desde = new Date();

    if (rangoFecha === 'custom') {
      desde = fechaDesde ? new Date(fechaDesde) : new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      const hasta = fechaHasta ? new Date(fechaHasta) : ahora;
      desde.setHours(0, 0, 0, 0);
      hasta.setHours(23, 59, 59, 999);
      result = result.filter(p => {
        const fecha = obtenerFechaHistorial(p, fechasPersistidas);
        return fecha ? (fecha >= desde && fecha <= hasta) : false;
      });
    } else if (rangoFecha === 'all') {
      // Sin filtro de fecha
    } else {
      desde = new Date(ahora.getTime() - rangoFecha * 24 * 60 * 60 * 1000);
      desde.setHours(0, 0, 0, 0);
      result = result.filter(p => {
        const fecha = obtenerFechaHistorial(p, fechasPersistidas);
        return fecha ? fecha >= desde : false;
      });
    }

    return result.sort((a, b) => {
      const fechaB = obtenerFechaHistorial(b, fechasPersistidas)?.getTime() || 0;
      const fechaA = obtenerFechaHistorial(a, fechasPersistidas)?.getTime() || 0;
      return fechaB - fechaA;
    });
  }, [allPedidos, estadoFiltro, rangoFecha, fechaDesde, fechaHasta, fechasPersistidas]);

  const contadores = useMemo(() => {
    if (!allPedidos) return { Enviado: 0, Cancelado: 0 };
    return {
      Enviado: allPedidos.filter(p => p.estado === 'Enviado').length,
      Cancelado: allPedidos.filter(p => p.estado === 'Cancelado').length,
    };
  }, [allPedidos]);

  return {
    filtered,
    estadoFiltro,
    setEstadoFiltro,
    rangoFecha,
    setRangoFecha,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    contadores,
    getFechaHistorial,
  };
}
