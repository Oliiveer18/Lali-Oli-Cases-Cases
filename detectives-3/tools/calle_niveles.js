// calle_niveles.js — 3-bis 2/3: % de casos con escena de calle por nivel y por nº de salas (solo lectura).
// Uso: [GENV=5] node tools/calle_niveles.js [N=1000] [paso=7919]
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
if (process.env.GENV) G.GEN_VERSION = +process.env.GENV;
const N = +process.argv[2] || 1000, STEP = +process.argv[3] || 7919, pct = (a, b) => (b ? Math.round(1000 * a / b) / 10 : 0);
console.log(`GEN_VERSION ${G.GEN_VERSION} · ${N} semillas por nivel (misma semilla en los 3) · meta global 25-35 %`);
const by = {}; let tc = 0, tn = 0;
for (const L of ['facil', 'normal', 'dificil']) {
  let c = 0, n = 0; const rooms = {};
  for (let i = 1; i <= N; i++) {
    const r = G.generateCase(i * STEP + 1, { register: true, level: L }); if (r.error) continue;
    const calle = G.caseFingerprint(r.def, r.bible).scene === 'calle', k = Object.keys(r.def.rooms).length;
    n++; if (calle) c++; (rooms[k] = rooms[k] || [0, 0])[1]++; if (calle) rooms[k][0]++;
  }
  tc += c; tn += n; by[L] = { n, calle: pct(c, n), porSalas: Object.fromEntries(Object.entries(rooms).map(([k, v]) => [k + ' salas', `${pct(v[0], v[1])} % (${v[1]})`])) };
  console.log(L.padEnd(8), `calle ${by[L].calle} %`, JSON.stringify(by[L].porSalas));
}
console.log('global (3 niveles juntos)', pct(tc, tn), '%');
