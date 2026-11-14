// TIEMPOS-1 (cp. 261): duración OFICIAL por dificultad en los datos (`GEN_DATA.compile.durationV7`; solo datos, el compilador no los lee). Una a una: node test_tiempos1.js
// Comprueba: Fácil 20-28 (mediana 24) · Normal 28-36 (32) · Difícil 36-45 (40); rangos CONTIGUOS (sin solape), medianas separadas ≥ 6 min, mínimo absoluto 20 y techo 45;
// `targetMinV7` (objetivo del relleno, en minutos del medidor, calibrado midiendo) ≥ 20 y sin pasar la mediana de SU nivel (con el medidor v7 ajustado, 4F-0b 3/4-d: 24 · 32 · 39 dan ≈ 24 · 32 · 39,5 reales); los perfiles de v6 (`goal`/`today`/`targetMin`) INTACTOS;
// y que son SOLO datos: quitar `durationV7` no cambia ni un caso (v6 ni v7). La herramienta `calidad_niveles.js` los lee de ahí.
// Mutaciones: techo 46 · rangos solapados · mediana fuera de rango · mínimo absoluto 18 · objetivo de relleno fuera de banda. Cada una DEBE detectarse.
const fs = require('fs'), path = require('path');
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'], LV = ['facil', 'normal', 'dificil'];
let bad = 0, checks = 0, quiet = false; const ok = (m, c) => { checks++; if (!c) { bad++; if (!quiet) console.log('✗ ' + m); } };
const load = (patch) => require('./tools/load_g.js')(MOD, patch ? patch.patch || patch : undefined);

// Revisa los datos de una carga de G; devuelve cuántos fallos encuentra (se usa también para las mutaciones)
function revisa(G, etiqueta, verbose) {
  const before = bad; const k = (m, c) => ok(etiqueta + ': ' + m, c);
  const C = G.GEN_DATA.compile, D = C.durationV7;
  k('existe `durationV7` con los 3 niveles', !!D && !!D.levels && LV.every((L) => D.levels[L] && Array.isArray(D.levels[L].range) && D.levels[L].range.length === 2 && typeof D.levels[L].median === 'number'));
  if (!D || !D.levels || !LV.every((L) => D.levels[L])) return bad - before;
  const R = (L) => D.levels[L].range, M = (L) => D.levels[L].median;
  k('mínimo absoluto 20 y techo 45', D.floor === 20 && D.ceiling === 45);
  k('Fácil empieza en el mínimo absoluto y Difícil acaba en el techo', R('facil')[0] === D.floor && R('dificil')[1] === D.ceiling);
  k('rangos CONTIGUOS (el tope de un nivel = el mínimo del siguiente, sin solape)', R('facil')[1] === R('normal')[0] && R('normal')[1] === R('dificil')[0]);
  k('cada rango es válido (mínimo < tope)', LV.every((L) => R(L)[0] < R(L)[1]));
  k('cada mediana está DENTRO de su rango', LV.every((L) => M(L) >= R(L)[0] && M(L) <= R(L)[1]));
  k('medianas 24 · 32 · 40', M('facil') === 24 && M('normal') === 32 && M('dificil') === 40);
  k('medianas separadas ≥ 6 min', M('normal') - M('facil') >= 6 && M('dificil') - M('normal') >= 6);
  k('rangos exactos [20,28] · [28,36] · [36,45]', JSON.stringify([R('facil'), R('normal'), R('dificil')]) === '[[20,28],[28,36],[36,45]]');
  k('`targetMinV7` (objetivo del relleno, en minutos DEL MEDIDOR, no reales) ≥ mínimo absoluto y NO supera la mediana de su nivel', LV.every((L) => C.levels[L].targetMinV7 >= D.floor && C.levels[L].targetMinV7 <= M(L)));
  if (verbose) console.log('  targetMinV7:', LV.map((L) => L + ' ' + C.levels[L].targetMinV7).join(' · '));
  return bad - before;
}

