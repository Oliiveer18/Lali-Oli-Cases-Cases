// CL-5c-c 2/4: REVISOR (J5-J6), MEDIDOR y HUELLA conocen los puzles (docs/DISENO_PUZLES_CL5C.md). Una a una: node test_puzles_revisor.js [N=20]
// Casos de Difícil v7 con puzles: se estropean EN MEMORIA y el revisor debe rechazarlos; el medidor cuenta el coste del puzle; la huella declara su tipo.
// Fácil, Normal y v6 no llevan puzles: sus resultados no cambian. Con mutación: si se apaga cada pieza, la prueba lo detecta.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'];
const N = +process.argv[2] || 20;
let bad = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m); } };
const clone = (x) => JSON.parse(JSON.stringify(x));
const pzs = (d) => { const o = []; Object.values(d.rooms).forEach((r) => (r.props || []).forEach((q) => { if (/^pz_\d+$/.test(q.id)) o.push(q); })); return o; };
function correr(patch) {
  const G = require('./tools/load_g.js')(MOD, patch); G.GEN_VERSION = 7;
  const casos = []; for (let i = 1; casos.length < N && i < N * 6; i++) { const r = G.generateCase(i * 7919 + 3, { level: 'dificil' }); if (!r.error) casos.push(r); }
  ok(casos.length === N, 'se generan ' + N + ' casos de Difícil v7');
  const rechaza = (d, b, code, m) => { const r = G.reviewCase(d, { bible: b }); ok(!r.ok && r.findings.some((f) => f.code === code), m + ' → el revisor debe decir «' + code + '»' + (r.ok ? ' (dijo que todo bien)' : ' (dijo: ' + r.findings.filter((f) => f.sev === 'error').map((f) => f.code).join(',') + ')')); };
  const stat = { puzzles: 0, J6: 0 }, fps = [];
  casos.forEach((c) => {
    const def = c.def, bible = c.bible, ps = pzs(def);
    const rv = G.reviewCase(def, { bible }); ok(rv.ok && !rv.findings.some((f) => /^puzle_/.test(f.code)), 'caso sin tocar: revisor sin fallos de puzle (' + rv.findings.filter((f) => f.sev === 'error').map((f) => f.code) + ')');
    ok(rv.stats.puzzles === G.puzzleClueIds(def).length && rv.stats.puzzles > 0, 'el revisor cuenta las pistas de puzle');
    ok(rv.fairness === c.review.fairness, 'la equidad del revisor no cambia por pasarle la biblia');
    // ---- J5/J6 con el caso estropeado
    const ids = G.puzzleClueIds(def), id0 = ids[0], cu = def.solution.culprit;
    const t = (f) => { const d = clone(def), b = clone(bible); f(d, b); return [d, b]; };
    let m = t((d) => { d.clues[id0].sus = { [cu]: 2 }; }); rechaza(m[0], m[1], 'puzle_con_puntos', 'J5 · la pista de puzle da puntos');
    m = t((d) => { const q = d.suspects.find((s) => s.id !== cu); q.clearedBy.push(id0); }); rechaza(m[0], m[1], 'puzle_en_solucion', 'J5 · la pista de puzle descarta a un inocente');
    m = t((d) => { d.lies && Object.keys(d.lies).length && d.lies[Object.keys(d.lies)[0]].refutedBy.push(id0); }); if (Object.keys(def.lies || {}).length) rechaza(m[0], m[1], 'puzle_en_solucion', 'J5 · la pista de puzle desmonta una mentira');
    m = t((d) => { d.clues[id0].text += ' Todo apunta a ' + ((d.npcs[cu] || {}).name || d.suspects.find((s) => s.id === cu).name) + '.'; }); rechaza(m[0], m[1], 'puzle_nombra_culpable', 'J5 · la pista de puzle nombra al culpable');
    const bc = (id) => bible.clues.findIndex((x) => x.id === id);
    m = t((d, b) => { b.clues[bc(id0)].role = 'prueba'; }); rechaza(m[0], m[1], 'puzle_rol', 'J5 · la pista de puzle no es de ambiente');
    m = t((d, b) => { const i = b.truth.timeline.findIndex((e) => e.who === cu); b.clues[bc(id0)].derivedFrom = i; }); rechaza(m[0], m[1], 'puzle_del_culpable', 'J5 · la pista cuenta un suceso del culpable');
    m = t((d, b) => { const W = b.truth.window, i = b.truth.timeline.findIndex((e) => e.who !== cu && e.until > W.from && e.t < W.to); if (i >= 0) b.clues[bc(id0)].derivedFrom = i; else b.truth.window = { from: 0, to: 24 * 60 }; }); rechaza(m[0], m[1], 'puzle_en_ventana', 'J5 · la pista cae en la ventana del robo');
    // J6: la prueba solo se consigue en un sitio que TAMBIÉN entrega una pista de puzle; al quitar los puzles se pierde y el caso deja de valer
    m = t((d) => { const pr = d.solution.proof.filter((c) => d.clues[c] && d.clues[c].kind !== 'testimonio'); let hecho = false;
      Object.values(d.rooms).forEach((r) => (r.props || []).forEach((p) => { if (hecho || /^pz_/.test(p.id)) return; (p.steps || []).forEach((st) => { if (!hecho && st.clue && d.solution.proof.indexOf(st.clue) >= 0 && !st.fx) { st.fx = { clue: id0 }; hecho = true; } }); })); stat.J6 += hecho ? 1 : 0; });
    if (JSON.stringify(m[0].rooms).indexOf('"fx":{"clue":"' + id0 + '"}') >= 0) rechaza(m[0], m[1], 'puzle_no_prescindible', 'J6 · una prueba vive en un objeto que también entrega una pista de puzle');
    // ---- medidor: el puzle cuesta lo que el bot (código 25 s, línea 30 s) y ya no cuenta como paso
    const f = G.meterFeatures(def), pc = ps.filter((q) => q.steps[0].mini.type === 'code').length, pl = ps.length - pc;
    ok(f.puzCode === pc && f.puzLine === pl, 'el medidor cuenta ' + pc + ' códigos y ' + pl + ' líneas (cuenta ' + f.puzCode + '/' + f.puzLine + ')');
    const fs = G.meterFeatures(G.stripPuzzles(def));
    ok(fs.puzCode === 0 && fs.puzLine === 0, 'sin puzles el medidor no cuenta ninguno');
    ok(G.meterSeconds(f) - G.meterSeconds(Object.assign({}, f, { puzCode: 0, puzLine: 0 })) === 25 * pc + 30 * pl, 'el coste del puzle es 25 s por código y 30 s por línea');
    ok(f.steps === G.meterFeatures(def).steps && !ps.some((q) => /pz_/.test(q.id) && false), 'estable');
    // ---- huella
    const fp = G.caseFingerprint(def, bible), esperado = ps.map((q) => q.steps[0].mini.type === 'timeline' ? 'linea' : 'codigo').sort().join('+');
    ok(fp.puzzle === esperado && fp.key.indexOf('p:' + esperado) >= 0, 'la huella declara el puzle «' + esperado + '» (dice «' + fp.puzzle + '»)');
    ok(G.caseFingerprint(G.stripPuzzles(def), bible).puzzle === 'ninguno' && G.caseFingerprint(G.stripPuzzles(def), bible).key.indexOf('p:') < 0, 'sin puzles la huella dice «ninguno» y la clave no lleva «p:»');
    stat.puzzles += ps.length; fps.push(fp);
  });
  ok(stat.puzzles >= N, 'la muestra tiene puzles (' + stat.puzzles + ')');
  // metas de la huella: con ≥ 20 casos con puzle deben aparecer código y línea y ninguna combinación domina
  { const f2 = fps.slice(); for (let i = 1; f2.length < 60 && i < 400; i++) { const r = G.generateCase(i * 104729 + 5, { level: 'dificil' }); if (!r.error) f2.push(G.caseFingerprint(r.def, r.bible)); } fps.length = 0; f2.forEach((x) => fps.push(x)); } // 60 casos para la meta de variedad (con 20 el azar del reparto 50/25/25 la haría inestable)
  const st = G.fingerprintStats(fps); ok(!!st.fields.puzzle && !st.fields.puzzle.ninguno, 'las estadísticas incluyen el campo puzzle (' + JSON.stringify(st.fields.puzzle) + ')');
  ok(G.fingerprintGoals(st).puzzle === true, 'meta de variedad de puzles en verde (' + JSON.stringify(st.fields.puzzle) + ')');
  { const falso = clone(st); falso.fields.puzzle = { codigo: 50 }; ok(G.fingerprintGoals(falso).puzzle === false, 'la meta se pone en rojo si solo hay códigos'); const dom = clone(st); dom.fields.puzzle = { 'codigo+linea': 90, codigo: 5, linea: 5 }; ok(G.fingerprintGoals(dom).puzzle === false, 'la meta se pone en rojo si una combinación domina'); const poco = clone(st); poco.fields.puzzle = { codigo: 5 }; ok(G.fingerprintGoals(poco).puzzle === true, 'con pocos casos con puzle no se exige'); }
  // lo que no lleva puzles sigue como siempre
  ['facil', 'normal'].forEach((L) => { for (let i = 1; i <= 6; i++) { const r = G.generateCase(i * 7919 + 1, { level: L }); const f = G.meterFeatures(r.def); ok(!r.error && r.review.ok && f.puzCode === 0 && f.puzLine === 0 && G.caseFingerprint(r.def, r.bible).puzzle === 'ninguno' && G.caseFingerprint(r.def, r.bible).key.indexOf('p:') < 0 && r.review.stats.puzzles === 0, L + ' v7: sin puzles en revisor, medidor y huella'); } });
  G.GEN_VERSION = 6; for (let i = 1; i <= 6; i++) { const r = G.generateCase(i * 7919 + 1, { level: 'dificil' }); ok(!r.error && pzs(r.def).length === 0 && r.review.stats.puzzles === 0 && G.caseFingerprint(r.def, r.bible).key.indexOf('p:') < 0, 'Difícil v6: sin puzles en revisor y huella'); }
  { const r = G.reviewCase(G.CASES.tarta); ok(r.ok && r.stats.puzzles === 0, 'caso 1: el revisor no ve puzles'); }
  return bad;
}
correr(null); console.log(`casos ${N} · comprobaciones ${checks} · fallos ${bad}`);
const real = bad; bad = 0; checks = 0;
const MUT = [
  ['review.js', 'if (pzIds.length && !opts.noPuzzles) {', 'if (false) {', 'revisor sin reglas de puzles'],
  ['review.js', "if (Object.keys(c.sus || {}).some((k) => c.sus[k])) add(", "if (false) add(", 'revisor sin comprobar los puntos (J5)'],
  ['review.js', "if (e.who === culprit) add(", "if (false) add(", 'revisor sin comprobar el suceso del culpable (J5)'],
  ['review.js', "if (W && e.until > W.from && e.t < W.to) add(", "if (false) add(", 'revisor sin comprobar la ventana (J5)'],
  ['review.js', "const sd = G.stripPuzzles(def), sv = G.validateCase(sd);", "const sd = def, sv = { ok: true };", 'revisor sin quitar los puzles para comprobar J6'],
  ['meter.js', 'c.perPuzzleCode * (f.puzCode || 0)', '0', 'medidor sin coste del código'],
  ['meter.js', 'c.perPuzzleLine * (f.puzLine || 0)', '0', 'medidor sin coste de la línea'],
  ['fingerprint.js', "return k.length ? k.sort().join('+') : 'ninguno';", "return 'ninguno';", 'huella sin puzles'],
];
let falla = false; const q = console.log;
MUT.forEach(([f, d, h, nom]) => {
  const m = mutador(f, d, h); bad = 0; checks = 0; console.log = () => {}; try { correr(m.patch); } catch (e) { bad++; } console.log = q;
  if (!m.ok) { console.log('✗ mutación (' + nom + '): ' + m.motivo); falla = true; return; }
  console.log(`(mutación «${nom}»: ${bad} fallos esperados)`); if (!bad) { console.log('✗ la mutación NO se detecta: ' + nom); falla = true; }
});
if (real || falla) process.exit(1); console.log('\nTodo en orden');
