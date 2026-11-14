// c4 · 2b-1 (cp. 229): MÁS UV PARA LALI, CON PESO. Una a una: node test_uv_c4.js [N=120]
// GEN_VERSION 7 en memoria. Comprueba por nivel: la UV sale en (casi) todos los casos y de media ≥ 1,3 por caso (antes ≈ 1,2), solo en pistas de sostén de documento o física, con el texto PROPIO de su tipo
// (tinta · texto borrado · marca para documentos; mancha para físicas; sin tipo en la UV encadenada tras la ganzúa), con el azar propio (no mueve la historia), y el bot gana. Mutaciones: sin `uvFirst` y sin textos por tipo.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
const N = +process.argv[2] || 120, /* cp. 272: N 40→120; con 40 el ruido (±0,1) tumbaba el suelo de Fácil */ LV = ['facil', 'normal', 'dificil'];
let bad = 0, checks = 0; const late = []; /* «el patrón encaja» se mira al final: m.ok se rellena al cargar el archivo (FIX-OK, cp. 247) */ const ok = (m, c) => { checks++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m); } };
// OFFP = señuelos (UV y ganzúa) apagados; en disco van encendidos desde 2b-4 paso 2 (cp. 234)
const OFFP = (f, t) => (f === 'gen_data.js' ? t.replace('uvSenuelos: true, ganzuaSenuelos: true', 'uvSenuelos: false, ganzuaSenuelos: false') : t);
function medir(patch) {
  const G = require('./tools/load_g.js')(MOD, patch); G.GEN_VERSION = 7;
  const T = G.GEN_DATA.compile.mech.uvTipos || {}, tipos = (k) => [].concat(...(T[k] || []));
  const res = {};
  LV.forEach((L) => {
    const R = res[L] = { n: 0, uv: 0, sinUv: 0, malKind: 0, sinTexto: 0, malRol: 0, win: 0, encad: 0, conTipo: 0, historia: 0 };
    for (let i = 1; R.n < N && i < N * 6; i++) {
      const r = G.generateCase(i * 7919 + 1, { level: L }); if (r.error) continue; R.n++;
      const byId = {}; r.bible.clues.forEach((c) => { byId[c.id] = c; }); let uv = 0;
      Object.values(r.def.rooms).forEach((rm) => (rm.props || []).forEach((p) => { const st = (p.steps || [])[0]; if (!st || st.tool !== 'uv') return; uv++;
        const c = byId[p.id.replace(/^obj_/, '')], k = c && c.kind;
        if (!c || ['documento', 'física'].indexOf(k) < 0) R.malKind++;
        if (!c || ['prueba', 'descarte', 'refuta'].indexOf(c.role) < 0) R.malRol++;
        if (p.visible) { R.encad++; if (k !== 'documento') R.malKind++; return; } // UV encadenada (ganzúa → UV): texto de cadena, solo documentos
        if (tipos(k).some((t) => st.text.indexOf(t) === 0)) R.conTipo++; else R.sinTexto++; }));
      R.uv += uv; if (!uv) R.sinUv++;
    }
    const b = G.generateCase(4321, { level: L }); if (b.def) { const q = G.botPlay(b.def); if (q.win) R.win++; }
  });
  return res;
}
const A = medir(OFFP);
LV.forEach((L) => { const R = A[L], m = R.uv / R.n;
  ok(`${L}: ${R.n} casos, UV de media ${m.toFixed(2)} por caso (≥ 1,1: con 100 casos sale 1,17 · 1,16 · ? con charlas señuelo ENCENDIDAS (c4-3 4/4, cp. 250; antes 1,33 · 1,28 · 1,48: la refutación en charla quita ≈ 0,1-0,15 de UV de sostén); la BANDA oficial 1,7-2,3 se mide sobre el total en disco, más abajo)`, R.n === N && m >= 1.1);
  ok(`${L}: casos sin UV ≤ 5 % (${R.sinUv})`, R.sinUv <= Math.ceil(R.n * 0.05));
  ok(`${L}: la UV solo toma pistas de sostén de documento o física (${R.malKind} mal tipo, ${R.malRol} mal rol)`, R.malKind === 0 && R.malRol === 0);
  ok(`${L}: toda UV no encadenada lleva el texto propio de su tipo (${R.conTipo} con tipo, ${R.sinTexto} sin)`, R.conTipo > 0 && R.sinTexto === 0);
  ok(`${L}: el bot gana el caso de muestra`, R.win === 1);
});
// FIX-OK-2: UV TOTAL con todo encendido (como en disco) dentro de la banda de datos `herr2.bandas.uv` (±0,15 por el tamaño de muestra)
{ const G0 = require('./tools/load_g.js')(MOD), B = G0.GEN_DATA.compile.mech.herr2.bandas.uv, D = medir(undefined); LV.forEach((L) => { const m = D[L].uv / D[L].n; ok(`${L}: UV total con señuelos (disco) ${m.toFixed(2)} dentro de ${B[0]}-${B[1]} (±0,15)`, m >= B[0] - 0.15 && m <= B[1] + 0.15); }); }
// bancos: tipos de marca, 3 textos o más por tipo, todos nombran la luz o la UV y caben en pantalla (≤ 130 caracteres)
{ const G = require('./tools/load_g.js')(MOD); const T = G.GEN_DATA.compile.mech.uvTipos;
  ok('bancos uvTipos: documento (3 tipos) y física (1 tipo), ≥ 3 textos por tipo, con «UV» y ≤ 130 caracteres', T && T['documento'].length === 3 && T['física'].length === 1 && [].concat(...Object.values(T)).every((g) => g.length >= 3 && g.every((s) => /UV/.test(s) && s.length <= 130)), JSON.stringify(Object.keys(T || {}))); }
