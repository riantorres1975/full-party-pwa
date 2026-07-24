import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getInlineProductPlaceholder,
  getProductPlaceholderUrl,
  getSafeProductImageUrl,
} from '../src/utils/imagenes.js';

test('el placeholder inline es un data URI SVG autosuficiente (offline-safe)', () => {
  const uri = getInlineProductPlaceholder('Globo Rosa');
  assert.ok(uri.startsWith('data:image/svg+xml'), 'debe ser un data URI, no una URL externa');
  assert.ok(!uri.includes('placehold.co'), 'no debe depender de servicios externos');
  const svg = decodeURIComponent(uri.slice('data:image/svg+xml;charset=UTF-8,'.length));
  assert.ok(svg.includes('Globo Rosa'), 'incluye el nombre del producto');
});

test('el placeholder inline escapa HTML para evitar inyección en el SVG', () => {
  const uri = getInlineProductPlaceholder('<script>alert("x")</script>');
  const svg = decodeURIComponent(uri.slice('data:image/svg+xml;charset=UTF-8,'.length));
  assert.ok(!svg.includes('<script>'), 'el nombre no debe romper el SVG');
  assert.ok(svg.includes('&lt;script&gt;'), 'el nombre queda escapado como texto');
});

test('el placeholder inline tolera valores vacíos y no string', () => {
  assert.ok(getInlineProductPlaceholder('').startsWith('data:image/svg+xml'));
  assert.ok(getInlineProductPlaceholder(null).startsWith('data:image/svg+xml'));
  assert.ok(getInlineProductPlaceholder(undefined).startsWith('data:image/svg+xml'));
  assert.ok(getInlineProductPlaceholder('   ').startsWith('data:image/svg+xml'));
});

test('el placeholder inline trunca nombres muy largos', () => {
  const uri = getInlineProductPlaceholder('A'.repeat(200));
  const svg = decodeURIComponent(uri.slice('data:image/svg+xml;charset=UTF-8,'.length));
  assert.ok(svg.includes('A'.repeat(40)), 'mantiene los primeros 40 caracteres');
  assert.ok(!svg.includes('A'.repeat(41)), 'no incluye el nombre completo');
});

test('la URL externa de placeholder se conserva para SEO/JSON-LD', () => {
  const url = getProductPlaceholderUrl('Globo', '900x900');
  assert.ok(url.startsWith('https://placehold.co/900x900/'), 'los crawlers necesitan una URL real');
  assert.equal(getSafeProductImageUrl('  ', 'Globo', '56x56'), getProductPlaceholderUrl('Globo', '56x56'));
  assert.equal(getSafeProductImageUrl('https://cdn.test/img.png', 'Globo'), 'https://cdn.test/img.png');
});
