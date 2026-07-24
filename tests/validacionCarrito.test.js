import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeEstadoCarrito } from '../src/lib/validacionCarrito.js';

const carrito = [
  { id: 'p-1', nombre: 'Globo Rosa', precio: 85, cantidad: 2, activo: true, stock_actual: 20, stock_ilimitado: false },
  { id: 'p-2', nombre: 'Confeti', precio: 10, cantidad: 1, activo: true, stock_actual: 30, stock_ilimitado: false },
];

test('actualiza precio, stock y estado con los datos del servidor conservando cantidades', () => {
  const merged = mergeEstadoCarrito(carrito, [
    { id: 'p-1', nombre: 'Globo Rosa', precio: 99, activo: true, stock_actual: 3, stock_ilimitado: false },
    { id: 'p-2', nombre: 'Confeti Dorado', precio: 12, activo: true, stock_actual: 30, stock_ilimitado: false },
  ]);

  assert.equal(merged.length, 2);
  assert.equal(merged[0].precio, 99, 'precio fresco del servidor');
  assert.equal(merged[0].stock_actual, 3, 'stock fresco del servidor');
  assert.equal(merged[0].cantidad, 2, 'cantidad del cliente intacta');
  assert.equal(merged[1].nombre, 'Confeti Dorado', 'nombre actualizado');
  assert.ok(!merged[0].__noDisponible);
});

test('marca como no disponible un producto eliminado del catálogo', () => {
  const merged = mergeEstadoCarrito(carrito, [
    { id: 'p-1', nombre: 'Globo Rosa', precio: 85, activo: true, stock_actual: 20, stock_ilimitado: false },
  ]);

  assert.equal(merged[1].activo, false, 'activo=false para que la UI lo bloquee');
  assert.equal(merged[1].__noDisponible, true, 'bandera explícita de eliminado');
  assert.equal(merged[1].cantidad, 1, 'cantidad preservada para mostrar contexto');
  assert.equal(merged[1].nombre, 'Confeti', 'mantiene datos del carrito para mostrar');
});

test('un producto desactivado en servidor se refleja como inactivo', () => {
  const merged = mergeEstadoCarrito(carrito, [
    { id: 'p-1', nombre: 'Globo Rosa', precio: 85, activo: false, stock_actual: 20, stock_ilimitado: false },
    { id: 'p-2', nombre: 'Confeti', precio: 10, activo: true, stock_actual: 30, stock_ilimitado: false },
  ]);

  assert.equal(merged[0].activo, false);
  assert.ok(!merged[0].__noDisponible, 'existe pero está desactivado');
});

test('compara ids como strings aunque el carrito use números', () => {
  const merged = mergeEstadoCarrito(
    [{ id: 123, nombre: 'X', precio: 1, cantidad: 4 }],
    [{ id: '123', nombre: 'X', precio: 2, activo: true, stock_ilimitado: true }],
  );

  assert.equal(merged[0].precio, 2);
  assert.equal(merged[0].cantidad, 4);
});

test('tolera entradas vacías o inválidas', () => {
  assert.deepEqual(mergeEstadoCarrito([], []), []);
  assert.deepEqual(mergeEstadoCarrito(null, null), []);
  const merged = mergeEstadoCarrito(carrito, null);
  assert.ok(merged.every((item) => item.__noDisponible), 'sin datos del servidor todo queda no disponible');
});

test('mantiene el orden original del carrito', () => {
  const merged = mergeEstadoCarrito(carrito, [
    { id: 'p-2', nombre: 'Confeti', precio: 10, activo: true, stock_actual: 30, stock_ilimitado: false },
    { id: 'p-1', nombre: 'Globo Rosa', precio: 85, activo: true, stock_actual: 20, stock_ilimitado: false },
  ]);

  assert.deepEqual(merged.map((item) => item.id), ['p-1', 'p-2']);
});
