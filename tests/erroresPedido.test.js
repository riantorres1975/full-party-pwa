import assert from 'node:assert/strict';
import test from 'node:test';
import { clasificarErrorPedido } from '../src/utils/erroresPedido.js';

test('clasifica el trigger anti-duplicado como duplicado', () => {
  const err = new Error('Pedido duplicado detectado. Espera unos minutos antes de repetir el mismo pedido.');
  assert.equal(clasificarErrorPedido(err), 'duplicado');
});

test('clasifica el rate limit por teléfono como limite', () => {
  const err = new Error('Demasiados pedidos recientes desde este número. Intenta más tarde.');
  assert.equal(clasificarErrorPedido(err), 'limite');
});

test('clasifica producto no disponible como inventario', () => {
  assert.equal(clasificarErrorPedido(new Error('Product is unavailable')), 'inventario');
  assert.equal(clasificarErrorPedido(new Error('Requested quantity exceeds available stock')), 'inventario');
  assert.equal(clasificarErrorPedido(new Error('Invalid product or quantity in order')), 'inventario');
  assert.equal(clasificarErrorPedido(new Error('Duplicate product in order')), 'inventario');
  assert.equal(clasificarErrorPedido(new Error('Order must contain between 1 and 50 products')), 'inventario');
});

test('clasifica el interruptor de pedidos desactivado como deshabilitado', () => {
  assert.equal(clasificarErrorPedido(new Error('Orders are temporarily disabled')), 'deshabilitado');
});

test('clasifica validaciones del RPC como validacion', () => {
  assert.equal(clasificarErrorPedido(new Error('Invalid customer name')), 'validacion');
  assert.equal(clasificarErrorPedido(new Error('Invalid customer phone')), 'validacion');
  assert.equal(clasificarErrorPedido(new Error('Invalid delivery address')), 'validacion');
  assert.equal(clasificarErrorPedido(new Error('Invalid order total')), 'validacion');
});

test('clasifica fallas de red como red', () => {
  const typeError = new TypeError('Failed to fetch');
  assert.equal(clasificarErrorPedido(typeError), 'red');
  assert.equal(clasificarErrorPedido(new Error('Network request failed')), 'red');
  assert.equal(clasificarErrorPedido(new Error('The request timed out')), 'red');
});

test('clasifica errores desconocidos como desconocido', () => {
  assert.equal(clasificarErrorPedido(new Error('Something went wrong')), 'desconocido');
  assert.equal(clasificarErrorPedido(null), 'desconocido');
  assert.equal(clasificarErrorPedido(undefined), 'desconocido');
  assert.equal(clasificarErrorPedido({}), 'desconocido');
});

test('acepta el formato de error de PostgREST (message en el objeto)', () => {
  const postgrestError = {
    message: 'Pedido duplicado detectado. Espera unos minutos antes de repetir el mismo pedido.',
    code: 'P0001',
    details: null,
    hint: null,
  };
  assert.equal(clasificarErrorPedido(postgrestError), 'duplicado');
});
