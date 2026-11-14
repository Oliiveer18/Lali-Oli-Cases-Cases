// reparto_niveles.js — reparto de herramientas y refutaciones por TESTIMONIO, medido POR NIVEL (paquete de reparto de herramientas, cp. 184, 25 oct).
// Uso: GENV=7 node tools/reparto_niveles.js [N=150] [paso=7919]   (semilla = i*paso+1, como bot_masa; solo mide, no cambia el juego)
// Denominador = pistas de sostén (objeto con role prueba, descarte o refuta). «Libre» = su paso no pide herramienta (grabadora = charla grabada). Informa por caso: media, mínimo y máximo.
// Mentiras: cuántas llevan al menos una refutación por TESTIMONIO de personaje (source npc) y cuántas dependen solo de objetos.
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
if (process.env.GENV) G.GEN_VERSION = +process.env.GENV;
const N = +process.argv[2] || 150, STEP = +process.argv[3] || 7919;
const TOOLS = ['lupa', 'ganzua', 'uv', 'grabadora', 'sigilo', 'empuje'], LV = ['facil', 'normal', 'dificil'];
const supp = (c) => ['prueba', 'descarte', 'refuta'].indexOf(c.role) >= 0;
const stat = () => ({ n: 0, sum: 0, min: 1e9, max: -1e9, h: {} });
const put = (s, v) => { s.n++; s.sum += v; s.min = Math.min(s.min, v); s.max = Math.max(s.max, v); s.h[v] = (s.h[v] || 0) + 1; };
const A = {};
LV.forEach((l) => { A[l] = { casos: 0, err: 0, S: stat(), libres: stat(), tool: {}, lies: stat(), liesTest: stat(), liesSoloObj: 0, liesTot: 0, casosAlgunaSoloObj: 0, nTest: stat() }; TOOLS.forEach((t) => (A[l].tool[t] = stat())); });
for (let i = 1; i <= N; i++) {
  const r = G.generateCase(i * STEP + 1, { register: true });
  const lv = r && r.bible && r.bible.level; if (!A[lv]) { if (r && r.error) (A.facil.err++); continue; }
  const a = A[lv]; a.casos++;
  const toolOf = {};
  Object.keys(r.def.rooms).forEach((rid) => (r.def.rooms[rid].props || []).forEach((p) => (p.steps || []).forEach((st) => { if (st.clue) toolOf[st.clue] = (st.tool && st.tool !== 'coop' ? st.tool : p.watcher ? 'sigilo' : (p.visible !== undefined && /^obj_/.test(p.id) ? 'empuje' : (toolOf[st.clue] || null))); })));
  const sup = r.bible.clues.filter((c) => c.source.type === 'prop' && supp(c));
  const cnt = { lupa: 0, ganzua: 0, uv: 0, grabadora: 0, sigilo: 0, empuje: 0 }; let free = 0;
  sup.forEach((c) => { const t = toolOf[c.id]; if (t && cnt[t] !== undefined) cnt[t]++; else free++; });
  put(a.S, sup.length); put(a.libres, free); TOOLS.forEach((t) => put(a.tool[t], cnt[t]));
  // mentiras: ¿alguna refutación es un testimonio de personaje?
  let soloObj = 0; const byId = {}; r.bible.clues.forEach((c) => { byId[c.id] = c; });
  r.bible.lies.forEach((l) => { const t = l.refutedBy.filter((id) => byId[id] && byId[id].source.type === 'npc').length; a.liesTot++; if (!t) soloObj++; });
  a.liesSoloObj += soloObj; if (soloObj) a.casosAlgunaSoloObj++; put(a.lies, r.bible.lies.length); put(a.liesTest, r.bible.lies.length - soloObj);
  put(a.nTest, r.bible.clues.filter((c) => c.source.type === 'npc' && supp(c)).length);
}
const f = (s) => (s.n ? (s.sum / s.n).toFixed(2) : '-'), mm = (s) => (s.n ? `${s.min}-${s.max}` : '-');
const out = [];
const pr = (x) => { out.push(x); console.log(x); };
pr(`=== Reparto por nivel · ${N} semillas (i*${STEP}+1) · GEN_VERSION ${G.GEN_VERSION} ===`);
LV.forEach((l) => {
  const a = A[l]; if (!a.casos) { pr(`${l}: sin casos`); return; }
  const free = Math.round((100 * a.libres.sum) / (a.S.sum || 1));
  pr(`\n${l.toUpperCase()} · ${a.casos} casos · pistas de sostén ${f(a.S)} (${mm(a.S)})`);
  pr('  por caso (media, rango): ' + TOOLS.map((t) => `${t} ${f(a.tool[t])} (${mm(a.tool[t])})`).join(' · ') + ` · LIBRES ${f(a.libres)} (${mm(a.libres)}) = ${free} %`);
  pr(`  mentiras por caso ${f(a.lies)} · con ≥1 refutación por TESTIMONIO: ${f(a.liesTest)} por caso · solo-objeto: ${a.liesSoloObj} de ${a.liesTot} mentiras (${Math.round((100 * a.liesSoloObj) / (a.liesTot || 1))} %) · casos con alguna mentira solo-objeto: ${a.casosAlgunaSoloObj} de ${a.casos}`);
  pr(`  testimonios de sostén (npc) por caso: ${f(a.nTest)} (${mm(a.nTest)})`);
});
require('fs').writeFileSync('/tmp/reparto_niveles.json', JSON.stringify(A, null, 1));
require('fs').writeFileSync('/tmp/reparto_niveles.txt', out.join('\n'));
