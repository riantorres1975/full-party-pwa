import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { buscarPedidoPublico, crearPedidoPublico } from '../lib/pedidosPublicos';
import { obtenerPrecioAplicable } from '../utils/precios';
import { clasificarErrorPedido } from '../utils/erroresPedido';

/**
 * usePedido
 * Expone:
 *  - guardarPedido(payload) → Promise<{ folio, error }>
 *  - buscarPedido(query)    → Promise<{ pedidos[], error }>
 *  - guardando / buscando  → boolean para UI
 */
export function usePedido() {
  const [guardando, setGuardando] = useState(false);
  const [buscando,  setBuscando]  = useState(false);

  /**
   * Inserta el pedido en Supabase y devuelve el folio generado.
   * payload: { nombre, telefono, tipoEntrega, direccion, total, items }
   */
  async function guardarPedido({ nombre, telefono, tipoEntrega, direccion, total, items }) {
    setGuardando(true);
    try {
      const detalles = items.map(i => {
        const precioBase = Number(i.precio_base ?? i.precio) || 0;
        const precioAplicado = Number(i.precio) || obtenerPrecioAplicable({ ...i, precio: precioBase }, i.cantidad);
        return {
          id: i.id,
          nombre: i.nombre,
          precio: precioAplicado,
          precio_base: precioBase,
          cantidad: i.cantidad,
          imagen_url: i.imagen_url ?? null,
          tamano: i.tamano ?? null,
          precios_mayoreo: i.precios_mayoreo ?? null,
          familia_mayoreo: i.familia_mayoreo ?? null,
        };
      });

      const folio = await crearPedidoPublico(supabase, {
        nombre,
        telefono,
        tipoEntrega,
        direccion,
        total,
        detalles,
      });

      return { folio, error: null, tipo: null };
    } catch (err) {
      console.error('[usePedido] guardarPedido:', err.message);
      return {
        folio: null,
        error: 'No se pudo registrar el pedido ni generar el folio.',
        tipo: clasificarErrorPedido(err),
      };
    } finally {
      setGuardando(false);
    }
  }

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

  return { guardarPedido, buscarPedido, guardando, buscando };
}
