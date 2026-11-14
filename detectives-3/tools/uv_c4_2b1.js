// c4 · SUBPASO 2b-1 (cp. 229): ¿cuántas pistas de sostén piden UV por caso y por qué no salen más? Solo lectura.
// Uso: GENV=7 node tools/uv_c4_2b1.js [N=100] [paso=7919]   Informe JSON: /tmp/uv_c4_2b1.json
const fs = require('fs');
// PARCHE=<nombre> prueba una variante en memoria (src/ intacto): kinds = UV también en pistas físicas.
const PARCHE = process.env.PARCHE || '';
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'], (f, t) => {
  if (f === 'gen_data.js' && PARCHE.indexOf('kinds') >= 0) t = t.replace("uv: ['documento'], ganzua:", "uv: ['documento', 'física'], ganzua:");
  if (f === 'compile.js' && PARCHE.indexOf('uvfirst') >= 0) t = t.replace("(H2L ? order().sort((x, y) => left[y] - left[x]) : order())", "(H2L ? order().sort((x, y) => ((y === 'uv') - (x === 'uv')) || left[y] - left[x]) : order())");
  if (f === 'compile.js' && PARCHE.indexOf('sobrante') >= 0) t = t.replace("left.uv = left.lupa = 9; pass(8, () => ['uv', 'lupa'])", "left.uv = left.lupa = 9; pass(8, () => ['lupa', 'uv'])");
  if (f === 'gen_data.js' && PARCHE.indexOf('mix') >= 0) t = t.replace("kinds: { uv: ['documento'], ganzua: ['documento', 'física'], lupa: ['física', 'documento', 'grabación'] }", "kinds: { uv: ['documento', 'física'], ganzua: ['física', 'documento'], lupa: ['física', 'grabación', 'documento'] }");
  return t;
}); G.GEN_VERSION = +process.env.GENV || 7;
const N = +process.argv[2] || 100, STEP = +process.argv[3] || 7919, LV = ['facil', 'normal', 'dificil'];
const out = { N, genV: G.GEN_VERSION, niveles: {} };
const tpls = (G.GEN_DATA && G.GEN_DATA.rooms) || {};
LV.forEach((L) => {
  const A = { casos: 0, uv: 0, uvSosten: 0, uvOtras: 0, lupa: 0, ganzua: 0, grab: 0, sostenN: 0, sostenDoc: 0, sostenDocConRincon: 0, salasConRincon: 0, salas: 0, uvTexts: {}, sinUv: 0, dist: {} };
  for (let i = 1; A.casos < N && i < N * 4; i++) {
    const r = G.generateCase(i * STEP + 1, { level: L }); if (r.error) continue; A.casos++;
    const def = r.def, byId = {}; r.bible.clues.forEach((c) => { byId[c.id] = c; });
    let uv = 0;
    Object.keys(def.rooms).forEach((k) => {
      const room = def.rooms[k]; A.salas++;
      const tp = (tpls[k] || []).find((t) => t.id === room.template);
      if (tp && tp.special && tp.special.rincon) A.salasConRincon++;
      (room.props || []).forEach((p) => {
        const st = (p.steps || [])[0] || {};
        if (st.tool === 'uv') { uv++; const c = byId[(p.id || '').replace(/^obj_/, '')]; if (c && ['prueba', 'descarte', 'refuta'].indexOf(c.role) >= 0) A.uvSosten++; else A.uvOtras++; }
        else if (st.tool === 'lupa') A.lupa++; else if (st.tool === 'ganzua') A.ganzua++;
      });
    });
    A.uv += uv; A.dist[uv] = (A.dist[uv] || 0) + 1; if (!uv) A.sinUv++;
    r.bible.clues.forEach((c) => { if (c.source.type === 'prop' && ['prueba', 'descarte', 'refuta'].indexOf(c.role) >= 0) { A.sostenN++; if (c.kind === 'documento') A.sostenDoc++; } });
  }
  const n = A.casos, f = (x) => +(x / n).toFixed(2);
  out.niveles[L] = { casos: n, uvPorCaso: f(A.uv), uvSostenPorCaso: f(A.uvSosten), uvOtrasPorCaso: f(A.uvOtras), lupaPorCaso: f(A.lupa), ganzuaPorCaso: f(A.ganzua), sostenPorCaso: f(A.sostenN), sostenDocumentoPorCaso: f(A.sostenDoc), salasConRinconPorCaso: f(A.salasConRincon), salasPorCaso: f(A.salas), casosSinUv: A.sinUv, distribucionUv: A.dist };
});
fs.writeFileSync('/tmp/uv_c4_2b1.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
