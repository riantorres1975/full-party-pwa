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
  const [stockError, setStockError] = useState(null);

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
    setStockError(null);
    setItems((prev) => {
      const existe = prev.find((i) => i.id === producto.id);
      const cantidadEnCarrito = existe ? existe.cantidad : 0;
      
      // Validación estricta de stock máximo
      if (producto.stock_ilimitado === false) {
        const stockActual = producto.stock_actual || 0;
        if (cantidadEnCarrito >= stockActual) {
          const msg = stockActual === 0
            ? 'Este artículo está agotado en tienda.'
            : `Solo nos quedan ${stockActual} unidades de este artículo.`;
          queueMicrotask(() => setStockError(msg));
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
        stock_ilimitado: producto.stock_ilimitado ?? true,
        stock_actual: producto.stock_actual ?? null,
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

  // ── Sincronizar carrito con datos de productos en vivo (Realtime) ────────
  const sincronizarStock = useCallback((productosActuales) => {
    if (!productosActuales || productosActuales.length === 0) return;
    const mapaProductos = new Map(productosActuales.map(p => [p.id, p]));

    setItems(prev => {
      let cambio = false;
      const nuevos = prev.map(item => {
        const real = mapaProductos.get(item.id);
        if (!real) return item; // producto eliminado — se queda hasta que el user lo quite

        const updates = {};

        // Sincronizar campos clave
        if (real.stock_actual !== item.stock_actual)       updates.stock_actual = real.stock_actual;
        if (real.stock_ilimitado !== item.stock_ilimitado) updates.stock_ilimitado = real.stock_ilimitado;
        if (real.precio !== item.precio)                   updates.precio = real.precio;
        if (real.activo !== item.activo)                   updates.activo = real.activo;
        if (real.precios_mayoreo !== item.precios_mayoreo) updates.precios_mayoreo = real.precios_mayoreo;
        if (real.nombre !== item.nombre)                   updates.nombre = real.nombre;
        if (real.imagen_url !== item.imagen_url)           updates.imagen_url = real.imagen_url;

        // Ajustar cantidad si excede el stock disponible
        const stockReal = real.stock_actual || 0;
        if (real.stock_ilimitado === false && item.cantidad > stockReal && stockReal > 0) {
          updates.cantidad = stockReal;
        }
        // Si está inactivo o stock llegó a 0 (y no es ilimitado) — no eliminamos, marcamos
        if (real.activo === false || (real.stock_ilimitado === false && stockReal === 0)) {
          updates.activo = real.activo;
        }

        if (Object.keys(updates).length === 0) return item;
        cambio = true;
        return { ...item, ...updates };
      });

      return cambio ? nuevos : prev;
    });
  }, []);

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
    stockError,
    agregarItem,
    reducirItem,
    eliminarItem,
    limpiarCarrito,
    vaciarCarrito,
    getCantidad,
    sincronizarStock,
  };
}
