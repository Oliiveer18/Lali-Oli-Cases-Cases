// test_quality_spread.js — S3b-1 de 4D-2 · NOTA v3 POR NIVEL (reescrito; antes medía todo como Normal con la nota v2).
// Unidad de medida = el PAR (caso, dificultad): 40 casos por nivel generados con generateCase(seed, { register: true, level: L }); el bot juega en la dificultad del nivel.
//  R2 anti-saturación en las 3 casillas: media ≤ 90, ≤ 10 % con 100, desviación ≥ 2,5, rango ≥ 10, 0 errores de puerta; Fácil y Normal ≥ 85 % aceptados.
//     (Difícil da desviación ~2,9 por EFECTO SUELO —casi todo cae en la misma zona baja—, no por saturación; sus aceptados solo se INFORMAN hasta decidir QUALITY_MIN en S3b-2.)
//  Orden: media Fácil > Normal > Difícil · calidad intrínseca parecida entre niveles (|Fácil − Difícil| ≤ 8).
//  Nivel en el caso: genLevel = L y genDecoys dentro de G.DECOY_RANGE[L] (recortado con ≤ 4 sospechosos).
//  El bot juega en la dificultad del par; opts.difficulty manda sobre genLevel; engañosos fuera de rango → aviso y menos profundidad.
//  R1 casos pelados (sin charlas sin pista ni bandera): la profundidad NO sube y la nota baja en ≥ 5 de 6, en cada nivel.
//  Casos manipulados: textos repetidos → baja `text` y avisa; todas las etiquetas iguales → baja `obj`; todas las pistas del mismo tipo → baja `var`.
// Informa la calidad de CADA nivel por separado (regla del usuario, 19 oct).
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra !== undefined) console.log('  ', typeof extra === 'string' ? extra : JSON.stringify(extra)); } };
const clone = (o) => JSON.parse(JSON.stringify(o));
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0), sdev = (a) => Math.sqrt(mean(a.map((x) => (x - mean(a)) ** 2)));
const r1 = (x) => Math.round(x * 10) / 10;
const LEVELS = ['facil', 'normal', 'dificil'], DIFF = { facil: 'easy', normal: 'normal', dificil: 'hard' };
const N = 40, byLevel = {};

// ---- generar los 40 casos de cada nivel y medirlos ----
LEVELS.forEach((L) => {
  const rows = [];
  for (let s = 0; s < N; s++) { const r = G.generateCase(s * 7919 + 1, { register: true, level: L }); if (r.error) continue; rows.push({ r, Q: G.qualityCase(r.def) }); }
  byLevel[L] = rows;
  const q = rows.map((x) => x.Q.quality), acc = rows.filter((x) => x.Q.accept).length, mins = rows.map((x) => x.Q.bot.humanMinutes), b = G.QUALITY_CFG.profiles[L].band;
  const inBand = rows.filter((x) => x.Q.bot.humanMinutes >= b[0] && x.Q.bot.humanMinutes <= b[1]).length;
  console.log(`${L.padEnd(7)} n ${rows.length} · nota ${Math.min(...q)}/${r1(mean(q))}/${Math.max(...q)} (desv ${r1(sdev(q))}) · intrínseca ${r1(mean(rows.map((x) => x.Q.intrinseca)))} · ajuste ${r1(mean(rows.map((x) => x.Q.ajuste)))} · aceptados ${acc}/${rows.length} · ${r1(mean(mins))} min (banda ${b[0]}-${b[1]}: ${Math.round(100 * inBand / rows.length)} % dentro)`);
});

