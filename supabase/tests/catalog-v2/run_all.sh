#!/bin/sh
# Harness: aplica estado actual + migraciones V2 + casos de prueba.
set -e

cd /repo

echo "== 00_bootstrap.sql"
psql -U postgres -d catalog_test -v ON_ERROR_STOP=1 -q -f /harness/00_bootstrap.sql

for f in \
  supabase_setup.sql \
  supabase_profiles_migration.sql \
  supabase_invites_migration.sql \
  supabase_pagos_migration.sql \
  supabase_rate_limit.sql \
  supabase_inventario_migration.sql \
  supabase_productos_mayoreo_migration.sql \
  supabase_catalog_scalability.sql \
  supabase_security_fixes.sql \
  supabase_security_hardening.sql \
  supabase_order_integrity.sql \
  supabase_public_order_rpc.sql \
  supabase_order_idempotency.sql \
  supabase_category_config.sql
do
  echo "== $f"
  psql -U postgres -d catalog_test -v ON_ERROR_STOP=1 -q -f "/repo/$f"
done
echo "== ESTADO ACTUAL (V1) APLICADO OK"

for f in \
  001_catalog_backup_and_cleanup.sql \
  002_catalog_schema.sql \
  003_catalog_constraints_indexes.sql \
  004_catalog_rls.sql \
  005_catalog_functions.sql \
  006_catalog_seed.sql \
  009_catalog_rls_policy_optimization.sql \
  010_catalog_bulk_operations.sql \
  011_catalog_glomex_pricing.sql
do
  echo "== $f"
  psql -U postgres -d catalog_test -v ON_ERROR_STOP=1 -q -f "/repo/$f"
done
echo "== MIGRACIONES V2 APLICADAS OK"

echo "== 98_test_cases_a.sql"
psql -U postgres -d catalog_test -v ON_ERROR_STOP=1 -q -f /harness/98_test_cases_a.sql

echo "== 99_test_cases_b.sql"
psql -U postgres -d catalog_test -v ON_ERROR_STOP=1 -f /harness/99_test_cases_b.sql
