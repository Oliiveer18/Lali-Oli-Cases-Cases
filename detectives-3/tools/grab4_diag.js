// grab4_diag.js — c4-2c GRAB-4 paso 1 (SOLO LECTURA): por qué algunos casos no llevan charla grabada con pista.
// Uso: GENV=7 node tools/grab4_diag.js [N=150]
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
G.GEN_VERSION = +process.env.GENV || 7;
const N = +process.argv[2] || 150, LV = ['facil', 'normal', 'dificil'], SEEDS = { facil: [], normal: [], dificil: [] };
for (let i = 1; i < 3000 && LV.some((k) => SEEDS[k].length < N); i++) { const sd = i * 7919 + 1, r = G.generateCase(sd, { register: true }); if (r.error || !r.def.genLevel) continue; if (SEEDS[r.def.genLevel].length < N) SEEDS[r.def.genLevel].push(sd); }
const SUP = ['prueba', 'descarte', 'refuta'];
LV.forEach((L) => {
  const c = { n: 0, conCharla: 0, sin: 0, causa: {}, grabTot: 0 }, ejemplos = [];
  SEEDS[L].forEach((sd) => {
    const r = G.generateCase(sd, { register: true, level: L }); if (r.error) return; c.n++;
    const def = r.def, b = r.bible || {};
    let listenClue = 0, listenAny = 0;
    Object.keys(def.rooms).forEach((rid) => (def.rooms[rid].props || []).forEach((p) => { if (p.listen) { listenAny++; if (p.steps && p.steps.some((s) => s.clue)) listenClue++; } }));
    if (listenClue >= 1) { c.conCharla++; return; }
    c.sin++;
    const clues = (b.clues || []);
    const grab = clues.filter((q) => q.kind === 'grabación');
    const grabProp = grab.filter((q) => q.source && q.source.type === 'prop');
    const grabSup = grabProp.filter((q) => SUP.indexOf(q.role) >= 0);
    let causa;
    if (!grab.length) causa = 'A: la biblia no trae NINGUNA pista tipo grabación';
    else if (!grabProp.length) causa = 'B: hay grabación pero no es de objeto';
    else if (!grabSup.length) causa = 'C: hay grabación de objeto pero no es prueba/descarte/refuta (p. ej. falsa o ambiente)';
    else causa = 'D: hay grabación de sostén elegible; la bloquea okGate / falta rincón de charla / reparto grabadora=0';
    c.causa[causa] = (c.causa[causa] || 0) + 1; if (ejemplos.length < 3) ejemplos.push(sd + ' (' + causa[0] + ', listenAny=' + listenAny + ', grab=' + grab.length + ')');
  });
  console.log(L.padEnd(8), 'n=' + c.n, 'con charla con pista=' + c.conCharla, 'SIN=' + c.sin);
  Object.keys(c.causa).forEach((k) => console.log('   ', c.causa[k], '×', k));
  if (ejemplos.length) console.log('    semillas:', ejemplos.join(' | '));
});
