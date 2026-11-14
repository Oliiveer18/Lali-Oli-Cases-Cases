// TIEMPOS-2 (cp. 262): con GEN_VERSION >= 7 la nota de calidad (`src/quality.js`) y el medidor (`src/meter.js`) usan la duración OFICIAL por nivel de `GEN_DATA.compile.durationV7`
// (Fácil 20-28 · Normal 28-36 · Difícil 36-45, techo 45, mínimo absoluto 20); con v6 y v5 NADA cambia (franjas solapadas `today` / bandas duras, techo 60). Una a una: node test_tiempos2.js
// Los minutos NO salen del bot: se sustituye `botSeconds` (y `meterSeconds`) sobre una partida real cacheada, como en test_quality_spread.js.
// Comprueba: franja/mediana/techo/mínimo por versión · la duración puntúa 100 en la mediana y en los dos bordes de CADA nivel y baja fuera · los rangos contiguos (28 y 36 puntúan 100 a ambos lados)
// · 45 min no es error y 46 SÍ («demasiado_largo», sin aceptar) en v7, y en v6 un caso de 46 min sigue sin ser error · bajo 20 min, 10 puntos más · el medidor usa la misma franja.
// Mutaciones: el techo se queda en 60 · la franja ignora `durationV7` · v6 también usa los rangos v7 · el medidor usa la franja antigua. Cada una DEBE detectarse.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'], LV = ['facil', 'normal', 'dificil'], DIFF = { facil: 'easy', normal: 'normal', dificil: 'hard' };
let bad = 0, checks = 0, quiet = false; const ok = (m, c, x) => { checks++; if (!c) { bad++; if (!quiet) { console.log('✗ ' + m); if (x !== undefined) console.log('   ', JSON.stringify(x)); } } };
const load = (m) => require('./tools/load_g.js')(MOD, m ? m.patch : undefined);
const J = JSON.stringify;

function revisa(G, et) {
  const before = bad, k = (m, c, x) => ok(et + ': ' + m, c, x);
  const Q = G.QUALITY_CFG, base = G.generateCase(1 * 7919 + 1, { register: true, level: 'normal' }).def, real = G.botPlay, realMeter = G.meterSeconds, cache = {};
  LV.forEach((L) => { cache[DIFF[L]] = real(base, { difficulty: DIFF[L] }); });
  let fixed = null;
  G.botPlay = function (def, o) { const b = cache[o && o.difficulty] || real.apply(this, arguments); return fixed === null ? b : Object.assign({}, b, { botSeconds: fixed * 60 }); };
  G.meterSeconds = function (f) { return fixed === null ? realMeter.call(this, f) : fixed * 60; };
  const at = (min, L) => { fixed = min; try { const r = G.qualityCase(base, { difficulty: DIFF[L], humanFactor: 1 }); return { dur: r.parts ? r.parts.dur : null, accept: r.accept, min: r.bot ? r.bot.humanMinutes : null, codes: r.findings.map((f) => f.code) }; } finally { fixed = null; } };
  const meter = (min, L) => { fixed = min; try { return G.meterCase(Object.assign({}, base, { genLevel: L }), {}).play; } finally { fixed = null; } };
  try {
    const V = (v, f) => { G.GEN_VERSION = v; try { return f(); } finally { G.GEN_VERSION = 7; } };
    // ---- versiones: franja, mediana, techo y mínimo ----
    V(5, () => { k('v5: bandas duras 20-30 · 30-40 · 40-55 y techo 60', J(LV.map((L) => Q.bandOf(L))) === '[[20,30],[30,40],[40,55]]' && Q.ceilingOf() === 60 && Q.floorOf() === 20); });
    V(6, () => { k('v6 INTACTO: franjas solapadas `today` 20-28 · 22-32 · 24-36, medianas 23,5 · 27 · 30, techo 60', J(LV.map((L) => Q.bandOf(L))) === '[[20,28],[22,32],[24,36]]' && J(LV.map((L) => Q.medianOf(L))) === '[23.5,27,30]' && Q.ceilingOf() === 60 && Q.floorOf() === 20, LV.map((L) => [Q.bandOf(L), Q.medianOf(L), Q.ceilingOf()])); });
    V(7, () => { k('v7: franjas 20-28 · 28-36 · 36-45, medianas 24 · 32 · 40, techo 45 y mínimo 20', J(LV.map((L) => Q.bandOf(L))) === '[[20,28],[28,36],[36,45]]' && J(LV.map((L) => Q.medianOf(L))) === '[24,32,40]' && Q.ceilingOf() === 45 && Q.floorOf() === 20, LV.map((L) => [Q.bandOf(L), Q.medianOf(L), Q.ceilingOf()])); });
    // ---- v7: la duración puntúa 100 en la mediana y en los dos bordes; fuera baja, y baja más cuanto más lejos ----
    V(7, () => {
      LV.forEach((L) => { const b = Q.bandOf(L), m = Q.medianOf(L);
        k(L + ' v7: dur = 100 en la mediana y en los dos bordes de su franja', [m, b[0], b[1]].every((x) => at(x, L).dur === 100), [m, b[0], b[1]].map((x) => at(x, L).dur));
        const d = (x) => at(x, L).dur;
        k(L + ' v7: fuera de la franja baja y baja más cuanto más lejos (por los dos lados, salvo el techo)', d(b[0] - 1) < 100 && d(b[0] - 2) < d(b[0] - 1) && d(b[1] + 1) < 100, [d(b[0] - 2), d(b[0] - 1), d(b[1] + 1)]); });
      k('v7: rangos CONTIGUOS: 28 min puntúa 100 en Fácil y en Normal; 36 min en Normal y en Difícil', at(28, 'facil').dur === 100 && at(28, 'normal').dur === 100 && at(36, 'normal').dur === 100 && at(36, 'dificil').dur === 100);
      k('v7: un caso de 29 min en Fácil, de 37 en Normal y de 35 en Difícil puntúan menos de 100 (ya no se solapan)', at(29, 'facil').dur < 100 && at(37, 'normal').dur < 100 && at(35, 'dificil').dur < 100, [at(29, 'facil').dur, at(37, 'normal').dur, at(35, 'dificil').dur]);
      // techo 45
      const a45 = at(45, 'dificil'), a46 = at(46, 'dificil'), a60 = at(59, 'normal');
      k('v7: 45 min en Difícil NO es error y puntúa 100', a45.dur === 100 && !a45.codes.includes('demasiado_largo'), a45);
      k('v7: 46 min es ERROR «demasiado_largo», dur 0 y el caso no se acepta', a46.codes.includes('demasiado_largo') && a46.dur === 0 && a46.accept === false, a46);
      k('v7: 59 min (antes válido bajo el techo de 60) ahora es error en cualquier nivel', a60.codes.includes('demasiado_largo') && a60.accept === false, a60);
      // mínimo absoluto: bajo 20 min, 10 puntos más
      const b19 = at(19, 'facil'), b20 = at(20, 'facil');
      k('v7: bajo los 20 min el caso pierde 10 puntos más (19 min = 100 − perMinute − 10)', b20.dur === 100 && b19.dur === 100 - Q.perMinute - 10, [b20.dur, b19.dur]);
      // medidor: misma franja
      const p = (x, L) => meter(x, L);
      k('v7 medidor: Fácil igual de bien en 20-28 y peor a los 29 min', p(28, 'facil') === p(24, 'facil') && p(29, 'facil') < p(28, 'facil'), [p(24, 'facil'), p(28, 'facil'), p(29, 'facil')]);
      k('v7 medidor: Difícil sin penalización en 36-45 y con ella a los 46 y a los 35', p(36, 'dificil') === p(45, 'dificil') && p(46, 'dificil') < p(45, 'dificil') && p(35, 'dificil') < p(36, 'dificil'), [p(35, 'dificil'), p(36, 'dificil'), p(45, 'dificil'), p(46, 'dificil')]);
      k('v7 medidor: Normal sin penalización en 28-36 y con ella a los 37', p(28, 'normal') === p(36, 'normal') && p(37, 'normal') < p(36, 'normal'), [p(28, 'normal'), p(36, 'normal'), p(37, 'normal')]);
    });
    // ---- v6: NADA cambia ----
    V(6, () => {
      const c46 = at(46, 'dificil'), c61 = at(61, 'dificil');
      k('v6 INTACTO: un caso de 46 min NO es error (techo 60) y uno de 61 sí', !c46.codes.includes('demasiado_largo') && c61.codes.includes('demasiado_largo'), [c46.codes, c61.codes]);
      k('v6 INTACTO: la franja de Difícil sigue siendo 24-36 (40 min puntúa menos de 100; 30 min, 100)', at(30, 'dificil').dur === 100 && at(40, 'dificil').dur < 100 && at(23, 'dificil').dur < 100, [at(30, 'dificil').dur, at(40, 'dificil').dur]);
      k('v6 INTACTO medidor: Difícil penaliza a los 40 min (franja 24-36)', meter(40, 'dificil') < meter(30, 'dificil'), [meter(30, 'dificil'), meter(40, 'dificil')]);
    });
  } finally { G.botPlay = real; G.meterSeconds = realMeter; G.GEN_VERSION = 7; }
  return bad - before;
}