// ---- R2 · anti-saturación y puerta, en las tres casillas ----
LEVELS.forEach((L) => {
  const rows = byLevel[L], q = rows.map((x) => x.Q.quality), mean_ = mean(q), sd = sdev(q), mn = Math.min(...q), mx = Math.max(...q), cien = q.filter((x) => x >= 100).length / q.length;
  const acc = rows.filter((x) => x.Q.accept).length / rows.length;
  ok(`[${L}] se generaron los ${N} casos`, rows.length === N, rows.length);
  ok(`[${L}] R2 · media ≤ 90`, mean_ <= 90, mean_);
  ok(`[${L}] R2 · como mucho el 10 % de casos con 100`, cien <= 0.1, cien);
  ok(`[${L}] R2 · dispersión real (desviación ≥ 2,5)`, sd >= 2.5, sd);
  ok(`[${L}] R2 · rango útil (máx − mín ≥ 10)`, mx - mn >= 10, [mn, mx]);
  ok(`[${L}] puerta: 0 errores en los casos generados`, rows.every((x) => x.Q.ok), rows.filter((x) => !x.Q.ok).map((x) => x.Q.findings.filter((f) => f.sev === 'error').map((f) => f.code)));
  if (L === 'dificil') console.log(`INFO · [dificil] aceptados ${Math.round(acc * 100)} % con QUALITY_MIN ${G.QUALITY_MIN}: NO se exige (decisión de QUALITY_MIN en S3b-2; hoy los casos duran ~23 min y Difícil pide 40-55)`);
  else ok(`[${L}] casi todos se aceptan (≥ 85 %)`, acc >= 0.85, acc);
  ok(`[${L}] cada par se mide con el perfil de su nivel (nivel, dificultad y banda)`, rows.every((x) => x.Q.level === L && x.Q.tier === DIFF[L] && x.Q.band[0] === G.QUALITY_CFG.bandOf(L)[0] && x.Q.band[1] === G.QUALITY_CFG.bandOf(L)[1]), rows[0] && [rows[0].Q.level, rows[0].Q.tier, rows[0].Q.band]);
});
const M = (L) => mean(byLevel[L].map((x) => x.Q.quality)), MI = (L) => mean(byLevel[L].map((x) => x.Q.intrinseca));
ok('orden de las medias: Fácil > Normal > Difícil', M('facil') > M('normal') && M('normal') > M('dificil'), [r1(M('facil')), r1(M('normal')), r1(M('dificil'))]);
ok('la calidad intrínseca es parecida entre niveles (|Fácil − Difícil| ≤ 8)', Math.abs(MI('facil') - MI('dificil')) <= 8, [r1(MI('facil')), r1(MI('normal')), r1(MI('dificil'))]);

// ---- el nivel viaja en el caso ----
LEVELS.forEach((L) => {
  const rg = G.DECOY_RANGE[L];
  const okLevel = byLevel[L].every((x) => x.r.def.genLevel === L);
  const badDec = byLevel[L].filter((x) => { const maxD = G.maxDecoys(x.r.def.suspects.length), lo = Math.min(rg[0], maxD), hi = Math.min(rg[1], maxD), n = x.r.def.genDecoys; return typeof n !== 'number' || n < lo || n > hi; }).map((x) => [x.r.def.genDecoys, x.r.def.suspects.length]);
  ok(`[${L}] el caso guarda genLevel = «${L}»`, okLevel);
  ok(`[${L}] genDecoys dentro de G.DECOY_RANGE (${rg[0]}-${rg[1]}; con ≤ 4 sospechosos, máx. 2)`, badDec.length === 0, badDec);
  ok(`[${L}] el número de caso (level) sigue siendo el de caso, no el del nivel`, byLevel[L].every((x) => x.r.def.level === 2), byLevel[L][0] && byLevel[L][0].r.def.level);
});

// ---- el bot juega en la dificultad del par; opts.difficulty manda sobre genLevel ----
{
  const real = G.botPlay, seen = [];
  G.botPlay = function (def, o) { seen.push(o && o.difficulty); return real.apply(this, arguments); };
  const got = LEVELS.map((L) => { seen.length = 0; const x = byLevel[L][0]; G.qualityCase(x.r.def); return seen[0]; });
  const forced = (() => { seen.length = 0; G.qualityCase(byLevel.normal[0].r.def, { difficulty: 'hard' }); return seen[0]; })();
  G.botPlay = real;
  ok('el bot juega en la dificultad del par (Fácil→easy, Normal→normal, Difícil→hard)', got.join() === 'easy,normal,hard', got);
  ok('opts.difficulty manda sobre genLevel (también para el bot)', forced === 'hard', forced);
  const x = byLevel.normal[0], Qh = G.qualityCase(x.r.def, { difficulty: 'hard' }), Qe = G.qualityCase(x.r.def, { difficulty: 'easy' });
  ok('un caso Normal medido en Difícil o Fácil se puntúa contra el perfil de esa dificultad', Qh.tier === 'hard' && Qh.band[0] === G.QUALITY_CFG.bandOf('dificil')[0] && Qe.tier === 'easy' && Qe.band[1] === G.QUALITY_CFG.bandOf('facil')[1], [Qh.tier, Qh.band, Qe.tier, Qe.band]);
}

