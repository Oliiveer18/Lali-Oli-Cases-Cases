// uso_2b4.js — c4 2b-4 paso 3b (25 oct): pasos con herramienta POR CASO y POR NIVEL (F · N · D), N casos por nivel (semillas i*7919+1, como palancas_cl5).
// Uso: GENV=7 node tools/uso_2b4.js [N=150]   ·   PARCHE='js' = código que cambia DATOS EN MEMORIA antes de medir (p. ej. G.GEN_DATA.compile.mech.herr2.senuelos.dificil.uv=[[0,60],[1,40]]). No toca src/.
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
G.GEN_VERSION = +process.env.GENV || 7;
const N = +process.argv[2] || 150, TOOLS = ['lupa', 'ganzua', 'uv', 'grabadora'];
const kind = (id) => (/^obj_/.test(id) ? 'pista' : /^cur_/.test(id) ? 'curiosidad' : /^sit_/.test(id) ? 'situacion' : /^push_/.test(id) ? 'empujar' : 'otro');
function measure(def) {
  const m = { tool: {}, coop: { n: 0, s: 0 }, free: { pista: 0, curiosidad: 0, situacion: 0, otro: 0 }, byDet: { rex: { n: 0, s: 0 }, luna: { n: 0, s: 0 } }, byCh: {}, listen: 0, doors: { n: 0, tools: {} }, nCh: def.chapters.length };
  TOOLS.forEach((t) => (m.tool[t] = { n: 0, s: 0 }));
  const add = (ch, det, s) => {
    m.byDet[det].n++; m.byDet[det].s += s;
    const c = (m.byCh[ch] = m.byCh[ch] || { rex: { n: 0, s: 0 }, luna: { n: 0, s: 0 } });
    c[det].n++; c[det].s += s;
  };
  Object.keys(def.rooms).forEach((rid) => {
    (def.rooms[rid].props || []).forEach((p) => {
      if (p.listen) m.listen++;
      const ch = p.chapterMin || 1, k = kind(p.id), steps = p.steps || [];
      if (!steps.length) return;
      let hasTool = false;
      steps.forEach((st) => {
        const s = G.stepBaseSeconds(st);
        if (st.tool === 'coop') { m.coop.n++; m.coop.s += s; hasTool = true; return; }
        if (st.tool && m.tool[st.tool]) {
          hasTool = true; m.tool[st.tool].n++; m.tool[st.tool].s += s;
          const own = G.toolOwner(st.tool, def); if (own) add(ch, own, s);
        }
      });
      if (!hasTool && p.visible === undefined) m.free[k] = (m.free[k] || 0) + 1;
    });
    (def.rooms[rid].doors || []).forEach((d) => {
      if (d.locked && d.locked.tool) {
        m.doors.n++; m.doors.tools[d.locked.tool] = (m.doors.tools[d.locked.tool] || 0) + 1;
        const own = G.toolOwner(d.locked.tool, def), s = d.locked.time || (G.TOOLS[d.locked.tool] ? G.TOOLS[d.locked.tool].time : 0);
        if (own) add(d.locked.chapterMin || 1, own, s);
      }
    });
  });
  return m;
}

// Pistas de sostén de un caso generado r = {def, bible}: {core:{n,free,watch,tool:{...}}, falsa:{n,free}, npc:n}
if (process.env.PARCHE) new Function('G', process.env.PARCHE)(G);
const LV = ['facil', 'normal', 'dificil'], SEEDS = { facil: [], normal: [], dificil: [] };
for (let i = 1; i < 3000 && LV.some((k) => SEEDS[k].length < N); i++) { const sd = i * 7919 + 1, r = G.generateCase(sd, { register: true }); if (r.error || !r.def.genLevel) continue; if (SEEDS[r.def.genLevel].length < N) SEEDS[r.def.genLevel].push(sd); }
const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');
const out = {};
LV.forEach((L) => {
  const t = { lupa: 0, ganzua: 0, uv: 0, grabadora: 0 }, g0 = { 0: 0, 1: 0, 2: 0, 3: 0 }; let n = 0, err = 0, oli = 0, tot = 0;
  SEEDS[L].forEach((sd) => { const r = G.generateCase(sd, { register: true, level: L }); if (r.error) { err++; return; } const m = measure(r.def); n++; TOOLS.forEach((k) => (t[k] += m.tool[k].n)); g0[Math.min(3, m.tool.grabadora.n)]++; oli += m.byDet.rex.n; tot += m.byDet.rex.n + m.byDet.luna.n; });
  out[L] = { n, err, lupa: t.lupa / n, ganzua: t.ganzua / n, uv: t.uv / n, grabadora: t.grabadora / n, grabDist: g0, oliPct: 100 * oli / tot };
});
LV.forEach((L) => { const o = out[L]; console.log(L.padEnd(8), 'n=' + o.n, 'err=' + o.err, '| lupa', f2(o.lupa), '| ganzúa', f2(o.ganzua), '| UV', f2(o.uv), '| grabadora', f2(o.grabadora), 'dist 0/1/2/3+:', JSON.stringify(Object.values(o.grabDist)), '| Oli', f2(o.oliPct) + ' %'); });