// 1) Código real
{ const G = load(); G.GEN_VERSION = 7; const f = revisa(G, 'real'); console.log('  comprobaciones del código real: ' + (f ? f + ' fallos' : 'todas bien')); }

// 2) Mutaciones: cada una DEBE producir al menos un fallo
[
  ['el techo se queda en 60', mutador('quality.js', 'ceil = Q.ceilingOf()', 'ceil = Q.ceiling')],
  ['la franja ignora `durationV7`', mutador('quality.js', 'if (D && D.levels[level]) return D.levels[level].range;', '')],
  ['la mediana ignora `durationV7`', mutador('quality.js', 'if (D && D.levels[level]) return D.levels[level].median;', '')],
  ['v6 también usa los rangos v7', mutador('quality.js', 'G.GEN_VERSION >= 7 && G.GEN_DATA && G.GEN_DATA.compile && G.GEN_DATA.compile.durationV7', 'G.GEN_VERSION >= 6 && G.GEN_DATA && G.GEN_DATA.compile && G.GEN_DATA.compile.durationV7')],
  ['el medidor usa la franja antigua', mutador('meter.js', 'const bd = DV ? DV.range : LV', 'const bd = LV')],
  ['sin el castigo bajo el mínimo absoluto', mutador('quality.js', '(humanMin < floorMin ? 10 : 0)', '0')],
].forEach(([nom, m]) => {
  const before = bad, G = load(m); G.GEN_VERSION = 7;
  if (!m.ok) { ok('mutación «' + nom + '»: ' + m.motivo, false); return; }
  quiet = true; const f = revisa(G, 'mut'); quiet = false; bad = before; // los fallos de la mutación NO cuentan como fallos de la prueba
  ok('mutación «' + nom + '» detectada', f > 0); console.log('  · mutación «' + nom + '»: ' + (f > 0 ? 'detectada (' + f + ' fallos)' : 'NO DETECTADA'));
});

console.log(bad ? '✗ ' + bad + ' fallos de ' + checks : '✓ test_tiempos2: ' + checks + ' comprobaciones'); process.exit(bad ? 1 : 0);