// ---- (a) DURACIÓN: la fórmula medida con MINUTOS FIJOS (cp. 134; sustituye a «la misma duración nunca puntúa más en una dificultad más alta») ----
// Con v6 (3-bis) las franjas de cada nivel SE SOLAPAN (hoy Fácil 20-28 · Normal 22-32 · Difícil 24-36; meta 20-28 · 25-36 · 31-46); con v7 (TIEMPOS-2) son contiguas (20-28 · 28-36 · 36-45), sin zona común. La regla tiene dos mitades:
//   · un caso CORTO (por debajo de las tres franjas) puntúa peor cuanto más difícil es el nivel (Fácil ≥ Normal ≥ Difícil);
//   · un caso LARGO (por encima de las tres) puntúa mejor cuanto más difícil es el nivel (Difícil ≥ Normal ≥ Fácil), y en la zona común de las tres franjas puntúan igual (100).
// Los minutos NO salen del bot (que cambiaría con el generador): se sustituye `botSeconds` sobre una partida real del bot (cacheada) y `humanFactor` = 1, y se deriva todo de G.QUALITY_CFG, en las dos escalas.
{
  const CFG = G.QUALITY_CFG, real = G.botPlay, base = byLevel.normal[0].r.def, cache = {}, prevScale = CFG.scale, prevVer = G.GEN_VERSION;
  LEVELS.forEach((L) => { cache[DIFF[L]] = real(base, { difficulty: DIFF[L] }); });
  let fixed = null;
  G.botPlay = function (def, o) { const b = cache[o && o.difficulty] || real.apply(this, arguments); return fixed === null ? b : Object.assign({}, b, { botSeconds: fixed * 60 }); };
  const at = (min, L) => { fixed = min; try { const Q = G.qualityCase(base, { difficulty: DIFF[L], humanFactor: 1 }); return { dur: Q.parts.dur, min: Q.bot.humanMinutes }; } finally { fixed = null; } };
  const durs = (min) => LEVELS.map((L) => at(min, L).dur);
  try {
    // TIEMPOS-3 (cp. 263): además de las dos escalas de v6 (`today`, `goal`), la franja OFICIAL de v7 (`durationV7`: 20-28 · 28-36 · 36-45, contigua, sin escala), con GEN_VERSION 7 solo en memoria
    [['today', 6], ['goal', 6], ['v7', 7]].forEach(([sc, ver]) => {
      G.GEN_VERSION = ver; if (ver < 7) CFG.scale = sc;
      const lo = LEVELS.map((L) => CFG.bandOf(L)[0]), hi = LEVELS.map((L) => CFG.bandOf(L)[1]), med = LEVELS.map((L) => CFG.medianOf(L));
      const up = (a) => a[0] < a[1] && a[1] < a[2], ceil = CFG.ceilingOf();
      ok(`[escala ${sc}] el mínimo, el máximo y la mediana de la franja suben con el nivel (Fácil < Normal < Difícil), y la mediana cae dentro de su franja`, up(lo) && up(hi) && up(med) && LEVELS.every((L, i) => med[i] >= lo[i] && med[i] <= hi[i]), { lo, hi, med });
      const sub = at(med[0], 'facil');
      ok(`[escala ${sc}] el banco de pruebas mide los minutos que se piden (sin pasar por el bot)`, Math.abs(sub.min - med[0]) <= 0.1, sub);
      ok(`[escala ${sc}] la duración puntúa 100 en la mediana y en los dos bordes de la franja de CADA nivel`, LEVELS.every((L, i) => [med[i], lo[i], hi[i]].every((m) => at(m, L).dur === 100)), LEVELS.map((L, i) => [at(med[i], L).dur, at(lo[i], L).dur, at(hi[i], L).dur]));
      ok(`[escala ${sc}] fuera de la franja la nota baja y baja más cuanto más lejos (un minuto y dos minutos fuera, por los dos lados)`, LEVELS.every((L, i) => { const d = (m) => at(m, L).dur; return d(lo[i] - 1) < 100 && d(lo[i] - 2) < d(lo[i] - 1) && d(hi[i] + 1) < 100 && (hi[i] + 2 > ceil || d(hi[i] + 2) < d(hi[i] + 1)); }));   // pasado el techo (v7: 45) el caso es ERROR y puntúa 0: ahí ya no hay «baja más»
      const short = Math.min(...lo) - 1, long = Math.min(Math.max(...hi) + 1, ceil), ds = durs(short), dl = durs(long);
      ok(`[escala ${sc}] caso CORTO (${short} min, bajo las tres franjas): puntúa peor cuanto más difícil es el nivel (Fácil ≥ Normal ≥ Difícil, con alguna diferencia)`, ds[0] >= ds[1] && ds[1] >= ds[2] && ds[0] > ds[2], ds);
      ok(`[escala ${sc}] caso LARGO (${long} min, sobre las tres franjas): puntúa mejor cuanto más difícil es el nivel (Difícil ≥ Normal ≥ Fácil, con alguna diferencia)`, dl[2] >= dl[1] && dl[1] >= dl[0] && dl[2] > dl[0], dl);
      const zl = Math.max(...lo), zh = Math.min(...hi);
      if (zl <= zh) { const dz = durs(zl); ok(`[escala ${sc}] en la zona común de las tres franjas (${zl}-${zh} min) los tres niveles puntúan igual (100)`, dz.every((v) => v === 100) && durs(zh).every((v) => v === 100), dz); }
      else console.log(`  · [escala ${sc}] las franjas no tienen zona común (${zl} > ${zh}): se omite esa comprobación`);
    });
  } finally { CFG.scale = prevScale; G.GEN_VERSION = prevVer; G.botPlay = real; }
}

