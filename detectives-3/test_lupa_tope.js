// c4 · 2b-4 paso 1 (cp. 233): TOPE DE LUPA por nivel (`herr2.lupaTope`, banda del usuario 1,7-2,2 por caso). Una a una: node test_lupa_tope.js [N=40]
// Comprueba por nivel (GEN_VERSION 7 en memoria): la lupa media cae en la banda con los señuelos apagados y con ellos encendidos (estado de disco) entre 1,7 y 2,25 (margen de muestra);
// ningún caso supera el tope máximo de la tabla; el bot gana. Mutaciones: sin tope · tope que libera primero el sostén.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
const N = +process.argv[2] || 40, LV = ['facil', 'normal', 'dificil'];
let bad = 0, checks = 0; const late = []; /* «el patrón encaja» se mira al final: m.ok se rellena al cargar el archivo (FIX-OK, cp. 247) */ const ok = (m, c) => { checks++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m); } };
const OFFP = (extra) => (f, t) => { if (f === 'gen_data.js') t = t.replace('uvSenuelos: true, ganzuaSenuelos: true', 'uvSenuelos: false, ganzuaSenuelos: false'); return extra ? extra(f, t) : t; }; // OFFP = señuelos apagados; el estado de disco los lleva ENCENDIDOS (cp. 234)
function medir(patch) {
  const G = require('./tools/load_g.js')(MOD, patch); G.GEN_VERSION = 7; const res = {}, TOPE = G.GEN_DATA.compile.mech.herr2.lupaTope;
  LV.forEach((L) => { const R = res[L] = { n: 0, lupa: 0, max: 0, sobre: 0, falsas: 0, win: 0, tmax: Math.max(...TOPE[L].map((e) => e[0])) };
    for (let i = 1; R.n < N && i < N * 6; i++) {
      const r = G.generateCase(i * 7919 + 1, { level: L }); if (r.error) continue; R.n++;
      const byId = {}; r.bible.clues.forEach((c) => { byId[c.id] = c; }); let l = 0;
      Object.values(r.def.rooms).forEach((rm) => (rm.props || []).forEach((p) => { const st = (p.steps || [])[0]; if (st && st.tool === 'lupa') { l++; const c = byId[(p.id || '').replace(/^obj_/, '')]; if (c && c.role === 'falsa') R.falsas++; } }));
      R.lupa += l; if (l > R.tmax) R.sobre++;
    }
    const b = G.generateCase(4321, { level: L }); if (b.def && G.botPlay(b.def).win) R.win++; });
  return res;
}
const A = medir(OFFP()), S = medir();
LV.forEach((L) => { const a = A[L].lupa / A[L].n, s = S[L].lupa / S[L].n;
  ok(`${L}: lupa media con señuelos apagados ${a.toFixed(2)} dentro de 1,7-2,2`, a >= 1.7 && a <= 2.2);
  ok(`${L}: lupa media con señuelos encendidos (disco) ${s.toFixed(2)} dentro de 1,7-2,25`, s >= 1.7 && s <= 2.25);
  ok(`${L}: ningún caso pasa del tope máximo (${A[L].sobre} + ${S[L].sobre})`, A[L].sobre === 0 && S[L].sobre === 0);
  ok(`${L}: el bot gana el caso de muestra`, A[L].win === 1 && S[L].win === 1); });
{ const m1 = mutador('compile.js', 'if (MECH.herr2.lupaTope && b.level', 'if (false && MECH.herr2.lupaTope && b.level'); late.push(() => ok('mutación «sin tope de lupa»: el patrón encaja', m1.ok !== false));
  const M = medir(m1.patch); ok('mutación «sin tope de lupa» detectada (la lupa se sale de la banda)', LV.some((L) => M[L].lupa / M[L].n > 2.25 || M[L].sobre > 0));
  const m2 = mutador('compile.js', 'lupas.sort((x, y) => (falsa(x) ? 1 : 0) - (falsa(y) ? 1 : 0));', 'lupas.sort((x, y) => (falsa(x) ? 0 : 1) - (falsa(y) ? 0 : 1));'); late.push(() => ok('mutación «libera primero el sostén»: el patrón encaja', m2.ok !== false));
  const M2 = medir(m2.patch); ok('mutación «libera primero el sostén» detectada (quedan más lupas de señuelo)', LV.some((L) => M2[L].falsas > S[L].falsas)); }
late.forEach((g) => g()); console.log(bad ? `\n${bad} de ${checks} comprobaciones con fallos` : `\nTodo en orden (${checks} comprobaciones)`);
process.exit(bad ? 1 : 0);
