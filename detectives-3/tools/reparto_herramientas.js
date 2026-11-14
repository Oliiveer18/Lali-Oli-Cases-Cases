// A4 4/4-1 (22 oct): usa G.workShare/G.workIssues (la definición ÚNICA de reparto del revisor) para el bloque EQ-1 (banda 40-60 por caso y por capítulo).
// A4 HERR-1 · subpaso 1 (solo medir, no cambia el juego) + 3/4-a (22 oct): denominador fijo del ~25 % de pistas libres (EQ-6): reparto de herramientas y de trabajo entre Oli (rex) y Lali (luna).
// Uso: node tools/reparto_herramientas.js [N=200] [paso=7919]   (semilla = i*paso+1, como bot_masa). Informe JSON en /tmp/reparto_herramientas.json
// Cuenta, por caso generado: pasos con herramienta (lupa, ganzua, uv, grabadora), pasos «coop», puertas con herramienta y pistas sin herramienta,
// en NÚMERO y en SEGUNDOS (G.stepBaseSeconds), por detective (dueño de la herramienta: G.toolOwner) y por capítulo (chapterMin del objeto, 1 si no lo dice).
// DENOMINADOR DEL ~25 % LIBRE (EQ-6, fijado en 3/4-a): las PISTAS DE SOSTÉN = pistas de la biblia con source.type 'prop' (objeto) y role prueba, descarte o refuta, es decir las que cuentan
// para Acusar. NO entran: curiosidades (cur_), situaciones (sit_), pistas falsas/señuelos (role falsa; se informan aparte) ni las que cuenta un personaje (source npc; se informan aparte).
// «Libre» = su objeto no pide herramienta (el sigilo, que sí tiene vigilante, se cuenta aparte). Se mide sobre la biblia (r.bible.clues) y el objeto obj_<id> de def.
// Clase de objeto por su id: obj_ = pista del caso, cur_ = curiosidad, sit_ = situación macabra, push_ = empujar (paso coop).
const fs = require('fs');
// ANTES=1 → simula la voz de antes de b1 (todas las pistas libres con la voz de Oli) para el informe «antes/después» del bloque VOZ.
const ANTES = !!process.env.ANTES;
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'], ANTES ? (f, t) => (f === 'compile.js' ? t.replace("% 2 ? 'luna' : 'rex')", "% 2 ? 'rex' : 'rex')") : t) : undefined);
// GENV=6 → mide la receta de A4 3/4-b2 SIN subir la versión del repositorio (solo en memoria; la constante de bible.js sigue en 5).
if (process.env.GENV) G.GEN_VERSION = +process.env.GENV;
const N = +process.argv[2] || 200, STEP = +process.argv[3] || 7919;
const TOOLS = ['lupa', 'ganzua', 'uv', 'grabadora'];
const kind = (id) => (/^obj_/.test(id) ? 'pista' : /^cur_/.test(id) ? 'curiosidad' : /^sit_/.test(id) ? 'situacion' : /^push_/.test(id) ? 'empujar' : 'otro');

// Mide un caso (def) → { tool:{lupa:{n,s},...}, coop:{n,s}, free:{pista:n,curiosidad:n,situacion:n}, byDet:{rex:{n,s},luna:{n,s}}, byCh:{1:{rex:{n,s},luna:{n,s}},...}, listen:n, doors:{n,tools} }
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
function supportOf(r) {
  const info = {};
  Object.keys(r.def.rooms).forEach((rid) => (r.def.rooms[rid].props || []).forEach((p) => {
    if (!/^obj_/.test(p.id)) return;
    (p.steps || []).forEach((st) => { if (st.clue) info[st.clue] = { tool: (st.tool && st.tool !== 'coop' ? st.tool : null), watch: !!p.watcher }; });
  }));
  const o = { core: { n: 0, free: 0, watch: 0, tool: {} }, falsa: { n: 0, free: 0 }, npc: 0, sinObjeto: 0 };
  TOOLS.forEach((t) => (o.core.tool[t] = 0));
  r.bible.clues.forEach((c) => {
    if (c.source.type !== 'prop') { o.npc++; return; }
    const i = info[c.id];
    if (!i) { o.sinObjeto++; return; }
    if (c.role === 'falsa') { o.falsa.n++; if (!i.tool) o.falsa.free++; return; }
    if (['prueba', 'descarte', 'refuta'].indexOf(c.role) < 0) return;
    o.core.n++;
    if (i.tool) o.core.tool[i.tool]++; else if (i.watch) o.core.watch++; else o.core.free++;
  });
  return o;
}
const sup = { core: { n: 0, free: 0, watch: 0, tool: { lupa: 0, ganzua: 0, uv: 0, grabadora: 0 } }, falsa: { n: 0, free: 0 }, npc: 0, sinObjeto: 0, perCase: [] };

