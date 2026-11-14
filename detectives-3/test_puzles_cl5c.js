// CL-5c-b: PUZLES EN DIFÍCIL v7 (docs/DISENO_PUZLES_CL5C.md): código de 4 cifras / línea de tiempo con pistas PROPIAS (rol «ambiente») y hora real.
// Comprueba las reglas de justicia J1-J6 sobre N casos de Difícil v7, que Fácil, Normal y v6 NO llevan puzles, el banco, la lista `recentPuzzles` y el determinismo.
// Con mutaciones: se estropea una pieza del generador en memoria y la prueba DEBE fallar. Una a una: node test_puzles_cl5c.js [N=40]
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'];
const N = +process.argv[2] || 40;
let bad = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m); } };
const hhmm = (G, m) => G.minToStr(m).replace(':', '');
function gen(G, ver, level, n, opts) {
  G.GEN_VERSION = ver; const out = []; out.errores = 0;
  for (let i = 1; out.length < n && i < n * 6; i++) { const r = G.generateCase(i * 7919 + 1, Object.assign({ register: true, level }, opts || {})); if (r.error) out.errores++; else if (r.def.genLevel === level) out.push(r); }
  return out;
}
const props = (def) => { const o = []; Object.entries(def.rooms || {}).forEach(([rid, ro]) => (ro.props || []).forEach((q) => o.push({ rid, q }))); return o; };
const pzProps = (def) => props(def).filter((x) => /^pz_\d+$/.test(x.q.id));
const nPz = (r) => (r.bible.puzzles || []).length;
function correr(patch, conBot) {
  const G = require('./tools/load_g.js')(MOD, patch), P = G.GEN_DATA.compile.puzzlesV7;
  // ---- banco: ids estables y únicos, sprites que existen, premio de 2 frases
  const todos = [].concat(P.codes, P.lines, P.clueObj, P.clueNpc);
  ok(P.codes.length >= 7 && P.lines.length >= 6 && P.clueObj.length + P.clueNpc.length >= 11, 'banco: 7 códigos, 6 líneas y 11 plantillas de pista como mínimo');
  ok(new Set(todos.map((x) => x.id)).size === todos.length && P.codes.every((x) => /^pzc_\d\d$/.test(x.id)) && P.lines.every((x) => /^pzl_\d\d$/.test(x.id)) && P.clueObj.concat(P.clueNpc).every((x) => /^pzt_\d\d$/.test(x.id)), 'banco: ids estables (pzc_/pzl_/pzt_) y sin repetir');
  ok(P.codes.concat(P.lines).every((x) => x.sprite && G.spr[x.sprite] && x.label && x.title && x.hint && x.prize && x.prize.length === 2 && x.prize[0] && x.prize[1]), 'banco: cada entrada con sprite existente, etiqueta, título, pista de ayuda y premio de 2 frases');
  ok(P.clueObj.every((x) => /\{time\}/.test(x.text)) && P.clueNpc.every((x) => /\{time\}/.test(x.text)), 'banco: toda plantilla de pista imprime la hora ({time})');
  // ---- Difícil v7
  const D = gen(G, 7, 'dificil', N); ok(D.length === N, 'Difícil v7 genera ' + N + ' casos');
  ok(D.errores === 0, 'ninguna semilla de Difícil v7 falla al generar (validador y revisor aceptan los puzles; fallos: ' + D.errores + ')');
  let total = 0, uno = 0, dos = 0, tipos = { code: 0, timeline: 0 }, colocados = 0, mismo = 0;
  D.forEach((r) => {
    const b = r.bible, def = r.def, tl = b.truth.timeline, w = b.truth.window, cu = b.truth.culprit, pzs = b.puzzles || [], tag = ' [' + r.code + ']';
    ok(pzs.length >= 1 && pzs.length <= 2, 'cada caso lleva 1 o 2 puzles (' + pzs.length + ')' + tag);
    total += pzs.length; if (pzs.length === 1) uno++; if (pzs.length === 2) dos++;
    const mid = w.from + 5 * Math.floor((w.to - w.from) / 10), ventana = [w.from, w.to, mid].map((m) => hhmm(G, m));
    const todasPz = [].concat(...pzs.map((p) => p.clues)), props_ = pzProps(def);
    ok(props_.length === pzs.length, 'cada puzle tiene su objeto pz_N en una sala (' + props_.length + ' de ' + pzs.length + ')' + tag); colocados += props_.length;
    ok(pzs.every((p, k) => p.id === 'pz_' + (k + 1)) && new Set(pzs.map((p) => p.bank)).size === pzs.length && new Set(props_.map((x) => x.q.sprite)).size === props_.length, 'ids pz_N, entradas del banco y sprites sin repetir dentro del caso' + tag);
    if (pzs.length === 2) { if (pzs[0].type === pzs[1].type) mismo++; ok(!(pzs[0].type === 'timeline' && pzs[1].type === 'timeline'), 'con 2 puzles nunca dos líneas de tiempo (si no cabe una línea, esa plaza pasa a código)' + tag); }
    const titulos = todasPz.map((id) => (b.clues.find((c) => c.id === id) || {}).title); ok(new Set(titulos).size === titulos.length, 'J2: títulos de pista de puzle únicos' + tag);
    pzs.forEach((p) => {
      tipos[p.type]++;
      const cl = p.clues.map((id) => b.clues.find((c) => c.id === id)), ev = p.events.map((x) => tl[x.i]);
      ok(cl.every(Boolean) && p.events.every((x, k) => x.clue === p.clues[k]), 'cada suceso apunta a su pista' + tag);
      // J1: la pista imprime la hora real y es alcanzable sin pasar por el puzle
      ok(cl.every((c, k) => c && c.text.indexOf(G.minToStr(ev[k].t)) >= 0), 'J1: cada pista del puzle imprime la hora real de su suceso' + tag);
      ok(cl.every((c) => c && c.derivedFrom !== null && c.derivedFrom !== undefined && ((c.source.type === 'prop' && def.rooms[c.source.place]) || c.source.type === 'npc')), 'J1: cada pista tiene fuente (objeto de sala o personaje)' + tag);
      // J5: ambiente puro
      ok(cl.every((c) => c && c.role === 'ambiente' && Object.keys(c.points || {}).length === 0), 'J5: pistas de rol ambiente y sin puntos' + tag);
      ok(ev.every((e) => e.who !== cu && (e.until <= w.from || e.t >= w.to) && e.t < 1440), 'J5: sucesos de inocentes y fuera de la ventana del robo' + tag);
      const sol = def.solution || {}, usadas = [].concat(sol.proof || [], ...Object.values(def.lies || {}).map((l) => l.refutedBy || []), ...(def.suspects || []).map((s) => s.clearedBy || []));
      ok(p.clues.every((id) => usadas.indexOf(id) < 0), 'J5: ninguna pista de puzle entra en proof, coartadas ni refutaciones' + tag);
      if (p.type === 'timeline') {
        // J2: línea de tiempo
        ok(p.events.length >= 3 && p.events.length <= 4, 'J2: línea de 3 o 4 sucesos (' + p.events.length + ')' + tag);
        ok(ev.every((e, k) => k === 0 || e.t - ev[k - 1].t >= 10), 'J2: horas estrictamente crecientes con ≥ 10 min y en el orden del array' + tag);
        ok(new Set(ev.map((e) => e.doing)).size === ev.length, 'J2: textos de suceso distintos' + tag);
      } else {
        // J3: código
        const c = hhmm(G, ev[0].t);
        ok(p.events.length === 1 && /^\d{4}$/.test(p.code || '') && p.code === c && cl[0] && cl[0].text.indexOf(G.minToStr(ev[0].t)) >= 0, 'J3: código de 4 cifras = HHMM de la hora impresa en su pista' + tag + ' (' + p.code + ' / ' + c + ')');
        ok(ventana.indexOf(p.code) < 0, 'J3: el código no coincide con las horas de la ventana' + tag);
      }
      // el objeto del caso lleva lo mismo que la biblia
      const pp = props_.filter((x) => x.q.id === p.id)[0], st = pp && pp.q.steps && pp.q.steps[0], mi = st && st.mini;
      ok(pp && pp.q.steps.length === 1 && st.tool === null && mi && mi.type === p.type, 'el paso pz_N lleva el minijuego de su tipo' + tag);
      // J4: sin ciclo y sin entregar pistas; requires = las pistas del puzle
      ok(st && st.requires && JSON.stringify((st.requires.clue || []).slice().sort()) === JSON.stringify(p.clues.slice().sort()), 'J4: el paso exige exactamente las pistas del puzle (requires.clue)' + tag);
      ok(st && !st.clue && (!st.fx || Object.keys(st.fx).every((k) => k === 'money' || k === 'sfx')), 'J4: el puzle no entrega pistas' + tag);
      if (mi && p.type === 'code') ok(mi.code === p.code && /^\d{4}$/.test(mi.code) && mi.hint.indexOf(G.minToStr(0)) < 0, 'J3: mini.code = código de la biblia' + tag);
      if (mi && p.type === 'timeline') ok(mi.events.length === p.events.length && mi.events.every((e, k) => e.time === G.minToStr(ev[k].t) && e.clue === p.clues[k]) && mi.events.every((e, k) => k === 0 || mi.events[k - 1].time < e.time), 'J2: mini.events en orden por hora y con su pista' + tag);
    });
    // J4: cada pista de puzle es alcanzable (algún paso la entrega) y ningún paso que entrega una pista exige pistas de puzle
    const entrega = {}; props(def).forEach(({ q }) => (q.steps || []).forEach((s) => { if (s.clue) entrega[s.clue] = q.id; }));
    Object.values(def.npcs || {}).forEach((n) => (n.topics || []).forEach((t) => { if (t.clue) entrega[t.clue] = 'npc'; }));
    const blob = JSON.stringify(def.rooms) + JSON.stringify(def.npcs);
    ok(b.clues.every((c) => blob.indexOf('"' + c.id + '"') >= 0), 'J4: toda pista del caso (también las de puzle) se puede conseguir: ningún puzle se come el objeto de una pista' + tag);
    ok(todasPz.every((id) => !/^pz_/.test(entrega[id] || '')), 'J4: ninguna pista de puzle está dentro de un objeto pz_N' + tag);
    let ciclo = false; props(def).forEach(({ q }) => (q.steps || []).forEach((s) => { if (s.clue && s.requires && (s.requires.clue || []).some((id) => todasPz.indexOf(id) >= 0)) ciclo = true; }));
    ok(!ciclo, 'J4: ningún paso que da una pista exige pistas de puzle' + tag);
    ok(G.validateCase(def).ok, 'el caso pasa el validador' + tag);
  });
  ok(total >= N * 1.2 && total <= N * 1.8 && uno >= N * 0.25 && dos >= N * 0.25, 'reparto 1/2 puzles equilibrado, media ≈ 1,5 (' + uno + ' con 1 · ' + dos + ' con 2 · media ' + (total / N).toFixed(2) + ')');
  ok(mismo <= Math.max(2, dos * 0.2), 'con 2 puzles casi siempre uno de cada tipo (' + mismo + ' de ' + dos + ' casos con 2 puzles del mismo tipo)');
  ok(tipos.code >= N * 0.4 && tipos.timeline >= N * 0.4, 'reparto código / línea de tiempo equilibrado (' + tipos.code + ' / ' + tipos.timeline + ')');
  // ---- Fácil, Normal y v6: sin puzles (ni en la biblia ni en las salas)
  [['facil', 7], ['normal', 7], ['facil', 6], ['normal', 6], ['dificil', 6]].forEach(([L, v]) => {
    const c = gen(G, v, L, 8);
    ok(c.length === 8 && c.every((r) => !r.bible.puzzles && pzProps(r.def).length === 0 && Object.values(r.def.clues).every((x) => !/^pz\d_/.test(x.id || ''))) && c.every((r) => r.bible.clues.every((x) => !/^pz\d_/.test(x.id))), L + ' v' + v + ': sin puzles');
  });
  // ---- lista de «recientes»: se evitan sus entradas si hay otras libres; sin lista, mismo caso; determinista
  const a = gen(G, 7, 'dificil', 6), a2 = gen(G, 7, 'dificil', 6), banks = [].concat(...a.map((r) => (r.bible.puzzles || []).map((p) => p.bank)));
  ok(a.every((r, k) => JSON.stringify(r.def) === JSON.stringify(a2[k].def)), 'determinista: misma semilla, mismo caso');
  const recientes = [...new Set(banks)].slice(0, 3), b3 = gen(G, 7, 'dificil', 6, { recentPuzzles: recientes }), banks3 = [].concat(...b3.map((r) => (r.bible.puzzles || []).map((p) => p.bank)));
  ok(b3.length === 6 && banks3.every((x) => recientes.indexOf(x) < 0), 'recentPuzzles: no se eligen entradas recientes (' + recientes.join(',') + ' → ' + [...new Set(banks3)].join(',') + ')');
  const b4 = gen(G, 7, 'dificil', 6, { recentPuzzles: [] }); ok(b4.every((r, k) => JSON.stringify(r.def) === JSON.stringify(a[k].def)), 'recentPuzzles vacía = sin lista (ningún caso cambia)');
  // ---- J6: el caso se resuelve igual sin los pasos pz_* (el bot gana con y sin ellos)
  if (conBot) {
    gen(G, 7, 'dificil', 5).forEach((r) => {
      const q1 = G.qualityCase(r.def).bot || {}, d = JSON.parse(JSON.stringify(r.def));
      Object.keys(d.rooms).forEach((rid) => { d.rooms[rid].props = (d.rooms[rid].props || []).filter((q) => !/^pz_\d+$/.test(q.id)); });
      const q2 = G.qualityCase(d).bot || {};
      ok(q1.win && !q1.stuck, 'J6: el bot gana con los puzles [' + r.code + ']'); ok(q2.win && !q2.stuck, 'J6: el bot gana sin los pasos pz_* [' + r.code + ']');
    });
  }
  return bad;
}
correr(null, true); console.log(`casos Difícil v7 ${N} · comprobaciones ${checks} · fallos ${bad}`);
const real = bad; bad = 0; checks = 0;
const MUT = [
  ['gen_clues.js', 'time: G.minToStr(e.t),', "time: '00:00',", 'J1 · la pista no lleva la hora real'],
  ['gen_clues.js', '{ code: hhmm(tl[ord[0].i].t) }', "{ code: '0000' }", 'J3 · código distinto de la hora'],
  ['gen_clues.js', 'const ord = got.slice().sort((x, y) => tl[x.i].t - tl[y.i].t);', 'const ord = got.slice();', 'J2 · sucesos sin ordenar por hora'],
  ['gen_clues.js', /const timesOk = \(i, list\) => list\.every\([^;]*\);/, 'const timesOk = () => true;', 'J2 · horas empatadas o textos repetidos'],
  ['gen_clues.js', 'tl[i].who !== cu &&', 'true &&', 'J5 · sucesos del culpable'],
  ['gen_clues.js', '(tl[i].until <= w.from || tl[i].t >= w.to)', 'true', 'J5 · sucesos dentro de la ventana del robo'],
  ['gen_clues.js', "role: 'ambiente', points: {}", "role: 'ambiente', points: { [e.who]: 1 }", 'J5 · pistas con puntos'],
  ['gen_clues.js', 'free = (bank) => bank.filter((x) => recent.indexOf(x.id) < 0)', 'free = (bank) => bank', 'recentPuzzles ignorada'],
  ['gen_clues.js', "b.level === 'dificil' && D.compile && D.compile.puzzlesV7", 'D.compile && D.compile.puzzlesV7', 'puzles también en Fácil y Normal'],
  ['compile.js', 'requires: { clue: pz.clues.slice() }', 'requires: {}', 'sin requires en el paso'],
  ['compile.js', /\/\^cur_\\d\+\$\/\.test\(q\.id\)\) curs\.push/, '/^(cur_\\d+|obj_.*)$/.test(q.id)) curs.push', 'J4 · el puzle sustituye al objeto de una pista (la pista queda inalcanzable)'],
];
let falla = false; const q = console.log;
MUT.forEach(([f, d, h, nom]) => {
  const m = mutador(f, d, h); bad = 0; checks = 0; console.log = () => {}; try { correr(m.patch, false); } catch (e) { bad++; } console.log = q;
  if (!m.ok) { console.log('✗ mutación (' + nom + '): ' + m.motivo); falla = true; return; }
  console.log(`(mutación «${nom}»: ${bad} fallos esperados)`); if (!bad) { console.log('✗ la mutación NO se detecta: ' + nom); falla = true; }
});
if (real || falla) process.exit(1); console.log('\nTodo en orden');
