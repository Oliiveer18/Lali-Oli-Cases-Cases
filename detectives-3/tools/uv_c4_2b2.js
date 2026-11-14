// c4 · 2b-2 (cp. 230): mide los SEÑUELOS CON UV. Uso: node tools/uv_c4_2b2.js [N=40]  (GEN_VERSION 7 en memoria; comprobación rápida, no medición final)
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
// Por defecto ENCIENDE los señuelos con UV en memoria (en disco están apagados, `uvSenuelos: false`); PARCHE=sinuv los deja apagados (comparación).
const G = require('./load_g.js')(MOD, (f, t) => (f === 'gen_data.js' && process.env.PARCHE !== 'sinuv' ? t.replace('uvFirst: true, uvSenuelos: false', 'uvFirst: true, uvSenuelos: true') : t)); G.GEN_VERSION = 7;
const N = +process.argv[2] || 40;
['facil', 'normal', 'dificil'].forEach((L) => {
  const R = { n: 0, uvS: 0, uvF: 0, lupa: 0, gz: 0, rec: 0, sinS: 0, cad: 0, err: 0 };
  for (let i = 1; R.n < N && i < N * 6; i++) {
    const r = G.generateCase(i * 7919 + 1, { level: L }); if (r.error) { R.err++; continue; } R.n++;
    const byId = {}; r.bible.clues.forEach((c) => { byId[c.id] = c; }); let s = 0;
    Object.values(r.def.rooms).forEach((rm) => (rm.props || []).forEach((p) => { const st = (p.steps || [])[0]; if (!st || !st.tool) return;
      const c = byId[(p.id || '').replace(/^obj_/, '')], f = c && c.role === 'falsa';
      if (st.tool === 'uv') { if (f) { R.uvF++; s++; } else R.uvS++; if (p.visible) R.cad++; }
      else if (st.tool === 'lupa') R.lupa++; else if (st.tool === 'ganzua') R.gz++; else if (st.tool === 'grabadora') R.rec++; }));
    if (!s) R.sinS++;
  }
  const f = (x) => (x / R.n).toFixed(2);
  console.log(`${L.padEnd(8)} n=${R.n} err=${R.err} · UV sostén ${f(R.uvS)} · UV señuelo ${f(R.uvF)} (casos sin señuelo UV ${R.sinS}) · lupa ${f(R.lupa)} · ganzúa ${f(R.gz)} · cadenas ${f(R.cad)}`);
});