const pct = (a, b) => (a + b ? Math.round((100 * a) / (a + b)) : 0);
const agg = { n: 0, err: 0, tool: {}, coop: { n: 0, s: 0 }, free: { pista: 0, curiosidad: 0, situacion: 0, otro: 0 }, byDet: { rex: { n: 0, s: 0 }, luna: { n: 0, s: 0 } }, byCh: {}, listen: 0, doors: { n: 0 }, out: { num: 0, time: 0, casos: 0 }, level: {} };
TOOLS.forEach((t) => (agg.tool[t] = { n: 0, s: 0, casesWith: 0 }));
const perCase = [];
const EQ = { n: 0, okAll: 0, caso: { numero: 0, tiempo: 0 }, ch: {}, oliNum: [], oliTime: [] }; // EQ-1 según G.workIssues
function addEq(def) {
  EQ.n++;
  const iss = G.workIssues(def), w = G.workShare(def);
  if (!iss.length) EQ.okAll++;
  iss.forEach((i) => { if (i.scope === 'caso') EQ.caso[i.axis]++; else { const c = (EQ.ch[i.scope] = EQ.ch[i.scope] || { numero: 0, tiempo: 0 }); c[i.axis]++; } });
  Object.keys(w.chShare).forEach((c) => { EQ.ch['cap' + c] = EQ.ch['cap' + c] || { numero: 0, tiempo: 0 }; EQ.ch['cap' + c].con = (EQ.ch['cap' + c].con || 0) + 1; });
  if (w.share.num !== null) { EQ.oliNum.push(w.share.num); EQ.oliTime.push(w.share.time); }
}
function addCase(label, m) {
  agg.n++;
  TOOLS.forEach((t) => { agg.tool[t].n += m.tool[t].n; agg.tool[t].s += m.tool[t].s; if (m.tool[t].n > 0) agg.tool[t].casesWith++; });
  agg.coop.n += m.coop.n; agg.coop.s += m.coop.s; agg.listen += m.listen; agg.doors.n += m.doors.n;
  Object.keys(m.free).forEach((k) => (agg.free[k] += m.free[k]));
  ['rex', 'luna'].forEach((d) => { agg.byDet[d].n += m.byDet[d].n; agg.byDet[d].s += m.byDet[d].s; });
  Object.keys(m.byCh).forEach((c) => {
    const a = (agg.byCh[c] = agg.byCh[c] || { rex: { n: 0, s: 0 }, luna: { n: 0, s: 0 } });
    ['rex', 'luna'].forEach((d) => { a[d].n += m.byCh[c][d].n; a[d].s += m.byCh[c][d].s; });
  });
  const pn = pct(m.byDet.rex.n, m.byDet.luna.n), pt = pct(m.byDet.rex.s, m.byDet.luna.s);
  const bad = pn < 40 || pn > 60 || pt < 40 || pt > 60;
  if (bad) agg.out.casos++;
  perCase.push({ label, oliNum: pn, oliTime: pt });
}

