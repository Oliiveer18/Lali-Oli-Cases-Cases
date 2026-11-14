// bot.js — BOT DE RECORRIDO · parte 2B-1 (fábrica de casos, fase 2)
// G.botPlay(def, opts) → un jugador virtual juega el caso entero SIN pantalla, andando de verdad con el A* del
// compañero (G.findPath) por los mapas, usando la misma ayuda del juego (CaseState.nextAction) y, si se queda sin
// ideas, un barrido de «probarlo todo» (charlar, presionar, enseñar pruebas...). Mide el tiempo: andar, leer, trabajar.
// Devuelve { ok, finished, win, botSeconds, humanSeconds, perChapter, stuck, ... }. No juzga la calidad (eso es 2B-2).
// Límite conocido: recorrido en serie (un solo cuerpo). Con dos jugadores reales el tiempo baja; humanSeconds es
// una estimación provisional (botSeconds × humanFactor) que se calibrará con partidas reales.
(function (root) {
  'use strict';
  const G = root.G, TS = G.TS;
  G.BOT_VERSION = 1;
  const CFG = G.BOT_CFG = {
    speed: 74 * 2.6,          // px/s del jugador sin mejoras (igual que world.js)
    cps: 17, minLine: 1.4,    // lectura: caracteres por segundo y mínimo por línea
    talk: 1.2, transition: 0.6, equip: 1.0, board: 45,
    mini: { code: 25, timeline: 30 },
    humanFactor: 1.7, maxActions: 700,
  };
  const fmt = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

  G.botPlay = function (def, opts) {
    try { return inner(def, opts || {}); } catch (e) { return base({ reason: 'error', msg: 'Error interno del bot: ' + (e && e.message ? e.message : e) }); }
  };
  const base = (o) => Object.assign({ ok: false, finished: false, win: false, botSeconds: 0, humanSeconds: 0, minutes: 0, humanMinutes: 0, actions: 0, perChapter: [], stuck: null, log: [], stats: {} }, o);

  const inner = function (def, opts) {
    const v = G.validateCase(def);
    if (!v.ok) return base({ reason: 'invalido', msg: 'El caso no pasa el validador: ' + v.errors[0] });
    const st = new G.CaseState(def, opts.difficulty || 'normal');
    const lastCh = def.chapters.length, sol = def.solution;
    const R = { room: def.start.room, x: def.start.p1[0], y: def.start.p1[1] };
    let t = 0, walk = 0, read = 0, work = 0, actions = 0, lastTool = null, fallbacks = 0, stealthWait = 0;
    // A4 4/4 subpaso 3: reparto del trabajo con herramienta que el bot HACE de verdad (informa, no cambia tiempos): por detective (G.toolOwner) y «coop» aparte; n = acciones, s = segundos de la acción.
    const workBy = { rex: { n: 0, s: 0 }, luna: { n: 0, s: 0 }, coop: { n: 0, s: 0 } };
    const evs = [];   // A4 4/4-4 (EQ-7): eventos {ch, who, t0, t1, fill} para G.idleOf (el relleno cur_/f_ch también ocupa a quien lo hace, pero no cuenta como acción propia) (no cambia ningún tiempo)
    const ev = (who, t0, fill) => { evs.push({ ch: curCh, who, t0, t1: t, fill: !!fill }); };
    const credit = (tool, dur) => { const w = !tool ? null : tool === 'coop' ? 'coop' : G.toolOwner(tool, def); if (w && workBy[w]) { workBy[w].n++; workBy[w].s += dur; } };
    const log = [], per = [], tried = {};
    let chT = 0, chA = 0;
    const say = (m) => { if (log.length < 500) log.push(`${fmt(t)} ${m}`); };

    // ---------- lectura
    const lineLen = (l) => (typeof l === 'string' ? l : l && l.text ? l.text : '').length;
    // 4F-0a/4: las monedas sueltas son un EXTRA: su frase no cuenta en el tiempo ni en la nota (el caso mide igual con y sin ellas)
    const coinLines = ((G.GEN_DATA && G.GEN_DATA.compile && G.GEN_DATA.compile.extra && G.GEN_DATA.compile.extra.coins) || { lines: [], amount: 0 });
    const coinFreeText = (step) => { let x = step.text || ''; if (step.fx && step.fx.money) coinLines.lines.forEach((l) => { x = x.split(' ' + l.replace('{n}', coinLines.amount)).join(''); }); return x; };
    const reading = (lines) => { let s = 0; (lines || []).forEach((l) => { s += Math.max(CFG.minLine, lineLen(l) / CFG.cps); }); t += s; read += s; };

    // ---------- mapa de cada sala (igual que Room: paredes + objetos sólidos visibles)
    const world = (rid) => {
      const rd = def.rooms[rid], map = rd.map, h = map.length, w = map[0].length;
      const solid = map.map((row) => row.split('').map((c) => c === '#'));
      rd.props.forEach((p) => {
        if (!p.solid || !st.propVisible(p)) return;
        const mv = st.moved[p.id] || { dx: 0, dy: 0 };
        for (let yy = 0; yy < (p.h || 1); yy++) for (let xx = 0; xx < (p.w || 1); xx++) { const yv = p.y + mv.dy + yy, xv = p.x + mv.dx + xx; if (solid[yv] && solid[yv][xv] !== undefined) solid[yv][xv] = true; }
      });
      const npcs = [];
      Object.keys(def.npcs).forEach((nid) => { const pl = st.placementOf(nid); if (pl && pl.room === rid && !def.npcs[nid].cat) npcs.push({ x: (pl.x + 0.5) * TS, y: (pl.y + 1) * TS - 6 }); });
      return { room: { w, h, isSolidTile: (x, y) => x < 0 || y < 0 || x >= w || y >= h || solid[y][x] }, npcsHere: () => npcs };
    };
    const partner = (d) => def.rooms[d.to.room].doors.find((x) => x.id === d.to.door);
    const doorState = (d) => (!d.locked || st.flags['unlocked_' + d.id] ? 'open' : st.chapter < (d.locked.chapterMin || 1) ? 'wait' : !d.locked.tool ? 'auto' : 'tool');

    // ---------- andar
    const walkTile = (tx, ty) => {
      const p = G.findPath(world(R.room), R.x, R.y, tx, ty, 6000);
      if (!p) return false;
      let px = (R.x + 0.5) * TS, py = (R.y + 1) * TS - 6, d = 0;
      p.forEach((q) => { d += Math.hypot(q.x - px, q.y - py); px = q.x; py = q.y; });
      const s = d / CFG.speed; t += s; walk += s;
      if (p.length) { const e = p[p.length - 1]; R.x = Math.floor(e.x / TS); R.y = Math.round((e.y + 6) / TS) - 1; }
      return true;
    };
    const route = (from, to) => {
      const prev = { [from]: null }, q = [from];
      while (q.length) {
        const r = q.shift();
        if (r === to) break;
        def.rooms[r].doors.forEach((d) => { if (doorState(d) !== 'wait' && !(d.to.room in prev)) { prev[d.to.room] = { r, d }; q.push(d.to.room); } });
      }
      if (!(to in prev)) return null;
      const out = [];
      for (let r = to; prev[r]; r = prev[r].r) out.unshift(prev[r].d);
      return out;
    };
    const useTool = (tool) => { if (tool && tool !== lastTool) { t += CFG.equip; work += CFG.equip; lastTool = tool; } };
    const useDoor = (d) => {
      const ins = G.doorInside(d);
      if (!walkTile(ins.x, ins.y)) return false;
      const s = doorState(d);
      if (s === 'wait') return false;
      const ta = t;
      if (s === 'auto') { t += 0.8; work += 0.8; st.setFlag('unlocked_' + d.id); ev('both', ta, false); }
      if (s === 'tool') { useTool(d.locked.tool); const dur = d.locked.time || (G.TOOLS[d.locked.tool] ? G.TOOLS[d.locked.tool].time : 1); t += dur; work += dur; credit(d.locked.tool, dur); reading([d.locked.text].filter(Boolean)); st.setFlag('unlocked_' + d.id); ev(d.locked.tool === 'coop' ? 'both' : G.toolOwner(d.locked.tool, def) || 'both', ta, false); }
      t += CFG.transition;
      const back = partner(d), i2 = G.doorInside(back);
      R.room = d.to.room; R.x = i2.x; R.y = i2.y;
      if (d.firstOpen) { reading([d.firstOpen.text]); if (d.firstOpen.clue) st.addClue(d.firstOpen.clue, d.id); }
      say(`puerta → ${def.rooms[R.room].name}`);
      return true;
    };
    const goTo = (rid, x, y) => {
      if (R.room !== rid) { const rt = route(R.room, rid); if (!rt) return false; for (const d of rt) if (!useDoor(d)) return false; }
      return walkTile(x, y);
    };

    // ---------- estado y capítulos
    const sig = () => st.clueOrder.length + '|' + Object.keys(st.flags).length + '|' + st.chapter + '|' + JSON.stringify(st.progress) + '|' + Object.keys(st.asked).length + '|' + Object.keys(st.shown).length + '|' + Object.keys(st.npc).map((k) => st.npc[k].trust + '.' + st.npc[k].pressure).join(',');
    // 4D-2: el estado avanza de capítulo POR DENTRO (startTalk, ask, acusar llaman a checkAdvance), así que aquí checkAdvance casi nunca devuelve true y todo el tiempo
    // se apuntaba al último capítulo («el capítulo 2 se lleva el 100 %» era un fallo de MEDICIÓN, no del caso). Ahora se compara con el capítulo que el bot tenía apuntado.
    let curCh = 1;
    // 4D-2 (cierre): el relleno OPCIONAL (curiosidades cur_* y charlas de detalle f_ch*) no cuenta en el reparto del tiempo por capítulo: solo la historia.
    // Su tiempo (andar hasta él incluido) se anota aparte en `fillSeconds` de cada capítulo; el tiempo total del caso no cambia.
    let fillAcc = 0, fillAll = 0;
    const isFill = (id) => /^(cur_|f_ch)/.test(id || '');
    const closeChapter = (ch) => {
      per.push({ chapter: ch, title: def.chapters[ch - 1].title, seconds: Math.round(t - chT - fillAcc), fillSeconds: Math.round(fillAcc), actions: chA });
      fillAll += fillAcc; fillAcc = 0;
    };
    const tick = () => {
      st.time = t;
      for (;;) {
        const adv = st.checkAdvance();
        if (!adv && st.chapter <= curCh) break;
        const from = curCh;
        curCh = from + 1;
        closeChapter(from);
        chT = t; chA = 0;
        const c = def.chapters[from - 1], n = def.chapters[curCh - 1];
        reading([].concat(c.outro || [], n.intro || []));
        say(`capítulo ${from} completado`);
      }
    };

    // ---------- acciones
    const doProp = (c) => {
      const p = def.rooms[c.room].props.find((x) => x.id === c.id);
      if (!p || !p.steps || st.propDone(p) || !st.propVisible(p)) return false;
      const t0 = t;
      const step = st.propStep(p);
      if ((p.chapterMin && st.chapter < p.chapterMin) || (step.requires && !G.evalCond(step.requires, st, null))) return false;
      if (!goTo(c.room, p.x, p.y)) return false;
      const ta = t;
      useTool(step.tool);
      const base = step.time || (step.tool && G.TOOLS[step.tool] ? G.TOOLS[step.tool].time : 0.55);
      const dur = Math.max(0.35, base) + (step.mini ? CFG.mini[step.mini.type] || 25 : 0);
      // sigilo (4C-2b): si un vigilante mira durante la acción, el jugador espera a que empiece su ventana segura (la acción se cancelaría si lo pillan)
      if (p.watcher && step.tool !== 'coop' && st.diff && st.diff.id !== 'easy') {
        const wc = G.watchConfig(def, p.watcher); let w = 0;
        while (w < 60) { let bad = false; for (let k = 0; k <= dur + 0.001; k += 0.1) if (G.watchLooking(wc, st.diff.id, t + w + k)) { bad = true; break; } if (!bad) break; w += 0.1; }
        if (w > 0) { t += w; work += w; stealthWait += w; }
      }
      t += dur; work += dur; credit(step.tool, dur); reading([coinFreeText(step)]);
      ev(step.tool === 'coop' ? 'both' : step.tool ? G.toolOwner(step.tool, def) || 'both' : (step.who === 'rex' || step.who === 'luna' ? step.who : 'both'), ta, isFill(p.id));
      st.progress[p.id] = (st.progress[p.id] || 0) + 1;
      const fx = step.fx;
      if (fx && fx.flag) st.setFlag(fx.flag);
      if (fx && fx.moveProp) { const mv = st.moved[fx.moveProp.id] || { dx: 0, dy: 0 }; mv.dx += fx.moveProp.dx; mv.dy += fx.moveProp.dy; st.moved[fx.moveProp.id] = mv; }
      if (step.clue) st.addClue(step.clue, p.id);
      say(`examina ${p.label || p.id}${step.clue ? ' → ' + step.clue : ''}`);
      if (isFill(p.id)) fillAcc += t - t0;
      return true;
    };
    const doDoor = (c) => {
      const d = def.rooms[c.room].doors.find((x) => x.id === c.id);
      if (!d) return false;
      if (R.room !== c.room && !goTo(c.room, G.doorInside(d).x, G.doorInside(d).y)) return false;
      const s = doorState(d);
      if (s === 'wait' || (s === 'open' && !(d.firstOpen && !st.hasClue(d.firstOpen.clue)))) return false;
      return useDoor(d);
    };
    const talkOut = (out) => { t += CFG.talk; reading(out && out.lines); };
    const doNpc = (c) => {
      const nid = c.id, nd = def.npcs[nid], pl = st.placementOf(nid), t0 = t;
      if (!pl || !st.roomAccessible(pl.room)) return false;
      if (!goTo(pl.room, pl.x, pl.y)) return false;
      if (st.isLocked(nid)) { const w = st.lockLeft(nid); t += w; st.time = t; }
      const ta = t, fl = isFill(c.id);
      let what = c.act;
      if (!st.flags['talked_' + nid]) { talkOut(st.startTalk(nid)); say(`habla con ${nd.name}`); ev('both', ta, fl); return true; }
      if (!what) what = c.clue ? 'present' : st.topicsFor(nid).some((x) => !x.seen) ? 'ask' : 'chat';
      if (what === 'present') { const out = st.present(nid, c.clue); talkOut(out); say(`enseña ${c.clue} a ${nd.name}${out.objection ? ' ¡PROTESTO!' : ''}`); ev('both', ta, fl); return true; }
      if (what === 'ask') { const tp = st.topicsFor(nid).find((x) => !x.seen); if (!tp) return false; talkOut(st.ask(nid, tp.id)); say(`pregunta a ${nd.name}: ${tp.label}`); if (isFill(tp.id)) fillAcc += t - t0; ev('both', ta, isFill(tp.id)); return true; }
      if (what === 'chat') { talkOut(st.chat(nid)); say(`charla con ${nd.name}`); ev('both', ta, fl); return true; }
      if (what === 'press') { talkOut(st.press(nid)); say(`presiona a ${nd.name}`); ev('both', ta, fl); return true; }
      return false;
    };
    const run = (c) => (c.kind === 'prop' ? doProp(c) : c.kind === 'door' ? doDoor(c) : c.kind === 'npc' ? doNpc(c) : false);

    // ---------- barrido «probarlo todo» (cuando la ayuda del juego no da más de sí)
    const sweepList = () => {
      const L = [];
      Object.keys(def.rooms).forEach((rid) => {
        if (!st.roomAccessible(rid)) return;
        def.rooms[rid].props.forEach((p) => { if (p.steps && !st.propDone(p)) L.push({ kind: 'prop', room: rid, id: p.id }); });
        def.rooms[rid].doors.forEach((d) => L.push({ kind: 'door', room: rid, id: d.id }));
      });
      Object.keys(def.npcs).forEach((nid) => {
        const nd = def.npcs[nid], pl = st.placementOf(nid);
        if (!pl || !st.roomAccessible(pl.room) || nd.cat) return;
        L.push({ kind: 'npc', room: pl.room, id: nid, act: 'ask' });
        st.clueOrder.forEach((cl) => { if (!st.shown[nid + ':' + cl]) L.push({ kind: 'npc', room: pl.room, id: nid, act: 'present', clue: cl }); });
        if (st.npc[nid].trust < 6) L.push({ kind: 'npc', room: pl.room, id: nid, act: 'chat' });
        if (st.npc[nid].presses < 3) L.push({ kind: 'npc', room: pl.room, id: nid, act: 'press' });
      });
      L.sort((a, b) => (a.room === R.room ? 0 : 1) - (b.room === R.room ? 0 : 1));
      return L;
    };
    const attempt = (c) => {
      const key = c.kind + ':' + c.room + ':' + c.id + ':' + (c.act || '') + ':' + (c.clue || ''), s0 = sig();
      if (tried[key] === s0) return false;
      tried[key] = s0;
      const ok = run(c);
      return ok && sig() !== s0;
    };

    // ---------- bucle principal
    say('empieza el caso en ' + def.rooms[R.room].name);
    let result = null;
    while (actions < CFG.maxActions) {
      tick();
      const na = st.nextAction();
      // CL-3 (v7): con opts.early el bot acusa EN CUANTO tiene las pistas de las razones verdaderas del nivel (cifra informativa «cuándo se podría acusar»)
      const early = !!(opts.early && st.isV7() && (() => { const o = st.boardOptions(); const has = (x) => (x.needs || []).length && x.needs.every((c) => st.hasClue(c));
        return (!o.motive || sol.motives.some((m) => m.id === sol.motive && has(m))) && (!o.method || sol.methods.some((m) => m.id === sol.method && has(m))); })());
      if ((na && na.kind === 'accuse') || early) {
        t += CFG.board;
        const held = sol.proof.filter((c) => st.hasClue(c));
        const top = st.topSuspect();
        // FIX-3d: opts.failFirst = k → antes de acertar, falla k veces acusando a inocentes interrogados (con método/motivo equivocados)
        const fails = [];
        for (let k = 0; k < (opts.failFirst || 0) && !st.failed; k++) {
          const inn = st.accuseList().filter((x) => x.ok && x.s.id !== sol.culprit)[0];
          if (!inn) break;
          const w = st.accuse({ culprit: inn.s.id, method: sol.method, motive: sol.motive, proof: held.slice(0, 3) });
          fails.push({ blocked: !!w.blocked, offended: w.offended || null, left: w.strikesLeft, cut: w.cut, failed: !!w.failed });
          t += CFG.board;
          if (w.offended && st.isOffended(w.offended)) {   // el ofendido no da pistas nuevas mientras dure la ofensa
            const nd = def.npcs[w.offended], tp = nd && nd.topics && nd.topics[0], n0 = st.clueCount();
            if (tp) { const rr = st.ask(w.offended, tp.id); fails[fails.length - 1].offendedReply = !!(rr && rr.offended); fails[fails.length - 1].newClues = st.clueCount() - n0; }
          }
          if (w.failed) break;
        }
        if (st.failed) { result = { win: false, failedOut: true, fails, wrong: st.wrong, reward: st.reward() }; say('sin intentos'); break; }
        let r = st.accuse({ culprit: sol.culprit, method: sol.method, motive: sol.motive, proof: held.slice(0, 3) });
        if (r.blocked) { st.startTalk(sol.culprit); r = st.accuse({ culprit: sol.culprit, method: sol.method, motive: sol.motive, proof: held.slice(0, 3) }); }
        tick();
        say('acusa → ' + (r.ok ? 'CASO RESUELTO' : 'fallo ' + JSON.stringify(r)));
        result = { win: !!r.ok, early, earlySeconds: early ? Math.round(t) : null, topSuspectIsCulprit: top === sol.culprit, proofHeld: held.length, fails, wrong: st.wrong, reward: st.reward() };
        break;
      }
      let changed = false;
      if (na && (na.kind === 'prop' || na.kind === 'door' || na.kind === 'npc')) changed = attempt({ kind: na.kind, room: na.room, id: na.id, clue: na.clue });
      if (!changed) { const list = sweepList(); for (const c of list) { if (attempt(c)) { changed = true; fallbacks++; break; } } }
      if (!changed) break;
      actions++; chA++;
    }
    tick();
    const total = Math.round(t);
    closeChapter(curCh);
    const goalsLeft = st.chapterDef().goals.filter((g) => !st.goalDone(g)).map((g) => g.text);
    const stuck = result ? null : { chapter: st.chapter, goals: goalsLeft, msg: actions >= CFG.maxActions ? 'el bot superó el máximo de acciones' : `el bot no encuentra nada más que hacer en el capítulo ${st.chapter} (falta: ${goalsLeft.join(' · ') || '—'})` };
    return base({
      ok: !!(result && result.win), finished: !!result, win: !!(result && result.win), reason: result ? (result.win ? 'resuelto' : 'acusacion_fallida') : 'atasco',
      botSeconds: total, humanSeconds: Math.round(t * CFG.humanFactor), minutes: Math.round(t / 6) / 10, humanMinutes: Math.round(t * CFG.humanFactor / 6) / 10,
      actions, perChapter: per, stuck, log,
      early: !!(result && result.early), earlySeconds: result && result.earlySeconds != null ? result.earlySeconds : null, // CL-3: acusación temprana (v7, opts.early)
      fails: result ? (result.fails || []) : [], wrong: result ? (result.wrong || 0) : 0, reward: result && result.reward !== undefined ? result.reward : null,
      stats: { fillSeconds: Math.round(fillAll), walkSeconds: Math.round(walk), readSeconds: Math.round(read), workSeconds: Math.round(work), workBy: { rex: { n: workBy.rex.n, s: Math.round(workBy.rex.s * 10) / 10 }, luna: { n: workBy.luna.n, s: Math.round(workBy.luna.s * 10) / 10 }, coop: { n: workBy.coop.n, s: Math.round(workBy.coop.s * 10) / 10 } }, stealthWait: Math.round(stealthWait), idle: G.idleOf(evs, def.chapters.length, G.idleChapters(def)), fallbackActions: fallbacks, clues: st.clueOrder.length, cluesTotal: Object.keys(def.clues).length, topSuspectIsCulprit: result ? result.topSuspectIsCulprit : null, proofHeld: result ? result.proofHeld : null },
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
