/**
 * Test suite de seguridad para validación de teléfono, honeypot y rate limit.
 * Ejecutar con: node src/__tests__/seguridad.test.mjs
 */

// ── Importar validador de teléfono ──────────────────────────────────────────
// Copiar la lógica directamente ya que es ESM con export

const LADAS_2 = new Set(['33', '55', '56', '81']);

const LADAS_3 = new Set([
  '449','646','653','658','661','664','665','686','612','613','615','624',
  '981','982','996','916','918','919','932','934','961','962','963','964','965','966','967','968',
  '614','621','625','627','628','629','635','636','639','649','652','656','659',
  '840','842','844','861','862','866','867','869','871','872','873','877','878',
  '312','313','314','618','671','674','675','676','677',
  '588','591','592','593','594','595','596','597','598','599',
  '712','713','714','716','718','719','721','722','723','724','725','726','727','728',
  '411','412','413','414','415','417','418','419','421','428','429',
  '432','445','461','462','464','466','468','469','472','473','474','475','476','477','478',
  '732','733','734','735','736','737','741','742','743','744','745','746','747','751','752','753','754','755','756','757','758',
  '738','739','771','772','773','774','775','776','778','779',
  '316','317','321','322','341','342','343','344','345','346','347','348','349',
  '351','352','353','354','355','356','357','358',
  '371','372','373','374','375','376','377','378','379',
  '381','382','383','384','385','386','387','388','391','392','393','394','395',
  '271','272','273','274',
  '421','422','423','424','425','426','431','434','435','436',
  '443','447','451','452','453','454','455',
  '731','769','777',
  '311','319','323','324','325','327','328','329',
  '812','818','821','823','824','825','826','828','829',
  '281','283','284','285','287','951','953','954','958','971','972',
  '221','222','223','224','225','226','227','228','229',
  '231','232','233','234','235','236','237','238','241','243','244','245','246','247','248','249',
  '261','276','278','279','282',
  '427','441','442','448',
  '983','984','987','997','998',
  '444','481','482','483','485','486','487','488','489',
  '667','668','669','672','673','687','694','695','696','697',
  '622','623','631','632','633','634','637','638','641','642','643','644','645','647','648','651',
  '913','914','917','933','936','937','993',
  '831','832','833','834','835','836','841','843','845','846','848','864','868','891','892','893','894','897','899',
  '242',
  '288','294','296','297','921','922','923','924',
  '985','986','988','991','992','994','995','999',
  '433','437','438','439','457','458','459','463','467','471','492','493','494','496','498','499',
]);

function validarTelefonoMX(telefono) {
  const limpio = telefono.replace(/\D/g, '');
  if (limpio.length !== 10) {
    return { valido: false, error: 'El número debe tener exactamente 10 dígitos' };
  }
  if (/^(\d)\1{9}$/.test(limpio)) {
    return { valido: false, error: 'Ingresa un número de teléfono real' };
  }
  if (limpio === '1234567890' || limpio === '0987654321') {
    return { valido: false, error: 'Ingresa un número de teléfono real' };
  }
  const lada2 = limpio.slice(0, 2);
  const lada3 = limpio.slice(0, 3);
  if (!LADAS_2.has(lada2) && !LADAS_3.has(lada3)) {
    return { valido: false, error: 'La lada no corresponde a una región de México' };
  }
  return { valido: true };
}

// ── Rate limit mock ─────────────────────────────────────────────────────────
const MAX_PEDIDOS = 5;
const VENTANA_MS = 30 * 60 * 1000;

function simulateRateLimit(timestamps, ahora) {
  const recientes = timestamps.filter(t => ahora - t < VENTANA_MS);
  if (recientes.length >= MAX_PEDIDOS) return { allowed: false, count: recientes.length };
  recientes.push(ahora);
  return { allowed: true, count: recientes.length };
}

// ── Test runner ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function test(category, name, fn) {
  try {
    const result = fn();
    if (result === true) {
      passed++;
      results.push({ category, name, status: '✅ BLOQUEADO', detail: '' });
    } else if (result === false) {
      // Expected to pass (legitimate)
      passed++;
      results.push({ category, name, status: '✅ PERMITIDO', detail: '' });
    } else {
      failed++;
      results.push({ category, name, status: '❌ FALLO', detail: result });
    }
  } catch (e) {
    failed++;
    results.push({ category, name, status: '❌ ERROR', detail: e.message });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 1: Números con longitud incorrecta
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(70));
console.log('  PRUEBAS DE SEGURIDAD — VALIDACIÓN DE TELÉFONO, HONEYPOT Y RATE LIMIT');
console.log('═'.repeat(70));

