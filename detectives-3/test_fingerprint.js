// Prueba de la HUELLA DE CASO (fase 4.0): el detector funciona, es determinista y mide el estado de partida. Uso: node test_fingerprint.js [semillas]
// Las METAS de unicidad (G.FINGERPRINT_GOALS) se exigen desde 4A para capture y decoy; rooms y mechanic se activan en 4C.
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const N = +process.argv[2] || (+process.env.SEEDS ? Math.min(1000, +process.env.SEEDS) : 1000); let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✗ ' + m); } };
const clone = (x) => JSON.parse(JSON.stringify(x));

// 1) caso 1 (hecho a mano): usa mecánicas, no es «solo leer»
const f1 = G.caseFingerprint(G.CASES.tarta);
ok(f1.mechanic !== 'solo_leer' && /lupa|ganza|uv|empujar|sigilo/.test(f1.mechanic), 'caso 1 debería usar mecánicas: ' + f1.mechanic);
ok(f1.capture && f1.rooms && f1.decoy && f1.key.split(' | ').length === 8 && f1.scene === 'interior' && f1.ally === 'ninguno' && f1.mood === 'ninguno' && f1.v === 6 && f1.puzzle === 'ninguno', 'campos de la huella del caso 1 (8 campos, versión 6, sin puzles; el caso 1 es interior, sin aliado y sin ambiente)');
ok(JSON.stringify(f1) === JSON.stringify(G.caseFingerprint(G.CASES.tarta)), 'determinista (caso 1)');

// 2) el detector reacciona a lo que debe (mutando un caso generado)
const g = G.generateCase(100); const base = G.caseFingerprint(g.def, g.bible);
const m1 = clone(g.def); Object.values(m1.rooms)[0].props.find((p) => p.steps).steps[0].tool = 'grabadora'; // (desde 4C-1a el primer objeto de la sala puede ser de ambiente; desde 4C-1b el generador ya usa lupa, ganzúa y uv, por eso se prueba con otra)
ok(/grabadora/.test(G.caseFingerprint(m1, g.bible).mechanic), 'detecta herramienta');
const m2 = clone(g.def); Object.values(m2.rooms)[0].props.find((p) => p.steps).watcher = 'x';
ok(/sigilo/.test(G.caseFingerprint(m2, g.bible).mechanic), 'detecta sigilo');
const m3 = clone(g.def); Object.values(m3.rooms)[0].template = 'almacen_cajas';
ok(/almacen_cajas/.test(G.caseFingerprint(m3, g.bible).rooms) && G.caseFingerprint(m3, g.bible).key !== base.key, 'detecta plantilla de sala');
{ const m6 = clone(g.def); Object.values(m6.rooms)[0].template = 'calle_esquina'; const f6 = G.caseFingerprint(m6, g.bible); ok(f6.scene === 'calle' && G.caseFingerprint(g.def, g.bible).scene !== undefined && f6.key !== base.key, 'detecta escena de calle por la plantilla'); const m7 = clone(g.def); Object.values(m7.rooms).forEach((r) => { r.template = 'tienda_vitrinas'; }); ok(G.caseFingerprint(m7, g.bible).scene === 'interior', 'sin plantillas de calle la escena es interior'); }
const b4 = clone(g.bible); b4.captureForm = 'contradiccion';
ok(G.caseFingerprint(g.def, b4).capture === 'contradiccion', 'captureForm de la biblia manda');
// un caso SIN engañosos (recuento 0) al que se le copia la sospecha del culpable a un inocente descartable pasa a tener 1
let g0 = null; for (let s2 = 0; s2 < 200 && !g0; s2++) { const c = G.generateCase(s2); if (G.caseFingerprint(c.def, c.bible).decoy === '0') g0 = c; }
ok(!!g0, 'hay casos sin engañosos para probar el detector');
const m5 = clone(g0.def), cu = m5.solution.culprit, inn = m5.suspects.find((s) => s.id !== cu && s.clearedBy.length);
Object.values(m5.clues).forEach((c) => { if (c.sus && c.sus[cu]) c.sus[inn.id] = (c.sus[inn.id] || 0) + c.sus[cu]; });
ok(G.caseFingerprint(m5, g0.bible).decoy === '1', 'detecta 1 sospechoso engañoso descartable (recuento 0→1)');
// el recuento de la huella coincide con los engañosos que declara la biblia
for (let s2 = 0; s2 < 300; s2++) { const c = G.generateCase(s2); if (c.error) continue; if (G.caseFingerprint(c.def, c.bible).decoy !== String(c.bible.deceptive.length)) { ok(false, 'huella y biblia no coinciden en los engañosos (semilla ' + s2 + ')'); break; } }