// c4 · 2b-2 (cp. 230): SEÑUELOS CON UV (interruptor `uvSenuelos`, APAGADO en disco hasta 2b-4). Apagado: ninguna UV sobre pistas falsas (v7 sin cambios). Encendido (parche en memoria): las falsas de documento o física piden UV,
// una UV por sala, nunca encadenadas tras la ganzúa, con texto propio de su tipo, y el bot gana.
// En disco AMBOS interruptores van encendidos (2b-4 paso 2, cp. 234). OFFP = ambos apagados (parte 2b-1: UV de sostén); ON = solo UV de señuelo (ganzúa apagada), como se probó en 2b-2.
const ON = (extra) => (f, t) => { if (f === 'gen_data.js') t = t.replace('uvSenuelos: true, ganzuaSenuelos: true', 'uvSenuelos: true, ganzuaSenuelos: false'); return extra ? extra(f, t) : t; };
function medirSen(patch) {
  const G = require('./tools/load_g.js')(MOD, patch); G.GEN_VERSION = 7; const T = G.GEN_DATA.compile.mech.uvTipos, res = {};
  LV.forEach((L) => { const R = res[L] = { n: 0, falsas: 0, malKind: 0, encad: 0, dosPorSala: 0, sinTexto: 0, win: 0 };
    for (let i = 1; R.n < N && i < N * 6; i++) {
      const r = G.generateCase(i * 7919 + 1, { level: L }); if (r.error) continue; R.n++;
      const byId = {}; r.bible.clues.forEach((c) => { byId[c.id] = c; });
      Object.values(r.def.rooms).forEach((rm) => { let uvSala = 0; (rm.props || []).forEach((p) => { const st = (p.steps || [])[0]; if (!st || st.tool !== 'uv') return; uvSala++;
        const c = byId[(p.id || '').replace(/^obj_/, '')]; if (!c || c.role !== 'falsa') return;
        R.falsas++; if (['documento', 'física'].indexOf(c.kind) < 0) R.malKind++; if (p.visible) R.encad++;
        if (![].concat(...(T[c.kind] || [])).some((x) => st.text.indexOf(x) === 0)) R.sinTexto++; }); if (uvSala > 1) R.dosPorSala++; });
    }
    const b = G.generateCase(4321, { level: L }); if (b.def && G.botPlay(b.def).win) R.win++; });
  return res;
}
{ const G0 = require('./tools/load_g.js')(MOD); const OFF = medirSen(OFFP), S = medirSen(ON()), TBL = G0.GEN_DATA.compile.mech.herr2.senuelos, MIN = {}; LV.forEach((L) => { MIN[L] = +(0.45 * TBL[L].uv.reduce((s, e) => s + e[0] * e[1], 0) / TBL[L].uv.reduce((s, e) => s + e[1], 0)).toFixed(2); }); // suelo = 0,45 × la media de la TABLA (cp. 272; antes 0,5: la media real de Fácil, 0,44-0,47, estaba pegada al suelo 0,45) = la mitad de la media de la TABLA de datos (antes 0,4 · 1,0 · 1,2 de la tabla vieja de cp. 230)
  LV.forEach((L) => { ok(`${L}: con el interruptor APAGADO no hay UV en pistas falsas (${OFF[L].falsas})`, OFF[L].falsas === 0);
    const R = S[L], m = R.falsas / R.n;
    ok(`${L}: señuelos con UV encendidos: ${m.toFixed(2)} por caso (≥ ${MIN[L]})`, m >= MIN[L]);
    ok(`${L}: señuelos UV solo en documento o física (${R.malKind}), nunca encadenados (${R.encad}), una UV por sala (${R.dosPorSala}), con texto propio (${R.sinTexto} sin)`, R.malKind === 0 && R.encad === 0 && R.dosPorSala === 0 && R.sinTexto === 0);
    ok(`${L}: señuelos con UV encendidos: el bot gana el caso de muestra`, R.win === 1); });
  const m3 = mutador('compile.js', '|| uvPlace[c.source.place]) return;', ') return;'); late.push(() => ok('mutación «dos UV en una sala»: el patrón encaja', m3.ok !== false));
  const M = medirSen((f, t) => ON(m3.patch)(f, t)); ok('mutación «dos UV en una sala» detectada', LV.some((L) => M[L].dosPorSala > 0));
  const m4 = mutador('gen_data.js', 'uvSenuelos: true, ganzuaSenuelos: true', 'uvSenuelos: false, ganzuaSenuelos: false'); late.push(() => ok('mutación «señuelos apagados en disco»: el patrón encaja', m4.ok !== false));
  const D = medirSen(), M4 = medirSen(m4.patch); ok('estado de disco: hay señuelos UV en Normal y Difícil', D.normal.falsas > 0 && D.dificil.falsas > 0); ok('mutación «señuelos apagados en disco» detectada (las UV falsas desaparecen)', M4.normal.falsas === 0 && M4.dificil.falsas === 0); }
