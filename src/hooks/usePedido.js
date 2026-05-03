import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerPrecioAplicable } from '../utils/precios';

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

      const { data, error } = await supabase
        .from('pedidos')
        .insert({
          cliente_nombre:   nombre,
          cliente_telefono: telefono,
          tipo_entrega:     tipoEntrega,
          direccion:        direccion || null,
          total,
          estado:          'Por Surtir',
          detalles_json:   detalles,
        })
        .select('folio')
        .single();

      if (error) throw error;
      return { folio: data.folio, error: null };
    } catch (err) {
      console.error('[usePedido] guardarPedido:', err.message);
      return { folio: null, error: 'No se pudo registrar el pedido. Tu pedido se enviará por WhatsApp.' };
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

      const { data, error } = await supabase
        .from('pedidos')
        .select('folio, cliente_nombre, estado, total, tipo_entrega, created_at, updated_at, detalles_json')
        .eq('folio', folio)
        .limit(5);

      if (error) throw error;
      return { pedidos: data ?? [], error: null };
    } catch (err) {
      return { pedidos: [], error: 'No se pudo buscar el pedido. Intenta de nuevo.' };
    } finally {
      setBuscando(false);
    }
  }

  return { guardarPedido, buscarPedido, guardando, buscando };
}
