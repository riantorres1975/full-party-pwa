import { useState, useMemo } from 'react';
import { ESTADOS_HISTORIAL } from '../../../../lib/estadoMeta';

export function useHistorialPedidos(allPedidos) {
  const [estadoFiltro, setEstadoFiltro] = useState('Enviado');
  const [rangoFecha, setRangoFecha] = useState(30);
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);

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
      result = result.filter(p => {
        const fecha = new Date(p.created_at);
        return fecha >= desde && fecha <= hasta;
      });
    } else if (rangoFecha === 'all') {
      // Sin filtro de fecha
    } else {
      desde = new Date(ahora.getTime() - rangoFecha * 24 * 60 * 60 * 1000);
      result = result.filter(p => {
        const fecha = new Date(p.created_at);
        return fecha >= desde;
      });
    }

    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [allPedidos, estadoFiltro, rangoFecha, fechaDesde, fechaHasta]);

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
  };
}
