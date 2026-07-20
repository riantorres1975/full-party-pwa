import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularPrioridades } from '../src/pages/admin/dashboard/dashboardPriorities.js';

test('calculates actionable order and payment priorities', () => {
  const prioridades = calcularPrioridades([
    { estado: 'Por Surtir', pago_estado: 'pendiente', total: 100 },
    { estado: 'Armando Pedido', pago_estado: 'pendiente', total: '250' },
    { estado: 'Listo para Entrega', pago_estado: 'confirmado', total: 80 },
    { estado: 'Cancelado', pago_estado: 'pendiente', total: 999 },
  ], { bajo: 3, sinStock: 2 });

  assert.deepEqual(prioridades, {
    pedidosPorSurtir: 1,
    pagosPendientes: 2,
    pagosPendientesTotal: 350,
    stockBajo: 3,
    sinStock: 2,
  });
});

test('returns a safe empty state for missing data', () => {
  assert.deepEqual(calcularPrioridades(), {
    pedidosPorSurtir: 0,
    pagosPendientes: 0,
    pagosPendientesTotal: 0,
    stockBajo: 0,
    sinStock: 0,
  });
});
