// c4 · 2b-3 (cp. 232): mide los SEÑUELOS CON GANZÚA y la CADENA DE SEÑUELOS. Uso: node tools/ganzua_c4_2b3.js [N=40]  (GEN_VERSION 7 en memoria; comprobación rápida, no medición final)
// PARCHE=disco (por defecto) = lo que hay en disco · off = ambos interruptores apagados · gz = solo ganzuaSenuelos · gzuv = ambos encendidos.
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'], P = process.env.PARCHE || 'disco';
const G = require('./load_g.js')(MOD, (f, t) => { if (f !== 'gen_data.js') return t; const m = t.match(/uvSenuelos: (true|false), ganzuaSenuelos: (true|false)/)[0]; if (P !== 'disco') t = t.replace(m, 'uvSenuelos: ' + (P === 'gzuv') + ', ganzuaSenuelos: ' + (P !== 'off')); return t; }); G.GEN_VERSION = 7;
const N = +process.argv[2] || 40;
console.log('PARCHE=' + P);
['facil', 'normal', 'dificil'].forEach((L) => {
  const R = { n: 0, gzS: 0, gzF: 0, uvS: 0, uvF: 0, lupa: 0, rec: 0, cadR: 0, cadF: 0, cadMix: 0, sinF: 0, win: 0, err: 0 };
  for (let i = 1; R.n < N && i < N * 6; i++) {
    const r = G.generateCase(i * 7919 + 1, { level: L }); if (r.error) { R.err++; continue; } R.n++;
    const byId = {}; r.bible.clues.forEach((c) => { byId[c.id] = c; }); let s = 0;
    const gzOf = {}; Object.values(r.def.rooms).forEach((rm) => (rm.props || []).forEach((p) => { const st = (p.steps || [])[0]; if (st && st.tool === 'ganzua') gzOf[(p.id || '').replace(/^obj_/, '')] = true; }));
    Object.values(r.def.rooms).forEach((rm) => (rm.props || []).forEach((p) => { const st = (p.steps || [])[0]; if (!st || !st.tool) return;
      const id = (p.id || '').replace(/^obj_/, ''), c = byId[id], f = c && c.role === 'falsa';
      if (st.tool === 'uv') { if (f) R.uvF++; else R.uvS++; if (p.visible) { const g = p.visible.flag.replace(/^abierto_/, ''), gf = byId[g] && byId[g].role === 'falsa'; if (f && gf) R.cadF++; else if (!f && !gf) R.cadR++; else R.cadMix++; } }
      else if (st.tool === 'ganzua') { if (f) { R.gzF++; s++; } else R.gzS++; }
      else if (st.tool === 'lupa') R.lupa++; }));
    Object.values(r.def.rooms).forEach((rm) => (rm.props || []).forEach((p) => { if (p.listen && p.chat) R.rec++; }));
    if (!s) R.sinF++;
    const q = G.botPlay(r.def); if (q.win) R.win++;
  }
  const f = (x) => (x / R.n).toFixed(2);
  console.log(`${L.padEnd(8)} n=${R.n} err=${R.err} · ganzúa sostén ${f(R.gzS)} señuelo ${f(R.gzF)} (casos sin señuelo ${R.sinF}) · UV sostén ${f(R.uvS)} señuelo ${f(R.uvF)} · lupa ${f(R.lupa)} · grabadora ${f(R.rec)} · ganzúa TOTAL ${f(R.gzS + R.gzF)} · UV TOTAL ${f(R.uvS + R.uvF)} · cadenas real ${f(R.cadR)} señuelo ${f(R.cadF)} mixtas ${R.cadMix} · bot gana ${R.win}/${R.n}`);
});