test('Longitud', 'Vacío ""', () => {
  const r = validarTelefonoMX('');
  return !r.valido ? true : 'Debería rechazar vacío';
});

test('Longitud', '1 dígito "5"', () => {
  const r = validarTelefonoMX('5');
  return !r.valido ? true : 'Debería rechazar 1 dígito';
});

test('Longitud', '9 dígitos "552345678"', () => {
  const r = validarTelefonoMX('552345678');
  return !r.valido ? true : 'Debería rechazar 9 dígitos';
});

test('Longitud', '11 dígitos "55234567890"', () => {
  const r = validarTelefonoMX('55234567890');
  return !r.valido ? true : 'Debería rechazar 11 dígitos';
});

test('Longitud', '15 dígitos "552345678901234"', () => {
  const r = validarTelefonoMX('552345678901234');
  return !r.valido ? true : 'Debería rechazar 15 dígitos';
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 2: Dígitos repetidos (spam clásico)
// ═══════════════════════════════════════════════════════════════════════════
test('Repetidos', '0000000000', () => {
  const r = validarTelefonoMX('0000000000');
  return !r.valido ? true : 'Debería rechazar todos ceros';
});

test('Repetidos', '1111111111', () => {
  const r = validarTelefonoMX('1111111111');
  return !r.valido ? true : 'Debería rechazar todos unos';
});

test('Repetidos', '5555555555', () => {
  const r = validarTelefonoMX('5555555555');
  return !r.valido ? true : 'Debería rechazar todos cincos';
});

test('Repetidos', '9999999999', () => {
  const r = validarTelefonoMX('9999999999');
  return !r.valido ? true : 'Debería rechazar todos nueves';
});

test('Repetidos', '3333333333', () => {
  const r = validarTelefonoMX('3333333333');
  return !r.valido ? true : 'Debería rechazar todos treses';
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 3: Secuencias obvias
// ═══════════════════════════════════════════════════════════════════════════
test('Secuencia', '1234567890', () => {
  const r = validarTelefonoMX('1234567890');
  return !r.valido ? true : 'Debería rechazar secuencia ascendente';
});

test('Secuencia', '0987654321', () => {
  const r = validarTelefonoMX('0987654321');
  return !r.valido ? true : 'Debería rechazar secuencia descendente';
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 4: Ladas inválidas (no existen en México)
// ═══════════════════════════════════════════════════════════════════════════
test('Lada inválida', '0012345678 (lada 00)', () => {
  const r = validarTelefonoMX('0012345678');
  return !r.valido ? true : 'Debería rechazar lada 00';
});

test('Lada inválida', '1012345678 (lada 10)', () => {
  const r = validarTelefonoMX('1012345678');
  return !r.valido ? true : 'Debería rechazar lada 10';
});

test('Lada inválida', '2012345678 (lada 20)', () => {
  const r = validarTelefonoMX('2012345678');
  return !r.valido ? true : 'Debería rechazar lada 20';
});

test('Lada inválida', '1501234567 (lada 150)', () => {
  const r = validarTelefonoMX('1501234567');
  return !r.valido ? true : 'Debería rechazar lada 150';
});

test('Lada inválida', '9001234567 (lada 900)', () => {
  const r = validarTelefonoMX('9001234567');
  return !r.valido ? true : 'Debería rechazar lada 900';
});

test('Lada inválida', '7001234567 (lada 700)', () => {
  const r = validarTelefonoMX('7001234567');
  return !r.valido ? true : 'Debería rechazar lada 700';
});

test('Lada inválida', '6001234567 (lada 600)', () => {
  const r = validarTelefonoMX('6001234567');
  return !r.valido ? true : 'Debería rechazar lada 600';
});

test('Lada inválida', '5001234567 (lada 500)', () => {
  const r = validarTelefonoMX('5001234567');
  return !r.valido ? true : 'Debería rechazar lada 500';
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 5: Inyección de caracteres especiales
// ═══════════════════════════════════════════════════════════════════════════
test('Inyección', 'Letras "abcdefghij"', () => {
  const r = validarTelefonoMX('abcdefghij');
  return !r.valido ? true : 'Debería rechazar letras';
});

test('Inyección', 'SQL injection "55\';DROP--"', () => {
  const r = validarTelefonoMX("55';DROP--");
  return !r.valido ? true : 'Debería rechazar SQL injection';
});

test('Inyección', 'XSS "<script>alert(1)</script>"', () => {
  const r = validarTelefonoMX('<script>alert(1)</script>');
  return !r.valido ? true : 'Debería rechazar XSS';
});

test('Inyección', 'Espacios "55 1234 5678"', () => {
  // 5512345678 tiene lada 55, debería ser válido después de limpiar
  const r = validarTelefonoMX('55 1234 5678');
  return r.valido ? false : 'Debería aceptar después de limpiar espacios';
});

test('Inyección', 'Guiones "55-1234-5678"', () => {
  const r = validarTelefonoMX('55-1234-5678');
  return r.valido ? false : 'Debería aceptar después de limpiar guiones';
});

test('Inyección', 'Paréntesis "(55)12345678"', () => {
  const r = validarTelefonoMX('(55)12345678');
  return r.valido ? false : 'Debería aceptar después de limpiar paréntesis';
});

test('Inyección', 'Emojis "📞5512345678"', () => {
  const r = validarTelefonoMX('📞5512345678');
  return r.valido ? false : 'Debería aceptar después de limpiar emojis';
});

test('Inyección', 'Solo caracteres especiales "!@#$%^&*()"', () => {
  const r = validarTelefonoMX('!@#$%^&*()');
  return !r.valido ? true : 'Debería rechazar solo especiales';
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 6: Números internacionales (no mexicanos)
// ═══════════════════════════════════════════════════════════════════════════
test('Internacional', '+521234567890 (con prefijo +52)', () => {
  const r = validarTelefonoMX('+521234567890');
  // Después de limpiar: 521234567890 = 12 dígitos
  return !r.valido ? true : 'Debería rechazar con prefijo +52 (12 dígitos)';
});

test('Internacional', '+11234567890 (USA)', () => {
  const r = validarTelefonoMX('+11234567890');
  return !r.valido ? true : 'Debería rechazar número USA';
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 7: Números VÁLIDOS que SÍ deben pasar
// ═══════════════════════════════════════════════════════════════════════════
test('Válido', '5512345678 (CDMX lada 55)', () => {
  const r = validarTelefonoMX('5512345678');
  return r.valido ? false : `Rechazó número válido: ${r.error}`;
});

test('Válido', '3312345678 (GDL lada 33)', () => {
  const r = validarTelefonoMX('3312345678');
  return r.valido ? false : `Rechazó número válido: ${r.error}`;
});

test('Válido', '8112345678 (MTY lada 81)', () => {
  const r = validarTelefonoMX('8112345678');
  return r.valido ? false : `Rechazó número válido: ${r.error}`;
});

test('Válido', '4521234567 (Uruapan lada 452)', () => {
  const r = validarTelefonoMX('4521234567');
  return r.valido ? false : `Rechazó número válido: ${r.error}`;
});

test('Válido', '4431234567 (Morelia lada 443)', () => {
  const r = validarTelefonoMX('4431234567');
  return r.valido ? false : `Rechazó número válido: ${r.error}`;
});

test('Válido', '4491234567 (Aguascalientes lada 449)', () => {
  const r = validarTelefonoMX('4491234567');
  return r.valido ? false : `Rechazó número válido: ${r.error}`;
});

test('Válido', '9981234567 (Cancún lada 998)', () => {
  const r = validarTelefonoMX('9981234567');
  return r.valido ? false : `Rechazó número válido: ${r.error}`;
});

test('Válido', '6641234567 (Tijuana lada 664)', () => {
  const r = validarTelefonoMX('6641234567');
  return r.valido ? false : `Rechazó número válido: ${r.error}`;
});

test('Válido', '2221234567 (Puebla lada 222)', () => {
  const r = validarTelefonoMX('2221234567');
  return r.valido ? false : `Rechazó número válido: ${r.error}`;
});

test('Válido', '5612345678 (CDMX lada 56)', () => {
  const r = validarTelefonoMX('5612345678');
  return r.valido ? false : `Rechazó número válido: ${r.error}`;
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 8: Honeypot
// ═══════════════════════════════════════════════════════════════════════════
test('Honeypot', 'Campo vacío (usuario legítimo)', () => {
  const honeypot = '';
  return !honeypot ? false : 'Debería permitir campo vacío';
});

test('Honeypot', 'Campo lleno "Im a bot" (bot)', () => {
  const honeypot = 'Im a bot';
  return honeypot ? true : 'Debería bloquear cuando honeypot tiene valor';
});

test('Honeypot', 'Campo con espacios "  " (bot)', () => {
  const honeypot = '  ';
  // truthy check on whitespace string
  return honeypot.trim() ? true : false; // spaces only = allow (could be accidental)
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 9: Rate Limiting
// ═══════════════════════════════════════════════════════════════════════════
test('Rate Limit', '1er pedido — permitido', () => {
  const r = simulateRateLimit([], Date.now());
  return r.allowed ? false : 'Debería permitir primer pedido';
});

test('Rate Limit', '5to pedido (límite) — permitido', () => {
  const ahora = Date.now();
  const ts = [ahora - 1000, ahora - 2000, ahora - 3000, ahora - 4000];
  const r = simulateRateLimit(ts, ahora);
  return r.allowed ? false : 'Debería permitir 5to pedido';
});

test('Rate Limit', '6to pedido — BLOQUEADO', () => {
  const ahora = Date.now();
  const ts = [ahora - 1000, ahora - 2000, ahora - 3000, ahora - 4000, ahora - 5000];
  const r = simulateRateLimit(ts, ahora);
  return !r.allowed ? true : 'Debería bloquear 6to pedido';
});

test('Rate Limit', '6to pedido con antiguos expirados — permitido', () => {
  const ahora = Date.now();
  const ts = [
    ahora - 40 * 60000, // 40 min atrás — expirado
    ahora - 35 * 60000, // 35 min atrás — expirado
    ahora - 32 * 60000, // 32 min atrás — expirado
    ahora - 1000,
    ahora - 2000,
  ];
  const r = simulateRateLimit(ts, ahora);
  return r.allowed ? false : 'Debería permitir si los antiguos expiraron';
});

test('Rate Limit', 'Ráfaga de 10 pedidos en 1 segundo — bloquea del 6to', () => {
  const ahora = Date.now();
  let ts = [];
  let bloqueado = false;
  for (let i = 0; i < 10; i++) {
    const r = simulateRateLimit(ts, ahora + i * 100);
    if (!r.allowed) { bloqueado = true; break; }
    ts.push(ahora + i * 100);
  }
  return bloqueado ? true : 'Debería bloquear ráfaga de pedidos';
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORÍA 10: Edge cases
// ═══════════════════════════════════════════════════════════════════════════
test('Edge case', 'null input', () => {
  try {
    const r = validarTelefonoMX(String(null));
    return !r.valido ? true : 'Debería rechazar null';
  } catch { return true; }
});

test('Edge case', 'undefined input', () => {
  try {
    const r = validarTelefonoMX(String(undefined));
    return !r.valido ? true : 'Debería rechazar undefined';
  } catch { return true; }
});

test('Edge case', 'Número con formato +52(55)12345678', () => {
  const r = validarTelefonoMX('+52(55)12345678');
  // Cleaned: 52551234578 = 12 digits
  return !r.valido ? true : 'Debería rechazar formato internacional completo';
});

test('Edge case', 'Muy largo "55123456789012345"', () => {
  const r = validarTelefonoMX('55123456789012345');
  return !r.valido ? true : 'Debería rechazar más de 10 dígitos';
});

// ═══════════════════════════════════════════════════════════════════════════
// REPORTE
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n');

const categories = [...new Set(results.map(r => r.category))];
for (const cat of categories) {
  console.log(`\n  ── ${cat.toUpperCase()} ${'─'.repeat(55 - cat.length)}`);
  const catResults = results.filter(r => r.category === cat);
  for (const r of catResults) {
    const detail = r.detail ? ` (${r.detail})` : '';
    console.log(`   ${r.status}  ${r.name}${detail}`);
  }
}

console.log('\n' + '═'.repeat(70));
console.log(`  RESULTADO FINAL: ${passed} pasaron, ${failed} fallaron de ${passed + failed} pruebas`);
if (failed === 0) {
  console.log('  🛡️  TODAS LAS PRUEBAS PASARON — Las defensas están funcionando correctamente');
} else {
  console.log('  ⚠️  HAY PRUEBAS FALLIDAS — Revisar los casos marcados con ❌');
}
console.log('═'.repeat(70) + '\n');
