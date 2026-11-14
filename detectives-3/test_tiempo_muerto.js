// Prueba de EQ-7 (A4 HERR-1 4/4-4, 23 oct): G.idleOf / G.idleIssues (tiempos muertos de cada detective) y su anotación por el bot (stats.idle).
// Uso: node test_tiempo_muerto.js        (TM_N = nº de casos generados por nivel, def. 12)
// Comprueba con eventos SINTÉTICOS (se sabe la respuesta): espera seguida máxima (inicio, entre eventos y final del capítulo), lo compartido («both») ocupa a los dos, el relleno (`fill`) ocupa pero no cuenta
// como acción propia, solo se juzgan los capítulos pedidos, límite en segundos (bordes incluidos), trabajo propio exigido en el CASO entero. Con casos generados (bot) comprueba que ningún detective supera el
// límite medido (G.IDLE) y que las acciones propias cuadran con el trabajo con herramienta de G.workShare. MUTACIONES DEL CÓDIGO (logic.js / bot.js estropeados en memoria): cada una DEBE hacer fallar.
const loadG = require('./tools/load_g.js');
const EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
const near = (a, b) => Math.abs(a - b) < 1e-6;
const E = (ch, who, t0, t1, fill) => ({ ch, who, t0, t1, fill: !!fill });
const N = +process.env.TM_N || 12;

