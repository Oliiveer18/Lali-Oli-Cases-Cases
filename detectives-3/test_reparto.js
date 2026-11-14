// Prueba de G.workShare / G.workIssues (A4 HERR-1 4/4-1): la definición ÚNICA del reparto de trabajo con herramienta entre Oli (rex) y Lali (luna).
// Uso: node test_reparto.js
// Comprueba con casos SINTÉTICOS (se sabe la respuesta): dueño por herramienta, número y segundos, capítulos, puertas, coop fuera del reparto, banda 40-60 (bordes incluidos),
// capítulo sin trabajo = no se juzga, caso sin trabajo = incumplimiento. Con el caso 1 (reservado) y casos generados solo comprueba que la medida es coherente (suma = total).
// MUTACIONES DEL CÓDIGO (se carga logic.js estropeado en memoria; cada una DEBE hacer fallar el bloque de comprobaciones): el coop cuenta · las puertas se ignoran · el capítulo se ignora ·
// los segundos se ignoran · los dueños se cambian · la banda se ensancha · el borde se excluye · (subpaso 3) el revisor solo avisa / no llama a workIssues / juzga el caso 1 / ignora GEN_VERSION ·
// el bot no anota pasos, segundos o puertas · el medidor no informa del reparto · (subpaso 5) MUTACIONES DEL GENERADOR: el balanceador no estira / tope 1 / la lupa se queda en el cap. 1 / receta de antes. El bloque 6 usa casos generados y casos injustos FABRICADOS (todo el trabajo en Oli; pasos de Oli lentos).
const loadG = require('./tools/load_g.js');
const EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
const near = (a, b) => Math.abs(a - b) < 1e-6;
const step = (tool, time) => (time === undefined ? { tool } : { tool, time });
const def = (props, doors) => ({ rooms: { a: { props, doors: doors || [] } } });
const P = (id, steps, chapterMin) => Object.assign({ id, steps }, chapterMin ? { chapterMin } : {});

