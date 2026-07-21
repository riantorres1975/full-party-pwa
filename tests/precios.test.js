import test from 'node:test';
import assert from 'node:assert/strict';
import {
  obtenerPrecioAplicable,
  obtenerSiguienteEscalaMayoreo,
} from '../src/utils/precios.js';

test('uses base price without wholesale tiers', () => {
  assert.equal(obtenerPrecioAplicable({ precio: 85 }, 12), 85);
});

test('selects the highest matching wholesale tier', () => {
  const producto = {
    precio: 85,
    precios_mayoreo: [
      { cantidad_minima: 24, precio: 65 },
      { cantidad_minima: 6, precio: 78 },
      { cantidad_minima: 12, precio: 72 },
    ],
  };

  assert.equal(obtenerPrecioAplicable(producto, 5), 85);
  assert.equal(obtenerPrecioAplicable(producto, 6), 78);
  assert.equal(obtenerPrecioAplicable(producto, 15), 72);
  assert.equal(obtenerPrecioAplicable(producto, 24), 65);
});

test('accepts wholesale tiers stored as JSON text', () => {
  const producto = {
    precio: 50,
    precios_mayoreo: JSON.stringify([
      { cantidad_minima: 10, precio: 42.5 },
    ]),
  };

  assert.equal(obtenerPrecioAplicable(producto, 10), 42.5);
});

test('ignores malformed and negative tiers', () => {
  const producto = {
    precio: 30,
    precios_mayoreo: [
      { cantidad_minima: 0, precio: 1 },
      { cantidad_minima: 5, precio: -10 },
      { cantidad_minima: 'invalid', precio: 5 },
    ],
  };

  assert.equal(obtenerPrecioAplicable(producto, 20), 30);
  assert.equal(obtenerPrecioAplicable({ precio: 30, precios_mayoreo: '{bad' }, 20), 30);
});

test('supports zero-price promotional tiers', () => {
  const producto = {
    precio: 20,
    precios_mayoreo: [{ cantidad_minima: 100, precio: 0 }],
  };

  assert.equal(obtenerPrecioAplicable(producto, 100), 0);
});

test('returns the next cheaper wholesale tier and missing quantity', () => {
  const producto = {
    precio: 85,
    precios_mayoreo: [
      { cantidad_minima: 24, precio: 65 },
      { cantidad_minima: 6, precio: 78 },
      { cantidad_minima: 12, precio: 72 },
    ],
  };

  assert.deepEqual(obtenerSiguienteEscalaMayoreo(producto, 4), {
    cantidad_minima: 6,
    precio: 78,
    faltantes: 2,
  });
  assert.deepEqual(obtenerSiguienteEscalaMayoreo(producto, 6), {
    cantidad_minima: 12,
    precio: 72,
    faltantes: 6,
  });
  assert.equal(obtenerSiguienteEscalaMayoreo(producto, 24), null);
});