// ---- engañosos fuera de rango → aviso y menos profundidad ----
{
  const cases = [['facil', 3], ['dificil', 0], ['normal', 0]];
  const res = cases.map(([L, n]) => { const x = byLevel[L][0], d = clone(x.r.def); d.genDecoys = n; const P = G.qualityCase(d); return { L, n, warn: P.findings.some((f) => f.code === 'enganosos_fuera_de_nivel'), lower: P.parts.depth < x.Q.parts.depth, base: x.r.def.genDecoys }; });
  ok('un caso con genDecoys fuera del rango de su nivel avisa «enganosos_fuera_de_nivel» y baja la profundidad', res.every((x) => x.warn && x.lower), res);
  const dentro = byLevel.normal.every((x) => !x.Q.findings.some((f) => f.code === 'enganosos_fuera_de_nivel'));
  ok('los casos generados no disparan ese aviso (están dentro de rango)', dentro);
}

// ---- R1 · casos pelados, en cada nivel (cp. 134: el suelo de Difícil se trata con una regla que se endurece sola) ----
// Pelar = quitar las charlas sin pista ni bandera. Solo mueve la componente «temas por personaje» de la PROFUNDIDAD (pistas, salas y sospechosos no cambian).
// R1a (todos los niveles): pelar NUNCA sube la profundidad. R1b: la nota baja en ≥ 5 de 6 — EXCEPTO si el nivel está en el SUELO de esa componente
// (media de las 6 puntuaciones de «temas/personaje» < 15/100: la ventana pide más contenido del que hay y quitar contenido ya no puede restar). Hoy solo Difícil; en cuanto 4F suba
// el contenido y la media pase de 15, R1b vuelve a exigirse por sí sola (no hay excepción que recordar). R1c prueba que la fórmula sí discrimina aunque haya suelo.
const peel = (d) => { Object.values(d.npcs).forEach((x) => { const t = x.topics || [], keep = t.filter((q) => /"(clue|flag)"/.test(JSON.stringify(q))); x.topics = keep.length ? keep : t.slice(0, 1); }); return d; };   // el validador exige ≥ 1 charla por personaje
const tpnOf = (d) => { const n = Object.values(d.npcs); return n.reduce((a, x) => a + (x.topics || []).length, 0) / n.length; };
const winOf = (L) => { const b = G.QUALITY_CFG.depthBase.topicsPerNpc, sh = G.QUALITY_CFG.profiles[L].shift; return [b[0] + (b[1] - b[0]) * sh[0], b[0] + (b[1] - b[0]) * sh[1]]; };
const lin01 = (x, bad, good) => Math.max(0, Math.min(100, ((x - bad) / (good - bad)) * 100));
const FLOOR = 15;
LEVELS.forEach((L) => {
  const rows = [];
  for (let i = 0; i < 6; i++) { const { r, Q } = byLevel[L][i], pd = peel(clone(r.def)); rows.push({ i, r, Q, pd, P: G.qualityCase(pd) }); }
  const w = winOf(L), top = mean(rows.map((x) => lin01(tpnOf(x.r.def), w[0], w[1]))), suelo = top < FLOOR;
  const depthOk = rows.filter((x) => x.P.ok && x.P.parts.depth <= x.Q.parts.depth).length, down = rows.filter((x) => x.P.ok && x.P.quality < x.Q.quality).length;
  console.log(`  · [${L}] pelar: profundidad ${rows.map((x) => r1(x.P.parts.depth - x.Q.parts.depth)).join(' ')} · nota ${rows.map((x) => x.P.quality - x.Q.quality).join(' ')} · «temas/personaje» ${r1(top)}/100 (ventana ${w.map(r1).join('-')} temas)${suelo ? ' → EN EL SUELO' : ''}`);
  ok(`[${L}] R1a · pelar nunca sube la profundidad (6 de 6)`, depthOk === 6, depthOk + '/6');
  if (suelo) console.log(`  · [${L}] SUELO: la componente «temas por personaje» vale ${r1(top)} (< ${FLOOR}); quitar contenido no puede bajar la nota (baja en ${down}/6). Se exige solo R1a y R1c. R1b (nota baja en ≥ 5 de 6) se reactiva sola cuando esa media pase de ${FLOOR}.`);
  else ok(`[${L}] R1b · casos pelados: la nota baja en ≥ 5 de 6 (la componente «temas/personaje» está en ${r1(top)}/100, fuera del suelo)`, down >= 5, down + '/6');
  // R1c: monotonía de la fórmula con una ventana puesta A LA MEDIDA del contenido (ya no está en el suelo): pelar tiene que bajar la profundidad en los 6 casos
  const cfg = G.QUALITY_CFG, saved = cfg.depthBase.topicsPerNpc, sh = cfg.profiles[L].shift;
  const tA = Math.max(...rows.map((x) => tpnOf(x.r.def))) + 1, tB = Math.min(...rows.map((x) => tpnOf(x.pd))) - 1;     // ventana [tB, tA] en la escala del nivel
  try {
    cfg.depthBase.topicsPerNpc = [tB - (tA - tB) * sh[0] / (sh[1] - sh[0]), tB + (tA - tB) / (sh[1] - sh[0]) - (tA - tB) * sh[0] / (sh[1] - sh[0])];   // base tal que window(base, nivel) = [tB, tA]
    const w2 = winOf(L), m = rows.map((x) => { const Q2 = G.qualityCase(x.r.def), P2 = G.qualityCase(x.pd); return { d: r1(P2.parts.depth - Q2.parts.depth) }; });
    ok(`[${L}] R1c · la fórmula discrimina: con la ventana de «temas/personaje» a la medida (${w2.map(r1).join('-')} temas) pelar BAJA la profundidad en los 6 casos`, Math.abs(w2[0] - tB) < 1e-6 && Math.abs(w2[1] - tA) < 1e-6 && m.every((x) => x.d < 0), { ventana: w2, bajadas: m.map((x) => x.d) });
  } finally { cfg.depthBase.topicsPerNpc = saved; }
});