// Devuelve el nº de comprobaciones fallidas (y las muestra si `verbose`)
function core(G, verbose, withReal) {
  let fails = 0, checks = 0;
  const ok = (c, m) => { checks++; if (!c) { fails++; if (verbose) console.log('  ✗ ' + m); } };
// ---- 1. dueños, número y segundos (lupa 1,3 y ganzúa 2,0 = Oli; UV 1,0 y grabadora con su `time` = Lali)
let w = G.workShare(def([P('o1', [step('lupa')]), P('o2', [step('ganzua')]), P('l1', [step('uv')]), P('l2', [step('grabadora', 4.8)], 2)]));
ok(w.det.rex.n === 2 && w.det.luna.n === 2, 'número 2/2');
ok(near(w.det.rex.s, 3.3) && near(w.det.luna.s, 5.8), `segundos 3,3/5,8 (sale ${w.det.rex.s}/${w.det.luna.s})`);
ok(near(w.share.num, 50) && near(w.share.time, 100 * 3.3 / 9.1), 'porcentajes de Oli: 50 % en número y 36,3 % en tiempo');
ok(near(w.ch[1].rex.s, 3.3) && near(w.ch[1].luna.s, 1.0) && near(w.ch[2].luna.s, 4.8) && !w.ch[2].rex.n, 'por capítulo: cap. 1 (Oli 3,3 / Lali 1,0) y cap. 2 (solo Lali 4,8)');
ok(near(w.chShare[2].num, 0) && near(w.chShare[2].time, 0), 'capítulo 2 solo de Lali = 0 % de Oli');

// ---- 2. coop no cuenta; sin herramienta (tool null o ausente) no cuenta
w = G.workShare(def([P('c', [step('coop', 2.2)]), P('n', [{ tool: null }]), P('m', [{ text: 'x' }]), P('o', [step('lupa')])]));
ok(w.coop.n === 1 && near(w.coop.s, 2.2) && w.det.rex.n === 1 && w.det.luna.n === 0, 'coop aparte y pasos libres fuera del reparto');

// ---- 3. puertas con herramienta (con y sin chapterMin) y herramienta sin dueño
w = G.workShare(def([], [{ locked: { tool: 'ganzua', time: 3, chapterMin: 2 } }, { locked: { tool: 'uv' } }, { locked: { text: 'sin herramienta' } }, { locked: { tool: 'telepatia' } }]));
ok(w.det.rex.n === 1 && near(w.det.rex.s, 3) && w.det.luna.n === 1 && near(w.det.luna.s, 1.0), 'puertas: ganzúa 3 s (Oli) y UV 1 s (Lali); lo demás no cuenta');
ok(w.ch[2] && w.ch[2].rex.n === 1 && w.ch[1] && w.ch[1].luna.n === 1, 'capítulo de la puerta = locked.chapterMin (1 si falta)');

// ---- 4. banda 40-60: bordes incluidos, fuera y capítulos
const mkEq = (rexS, lunaS, ch) => def([P('r', [step('lupa', rexS)], ch), P('l', [step('uv', lunaS)], ch)]);
ok(G.workIssues(mkEq(6, 4)).length === 0, '60/40 en tiempo y 50/50 en número = en banda (los bordes valen)');
ok(G.workIssues(mkEq(4, 6)).length === 0, '40/60 en tiempo = en banda');
ok(G.workIssues(mkEq(6.1, 3.9)).some((i) => i.axis === 'tiempo' && i.scope === 'caso'), '61/39 en tiempo = incumplimiento del caso');
ok(G.workIssues(def([P('r1', [step('lupa')]), P('r2', [step('ganzua')]), P('l', [step('uv')])])).some((i) => i.axis === 'numero'), 'Oli 2 pasos y Lali 1 = 67/33 en número: incumplimiento');
// capítulo con trabajo repartido mal aunque el caso global salga bien
const dos = def([P('r1', [step('lupa', 2)]), P('l1', [step('uv', 2)]), P('r2', [step('lupa', 2)], 2), P('r3', [step('lupa', 2)], 2), P('l2', [step('uv', 2)], 2)]);
ok(G.workIssues(dos).some((i) => i.scope === 'cap2' && i.axis === 'numero'), 'caso 3/2 y cap. 2 con 2 de Oli y 1 de Lali: se señala el capítulo 2');
ok(!G.workIssues(dos).some((i) => i.scope === 'cap1'), 'el capítulo 1 (1 y 1) está bien');
// capítulo sin trabajo = no se juzga
ok(G.workIssues(def([P('r', [step('lupa', 2)]), P('l', [step('uv', 2)])])).length === 0, 'un caso solo con cap. 1 repartido 50/50 no tiene incumplimientos (cap. 2 y 3 sin trabajo no se juzgan)');
// caso sin trabajo
ok(G.workIssues(def([P('x', [{ tool: null }])])).length === 1, 'sin ningún trabajo con herramienta: un incumplimiento');
// banda propia
ok(G.workIssues(mkEq(7, 3), { min: 25, max: 75 }).length === 0 && G.workIssues(mkEq(7, 3)).length > 0, 'la banda se puede pasar como argumento');

// ---- 5. coherencia con casos reales: la suma por capítulo es el total y todo trabajo tiene dueño
const sum = (w2, k) => Object.keys(w2.ch).reduce((a, c) => a + w2.ch[c].rex[k] + w2.ch[c].luna[k], 0);
if (withReal) {
const c1 = G.CASES && Object.values(G.CASES)[0];
if (c1) { const a = G.workShare(c1); ok(near(sum(a, 'n'), a.det.rex.n + a.det.luna.n) && near(sum(a, 's'), a.det.rex.s + a.det.luna.s), 'caso 1: suma por capítulo = total'); ok(a.det.rex.n === 8 && a.det.luna.n === 3, `caso 1 (medido el 22 oct): Oli 8 pasos y Lali 3 (sale ${a.det.rex.n}/${a.det.luna.n})`); }
for (let i = 1; i <= 40; i++) {
  const r = G.generateCase(i * 7919 + 1, { register: true }); if (r.error) continue;
  const a = G.workShare(r.def);
  ok(near(sum(a, 'n'), a.det.rex.n + a.det.luna.n) && near(sum(a, 's'), a.det.rex.s + a.det.luna.s), `semilla ${i}: suma por capítulo = total`);
  ok(a.share.work > 0, `semilla ${i}: tiene trabajo con herramienta`);
}
  }

// ---- 6. revisor (EQ-1 como error), bot y medidor (A4 4/4 subpaso 3). Casos generados de verdad + casos INJUSTOS fabricados a partir de ellos.
{
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const repErr = (r) => r.findings.filter((f) => f.sev === 'error' && /^reparto_/.test(f.code));
  // la UV de Lali pasa a ser una lupa de Oli (Oli 3 pasos, Lali 1; el cap. 1 queda solo para Oli) · o solo el tiempo de los pasos de Oli se multiplica (reparto en número bien, en tiempo mal)
  const everyStep = (d, fn) => Object.keys(d.rooms).forEach((rid) => { d.rooms[rid].props.forEach((pp) => (pp.steps || []).forEach((st) => fn(st))); d.rooms[rid].doors.forEach((dd) => { if (dd.locked && dd.locked.tool) fn(dd.locked); }); });
  const toOli = (d) => { const d2 = clone(d); everyStep(d2, (st) => { if (st.tool === 'uv') st.tool = 'lupa'; }); return d2; }; // la UV de Lali pasa a ser lupa de Oli (la grabadora no se puede quitar: la charla la exige)
  const slowOli = (d) => { const d2 = clone(d); everyStep(d2, (st) => { if (st.tool && st.tool !== 'coop' && G.toolOwner(st.tool, d2) === 'rex') st.time = 12; }); return d2; };
  const gens = [3, 11, 29].map((sd) => G.generateCase(sd));
  ok(gens.every((g) => !g.error && g.def.genLevel), 'bloque 6: tres casos generados de prueba (semillas 3, 11, 29), con nivel');
  gens.filter((g) => !g.error).forEach((g, i) => {
    const d = g.def, r0 = G.reviewCase(d), w = G.workShare(d);
    ok(r0.ok && repErr(r0).length === 0 && r0.stats.reparto && r0.stats.reparto.trabajo === w.share.work, `generado ${i}: el revisor lo acepta y sus estadísticas traen el reparto`);
    const a = toOli(d), ra = G.reviewCase(a);
    ok(G.validateCase(a).ok && repErr(ra).some((f) => f.code === 'reparto_caso') && !ra.ok && ra.fairness <= r0.fairness - 35, `generado ${i}: la UV pasa a Oli (3 pasos contra 1) → error reparto_caso, el caso se rechaza y la nota baja ≥ 35 (sale ${ra.fairness})`);
    ok(repErr(ra).some((f) => /^reparto_cap\d$/.test(f.code)), `generado ${i}: el reparto malo también se señala por capítulo (reparto_capN)`);
    const t = slowOli(d), rt = G.reviewCase(t);
    ok(G.validateCase(t).ok && repErr(rt).some((f) => /tiempo/.test(f.msg)) && !repErr(rt).some((f) => /en numero/.test(f.msg)) && !rt.ok, `generado ${i}: Oli con pasos lentos → solo falla el TIEMPO y el caso se rechaza`);
    const v5 = G.GEN_VERSION; G.GEN_VERSION = 5;
    let rv; try { rv = G.reviewCase(a); } finally { G.GEN_VERSION = v5; }
    ok(repErr(rv).length === 0 && rv.stats.reparto === null, `generado ${i}: con GEN_VERSION 5 el mismo caso injusto NO se juzga por reparto (casos v5 como antes)`);
    const m = G.meterCase(d).reparto, ma = G.meterCase(a).reparto;
    ok(m && near(m.oliNum, w.share.num) && near(m.oliTime, w.share.time) && m.fueraDeBanda === 0 && m.trabajo === w.share.work, `generado ${i}: el medidor informa el mismo reparto que G.workShare (Oli ${Math.round(m && m.oliNum)} % en número) y 0 fuera de banda`);
    ok(ma && ma.fueraDeBanda > 0, `generado ${i}: el medidor cuenta incumplimientos en el caso injusto`);
    const b = G.botPlay(d), wb = b.stats.workBy;
    ok(b.finished && b.win, `generado ${i}: el bot gana el caso`);
    ok(wb && wb.rex.n === w.det.rex.n && wb.luna.n === w.det.luna.n && wb.coop.n === w.coop.n && Math.abs(wb.rex.s - w.det.rex.s) < 0.2 && Math.abs(wb.luna.s - w.det.luna.s) < 0.2 && Math.abs(wb.coop.s - w.coop.s) < 0.2, `generado ${i}: lo que hace el bot (Oli ${wb && wb.rex.n} pasos, Lali ${wb && wb.luna.n}, juntos ${wb && wb.coop.n}) = la medida común, en número y segundos`);
  });
  // el caso 1 (a mano, reservado) NO se juzga por reparto aunque su reparto sea 8/3, y el bot lo reparte como mide G.workShare
  const c1 = G.CASES.tarta, rc = G.reviewCase(c1), w1 = G.workShare(c1);
  ok(rc.ok && rc.fairness >= 90 && repErr(rc).length === 0 && rc.stats.reparto === null && G.workIssues(c1).length > 0, 'caso 1: se mide fuera de banda (8/3) pero el revisor NO lo rechaza (no es un caso generado)');
  const bc = G.botPlay(c1).stats.workBy;
  ok(bc.rex.n === w1.det.rex.n && bc.luna.n === w1.det.luna.n && bc.coop.n === w1.coop.n && Math.abs(bc.rex.s - w1.det.rex.s) < 0.2 && Math.abs(bc.luna.s - w1.det.luna.s) < 0.2, `caso 1: el bot hace Oli ${bc.rex.n} / Lali ${bc.luna.n} / juntos ${bc.coop.n} = la medida común (puertas, pasos y coop)`);
  if (withReal) {
    let bad2 = 0, retried = 0, n = 0;
    for (let i = 1; i <= 150; i++) { const r = G.generateCase(i * 104729 + 3); if (r.error) { bad2++; continue; } n++; if (r.attempts > 1) retried++; if (G.workIssues(r.def).length) bad2++; }
    ok(bad2 === 0 && n === 150, `150 semillas: todas dan caso aceptado y NINGUNA sale fuera de banda (reintentos por reparto: ${retried})`);
  }
}
  return { fails, checks };
}

