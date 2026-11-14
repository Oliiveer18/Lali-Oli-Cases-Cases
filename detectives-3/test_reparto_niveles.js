// test_reparto_niveles.js — reparto de herramientas por NIVEL (cp. 184, S2, GEN_VERSION >= 7): en cada caso hay ≥ 2 pistas de sostén libres (las 2 clave), la grabadora no pasa de 2 charlas,
// la lupa pesa más que la ganzúa, y la lupa de Difícil pesa más que la de Fácil. Con mutación (sin perfil por nivel → vuelve el reparto uniforme).
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗ ' + m); } };
function medir(patch) {
  const G = require('./tools/load_g.js')(MOD, patch); G.GEN_VERSION = 7;
  const A = { facil: { n: 0, lupa: 0, ganzua: 0, uv: 0, grab: 0 }, normal: { n: 0, lupa: 0, ganzua: 0, uv: 0, grab: 0 }, dificil: { n: 0, lupa: 0, ganzua: 0, uv: 0, grab: 0 } }; let minLibres = 99, maxGrab = 0;
  for (let i = 1; i <= 90; i++) {
    const r = G.generateCase(i * 7919 + 1, { register: true }); if (r.error || !r.bible) continue; const a = A[r.bible.level]; a.n++;
    const toolOf = {}; Object.keys(r.def.rooms).forEach((rid) => (r.def.rooms[rid].props || []).forEach((p) => (p.steps || []).forEach((st) => { if (st.clue && st.tool && st.tool !== 'coop') toolOf[st.clue] = st.tool; })));
    let free = 0, g = 0;
    r.bible.clues.filter((c) => c.source.type === 'prop' && ['prueba', 'descarte', 'refuta'].indexOf(c.role) >= 0).forEach((c) => { const t = toolOf[c.id]; if (!t) free++; else if (t === 'grabadora') { g++; a.grab++; } else a[t]++; });
    minLibres = Math.min(minLibres, free); maxGrab = Math.max(maxGrab, g);
  }
  return { A, minLibres, maxGrab };
}
const m = (a, k) => (a.n ? a[k] / a.n : 0);
const R = medir(null), A = R.A;
console.log('mín libres', R.minLibres, '· máx grabadora', R.maxGrab, '· lupa F/N/D', ['facil', 'normal', 'dificil'].map((l) => m(A[l], 'lupa').toFixed(2)).join('/'));
ok(A.facil.n > 15 && A.normal.n > 15 && A.dificil.n > 15, 'hay casos de los tres niveles');
ok(R.minLibres >= 2, 'siempre quedan ≥ 2 pistas de sostén libres');
ok(R.maxGrab <= 2, 'la grabadora no pasa de 2 charlas por caso');
ok(['facil', 'normal', 'dificil'].every((l) => m(A[l], 'lupa') > m(A[l], 'ganzua')), 'en cada nivel hay más lupa que ganzúa');
ok(m(A.dificil, 'lupa') > m(A.facil, 'lupa'), 'la lupa de Difícil pesa más que la de Fácil');
const quita = (f, t) => (f === 'compile.js' ? t.replace('MECH.herr2.levels && b.level ? MECH.herr2.levels[b.level] : null', 'false ? null : null') : t);
const Q = medir(quita).A;
ok(!(m(Q.dificil, 'lupa') > m(Q.facil, 'lupa') + 0.25 && m(Q.facil, 'lupa') > m(Q.facil, 'ganzua')), 'mutación «sin perfil por nivel»: detectada');
console.log(bad ? 'test_reparto_niveles: ' + bad + ' FALLOS' : 'test_reparto_niveles: OK'); process.exit(bad ? 1 : 0);