for (let i = 1; i <= N; i++) {
  const seed = i * STEP + 1, r = G.generateCase(seed, { register: true });
  if (r.error) { agg.err++; continue; }
  addCase(seed, measure(r.def)); addEq(r.def);
  const so = supportOf(r);
  sup.core.n += so.core.n; sup.core.free += so.core.free; sup.core.watch += so.core.watch; TOOLS.forEach((t) => (sup.core.tool[t] += so.core.tool[t]));
  sup.falsa.n += so.falsa.n; sup.falsa.free += so.falsa.free; sup.npc += so.npc; sup.sinObjeto += so.sinObjeto;
  if (so.core.n) sup.perCase.push(Math.round((100 * so.core.free) / so.core.n));
}
// ---- VOZ (A4 3/4-b1): quién habla en el cartel de cada paso (`who`), por clase de objeto
const VOZ = {};
const vozAdd = (cls, who) => { const v = (VOZ[cls] = VOZ[cls] || { rex: 0, luna: 0 }); if (who === 'rex' || who === 'luna') v[who]++; };
for (let i = 1; i <= N; i++) {
  const r = G.generateCase(i * STEP + 1, { register: true }); if (r.error) continue;
  Object.keys(r.def.rooms).forEach((rid) => (r.def.rooms[rid].props || []).forEach((p) => {
    const cls = p.chat ? 'charla grabada' : /^cur_/.test(p.id) ? 'curiosidad' : /^sit_/.test(p.id) ? 'situación' : /^obj_/.test(p.id) ? 'pista' : null; if (!cls) return;
    (p.steps || []).forEach((st) => vozAdd(cls + (st.tool && st.tool !== 'coop' ? ' (con herramienta)' : cls === 'pista' ? ' (libre)' : ''), st.who));
  }));
}
const c1 = G.CASES && Object.values(G.CASES)[0];
const c1m = c1 ? measure(c1) : null;

