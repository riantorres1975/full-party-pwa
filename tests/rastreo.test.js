import test from 'node:test';
import assert from 'node:assert/strict';
import { construirUrlRastreo } from '../src/utils/rastreo.js';

test('builds a direct tracking URL with a normalized folio', () => {
  assert.equal(
    construirUrlRastreo(' fp-abc123 ', 'https://example.com/'),
    'https://example.com/rastrear/FP-ABC123',
  );
});
