#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// RESPALDO DEL CATÁLOGO V1 (tabla `productos`) — previo a la migración V2
//
// Uso:
//   node scripts/backup-catalog-v1.mjs
//
// Lee credenciales de .env:
//   VITE_SUPABASE_URL          (requerida)
//   VITE_SUPABASE_ANON_KEY     (requerida)
//   SUPABASE_SERVICE_ROLE_KEY  (opcional — respaldo COMPLETO incl. inactivos)
//
// Salida: backups/catalog-v1/<timestamp>/
//   productos.json        — todas las filas accesibles
//   productos.csv         — las mismas filas en CSV
//   MANIFEST.json         — metadatos del respaldo (fecha, filas, advertencias)
//
// LIMITACIÓN RLS: con la anon key solo se leen productos activos
// (policy productos_public_select: activo = true). Para un respaldo total
// (incluye productos inactivos) define SUPABASE_SERVICE_ROLE_KEY o ejecuta en
// el SQL Editor de Supabase: 001_catalog_backup_and_cleanup.sql, que crea la
// tabla `productos_backup_v1` dentro de la base (respaldo autoritativo).
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PAGE_SIZE = 1000;

function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync('.env', 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (match) env[match[1]] = match[2];
    }
  } catch {
    // .env opcional si las variables vienen del entorno
  }
  return { ...env, ...process.env };
}

function toCsv(rows) {
  if (rows.length === 0) return '';
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value) => {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((col) => escape(row[col])).join(','));
  return [header, ...body].join('\n');
}

async function fetchAllRows(baseUrl, key) {
  const rows = [];
  let offset = 0;
  while (true) {
    const url = new URL(`${baseUrl}/rest/v1/productos`);
    url.searchParams.set('select', '*');
    url.searchParams.set('order', 'created_at.asc,id.asc');
    const response = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Range-Unit': 'items',
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
      },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`REST ${response.status}: ${body}`);
    }
    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

async function main() {
  const env = loadEnv();
  const baseUrl = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || anonKey;

  if (!baseUrl || !key) {
    console.error('Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en .env');
    process.exit(1);
  }

  const warnings = [];
  if (!serviceKey) {
    warnings.push(
      'Respaldo con anon key: RLS solo permite leer productos activos. ' +
      'Los inactivos NO están incluidos. Para respaldo total usa ' +
      'SUPABASE_SERVICE_ROLE_KEY o el backup en base de datos (001_catalog_backup_and_cleanup.sql).',
    );
  }

  console.log('Exportando tabla productos…');
  const rows = await fetchAllRows(baseUrl, key);

  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const outDir = join('backups', 'catalog-v1', stamp);
  mkdirSync(outDir, { recursive: true });

  writeFileSync(join(outDir, 'productos.json'), JSON.stringify(rows, null, 2));
  writeFileSync(join(outDir, 'productos.csv'), toCsv(rows));
  writeFileSync(
    join(outDir, 'MANIFEST.json'),
    JSON.stringify(
      {
        created_at: new Date().toISOString(),
        source: `${baseUrl}/rest/v1/productos`,
        key_type: serviceKey ? 'service_role (respaldo completo)' : 'anon (solo activos)',
        row_count: rows.length,
        warnings,
      },
      null,
      2,
    ),
  );

  console.log(`✔ ${rows.length} filas exportadas a ${outDir}`);
  for (const warning of warnings) console.warn(`⚠ ${warning}`);
}

main().catch((error) => {
  console.error('Error en respaldo:', error.message);
  process.exit(1);
});