const L = [];
const pr = (s) => { L.push(s); console.log(s); };
pr(`=== Reparto de herramientas · ${agg.n} casos generados (${agg.err} sin generar), semillas i*${STEP}+1 ===`);
pr('Herramienta   pasos   %pasos  segundos  casos con ≥1   dueño');
const totalSteps = TOOLS.reduce((a, t) => a + agg.tool[t].n, 0);
TOOLS.forEach((t) => pr(`${t.padEnd(12)} ${String(agg.tool[t].n).padStart(6)}  ${String(Math.round((100 * agg.tool[t].n) / (totalSteps || 1))).padStart(5)}%  ${String(Math.round(agg.tool[t].s)).padStart(8)}  ${String(Math.round((100 * agg.tool[t].casesWith) / (agg.n || 1))).padStart(8)}%      ${G.toolOwner(t)}`));
pr(`coop (empujar, 2 detectives): ${agg.coop.n} pasos · puertas con herramienta: ${agg.doors.n} · objetos con «listen»: ${agg.listen}`);
const D = agg.byDet;
pr(`\nTRABAJO OBLIGADO POR DETECTIVE (pasos con herramienta, sin coop):`);
pr(`  Oli  (rex):  ${D.rex.n} pasos · ${Math.round(D.rex.s)} s`);
pr(`  Lali (luna): ${D.luna.n} pasos · ${Math.round(D.luna.s)} s`);
pr(`  Reparto Oli/Lali: ${pct(D.rex.n, D.luna.n)}/${100 - pct(D.rex.n, D.luna.n)} en número · ${pct(D.rex.s, D.luna.s)}/${100 - pct(D.rex.s, D.luna.s)} en tiempo (meta 40-60)`);
pr(`  Casos con algún detective fuera de 40-60 (número o tiempo): ${agg.out.casos} de ${agg.n} (${Math.round((100 * agg.out.casos) / (agg.n || 1))} %)`);
const f = agg.free;
pr(`\nOBJETOS SIN HERRAMIENTA (todos los objetos visibles con pasos sin tool; NO es la cifra de EQ-6): pistas ${f.pista} · curiosidades ${f.curiosidad} · situaciones ${f.situacion} · otros ${f.otro}`);
const C = sup.core, toolN = TOOLS.reduce((a, t) => a + C.tool[t], 0), pc = sup.perCase.slice().sort((a, b) => a - b);
pr(`\nPISTAS DE SOSTÉN (denominador de EQ-6: objetos con role prueba, descarte o refuta; sin curiosidades, situaciones, señuelos ni testimonios): ${C.n} en ${agg.n} casos (≈ ${(C.n / (agg.n || 1)).toFixed(1)} por caso)`);
pr(`  LIBRES (sin herramienta): ${C.free} = ${Math.round((100 * C.free) / (C.n || 1))} % (meta ~25 %) · con sigilo (vigilante, sin herramienta): ${C.watch} = ${Math.round((100 * C.watch) / (C.n || 1))} % · con herramienta: ${toolN} = ${Math.round((100 * toolN) / (C.n || 1))} % (${TOOLS.map((t) => t + ' ' + C.tool[t]).join(', ')})`);
if (pc.length) pr(`  %libre por caso: mín ${pc[0]} · mediana ${pc[pc.length >> 1]} · máx ${pc[pc.length - 1]}  (ninguna pista de sostén con herramienta en ${pc.filter((x) => x === 100).length} casos)`);
pr(`  Aparte (no entran): señuelos con objeto ${sup.falsa.n} (${sup.falsa.free} libres) · pistas que cuenta un personaje ${sup.npc} · pistas sin objeto en def ${sup.sinObjeto}`);
pr(`\nPOR CAPÍTULO (chapterMin del objeto; 1 si no lo dice):`);
Object.keys(agg.byCh).sort().forEach((c) => { const a = agg.byCh[c]; pr(`  Cap. ${c}: Oli ${a.rex.n} pasos/${Math.round(a.rex.s)} s · Lali ${a.luna.n} pasos/${Math.round(a.luna.s)} s → ${pct(a.rex.n, a.luna.n)}/${100 - pct(a.rex.n, a.luna.n)} en número`); });
if (c1m) pr(`\nCASO 1 (reservado): Oli ${c1m.byDet.rex.n} pasos/${Math.round(c1m.byDet.rex.s)} s · Lali ${c1m.byDet.luna.n} pasos/${Math.round(c1m.byDet.luna.s)} s · herramientas ${TOOLS.map((t) => t + ' ' + c1m.tool[t].n).join(', ')} · coop ${c1m.coop.n} · listen ${c1m.listen}`);
const nums = perCase.map((c) => c.oliNum).sort((a, b) => a - b);
if (nums.length) pr(`\n%Oli por caso (número): mín ${nums[0]} · mediana ${nums[nums.length >> 1]} · máx ${nums[nums.length - 1]}`);
const med = (a) => { const x = a.slice().sort((p, q) => p - q); return x.length ? x[x.length >> 1] : 0; };
pr(`\nEQ-1 (revisor, banda ${G.WORK_BAND.min}-${G.WORK_BAND.max} % por detective; G.workIssues): casos que cumplen TODO (caso y capítulos): ${EQ.okAll} de ${EQ.n} (${Math.round((100 * EQ.okAll) / (EQ.n || 1))} %)`);
pr(`  Caso entero fuera de banda: en número ${EQ.caso.numero} · en tiempo ${EQ.caso.tiempo} · %Oli mediana: número ${Math.round(med(EQ.oliNum))} / tiempo ${Math.round(med(EQ.oliTime))}`);
Object.keys(EQ.ch).sort().forEach((c) => pr(`  ${c}: con trabajo en ${EQ.ch[c].con || 0} casos · fuera de banda: número ${EQ.ch[c].numero} · tiempo ${EQ.ch[c].tiempo}`));
pr(`\nVOZ (quién habla en el cartel de cada paso; ${ANTES ? 'ANTES de b1, simulado' : 'DESPUÉS de b1'}): clase → Oli / Lali`);
Object.keys(VOZ).sort().forEach((k) => { const v = VOZ[k], t = v.rex + v.luna; pr(`  ${k.padEnd(30)} ${String(v.rex).padStart(6)} / ${String(v.luna).padStart(6)}  (${Math.round((100 * v.rex) / (t || 1))} % Oli)`); });
fs.writeFileSync('/tmp/reparto_herramientas.json', JSON.stringify({ agg, eq1: EQ, c1: c1m, sosten: { core: sup.core, falsa: sup.falsa, npc: sup.npc, sinObjeto: sup.sinObjeto } }, null, 1));
fs.writeFileSync('/tmp/reparto_herramientas.txt', L.join('\n'));