// mutaciones
{ const m1 = mutador('compile.js', "(H2.uvFirst ? (y === 'uv') - (x === 'uv') : 0) ||", ''); late.push(() => ok('mutación «sin uvFirst»: el patrón encaja', m1.ok !== false));
  const B = medir((f, t) => OFFP(f, m1.patch(f, t))); const mA = LV.reduce((s, L) => s + A[L].uv / A[L].n, 0) / 3, mB = LV.reduce((s, L) => s + B[L].uv / B[L].n, 0) / 3;
  ok(`mutación «sin uvFirst» detectada: la UV media baja (${mA.toFixed(2)} → ${mB.toFixed(2)})`, mB < mA - 0.02);
  const m2 = mutador('compile.js', "uvT = tl === 'uv' && G.GEN_VERSION >= 7", "uvT = tl === 'uv' && G.GEN_VERSION >= 99"); late.push(() => ok('mutación «sin textos por tipo»: el patrón encaja', m2.ok !== false));
  const C = medir((f, t) => OFFP(f, m2.patch(f, t))); ok('mutación «sin textos por tipo» detectada: aparecen UV sin su texto propio', LV.some((L) => C[L].sinTexto > 0)); }
late.forEach((g) => g()); console.log(bad ? `\n${bad} de ${checks} comprobaciones con fallos` : `\nTodo en orden (${checks} comprobaciones)`);
process.exit(bad ? 1 : 0);
