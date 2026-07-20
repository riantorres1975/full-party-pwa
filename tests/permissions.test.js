import test from 'node:test';
import assert from 'node:assert/strict';
import { can, canAll, canAny, PERMISSIONS_MATRIX } from '../src/lib/permissions.js';
import { ROLES } from '../src/lib/roles.js';

test('every permission references only known roles', () => {
  const knownRoles = new Set(Object.values(ROLES));

  for (const [permission, roles] of Object.entries(PERMISSIONS_MATRIX)) {
    assert.ok(roles.length > 0, `${permission} must allow at least one role`);
    for (const role of roles) {
      assert.ok(knownRoles.has(role), `${permission} contains unknown role ${role}`);
    }
  }
});

test('catalog permissions follow least privilege', () => {
  assert.equal(can(ROLES.ADMIN, 'catalogo.delete'), true);
  assert.equal(can(ROLES.MANAGER, 'catalogo.edit'), true);
  assert.equal(can(ROLES.MANAGER, 'catalogo.delete'), false);
  assert.equal(can(ROLES.EMPLEADO, 'catalogo.edit'), false);
  assert.equal(can(ROLES.VIEWER, 'catalogo.view'), true);
});

test('order permissions separate operations from cancellation', () => {
  assert.equal(can(ROLES.EMPLEADO, 'pedidos.edit'), true);
  assert.equal(can(ROLES.EMPLEADO, 'pedidos.cancel'), false);
  assert.equal(can(ROLES.MANAGER, 'pedidos.cancel'), true);
  assert.equal(can(ROLES.VIEWER, 'pedidos.view'), true);
  assert.equal(can(ROLES.VIEWER, 'pedidos.edit'), false);
});

test('sensitive modules stay restricted', () => {
  assert.equal(can(ROLES.ADMIN, 'usuarios.manage'), true);
  assert.equal(can(ROLES.MANAGER, 'usuarios.manage'), false);
  assert.equal(can(ROLES.MANAGER, 'configuracion.view'), true);
  assert.equal(can(ROLES.MANAGER, 'configuracion.edit'), false);
  assert.equal(can(ROLES.EMPLEADO, 'clientes.view'), false);
});

test('permission helpers deny missing input and combine checks correctly', () => {
  assert.equal(can(null, 'pedidos.view'), false);
  assert.equal(can(ROLES.ADMIN, 'unknown.permission'), false);
  assert.equal(canAny(ROLES.MANAGER, ['usuarios.manage', 'reportes.view']), true);
  assert.equal(canAny(ROLES.VIEWER, ['usuarios.manage', 'reportes.view']), false);
  assert.equal(canAll(ROLES.ADMIN, ['catalogo.edit', 'catalogo.delete']), true);
  assert.equal(canAll(ROLES.MANAGER, ['catalogo.edit', 'catalogo.delete']), false);
});
