// senuelos_c4_balanceador.js — c4-2a: ¿pierde el balanceador (freeLupa) las lupas de los señuelos? SOLO MIDE (parche en memoria de compile.js; src/ no se toca).
// Uso: GENV=7 node tools/senuelos_c4_balanceador.js [N=150] [paso=7919]  (semilla = i*paso+1, como senuelos_c4.js)
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'], (f, t) => {
  if (f !== 'compile.js') return t;
  let n = 0;
  t = t.replace("if (H2 && MECH.herr2.senuelos && b.level && MECH.herr2.senuelos[b.level]) {", () => { n++; return "G.__cur = { asig: 0, libSen: 0, libSos: 0, ids: {}, disparo: 0 };\n    if (H2 && MECH.herr2.senuelos && b.level && MECH.herr2.senuelos[b.level]) {"; });
  t = t.replace("cand.slice(0, want).forEach((c) => { taken[c.id] = true; toolOf[c.id] = 'lupa'; });", () => { n++; return "cand.slice(0, want).forEach((c) => { taken[c.id] = true; toolOf[c.id] = 'lupa'; G.__cur.asig++; G.__cur.ids[c.id] = 1; });"; });
  t = t.replace("while (lupas.length) { const c = cnt(); if (c.rex <= 1.5 * c.luna) break; freeLupa(lupas.pop()); }", () => { n++; return "while (lupas.length) { const c = cnt(); if (c.rex <= 1.5 * c.luna) break; G.__cur.disparo = 1; const _id = lupas.pop(); if (freeLupa(_id)) { if (G.__cur.ids[_id]) G.__cur.libSen++; else G.__cur.libSos++; } }"; });
  if (n !== 3) throw new Error('el parche no encaja (' + n + '/3): actualizar el patrón de esta herramienta');
  return t;
});
G.GEN_VERSION = +process.env.GENV || 7;
const N = parseInt(process.argv[2] || '150', 10), STEP = parseInt(process.argv[3] || '7919', 10), out = { N, genV: G.GEN_VERSION, niveles: {} };
['facil', 'normal', 'dificil'].forEach((L) => {
  const A = { casos: 0, asig: 0, libSen: 0, libSos: 0, disparo: 0, conAsig: 0, sosFin: 0, falsasObj: 0, senFin: 0, lupaFinal: 0 };
  for (let i = 0; i < N; i++) {
    G.__cur = null; const r = G.generateCase(i * STEP + 1, { level: L }); if (r.error || !G.__cur) continue;
    A.casos++; const c = G.__cur; A.asig += c.asig; A.libSen += c.libSen; A.libSos += c.libSos; A.disparo += c.disparo; if (c.asig) A.conAsig++;
  }
  out.niveles[L] = A;
});
const f = (x, n) => (x / n).toFixed(2);
console.log('c4-2a · ¿libera el balanceador las lupas de señuelo? · GEN_VERSION ' + out.genV + ' · N=' + N + ' por nivel (último intento de cada caso)');
Object.keys(out.niveles).forEach((L) => { const A = out.niveles[L], n = A.casos; console.log(L.padEnd(8), 'casos ' + n, '· lupas de señuelo asignadas/caso ' + f(A.asig, n), '· con alguna ' + A.conAsig, '· LIBERADAS señuelo/caso ' + f(A.libSen, n), '· liberadas sostén/caso ' + f(A.libSos, n), '· casos donde actúa el balanceador ' + A.disparo, '· señuelos con lupa que sobreviven/caso ' + f(A.asig - A.libSen, n)); });
require('fs').writeFileSync('/tmp/senuelos_c4_balanceador.json', JSON.stringify(out));