function core(G, verbose, withReal, ver) {   // ver = 7: mide la receta v7 SIN subir la versión del repositorio (solo en memoria; c3 subpaso 2, cp. 179)
  if (ver) G.GEN_VERSION = ver;
  let fails = 0, checks = 0;
  const ok = (c, m) => { checks++; if (!c) { fails++; if (verbose) console.log('  ✗ ' + m); } };
  // 1. cada uno con lo suyo: espera = hueco hasta su 1.ª acción y desde la última hasta el final del capítulo
  let r = G.idleOf([E(1, 'rex', 0, 2), E(1, 'luna', 10, 12)], 1)[1];
  ok(near(r.span, 12) && r.judged, 'capítulo de 12 s, juzgado (hay acciones propias)');
  ok(r.rex.ownN === 1 && near(r.rex.ownS, 2) && near(r.rex.maxWait, 10), 'Oli: 1 acción de 2 s y espera 10 s (del 2 al 12)');
  ok(r.luna.ownN === 1 && near(r.luna.ownS, 2) && near(r.luna.maxWait, 10), 'Lali: 1 acción de 2 s y espera 10 s (del 0 al 10)');
  ok(near(r.rex.waitShare, 10 / 12), 'espera de Oli = 83 % del capítulo');
  // 2. lo compartido ocupa a los dos y no es acción propia
  r = G.idleOf([E(1, 'rex', 0, 2), E(1, 'both', 5, 6), E(1, 'luna', 10, 12)], 1)[1];
  ok(near(r.rex.maxWait, 6) && near(r.luna.maxWait, 5), 'con un evento compartido a mitad: Oli espera 6 s y Lali 5 s');
  ok(r.rex.ownN === 1 && r.luna.ownN === 1, 'lo compartido no cuenta como acción propia');
  // 3. el relleno ocupa pero no cuenta como acción propia
  r = G.idleOf([E(1, 'rex', 0, 2), E(1, 'luna', 3, 9, true), E(1, 'luna', 10, 12)], 1)[1];
  ok(near(r.luna.maxWait, 3) && r.luna.ownN === 1 && near(r.luna.ownS, 2), 'relleno de Lali: la ocupa (espera 3 s) y no cuenta como propia');
  // 4. solo se juzgan los capítulos pedidos; sin pedirlos, los que tengan acciones propias
  const ev = [E(1, 'rex', 0, 2), E(1, 'luna', 4, 6), E(2, 'both', 0, 3, false)];
  let id = G.idleOf(ev, 3, [1]);
  ok(id[1].judged && !id[2].judged && !id[3].judged && id[3].events === 0, 'only=[1]: juzga el cap. 1; el 2 (sin trabajo propio) y el 3 (vacío) no');
  id = G.idleOf(ev, 3);
  ok(id[1].judged && !id[2].judged, 'sin only: juzga los capítulos con acciones propias');
  ok(G.idleIssues(id, { maxWait: 100, minOwn: 1 }).length === 0, 'sin incumplimientos con un límite amplio');
  // 5. límite en segundos (borde incluido) y mensajes por detective
  id = G.idleOf([E(1, 'rex', 0, 2), E(1, 'luna', 10, 12)], 1);
  ok(G.idleIssues(id, { maxWait: 10, minOwn: 1 }).length === 0, 'esperar justo el máximo (10 s) cumple');
  let iss = G.idleIssues(id, { maxWait: 9.9, minOwn: 1 });
  ok(iss.length === 2 && iss.every((x) => x.kind === 'espera') && iss.some((x) => x.who === 'rex' && /Oli/.test(x.msg)) && iss.some((x) => x.who === 'luna' && /Lali/.test(x.msg)), 'por encima del máximo: un incumplimiento por detective, con su nombre');
  // 6. trabajo propio exigido en el CASO (sumando capítulos juzgados): un detective sin ninguna acción propia incumple
  id = G.idleOf([E(1, 'rex', 0, 2), E(1, 'both', 3, 4)], 1);
  iss = G.idleIssues(id, { maxWait: 100, minOwn: 1 });
  ok(iss.length === 1 && iss[0].kind === 'sin_trabajo' && iss[0].who === 'luna' && /Lali/.test(iss[0].msg), 'Lali sin ninguna acción propia en el caso: incumplimiento «sin_trabajo»');
  id = G.idleOf([E(1, 'rex', 0, 2), E(2, 'luna', 0, 2)], 2);
  ok(G.idleIssues(id, { maxWait: 100, minOwn: 1 }).length === 0, 'acciones propias repartidas en capítulos distintos: cumple (se suma el caso)');
  ok(G.idleIssues({}, null).length === 0 && G.idleIssues(null, null).length === 0, 'sin datos no hay incumplimientos');
  ok(G.IDLE.maxWait === 240 && G.IDLE.minOwn === 1, 'el límite medido es 240 s y 1 acción (G.IDLE)');
  ok(!ver || G.GEN_VERSION === ver, `la receta medida es la v${ver || G.GEN_VERSION}`);
  if (!withReal) return { fails, checks };
  // 7. casos generados jugados por el bot (los 3 niveles)
  let casos = 0, conIdle = 0, juzgados = 0, maxW = 0;
  [['facil', 'easy'], ['normal', 'normal'], ['dificil', 'hard']].forEach(([L, dif]) => {
    for (let i = 1; i <= N; i++) {
      const rr = G.generateCase(i * 7919 + 1, { register: true, level: L }); if (rr.error) continue;
      const b = G.botPlay(JSON.parse(JSON.stringify(rr.def)), { difficulty: dif });
      casos++;
      ok(!b.stuck && b.stats && b.stats.idle, `${L} semilla ${i * 7919 + 1}: el bot acaba y anota stats.idle`);
      if (!b.stats || !b.stats.idle) continue;
      conIdle++;
      const idl = b.stats.idle, judged = Object.keys(idl).filter((c) => idl[c].judged).map(Number).sort();
      ok(JSON.stringify(judged) === JSON.stringify(G.idleChapters(rr.def)), `${L} ${i}: se juzgan los capítulos con trabajo con herramienta (${JSON.stringify(G.idleChapters(rr.def))})`);
      juzgados += judged.length;
      const iss = G.idleIssues(idl);
      ok(iss.length === 0, `${L} ${i}: sin tiempos muertos fuera del límite (${iss.map((x) => x.msg).join(' ')})`);
      Object.keys(idl).forEach((c) => ['rex', 'luna'].forEach((d) => { maxW = Math.max(maxW, idl[c][d].maxWait); }));
      // las acciones propias con herramienta del bot cuadran con lo que mide G.workShare (solo las de herramienta: las de voz libre se suman aparte)
      const ws = G.workShare(rr.def), own = { rex: 0, luna: 0 };
      Object.keys(idl).forEach((c) => ['rex', 'luna'].forEach((d) => { own[d] += idl[c][d].ownN; }));
      ok(own.rex + own.luna >= b.stats.workBy.rex.n + b.stats.workBy.luna.n - 0, `${L} ${i}: las acciones propias incluyen todo el trabajo con herramienta del bot`);
    }
  });
  ok(casos === 3 * N && conIdle === casos && juzgados > 0, `3 niveles × ${N} casos jugados (${casos}) y con capítulos juzgados (${juzgados})`);
  return { fails, checks, casos, maxW };
}