// ---- casos manipulados ----
const dupLines = (d) => {
  const f = (x) => (typeof x === 'string' ? 'No sé nada de eso, de verdad.' : Array.isArray(x) ? x.map(f) : x && x.say ? Object.assign({}, x, { say: f(x.say) }) : x && x.text ? Object.assign({}, x, { text: f(x.text) }) : x);
  Object.values(d.npcs).forEach((n) => { if (n.first) n.first = f(n.first); if (n.chat) n.chat = f(n.chat); if (n.press) n.press = f(n.press); (n.topics || []).forEach((t) => { if (!/^coartada/.test(t.id || '')) t.responses = f(t.responses); }); });
  Object.values(d.rooms).forEach((rm) => (rm.props || []).forEach((p) => (p.steps || []).forEach((s) => { if (s.text) s.text = 'Aquí no hay nada raro, de verdad.'; })));
  return d;
};
const sameLabels = (d) => { Object.values(d.rooms).forEach((rm) => (rm.props || []).forEach((p) => { if (p.steps) p.label = 'Cosa rara'; })); return d; };
const oneKind = (d) => { Object.values(d.clues).forEach((c) => { c.kind = 'documento'; }); return d; };
LEVELS.forEach((L) => {
  const rows = byLevel[L].slice(0, 4);
  const t = rows.map(({ r, Q }) => { const P = G.qualityCase(dupLines(clone(r.def))); return P.ok && P.findings.some((f) => f.code === 'textos_repetidos') && P.bot.stats.metrics.distinctShare < Q.bot.stats.metrics.distinctShare; });
  const o = rows.map(({ r, Q }) => { const P = G.qualityCase(sameLabels(clone(r.def))); return P.ok && P.parts.obj < Q.parts.obj && P.findings.some((f) => f.code === 'objetos_repetidos'); });
  const v = rows.map(({ r, Q }) => { const P = G.qualityCase(oneKind(clone(r.def))); return P.ok && P.parts.var < Q.parts.var && P.bot.stats.metrics.clueKinds === 1; });
  ok(`[${L}] textos repetidos → baja la proporción de líneas distintas y avisa «textos_repetidos»`, t.every(Boolean), t);
  ok(`[${L}] todas las etiquetas de objeto iguales → baja «obj» y avisa «objetos_repetidos»`, o.every(Boolean), o);
  ok(`[${L}] todas las pistas del mismo tipo → baja «var»`, v.every(Boolean), v);
});
process.exit(bad ? 1 : 0);
