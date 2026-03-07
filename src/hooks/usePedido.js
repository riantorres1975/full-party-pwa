import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
      const { data, error } = await supabase
        .from('pedidos')
        .insert({
          cliente_nombre:   nombre,
          cliente_telefono: telefono,
          tipo_entrega:     tipoEntrega,
          direccion:        direccion || null,
          total,
          estado:          'Por Surtir',
          detalles_json:   items.map(i => ({
            id:       i.id,
            nombre:   i.nombre,
            precio:   i.precio,
            cantidad: i.cantidad,
          })),
        })
        .select('folio')
        .single();

      if (error) throw error;
      return { folio: data.folio, error: null };
    } catch (err) {
      console.error('[usePedido] guardarPedido:', err.message);
      return { folio: null, error: err.message };
    } finally {
      setGuardando(false);
    }
  }

  /**
   * Busca pedidos por folio exacto o por número de teléfono.
   * query: string — si empieza con "FP-" busca por folio, si no por teléfono.
   */
  async function buscarPedido(query) {
    setBuscando(true);
    try {
      const esFolio = query.trim().toUpperCase().startsWith('FP-');
      const { data, error } = await supabase
        .from('pedidos')
        .select('folio, cliente_nombre, cliente_telefono, estado, total, tipo_entrega, created_at, updated_at, detalles_json')
        .eq(esFolio ? 'folio' : 'cliente_telefono', esFolio ? query.trim().toUpperCase() : query.trim())
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return { pedidos: data ?? [], error: null };
    } catch (err) {
      return { pedidos: [], error: err.message };
    } finally {
      setBuscando(false);
    }
  }

  return { guardarPedido, buscarPedido, guardando, buscando };
}
