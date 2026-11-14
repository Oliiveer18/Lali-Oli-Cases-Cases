// quality.js — NOTA DE CALIDAD FINAL · 2B-2, REHECHA en S3b de 4D-2 (v2 en S3b; v3 = QUALITY_VERSION 3 en S3b-1). Fábrica de casos, solo pruebas/generador.
// G.qualityCase(def, opts) → { ok, accept, quality (0-100), grade, fairness, play, solidez, riqueza, intrinseca, ajuste, parts, level, tier, band, profile, findings, review, bot }.
// UNIDAD DE MEDIDA = el PAR (caso, dificultad). La dificultad es: opts.difficulty ('easy'|'normal'|'hard'), o la que lleva el caso (def.genLevel: facil→easy,
// normal→normal, dificil→hard), o 'normal' (casos hechos a mano sin nivel). El bot JUEGA en esa dificultad. Un caso medido en otra dificultad que la suya se puntúa
// contra el perfil de la dificultad pedida (es lo que pasa si el jugador elige un nivel y se le da un caso hecho para otro).
// PUERTA y NOTA SEPARADAS (R3):
//  · PUERTA = errores graves (atasco, culpable no evidente, acusación fallida, pocas pruebas, duración absurda, equidad rota). Cualquier error limita la nota a 40 y rechaza el caso.
//  · NOTA = 0-100, suma ponderada de 10 componentes continuos en DOS grupos (cada uno con su razón escrita en docs/DOCUMENTO_MAESTRO.md §10, checkpoint 22):
//    A) CALIDAD INTRÍNSECA (55 %, la misma vara para los tres niveles): solidez de la solución 18 · capítulos 8 · mezcla historia/relleno 5 · paseo 5 · tiempo de referencia 2 ·
//       textos 7 (repetición y líneas largas) · objetos 5 (útiles frente a decoración, salas con propósito, etiquetas repetidas) · variedad de pistas 5 (tipos, herramientas, equilibrio).
//    B) AJUSTE AL PERFIL DE SU DIFICULTAD (45 %): duración frente a su banda 25 (Fácil 20-30 · Normal 30-40 · Difícil 40-55, techo 60; decisión del usuario, maestro §0.3i) ·
//       profundidad 20 (sospechosos, temas por personaje, pistas, salas y engañosos frente a lo que se espera de ese nivel).
// Los perfiles NO se inventan número a número: la banda es decisión del usuario, el rango de engañosos es G.DECOY_RANGE (bible.js) y las ventanas de profundidad salen de UNA regla
// fija (`shift`) aplicada a las ventanas de v2 (`depthBase`): Fácil = mitad baja, Normal = zona central, Difícil = mitad alta. Los objetivos siguen por encima del contenido de hoy a propósito.
(function (root) {
  'use strict';
  const G = root.G;
  G.QUALITY_VERSION = 3;
  G.QUALITY_MIN = 55;          // v1: 70 sobre otra escala. Provisional: se recalibra en S3b-2 (test_mech), 4D-3 y tras la prueba MP
  const Q = G.QUALITY_CFG = {
    // perfil por nivel de la biblia (facil/normal/dificil) = dificultad del juego (easy/normal/hard)
    profiles: {
      facil:   { diff: 'easy',   band: [20, 30], shift: [0, 0.5] },
      normal:  { diff: 'normal', band: [30, 40], shift: [0.25, 0.75] },
      dificil: { diff: 'hard',   band: [40, 55], shift: [0.5, 1] },
    },
    ceiling: 60,
    tooShort: 8,               // por debajo: error (el mínimo «blando» de 20 min lo recoge la componente de duración)
    perMinute: 4,              // puntos de la componente de duración que se pierden por minuto fuera de la banda
    parIdeal: [1.4, 2.0], parRange: [1.0, 2.5],
    chapterMax: 0.7, chapterMin: 0.08, walkMax: 0.5, fallbackMax: 0.3,
    longLine: 220,             // caracteres: una línea de más de esto ocupa ~4 cuadros de diálogo en el móvil y el bot tarda >13 s en leerla
    limitMargin: 1.3,          // Difícil: el límite de tiempo (timeLimit × par) debe dejar ≥ 30 % de margen sobre lo que tarda un jugador
    weights: { solid: 18, chap: 8, fill: 5, walk: 5, par: 2, text: 7, obj: 5, var: 5, dur: 25, depth: 20 },
    groups: { intrinseca: ['solid', 'chap', 'fill', 'walk', 'par', 'text', 'obj', 'var'], ajuste: ['dur', 'depth'] },
    // ventanas [malo → 0, bueno → 100] de la profundidad, ANTES de aplicar el perfil del nivel (son las de v2)
    depthBase: { topicsPerNpc: [3, 8], suspects: [3, 7], clues: [8, 24], rooms: [2, 6] },
    // objetivos [malo → 0, bueno → 100] del resto de señales continuas
    goals: { chapMax: [0.7, 0.4], chapMin: [0.05, 0.2], fillShare: [0.1, 0.25, 0.45], walkShare: [0.4, 0.08], proofs: [2, 6], lies: [0, 3],
             textDistinct: [0.85, 0.98], longShare: [0.1, 0], clueObjShare: [0.15, 0.35, 0.6, 0.85], roomsServed: [0.5, 1], labelDistinct: [0.7, 1],
             kinds: [1, 4], tools: [0, 3], kindMax: [0.8, 0.4] },
    errorCap: 40, warnPenalty: 6, excellent: 88, floor: 50,
  };
  // 3-bis 2/3: con GEN_VERSION >= 6 y GEN_DATA cargado, la franja de duración de cada nivel es el RANGO de su objetivo (mediana + rango que se solapan entre niveles; escala `today` del
  // contenido de hoy, `goal` cuando B2/C1 den profundidad: cambiar `Q.scale`). Sin GEN_DATA (o con GEN_VERSION 5) sigue la banda dura de siempre (Fácil 20-30 · Normal 30-40 · Difícil 40-55).
  Q.scale = 'today';
  // TIEMPOS-2 (GEN_VERSION >= 7, cp. 262): la franja, la mediana, el mínimo absoluto y el TECHO salen de `GEN_DATA.compile.durationV7` (Fácil 20-28 · Normal 28-36 · Difícil 36-45, techo 45; rangos contiguos).
  // Con v6 sigue `levels[nivel][Q.scale]` (solapado) y techo 60; con v5, la banda dura de `profiles` y techo 60. `Q.scale` solo afecta a v6.
  const durV7 = () => (G.GEN_VERSION >= 7 && G.GEN_DATA && G.GEN_DATA.compile && G.GEN_DATA.compile.durationV7) || null;
  Q.durationV7 = durV7;
  Q.ceilingOf = () => { const D = durV7(); return D ? D.ceiling : Q.ceiling; };
  Q.floorOf = () => { const D = durV7(); return D ? D.floor : 20; };
  Q.bandOf = (level) => { const D = durV7(); if (D && D.levels[level]) return D.levels[level].range; const L = G.GEN_VERSION >= 6 && G.GEN_DATA && G.GEN_DATA.compile && G.GEN_DATA.compile.levels && G.GEN_DATA.compile.levels[level]; return L ? L[Q.scale].range : Q.profiles[level].band; };
  Q.medianOf = (level) => { const D = durV7(); if (D && D.levels[level]) return D.levels[level].median; const L = G.GEN_VERSION >= 6 && G.GEN_DATA && G.GEN_DATA.compile && G.GEN_DATA.compile.levels && G.GEN_DATA.compile.levels[level]; return L ? L[Q.scale].median : null; };
  Q.bands = { easy: Q.profiles.facil.band, normal: Q.profiles.normal.band, hard: Q.profiles.dificil.band };   // compatibilidad (v2)
  const LEVEL_OF = { easy: 'facil', normal: 'normal', hard: 'dificil' };
  const PENALTY = { error: 35, warn: 8, info: 0 };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lin = (x, bad, good) => clamp(((x - bad) / (good - bad)) * 100, 0, 100);   // 0 en «bad», 100 en «good» (sirve en los dos sentidos)
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const trap = (x, g) => (x < g[1] ? lin(x, g[0], g[1]) : lin(x, g[3], g[2]));   // sube hasta g[1], meseta hasta g[2], baja hasta g[3]
  // nivel y dificultad del par: opts.difficulty manda; si no, el nivel con el que se generó el caso; si no, Normal
  const levelOf = (def, opts) => (opts.difficulty && LEVEL_OF[opts.difficulty] ? LEVEL_OF[opts.difficulty] : def && Q.profiles[def.genLevel] ? def.genLevel : 'normal');
  const window = (base, level) => { const s = Q.profiles[level].shift; return [base[0] + (base[1] - base[0]) * s[0], base[0] + (base[1] - base[0]) * s[1]]; };
  G.qualityCase = function (def, opts) {
    try { return inner(def, opts || {}); } catch (e) { return empty('error', 'Error interno: ' + (e && e.message ? e.message : e)); }
  };
  const empty = (code, msg) => ({ ok: false, accept: false, quality: 0, grade: 'rechazar', fairness: 0, play: 0, solidez: 0, riqueza: 0, intrinseca: 0, ajuste: 0, parts: null, level: null, tier: null, band: null, profile: null, findings: [{ src: 'calidad', sev: 'error', code, msg }], review: null, bot: null });

  // ---- textos y objetos del caso (solo mira el DEF: sirve igual para casos hechos a mano) ----
  const strs = (x, out) => { if (typeof x === 'string') out.push(x); else if (Array.isArray(x)) x.forEach((y) => strs(y, out)); else if (x && typeof x === 'object') { if (x.say) strs(x.say, out); else if (x.text) strs(x.text, out); } return out; };
  // Lo que el jugador LEE al explorar y charlar: saludo, temas (menos las coartadas, que son plantilla obligatoria de la mentira), charla suelta, presión y lo que dice cada objeto.
  // Se EXCLUYEN: las confesiones (`evidence`: se reutilizan a propósito) y el texto del diario de pistas (es el mismo que dice el objeto o el testigo).
  const textInfo = (def) => {
    const names = Object.values(def.npcs || {}).map((n) => n && n.name).filter(Boolean).sort((a, b) => b.length - a.length);
    const norm = (s) => { let t = String(s); names.forEach((n) => { t = t.split(n).join('@'); }); return t.toLowerCase().replace(/[0-9]+/g, '#').replace(/[^a-záéíóúüñ@# ]/g, ' ').replace(/\s+/g, ' ').trim(); };   // el nombre y la hora no cuentan: «la huella de Canela» y «la huella de Trufa» son la misma línea
    // 4F-0a/4: las monedas sueltas son un EXTRA: su frase no cuenta en la nota (el caso mide igual con y sin ellas)
    const CN = (G.GEN_DATA && G.GEN_DATA.compile && G.GEN_DATA.compile.extra && G.GEN_DATA.compile.extra.coins) || { lines: [], amount: 0 };
    const coinFree = (st) => { let x = st.text || ''; if (st.fx && st.fx.money) CN.lines.forEach((l) => { x = x.split(' ' + l.replace('{n}', CN.amount)).join(''); }); return x; };
    const lines = [], labels = [];
    Object.values(def.npcs || {}).forEach((n) => { strs(n.first, lines); (n.topics || []).forEach((t) => { if (!/^coartada/.test(t.id || '')) strs(t.responses, lines); }); strs(n.chat, lines); strs(n.press, lines); });
    Object.values(def.rooms || {}).forEach((rm) => (rm.props || []).forEach((p) => { if (!p.steps) return; if (p.label) labels.push(norm(p.label)); p.steps.forEach((s) => { if (s.text) lines.push(coinFree(s)); }); }));
    const clean = lines.filter((l) => l && l.length);
    const distinct = new Set(clean.map(norm)).size, labDistinct = new Set(labels).size;
    return { n: clean.length, distinctShare: clean.length ? distinct / clean.length : 1, longShare: clean.length ? clean.filter((l) => l.length > Q.longLine).length / clean.length : 0, labels: labels.length, labelDistinct: labels.length ? labDistinct / labels.length : 1 };
  };
  const objectInfo = (def) => {
    const rooms = Object.keys(def.rooms || {}), inter = [], clueObjs = [], served = {};
    rooms.forEach((rid) => (def.rooms[rid].props || []).forEach((p) => { if (!p.steps) return; inter.push(p); if (p.steps.some((s) => s.clue)) { clueObjs.push(p); served[rid] = 1; } }));
    Object.keys(def.placement || {}).forEach((nid) => (def.placement[nid] || []).forEach((pl) => { if (pl && pl.room) served[pl.room] = 1; }));
    return { inter: inter.length, clueObjs: clueObjs.length, clueObjShare: inter.length ? clueObjs.length / inter.length : 0, roomsServed: rooms.length ? rooms.filter((r) => served[r]).length / rooms.length : 0, rooms: rooms.length };
  };
  const clueInfo = (def) => {
    const cl = Object.values(def.clues || {}), kinds = {}, tools = {};
    cl.forEach((c) => { kinds[c.kind || '?'] = (kinds[c.kind || '?'] || 0) + 1; });
    Object.values(def.rooms || {}).forEach((rm) => (rm.props || []).forEach((p) => (p.steps || []).forEach((s) => { if (s.tool) tools[s.tool] = 1; })));
    return { kinds: Object.keys(kinds).length, tools: Object.keys(tools).length, kindMax: cl.length ? Math.max.apply(null, Object.values(kinds)) / cl.length : 1 };
  };

  const inner = function (def, opts) {
    const review = G.reviewCase(def);
    if (!review.ok && review.findings.some((f) => f.code === 'invalido')) return Object.assign(empty('invalido', review.findings[0].msg), { review });
    const level = levelOf(def, opts), profile = Q.profiles[level], tier = profile.diff, band = Q.bandOf(level), lo = band[0], hi = band[1], ceil = Q.ceilingOf(), floorMin = Q.floorOf();
    const bot = G.botPlay(def, Object.assign({}, opts, { difficulty: tier }));   // el bot juega en la dificultad del par
    const findings = review.findings.map((f) => ({ src: 'equidad', sev: f.sev, code: f.code, msg: f.msg }));
    const add = (sev, code, msg) => findings.push({ src: 'jugabilidad', sev, code, msg });
    const factor = opts.humanFactor || (G.BOT_CFG && G.BOT_CFG.humanFactor) || 1.7;
    const humanSeconds = Math.round(bot.botSeconds * factor), humanMin = Math.round(humanSeconds / 6) / 10;
    const stats = bot.stats || {}, rv = review.stats || {};
    const parts = { solid: 0, chap: 0, fill: 0, walk: 0, par: 0, text: 0, obj: 0, var: 0, dur: 0, depth: 0 };

    // ---- PUERTA: errores graves ----
    if (!bot.finished) {
      add('error', 'atasco', 'El bot no puede jugar el caso hasta el final: ' + (bot.stuck ? bot.stuck.msg : bot.msg || 'se atasca') + '. Puede haber salas partidas, objetos inalcanzables o una acción que el motor no permite.');
    } else {
      if (!bot.win) add('error', 'acusacion_fallida', 'El bot llegó a acusar con la solución correcta y el juego no la acepta.');
      if (stats.topSuspectIsCulprit === false) add('error', 'culpable_no_evidente', 'Al llegar a acusar, el sospechoso más señalado por las pistas no es el culpable: un jugador atento acusaría al equivocado.');
      if (stats.proofHeld < 3) add('error', 'pocas_pruebas_en_mano', `El bot llega a acusar con solo ${stats.proofHeld} pruebas contra el culpable (mínimo 3).`);
      if (stats.clues < stats.cluesTotal) add('warn', 'pistas_sin_conseguir', `El bot jugando normal deja ${stats.cluesTotal - stats.clues} pista(s) sin conseguir.`);
      if (humanMin < Q.tooShort) add('error', 'demasiado_corto', `Dura unos ${humanMin} min (humano estimado): demasiado corto (mínimo ${Q.tooShort}).`);
      else if (humanMin > ceil) add('error', 'demasiado_largo', `Dura unos ${humanMin} min (humano estimado): pasa del techo de ${ceil} min.`);
      const out = humanMin < lo ? lo - humanMin : humanMin > hi ? humanMin - hi : 0;
      if (humanMin >= Q.tooShort && humanMin <= ceil) {
        if (out > 3) add('warn', humanMin < lo ? 'corto' : 'largo', `Dura unos ${humanMin} min (humano estimado), fuera de los ${lo}–${hi} min de su dificultad (${tier}).`);
        else if (out > 0) add('info', humanMin < lo ? 'algo_corto' : 'algo_largo', `Dura unos ${humanMin} min (humano estimado): cerca de los ${lo}–${hi} min de su dificultad (${tier}).`);
      }
      const ratio = def.parSeconds / Math.max(1, humanSeconds);
      if (ratio < Q.parRange[0]) add('warn', 'par_corto', `parSeconds (${def.parSeconds} s) es menor que lo que tarda un jugador (~${humanSeconds} s): la 2.ª estrella sería casi imposible.`);
      else if (ratio > Q.parRange[1]) add('warn', 'par_largo', `parSeconds (${def.parSeconds} s) es muy generoso (~${humanSeconds} s estimados): la 2.ª estrella no cuesta nada.`);
      const dd = G.DIFFS && G.DIFFS[tier], lim = dd && dd.timeLimit ? def.parSeconds * dd.timeLimit : 0;   // Difícil: límite de tiempo = timeLimit × par
      if (lim && lim < humanSeconds * Q.limitMargin) add('warn', 'limite_ajustado', `El límite de tiempo de ${tier} (${Math.round(lim)} s) deja menos de un ${Math.round((Q.limitMargin - 1) * 100)} % de margen sobre lo que tarda un jugador (~${humanSeconds} s).`);
      // reparto del tiempo por capítulo: mide solo la HISTORIA (el relleno opcional se anota aparte en `fillSeconds`)
      const total = Math.max(1, bot.perChapter.reduce((a, c) => a + c.seconds, 0));
      const shares = bot.perChapter.map((c) => c.seconds / total);
      bot.perChapter.forEach((c, k) => {
        if (shares[k] > Q.chapterMax) add('warn', 'capitulo_largo', `El capítulo ${c.chapter} («${c.title}») se lleva el ${Math.round(shares[k] * 100)} % del tiempo.`);
        else if (shares[k] < Q.chapterMin && bot.perChapter.length > 1) add('warn', 'capitulo_corto', `El capítulo ${c.chapter} («${c.title}») dura solo el ${Math.round(shares[k] * 100)} % del caso.`);
      });
      const totalAll = Math.max(1, bot.botSeconds), walkShare = (stats.walkSeconds || 0) / totalAll, fillShare = (stats.fillSeconds || 0) / totalAll;
      if (walkShare > Q.walkMax) add('warn', 'mucho_paseo', `Más de la mitad del tiempo se va andando (${Math.round(walkShare * 100)} %): mapas demasiado grandes o puertas mal puestas.`);
      if (bot.actions && stats.fallbackActions / bot.actions > Q.fallbackMax) add('warn', 'ayuda_floja', `El ${Math.round(stats.fallbackActions / bot.actions * 100)} % de las acciones el bot las tuvo que buscar solo: la ayuda del juego no guía bien en este caso.`);

      // ---- NOTA · A) calidad intrínseca (cada componente 0-100) ----
      const g = Q.goals;
      const n = Math.max(1, shares.length);
      parts.chap = n < 2 ? 0 : avg([lin(Math.max.apply(null, shares), g.chapMax[0], Math.max(g.chapMax[1], 1 / n)), lin(Math.min.apply(null, shares), g.chapMin[0], g.chapMin[1])]);
      parts.fill = fillShare < g.fillShare[1] ? lin(fillShare, 0, g.fillShare[0]) : lin(fillShare, g.fillShare[2], g.fillShare[1]);   // 10-25 % de relleno es lo sano: ni seco ni inflado
      parts.walk = lin(walkShare, g.walkShare[0], g.walkShare[1]);
      parts.par = ratio < Q.parIdeal[0] ? lin(ratio, Q.parRange[0], Q.parIdeal[0]) : ratio > Q.parIdeal[1] ? lin(ratio, Q.parRange[1], Q.parIdeal[1]) : 100;
      // solidez: pruebas que el jugador tiene en la mano al acusar, mentiras que se pueden desmontar; los defectos de equidad restan (la equidad v1 sigue como puerta)
      const liesN = rv.lies || 0;
      parts.solid = clamp(avg([lin(stats.proofHeld || 0, g.proofs[0], g.proofs[1]), liesN ? lin(rv.liesRefutable || 0, g.lies[0], Math.min(g.lies[1], liesN)) : 0]) - (100 - review.fairness), 0, 100);
      // textos: ¿se repite el caso a sí mismo? ¿hay líneas que cansan?
      const ti = textInfo(def);
      parts.text = avg([lin(ti.distinctShare, g.textDistinct[0], g.textDistinct[1]), lin(ti.longShare, g.longShare[0], g.longShare[1])]);
      if (ti.distinctShare < g.textDistinct[0]) add('warn', 'textos_repetidos', `Solo el ${Math.round(ti.distinctShare * 100)} % de las líneas del caso son distintas (sin contar nombres ni horas): suena a plantilla.`);
      if (ti.longShare > 0.08) add('warn', 'lineas_largas', `El ${Math.round(ti.longShare * 100)} % de las líneas pasan de ${Q.longLine} caracteres: cuesta leerlas en el móvil.`);
      // objetos: útiles frente a decoración (meseta sana: 35-60 % de los objetos con que se puede interactuar dan una pista), salas con propósito, etiquetas sin repetir
      const oi = objectInfo(def);
      parts.obj = avg([trap(oi.clueObjShare, g.clueObjShare), lin(oi.roomsServed, g.roomsServed[0], g.roomsServed[1]), lin(ti.labelDistinct, g.labelDistinct[0], g.labelDistinct[1])]);
      if (oi.roomsServed < 1) add('warn', 'sala_sin_proposito', `Hay ${oi.rooms - Math.round(oi.roomsServed * oi.rooms)} sala(s) sin ninguna pista de objeto ni personaje: el jugador entra a una sala vacía.`);
      if (ti.labelDistinct < 0.8) add('info', 'objetos_repetidos', `Varios objetos interactivos comparten etiqueta (${Math.round(ti.labelDistinct * 100)} % distintas).`);
      // variedad de pistas: tipos de pista, herramientas distintas y que un tipo no se lo coma todo
      const ci = clueInfo(def);
      parts.var = avg([lin(ci.kinds, g.kinds[0], g.kinds[1]), lin(ci.tools, g.tools[0], g.tools[1]), lin(ci.kindMax, g.kindMax[0], g.kindMax[1])]);

      // ---- NOTA · B) ajuste al perfil de la dificultad ----
      parts.dur = humanMin < Q.tooShort || humanMin > ceil ? 0 : clamp(100 - Q.perMinute * out - (humanMin < floorMin ? 10 : 0), 0, 100);   // bajo el mínimo absoluto (20 min), 10 puntos más
      const npcs = Object.values(def.npcs || {}), tpn = npcs.length ? avg(npcs.map((x) => (x.topics || []).length)) : 0, nRooms = Object.keys(def.rooms || {}).length;
      const W = (k) => window(Q.depthBase[k], level);
      const dp = [lin(tpn, W('topicsPerNpc')[0], W('topicsPerNpc')[1]), lin(rv.suspects || 0, W('suspects')[0], W('suspects')[1]), lin(stats.cluesTotal || 0, W('clues')[0], W('clues')[1]), lin(nRooms, W('rooms')[0], W('rooms')[1])];
      let decoyInfo = null;
      if (typeof def.genDecoys === 'number' && (G.decoyRange ? G.decoyRange(level) : G.DECOY_RANGE && G.DECOY_RANGE[level])) {   // engañosos: dentro del rango del nivel (con pocos sospechosos se recorta, como en la biblia)
        const maxD = G.maxDecoys ? G.maxDecoys(rv.suspects || 4) : 3, rg = G.decoyRange ? G.decoyRange(level) : G.DECOY_RANGE[level], dl = Math.min(rg[0], maxD), dh = Math.min(rg[1], maxD);
        const dist = def.genDecoys < dl ? dl - def.genDecoys : def.genDecoys > dh ? def.genDecoys - dh : 0;
        dp.push(clamp(100 - 50 * dist, 0, 100)); decoyInfo = { n: def.genDecoys, range: [dl, dh] };
        if (dist) add('warn', 'enganosos_fuera_de_nivel', `El caso lleva ${def.genDecoys} engañosos y el nivel ${level} admite de ${dl} a ${dh}.`);
      }
      parts.depth = avg(dp);
      stats.metrics = { tpn: Math.round(tpn * 10) / 10, walkShare: Math.round(walkShare * 100) / 100, fillShare: Math.round(fillShare * 100) / 100, parRatio: Math.round(ratio * 100) / 100,
        distinctShare: Math.round(ti.distinctShare * 100) / 100, longShare: Math.round(ti.longShare * 100) / 100, clueObjShare: Math.round(oi.clueObjShare * 100) / 100, roomsServed: Math.round(oi.roomsServed * 100) / 100,
        clueKinds: ci.kinds, clueTools: ci.tools, decoys: decoyInfo, suspects: rv.suspects || 0, rooms: nRooms };
    }

    const Wt = Q.weights, wsum = Object.keys(Wt).reduce((a, k) => a + Wt[k], 0);
    const hasError = findings.some((f) => f.sev === 'error');
    // «play»: la parte de ritmo/duración de la nota, con los avisos de jugabilidad que no entran en otra componente
    const extraWarn = findings.filter((f) => f.src === 'jugabilidad' && (f.code === 'pistas_sin_conseguir' || f.code === 'ayuda_floja')).length;
    const playKeys = ['dur', 'chap', 'fill', 'walk', 'par'], pw = playKeys.reduce((a, k) => a + Wt[k], 0);
    const play = Math.round(clamp(playKeys.reduce((a, k) => a + Wt[k] * parts[k], 0) / pw - extraWarn * Q.warnPenalty, 0, 100));
    const grp = (keys) => Math.round(keys.reduce((a, k) => a + Wt[k] * parts[k], 0) / keys.reduce((a, k) => a + Wt[k], 0));
    let quality = Object.keys(Wt).reduce((a, k) => a + Wt[k] * parts[k], 0) / wsum - extraWarn * Q.warnPenalty;
    quality = Math.round(clamp(quality, 0, 100));
    if (hasError) quality = Math.min(quality, Q.errorCap);
    const intrinseca = grp(Q.groups.intrinseca), ajuste = grp(Q.groups.ajuste);
    Object.keys(parts).forEach((k) => { parts[k] = Math.round(parts[k]); });
    const grade = hasError ? 'rechazar' : quality >= Q.excellent ? 'excelente' : quality >= G.QUALITY_MIN ? 'buena' : quality >= Q.floor ? 'floja' : 'rechazar';
    return {
      ok: !hasError, accept: !hasError && quality >= G.QUALITY_MIN, quality, grade, fairness: review.fairness, play, solidez: parts.solid, riqueza: parts.depth, intrinseca, ajuste, parts, level, tier, band, profile: { level, diff: tier, band, shift: profile.shift }, findings, review,
      bot: { finished: bot.finished, win: bot.win, botSeconds: bot.botSeconds, humanSeconds, humanMinutes: humanMin, actions: bot.actions, perChapter: bot.perChapter, stats },
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
