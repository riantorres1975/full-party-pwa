import assert from 'node:assert/strict';
import test from 'node:test';
import { obtenerProductosRelacionados } from '../src/utils/productosRelacionados.js';

const productos = ['A', 'B', 'C', 'D', 'E'].map((id) => ({
  id,
  nombre: `Globo ${id}`,
  categoria: 'Globo Latex',
  marca: 'Glomex',
  tamano: '12 Pulg',
  precio: 85,
  activo: true,
}));

test('rotates tied recommendations around the selected product', () => {
  assert.deepEqual(
    obtenerProductosRelacionados(productos, productos[0]).map(({ id }) => id),
    ['B', 'C', 'D'],
  );
  assert.deepEqual(
    obtenerProductosRelacionados(productos, productos[2]).map(({ id }) => id),
    ['D', 'E', 'A'],
  );
});

test('prioritizes similarity and excludes inactive or selected products', () => {
  const catalogo = [
    { id: 1, categoria: 'Confeti', marca: 'Otra', tamano: 'Chico', precio: 20, activo: true },
    { id: 2, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', precio: 85, activo: true },
    { id: 3, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', precio: 85, activo: false },
    { id: 4, categoria: 'Globo Latex', marca: 'Otra', tamano: '12 Pulg', precio: 85, activo: true },
    { id: 5, categoria: 'Globo Latex', marca: 'Glomex', tamano: '12 Pulg', precio: 90, activo: true },
  ];

  assert.deepEqual(
    obtenerProductosRelacionados(catalogo, catalogo[1]).map(({ id }) => id),
    [5, 4, 1],
  );
});
