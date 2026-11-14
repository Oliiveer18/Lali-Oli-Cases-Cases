// meter.js — MEDIDOR BARATO de duración y calidad · 4D-1 (fábrica de casos, fase 4)
// G.meterCase(def, { fairness? }) → { humanSeconds, humanMinutes, features, parSeconds, reward, quality, play, goals, report }.
// Estima SIN ejecutar el bot cuánto dura un caso y qué nota sacaría, contando sus piezas (temas de charla, pasos de pistas,
// salas). Coeficientes ajustados por mínimos cuadrados contra el bot (4D-2: 600 semillas, error medio 3,0 %, máx 11,8 %); si cambia
// el contenido (4D-2) se reajustan con `node tools/meter_fit.js`. No sustituye a G.qualityCase (que usa el bot y sigue siendo
// la prueba final): sirve para fijar parSeconds/reward de cada caso generado y para informar de metas en 5000 semillas.
// S3b-2 (20 oct): `quality`/`play`/`goals` de este medidor siguen con la fórmula v1 (espejo de la nota antigua) y SOLO informan; NO deciden nada: parSeconds y reward salen
// de humanSeconds, que no depende de la nota. DECIDIDO: no se alinea con la nota v3 (por par caso+dificultad) hasta 4D-3, cuando el contenido de 4F-4/4H cambie los coeficientes
// y haya que reajustarlo todo de una vez (tools/meter_fit.js). La nota de verdad es G.qualityCase (bot).
(function (root) {
  'use strict';
  const G = root.G;
  G.METER_VERSION = 4; // 4F-0b 3/4-d (cp. 266): con `GEN_VERSION >= 7` el medidor usa `METER_CFG.v7` (ajustado contra el bot v7: 600 casos, 200 por nivel; error medio ≈ 0 % y ≈ 3 % absoluto en cada nivel; antes −8 / −9 / −12 %); v6 y v5 siguen con los coeficientes de 4D-2. // CL-5c-c 2/4: los puzles (pz_N) tienen coste propio (el del bot: código 25 s, línea 30 s). v2: // 4D-2: el relleno (curiosidades cur_N y charlas f_chN) tiene coste propio; antes eran variables colineales con las de base
  const M = G.METER_CFG = {
    // humanSeconds ≈ base + topics·t + chats·c + steps·s + curios·u + rooms·r  (mismas unidades que qualityCase: segundos de jugador humano)
    // topics/steps = piezas del caso base; chats = temas de charla de relleno (f_chN); curios = objetos de relleno (cur_N). Se ajustan con tools/meter_fit.js
    base: -43.04, perTopic: 24.67, perChat: 0, perStep: 25.66, perCurio: 19.26, perRoom: 33.36, perPuzzleCode: 25, perPuzzleLine: 30, minSeconds: 120, // 4D-2 (600 semillas, error medio 3,0 %, máx 11,8 %); perChat 0 a propósito: con las charlas el ajuste da un coeficiente negativo sin sentido (colinealidad)
    // v7 (4F-0b 3/4-d): salas 4 / 5 / 6 por nivel, puzles, reparto de herramientas y relleno nuevos. Ajuste de mínimos cuadrados contra el bot v7 (`node tools/meter_fit.js 200 0 7`; 600 casos con el relleno de antes de recalibrar `targetMinV7`; un reajuste posterior da otros `perRoom`/`base` con el mismo error por la colinealidad sala-nivel, y se mantienen estos, que miden bien con el relleno ya recalibrado); los puzles siguen costando 25 s por código y 30 s por línea (se restan antes de ajustar).
    // Ojo: en v7 las salas van 1 a 1 con el nivel (4 / 5 / 6), así que `perRoom` recoge también lo que el bot tarda de más en los niveles altos; si un caso futuro rompe esa relación (4F-0f), reajustar.
    v7: { base: -288.83, perTopic: 24.95, perStep: 21.75, perCurio: 15.84, perRoom: 151.79 },
    // espejo de G.QUALITY_CFG (quality.js no entra en el juego): franja de duración y penalización
    band: [20, 30], perMinute: 5, maxDurPenalty: 60, playOffset: 13, wFair: 0.6, wPlay: 0.4,
    // parSeconds = tiempo estimado × parFactor (el 2.º estrella exige jugar algo más rápido que la media), redondeado a 30 s y
    // dentro de [1,0 – 2,5] × estimado (la franja que vigila qualityCase)
    parFactor: 1.6, parRound: 30, parRange: [1.05, 2.4],
    // reward = rewardBase + minutos × rewardPerMin + nivel × rewardPerLevel, redondeado a 5 (caso 1: 120 monedas, 25 min, nivel 1)
    rewardBase: 30, rewardPerMin: 4, rewardPerLevel: 10, rewardRound: 5,
    // metas oficiales del usuario (ROADMAP §2): ≥ 20 min, nota > 80, jugabilidad ≥ 50
    goals: { minutes: 20, quality: 80, play: 50 },
  };

  // rasgos baratos de un def (solo recuentos). El relleno de 4D-2 se cuenta aparte: curiosidades (props cur_N) y charlas (temas f_chN)
  G.meterFeatures = function (def) {
    const rooms = Object.values(def.rooms || {}), npcs = Object.values(def.npcs || {});
    let steps = 0, props = 0, curios = 0, puzCode = 0, puzLine = 0;
    rooms.forEach((r) => (r.props || []).forEach((p) => { props++; if (/^cur_/.test(p.id)) curios++; else if (/^pz_\d+$/.test(p.id)) { const mi = p.steps && p.steps[0] && p.steps[0].mini; if (mi && mi.type === 'timeline') puzLine++; else puzCode++; } else if (!p.chat) steps += (p.steps || []).length; })); // A4 3/4-b1: la charla grabada (`chat`) es opcional y el bot no la hace: no cuenta como paso de la historia
    let topics = 0, chats = 0;
    npcs.forEach((n) => ((n && n.topics) || []).forEach((q) => { if (/^f_ch\d/.test(q.id)) chats++; else topics++; }));
    return { topics, chats, steps, curios, puzCode, puzLine, rooms: rooms.length, props, npcs: npcs.length, clues: Object.keys(def.clues || {}).length };
  };
  // segundos estimados de un jugador humano a partir de los rasgos (también lo usa el compilador para decidir cuánto relleno añadir)
  G.meterSeconds = function (f) {
    const c = G.GEN_VERSION >= 7 && M.v7 ? Object.assign({}, M, M.v7) : M; // v7: coeficientes propios; v6 IDÉNTICO
    return Math.max(c.minSeconds, Math.round(c.base + c.perTopic * f.topics + c.perChat * (f.chats || 0) + c.perStep * f.steps + c.perCurio * (f.curios || 0) + c.perRoom * f.rooms + c.perPuzzleCode * (f.puzCode || 0) + c.perPuzzleLine * (f.puzLine || 0)));
  };

  G.meterCase = function (def, opts) {
    opts = opts || {};
    const f = G.meterFeatures(def);
    const humanSeconds = G.meterSeconds(f);
    const humanMinutes = Math.round(humanSeconds / 6) / 10;
    // par y recompensa por caso (ya no 600/100 fijos)
    const lo = Math.ceil(humanSeconds * M.parRange[0] / M.parRound) * M.parRound, hi = Math.floor(humanSeconds * M.parRange[1] / M.parRound) * M.parRound;
    const parSeconds = Math.max(lo, Math.min(hi, Math.round(humanSeconds * M.parFactor / M.parRound) * M.parRound));
    const level = def.level || 1;
    const reward = Math.round((M.rewardBase + humanMinutes * M.rewardPerMin + level * M.rewardPerLevel) / M.rewardRound) * M.rewardRound;
    // nota estimada: 60 % equidad (la del revisor, si se pasa; si no, 100) + 40 % jugabilidad (solo penalización por duración)
    const LV = G.GEN_VERSION >= 6 && def.genLevel && G.GEN_DATA && G.GEN_DATA.compile && G.GEN_DATA.compile.levels && G.GEN_DATA.compile.levels[def.genLevel]; // 3-bis 2/3: rango del nivel del caso (solapado)
    const DV = G.GEN_VERSION >= 7 && def.genLevel && G.GEN_DATA && G.GEN_DATA.compile && G.GEN_DATA.compile.durationV7 && G.GEN_DATA.compile.durationV7.levels[def.genLevel]; // TIEMPOS-2: con v7 la franja es la oficial por nivel
    const bd = DV ? DV.range : LV ? LV[(G.QUALITY_CFG && G.QUALITY_CFG.scale) || 'today'].range : M.band;
    const out = humanMinutes < bd[0] ? bd[0] - humanMinutes : humanMinutes > bd[1] ? humanMinutes - bd[1] : 0;
    const play = Math.max(0, 100 - M.playOffset - Math.min(M.maxDurPenalty, Math.round(out * M.perMinute))); // playOffset: avisos medios del bot (capítulos, paseo, ayuda), medidos en 200 semillas
    const fairness = typeof opts.fairness === 'number' ? opts.fairness : 100;
    const quality = Math.round(M.wFair * fairness + M.wPlay * play);
    const g = M.goals;
    const goals = { minutes: humanMinutes >= g.minutes, quality: quality > g.quality, play: play >= g.play };
    const fails = [];
    if (!goals.minutes) fails.push(`dura ~${humanMinutes} min (meta ≥ ${g.minutes})`);
    if (!goals.quality) fails.push(`nota estimada ${quality} (meta > ${g.quality})`);
    if (!goals.play) fails.push(`jugabilidad estimada ${play} (meta ≥ ${g.play})`);
    return {
      humanSeconds, humanMinutes, features: f, parSeconds, reward, quality, play, fairness, goals, ok: fails.length === 0,
      reparto: G.workShare ? (() => { const w = G.workShare(def); return { oliNum: w.share.num, oliTime: w.share.time, trabajo: w.share.work, fueraDeBanda: G.workIssues(def).length }; })() : null, // A4 4/4 subpaso 3: reparto EQ-1 del caso (solo informa; lo exige el revisor)
      report: fails.length ? 'Fuera de meta: ' + fails.join('; ') + '.' : `En meta: ~${humanMinutes} min, nota ~${quality}, jugabilidad ~${play}.`,
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
