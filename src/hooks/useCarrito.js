import { useState, useEffect, useCallback } from 'react';
import { obtenerPrecioAplicable } from '../utils/precios';

const STORAGE_KEY = 'carritoPWA';

// ── Helpers de localStorage con manejo de errores ────────────────────────────
function leerStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function escribirStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Safari en modo privado puede lanzar excepción — ignoramos silenciosamente
  }
}

function borrarStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* silent */ }
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useCarrito
 * - Inicialización perezosa desde localStorage ('carritoPWA')
 * - Sincronización automática en cada cambio de estado
 * - vaciarCarrito() limpia estado + localStorage (botón basurero manual)
 * - confirmarPedido() abre WhatsApp y luego limpia todo
 */
export function useCarrito() {
  // 1. LAZY INIT — lee localStorage solo en el primer render
  const [items, setItems] = useState(() => leerStorage());

  // 2. SINCRONIZACIÓN AUTOMÁTICA — escribe en cada cambio
  useEffect(() => {
    if (items.length > 0) {
      escribirStorage(items);
    } else {
      // Si quedó vacío (vaciado o confirmado) borramos la entrada
      borrarStorage();
    }
  }, [items]);

  // ── Mutaciones del carrito ─────────────────────────────────────────────────

  const agregarItem = useCallback((producto) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.id === producto.id);
      const cantidadEnCarrito = existe ? existe.cantidad : 0;
      
      // Validación estricta de stock máximo
      if (producto.stock_ilimitado === false) {
        const stockActual = producto.stock_actual || 0;
        if (cantidadEnCarrito >= stockActual) {
          if (stockActual === 0) {
            alert('Este artículo está agotado en tienda.');
          } else {
            alert(`Solo nos quedan ${stockActual} unidades de este artículo.`);
          }
          return prev;
        }
      }

      if (existe) {
        return prev.map((i) =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      
      const itemLimpio = {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen_url: producto.imagen_url,
        cantidad: 1,
        tamano: producto.tamano,
      };
      if (producto.precios_mayoreo) itemLimpio.precios_mayoreo = producto.precios_mayoreo;
      if (producto.familia_mayoreo) itemLimpio.familia_mayoreo = producto.familia_mayoreo;

      return [...prev, itemLimpio];
    });
  }, []);

  const reducirItem = useCallback((id) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.id === id);
      if (!existe) return prev;
      if (existe.cantidad === 1) return prev.filter((i) => i.id !== id);
      return prev.map((i) =>
        i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i
      );
    });
  }, []);

  const eliminarItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // 3 & 4. VACIAR — usado tanto por el botón basurero como al confirmar
  const vaciarCarrito = useCallback(() => {
    setItems([]);
    borrarStorage();
  }, []);

  // Alias semántico para compatibilidad con props existentes
  const limpiarCarrito = vaciarCarrito;

  // ── Derivados ──────────────────────────────────────────────────────────────
  const total = items.reduce((acc, i) => {
    const precioAplicable = obtenerPrecioAplicable(i, i.cantidad);
    return acc + (precioAplicable * i.cantidad);
  }, 0);
  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);

  const getCantidad = useCallback(
    (id) => items.find((i) => i.id === id)?.cantidad ?? 0,
    [items]
  );

  return {
    items,
    total,
    cantidadTotal,
    agregarItem,
    reducirItem,
    eliminarItem,
    limpiarCarrito,
    vaciarCarrito,
    getCantidad,
  };
}