// 1) Datos reales
{ const G = load(); revisa(G, 'datos', true);
  const C = G.GEN_DATA.compile.levels;
  ok('v6 intacto: goal Fácil/Normal/Difícil', JSON.stringify([C.facil.goal, C.normal.goal, C.dificil.goal]) === JSON.stringify([{ median: 24, range: [20, 28] }, { median: 30, range: [25, 36] }, { median: 38, range: [31, 46] }]));
  ok('v6 intacto: today', JSON.stringify([C.facil.today, C.normal.today, C.dificil.today]) === JSON.stringify([{ median: 23.5, range: [20, 28] }, { median: 27, range: [22, 32] }, { median: 30, range: [24, 36] }]));
  ok('v6 intacto: targetMin 23,5 · 27 · 30', C.facil.targetMin === 23.5 && C.normal.targetMin === 27 && C.dificil.targetMin === 30);
  ok('`calidad_niveles.js` lee la banda de los datos', /GEN_DATA\.compile\.durationV7/.test(fs.readFileSync(path.join(__dirname, 'tools', 'calidad_niveles.js'), 'utf8')));
}

// 2) SOLO datos: sin `durationV7` los casos salen idénticos (v6 y v7)
{ const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => i * 7919 + 1);
  const huella = (G, v) => { G.GEN_VERSION = v; const out = []; LV.forEach((L) => SEEDS.forEach((sd) => { try { const b = G.genClues(G.genTruth(sd, { level: L }), { mood: G.pickMood(sd, G.DEFAULT_THEME) }); out.push(JSON.stringify(G.compileBible(b, { level: L }))); } catch (e) { out.push('ERR ' + e.message); } })); return out; };
  const G1 = load(), G2 = load(); delete G2.GEN_DATA.compile.durationV7;
  [6, 7].forEach((v) => { const a = huella(G1, v), b = huella(G2, v); let dif = 0; a.forEach((x, i) => { if (x !== b[i]) dif++; });
    ok('v' + v + ': quitar `durationV7` no cambia ningún caso (' + a.length + ' casos)', dif === 0 && a.length === 24); });
}

// 3) Mutaciones: cada una DEBE producir al menos un fallo
[
  ['techo 46 (Difícil 36-46)', mutador('gen_data.js', 'dificil: { median: 40, range: [36, 45] }', 'dificil: { median: 40, range: [36, 46] }')],
  ['rangos solapados (Normal 27-36)', mutador('gen_data.js', 'normal: { median: 32, range: [28, 36] }', 'normal: { median: 32, range: [27, 36] }')],
  ['mediana fuera de rango (Fácil 30)', mutador('gen_data.js', 'facil: { median: 24, range: [20, 28] }', 'facil: { median: 30, range: [20, 28] }')],
  ['mínimo absoluto 18', mutador('gen_data.js', 'floor: 20, ceiling: 45', 'floor: 18, ceiling: 45')],
  ['objetivo de relleno de Difícil fuera de banda (46)', mutador('gen_data.js', 'targetMinV7: 39', 'targetMinV7: 46')],
].forEach(([nom, m]) => {
  const before = bad, G = load(m); // m.ok se rellena al cargar
  if (!m.ok) { ok('mutación «' + nom + '»: ' + m.motivo, false); return; }
  quiet = true; const f = revisa(G, 'mut', false); quiet = false; bad = before; // los fallos de la mutación NO cuentan como fallos de la prueba
  ok('mutación «' + nom + '» detectada', f > 0); console.log('  · mutación «' + nom + '»: ' + (f > 0 ? 'detectada (' + f + ' fallos)' : 'NO DETECTADA'));
});

console.log(bad ? '✗ ' + bad + ' fallos de ' + checks : '✓ test_tiempos1: ' + checks + ' comprobaciones'); process.exit(bad ? 1 : 0);
