import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { buscarPedidoPublico } from '../lib/pedidosPublicos';

/**
 * usePedido
 * Busca pedidos por folio para la vista pública de rastreo.
 */
export function usePedido() {
  const [buscando,  setBuscando]  = useState(false);

  /**
   * Busca pedidos por folio exacto.
   * Solo se permite búsqueda por folio (no por teléfono) para proteger la privacidad de clientes.
   * query: string — debe empezar con "FP-"
   */
  async function buscarPedido(query) {
    setBuscando(true);
    try {
      const folio = query.trim().toUpperCase();
      if (!folio.startsWith('FP-')) {
        return { pedidos: [], error: 'Ingresa un folio válido (ej. FP-00001).' };
      }

      const pedidos = await buscarPedidoPublico(supabase, folio);
      return { pedidos, error: null };
    } catch (err) {
      return { pedidos: [], error: 'No se pudo buscar el pedido. Intenta de nuevo.' };
    } finally {
      setBuscando(false);
    }
  }

  return { buscarPedido, buscando };
}