// 3) estadística y metas con una lista de juguete
const A = { capture: 'a', decoy: '0', rooms: 'r:3', scene: 'interior', mechanic: 'solo_leer', key: 'A' }, B = Object.assign({}, A, { capture: 'b', key: 'B' });
const st = G.fingerprintStats([A, A, A, B]);
ok(st.n === 4 && st.distinct === 2 && st.topKey === 'A' && Math.abs(st.topShare - 0.75) < 1e-9, 'fingerprintStats');
ok(G.fingerprintGoals(st).ok === false, 'metas: una lista repetitiva no las cumple');

// 4) medición sobre N semillas: determinismo y estado de partida
const list = []; let bad = 0;
for (let s = 0; s < N; s++) {
  const r = G.generateCase(s); if (r.error) { bad++; continue; }
  const f = G.caseFingerprint(r.def, r.bible); list.push(f);
  if (s < 50) ok(JSON.stringify(f) === JSON.stringify(G.caseFingerprint(G.generateCase(s).def, G.generateCase(s).bible)), 'determinista semilla ' + s);
}
ok(bad === 0, bad + ' semillas sin caso');
const S = G.fingerprintStats(list), goals = G.fingerprintGoals(S);
const pc = (x) => Math.round(x * 100) + ' %';
console.log(`  ${N} semillas · huellas distintas: ${S.distinct} · más repetida: ${pc(S.topShare)}`);
Object.keys(S.fields).forEach((f) => console.log(`  ${f}: ${Object.keys(S.fields[f]).length} valores, el más común ${pc(S.topShareByField[f])}`));
console.log('  metas de unicidad: ' + JSON.stringify(goals) + ' (salas desde 4C-1a y mecánicas desde 4C-1b: ya se exigen)');
// 4A: se EXIGEN las metas de captura (≥ 4 formas, ninguna > 40 %) y de engañosos (aparecen 0, 1, 2 y 3; ninguno > 40 %)
ok(goals.capture, 'meta de captura: ≥ 4 formas y ninguna por encima del 40 % → ' + JSON.stringify(S.fields.capture));
ok(goals.decoy, 'meta de engañosos: recuentos 0, 1, 2 y 3 y ninguno por encima del 40 % → ' + JSON.stringify(S.fields.decoy));
ok(goals.tone, 'meta de tonos: ≥ 4 tonos y ninguno por encima del 40 % → ' + JSON.stringify(S.fields.tone));
ok(goals.rooms, 'meta de salas (4C-1a): ≥ ' + G.FINGERPRINT_GOALS.minRoomTemplates + ' plantillas distintas → ' + Object.keys(S.fields.rooms).length + ' combinaciones');
ok(goals.scene, 'meta de escena (4C-2a): casos de calle entre el 25 y el 35 % → ' + JSON.stringify(S.fields.scene));
ok(S.topShareByField.rooms <= G.FINGERPRINT_GOALS.topShareMax, 'ningún valor de salas supera el 40 % (4C-2a): ' + pc(S.topShareByField.rooms));
ok(goals.mechanic, 'meta de mecánicas (4C-1b): ≥ ' + G.FINGERPRINT_GOALS.minMechanics + ' y ninguna por encima del 40 % → ' + JSON.stringify(S.fields.mechanic));
ok(goals.mood, 'meta de ambientes (4C-4a): los tres aparecen y macabro entre el 12 y el 25 % → ' + JSON.stringify(S.fields.mood));
ok(goals.ally, 'meta de aliados (4C-3b-2): ≥ 50 % de casos con aliado, ≥ 3 tipos de escena y ninguna combinación por encima del 40 % → ' + JSON.stringify(S.fields.ally));
ok(goals.overall, 'meta global: ≥ ' + G.FINGERPRINT_GOALS.minDistinctPer1000 + ' huellas distintas por cada 1000 casos y ninguna por encima del 40 %');
// 3-bis 2/3 · paso 3a: la calle es una DECISION PROPIA (G.wantsStreet), no un subproducto del nº de salas.
// Se mide el % de calle POR NIVEL (misma semilla en los 3) y por nº de salas; cada uno dentro de 25-35 % y sin diferencias grandes.
// La meta GLOBAL (25-35 %) no se toca. Mutaciones: si wantsStreet se anula (vuelve al sorteo por sala) o deja de dar calle, esta prueba DEBE fallar.
if (G.GEN_VERSION >= 6) {
  const NC = +process.env.CALLE_N || 600, STEP = 7919, LO = 0.25, HI = 0.35, MAXDIF_NIVEL = 0.04, MAXDIF_SALAS = 0.08;
  const medir = () => {
    const out = { niveles: {}, salas: {} };
    for (const L of ['facil', 'normal', 'dificil']) {
      let c = 0, n = 0;
      for (let i = 1; i <= NC; i++) {
        const r = G.generateCase(i * STEP + 1, { register: true, level: L }); if (r.error) continue;
        const calle = G.caseFingerprint(r.def, r.bible).scene === 'calle', k = Object.keys(r.def.rooms).length;
        n++; if (calle) c++; const b = out.salas[k] = out.salas[k] || [0, 0]; b[1]++; if (calle) b[0]++;
      }
      out.niveles[L] = { n, share: n ? c / n : 0 };
    }
    return out;
  };
  const veredicto = (m) => {
    const sh = Object.values(m.niveles).map((v) => v.share), fallos = [];
    Object.keys(m.niveles).forEach((L) => { const v = m.niveles[L].share; if (v < LO || v > HI) fallos.push(L + ' ' + (v * 100).toFixed(1) + ' % fuera de 25-35'); });
    if (Math.max(...sh) - Math.min(...sh) > MAXDIF_NIVEL) fallos.push('diferencia entre niveles ' + ((Math.max(...sh) - Math.min(...sh)) * 100).toFixed(1) + ' puntos (máx ' + MAXDIF_NIVEL * 100 + ')');
    const bs = Object.entries(m.salas).filter(([, v]) => v[1] >= 100).map(([k, v]) => [k, v[0] / v[1]]);
    if (bs.length >= 2) { const sv = bs.map((x) => x[1]); if (Math.max(...sv) - Math.min(...sv) > MAXDIF_SALAS) fallos.push('diferencia entre nº de salas ' + ((Math.max(...sv) - Math.min(...sv)) * 100).toFixed(1) + ' puntos (máx ' + MAXDIF_SALAS * 100 + ')'); }
    return fallos;
  };
  const resumen = (m) => Object.keys(m.niveles).map((L) => L + ' ' + (m.niveles[L].share * 100).toFixed(1) + ' %').join(' · ') + ' | por salas: ' + Object.keys(m.salas).sort().map((k) => k + '→' + (100 * m.salas[k][0] / m.salas[k][1]).toFixed(1) + ' % (' + m.salas[k][1] + ')').join(', ');
  const real = medir(), fr = veredicto(real);
  console.log('  calle por nivel (' + NC + ' semillas/nivel): ' + resumen(real));
  ok(fr.length === 0, 'calle por nivel y por nº de salas dentro de 25-35 % y sin diferencias grandes: ' + fr.join('; '));
  const orig = G.wantsStreet;
  const mut = (nombre, f) => { G.wantsStreet = f; let m; try { m = medir(); } finally { G.wantsStreet = orig; } const fm = veredicto(m); console.log('  mutación «' + nombre + '»: ' + resumen(m)); ok(fm.length > 0, 'MUTACIÓN no detectada «' + nombre + '»: la prueba de calle por nivel debería fallar'); };
  mut('wantsStreet anulada: la calle vuelve a depender del nº de salas', () => undefined);
  mut('wantsStreet nunca da calle', () => false);
  mut('wantsStreet siempre da calle', () => true);
  ok(G.wantsStreet === orig, 'la mutación restaura G.wantsStreet');
}
console.log(fails ? `✗ ${fails} de ${checks} comprobaciones fallan` : `✓ huella de caso: ${checks} comprobaciones correctas`);
process.exit(fails ? 1 : 0);
