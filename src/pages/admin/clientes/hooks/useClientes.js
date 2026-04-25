import { useState, useEffect, useCallback } from 'react';
import { guardedQuery } from '../../../../lib/supabaseGuard';

function normalizarTelefono(tel) {
  if (!tel) return '';
  return tel.replace(/[\s\-\(\)]/g, '');
}

export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: pedidos, error: err } = await guardedQuery((client) =>
        client
          .from('pedidos')
          .select('id,cliente_nombre,cliente_telefono,tipo_entrega,total,estado,created_at')
          .neq('estado', 'Cancelado')
          .order('created_at', { ascending: false })
      );

      if (err) throw new Error(err.message);

      // Agrupar por teléfono normalizado
      const clienteMap = {};

      (pedidos || []).forEach(pedido => {
        const telNorm = normalizarTelefono(pedido.cliente_telefono);
        if (!telNorm) return;

        if (!clienteMap[telNorm]) {
          clienteMap[telNorm] = {
            id: telNorm, // usar teléfono normalizado como id
            nombre: pedido.cliente_nombre,
            telefono: pedido.cliente_telefono,
            email: null,
            pedidos_total: 0,
            gasto_total: 0,
            ultimo_pedido: pedido.created_at,
            primer_pedido: pedido.created_at,
            metodo_entrega_preferido: null,
            entregas: {},
          };
        }

        const cliente = clienteMap[telNorm];
        const pedidoFecha = new Date(pedido.created_at);
        const ultimoPedidoFecha = new Date(cliente.ultimo_pedido);
        const primerPedidoFecha = new Date(cliente.primer_pedido);
        const esMasReciente = pedidoFecha > ultimoPedidoFecha;

        cliente.pedidos_total += 1;
        cliente.gasto_total += Number(pedido.total) || 0;
        if (esMasReciente) {
          cliente.ultimo_pedido = pedido.created_at;
          cliente.nombre = pedido.cliente_nombre || cliente.nombre;
        }
        if (pedidoFecha < primerPedidoFecha) {
          cliente.primer_pedido = pedido.created_at;
        }

        // Rastrear método de entrega preferido
        if (pedido.tipo_entrega) {
          cliente.entregas[pedido.tipo_entrega] = (cliente.entregas[pedido.tipo_entrega] || 0) + 1;
        }

      });

      // Calcular entrega preferida
      Object.values(clienteMap).forEach(cliente => {
        if (Object.keys(cliente.entregas).length > 0) {
          cliente.metodo_entrega_preferido = Object.entries(cliente.entregas).sort(
            (a, b) => b[1] - a[1]
          )[0][0];
        }
        delete cliente.entregas; // limpiar
      });

      setClientes(Object.values(clienteMap).sort((a, b) =>
        new Date(b.ultimo_pedido) - new Date(a.ultimo_pedido)
      ));
    } catch (err) {
      console.error('[useClientes]', err);
      setError(err.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  return { clientes, loading, error, refetch: fetchClientes };
}