// ---- 1ª vuelta: el código REAL tiene que pasarlo todo
const G0 = loadG(EXTRA);
const real = core(G0, true, true);
let bad = real.fails;
const { mutador } = require('./tools/mutar.js');
// Cada mutación: [nombre, archivo, DESDE, HACIA, (true = se prueba con casos generados)]. DESDE es un texto (se ignora el formato) o una expresión regular anclada a lo ESENCIAL
// (P-3/3, cp. 149): así un retoque inocente del código vecino no rompe la prueba (antes: frases literales largas, que fallaron en C1). Ver tools/mutar.js.
const MUT = [
  ['el coop cuenta como trabajo de Oli', 'logic.js', /(if \(st\.tool === 'coop'\) \{[^}]*?)return;/, "$1add(p.chapterMin || 1, 'rex', G.stepBaseSeconds(st)); return;"],
  ['las puertas con herramienta se ignoran', 'logic.js', /if \(!d\.locked \|\| !d\.locked\.tool\) return;/, 'return;'],
  ['el capítulo se ignora (todo al 1)', 'logic.js', /const ch = p\.chapterMin \|\| 1;/, 'const ch = 1;'],
  ['los segundos se ignoran', 'logic.js', /if \(who\) add\(ch, who, G\.stepBaseSeconds\(st\)\);/, 'if (who) add(ch, who, 1);'],
  ['los dueños se intercambian', 'logic.js', /const who = G\.toolOwner\(st\.tool, def\);/, "const who0 = G.toolOwner(st.tool, def), who = who0 === 'rex' ? 'luna' : who0 === 'luna' ? 'rex' : null;"],
  ['la banda se ensancha a 0-100', 'logic.js', /G\.WORK_BAND = \{ min: \d+, max: \d+ \};/, 'G.WORK_BAND = { min: 0, max: 100 };'],
  ['el borde del 60 % se excluye', 'logic.js', /if \(v < B\.min - EPS \|\| v > B\.max \+ EPS\)/, 'if (v <= B.min + EPS || v >= B.max - EPS)'],
  ['un caso sin trabajo no se señala', 'logic.js', /(if \(!sh\.work\) \{\s*)if \(scope === 'caso'\)/, '$1if (false)'],
  // subpaso 3: revisor, bot y medidor
  ['el revisor solo AVISA del reparto (no rechaza)', 'review.js', /add\('error', (i\.scope === 'caso')/, "add('warn', $1"],
  ['el revisor no llama a G.workIssues', 'review.js', /G\.workIssues\(def\)\.forEach\(/, '[].forEach('],
  ['el revisor juzga también el caso 1 (sin mirar si es generado)', 'review.js', /(G\.GEN_VERSION >= 6 && )def\.genLevel && (G\.workIssues)/, '$1$2'],
  ['el revisor ignora GEN_VERSION (juzga también los casos v5)', 'review.js', /G\.GEN_VERSION >= 6 && (def\.genLevel && G\.workIssues)/, '$1'],
  ['el bot no anota los pasos de objeto', 'bot.js', /credit\(step\.tool, dur\);\s*/, ''],
  ['el bot no anota los segundos', 'bot.js', /workBy\[w\]\.s \+= dur;\s*/, ''],
  ['el bot no anota las puertas con herramienta', 'bot.js', /credit\(d\.locked\.tool, dur\);\s*/, ''],
  ['el medidor no informa del reparto', 'meter.js', /reparto: G\.workShare \?/, 'reparto: false ?'],
  // A4 4/4 subpaso 5: MUTACIONES DEL GENERADOR (compile.js). Se comprueban con casos generados de verdad (el 5.º elemento activa las 150 semillas): si el generador deja de equilibrar, el revisor rechaza
  // los casos (error de generación) o salen fuera de banda, y la comprobación «150 semillas: todas aceptadas y ninguna fuera de banda» falla.
  ['el balanceador de tiempos no estira nada', 'compile.js', /lo\.forEach\(\(st\) => \{\s*st\.time = Math\.round\(G\.stepBaseSeconds\(st\)[^;]*;\s*\}\);/, '', true],
  ['el tope del balanceador es 1 (no estira)', 'compile.js', /const CAP = MECH\.workCap \|\| \d+,/, 'const CAP = 1,', true],
  ['la lupa se queda en el cap. 1 (Oli con 2 pasos y Lali con 1)', 'compile.js', /if \(lupaLeft > 0\) \{ lupaLeft--;\s*pr\.chapterMin = 2;[^}]*\}/, 'if (lupaLeft > 0) { return; }', true],
  ['el generador no equilibra (receta de antes)', 'compile.js', /if \(G\.GEN_VERSION >= 6\) \{(?=\s*let lupaLeft)/, 'if (false) {', true],
];
MUT.forEach(([name, file, from, to, real2]) => {
  const m = mutador(file, from, to), Gm = loadG(EXTRA, m.patch);
  if (!m.ok) { console.log(`  ✗ MUTACIÓN «${name}»: ${m.motivo} en ${file} (actualiza el patrón de la prueba; el código no tiene por qué estar mal)`); bad++; return; }
  const aviso = m.veces > 1 ? ` [OJO: el patrón encaja ${m.veces} veces, se estropea la 1.ª]` : '';
  let r; try { r = core(Gm, false, !!real2); } catch (e) { r = { fails: 1 }; } // una excepción también es detectar la mutación
  if (r.fails === 0) { console.log(`  ✗ MUTACIÓN «${name}» NO detectada${aviso}`); bad++; } else console.log(`  · mutación «${name}»: detectada (${r.fails} comprobaciones fallan)${aviso}`);
});
console.log(bad ? `✗ reparto de trabajo: ${bad} problema(s)` : `✓ reparto de trabajo: ${real.checks} comprobaciones correctas y ${MUT.length} mutaciones del código detectadas`);
process.exit(bad ? 1 : 0);