let bad = 0;
const real = core(loadG(EXTRA), true, true);
if (real.fails) { console.log(`  ✗ ${real.fails} comprobación(es) fallan sin mutación`); bad++; }
else console.log(`  · ${real.checks} comprobaciones correctas; ${real.casos} casos jugados por el bot; espera máxima vista ${Math.round(real.maxW)} s (límite ${240} s)`);

// c3 subpaso 2 (24 oct, cp. 179): EQ-7 también con la receta v7 (GEN_VERSION >= 7: lupa por cuota, hasta 2 charlas, EQ-1 solo sobre el caso entero). Mismo límite (240 s / 1 acción).
const real7 = core(loadG(EXTRA), true, true, 7);
if (real7.fails) { console.log(`  ✗ v7: ${real7.fails} comprobación(es) fallan sin mutación`); bad++; }
else console.log(`  · v7: ${real7.checks} comprobaciones correctas; ${real7.casos} casos jugados por el bot; espera máxima vista ${Math.round(real7.maxW)} s (límite ${240} s)`);

const { mutador } = require('./tools/mutar.js'); // P-3/3: DESDE = texto (se ignora el formato) o expresión regular anclada a lo esencial; ver tools/mutar.js
const MUT = [
  ['la espera no se compara con el límite', 'logic.js', "if (c[d].maxWait > L.maxWait + 1e-9)", "if (false)"],
  ['el borde del límite se excluye', 'logic.js', "c[d].maxWait > L.maxWait + 1e-9", "c[d].maxWait >= L.maxWait"],
  ['lo compartido no ocupa a nadie', 'logic.js', "if (e.who !== d && e.who !== 'both') return;", "if (e.who !== d) return;"],
  ['el relleno cuenta como acción propia', 'logic.js', "if (e.who === d && !e.fill)", "if (e.who === d)"],
  ['el relleno no ocupa a nadie', 'logic.js', "if (e.who !== d && e.who !== 'both') return;", "if ((e.who !== d && e.who !== 'both') || e.fill) return;"],
  ['no se mide el final del capítulo', 'logic.js', "wait = Math.max(wait, z - last);", ""],
  ['no se mide el inicio del capítulo', 'logic.js', "wait = Math.max(wait, e.t0 - last); last = Math.max(last, e.t1);", "wait = Math.max(wait, last > a ? e.t0 - last : 0); last = Math.max(last, e.t1);"],
  ['no se exige trabajo propio en el caso', 'logic.js', "if (own[d] < L.minOwn)", "if (false)"],
  ['se juzgan todos los capítulos', 'logic.js', "o.judged = only ? only.indexOf(ch) >= 0 : o.rex.ownN + o.luna.ownN > 0;", "o.judged = true;"],
  ['los dos detectives intercambiados', 'logic.js', "if (e.who === d && !e.fill) { o[d].ownN++;", "if (e.who !== d && e.who !== 'both' && !e.fill) { o[d].ownN++;"],
  ['el bot no anota los eventos', 'bot.js', "const ev = (who, t0, fill) => { evs.push(", "const ev = (who, t0, fill) => { if (0) evs.push("],
  ['el bot anota todo como compartido', 'bot.js', /ev\(step\.tool === 'coop' \? 'both'[^;]*?, ta, isFill\(p\.id\)\);/, "ev('both', ta, isFill(p.id));"],
  ['el bot no anota el relleno', 'bot.js', "evs.push({ ch: curCh, who, t0, t1: t, fill: !!fill });", "if (!fill) evs.push({ ch: curCh, who, t0, t1: t, fill: false });"],
];
MUT.forEach(([name, file, from, to]) => {
  const m = mutador(file, from, to), Gm = loadG(EXTRA, m.patch);
  if (!m.ok) { console.log(`  ✗ MUTACIÓN «${name}»: ${m.motivo} en ${file} (actualiza el patrón de la prueba; el código no tiene por qué estar mal)`); bad++; return; }
  let r; try { r = core(Gm, false, true); } catch (e) { r = { fails: 1 }; }
  if (r.fails === 0) { console.log(`  ✗ MUTACIÓN «${name}» NO detectada`); bad++; } else console.log(`  · mutación «${name}»: detectada (${r.fails} comprobaciones fallan)`);
});
console.log(bad ? `✗ tiempos muertos (EQ-7): ${bad} problema(s)` : `✓ tiempos muertos (EQ-7): ${real.checks} comprobaciones en v6 y ${real7.checks} en v7 correctas y ${MUT.length} mutaciones del código detectadas`);
process.exit(bad ? 1 : 0);
