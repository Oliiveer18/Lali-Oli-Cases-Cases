// Prueba del COMPAÑERO IA CON INICIATIVA (A5 IA-1, v0.7.56). Uso: node test_companion.js
// Demuestra (sin navegador, con el mundo real): (1) los datos y los avisos de la IA (`G.AI_INIT`, `G.AI_LINES`, `G.aiLine`): cada herramienta y cada tono
// tienen sus frases, nunca nombran sospechosos y se eligen de forma determinista; (2) QUÉ objetos puede hacer la IA por su cuenta (`aiCandidates`, comparado con un
// oráculo escrito aquí): solo SU herramienta, nada «coop», nada de marcas UV sin iluminar, nada de charlas que no suenan, nada de capítulos futuros, nada de lo que el
// jugador hace, enfoca o tiene cerca, nada mientras hay un trabajo en equipo; (3) CÓMO decide (`aiInit`): espera antes de ofrecerse, descansa entre tareas, elige el más
// cercano, aparta 40 s una tarea fallida (y solo las suyas, no las que pidió el jugador) y avisa al ir y al acabar; (4) partidas simuladas con el jugador parado
// (3 niveles, capítulos 1 y 2): la IA hace casi todo lo que puede ver, respeta la espera, el descanso y el sigilo, y NUNCA habla con sospechosos, enseña pruebas ni acusa;
// el resultado es el mismo con la misma semilla; (5) MUTACIONES: roturas del código de `companion.js` que la prueba DEBE detectar.
const loadG = require('./tools/load_g.js');
const EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
const LV = [['easy', 'facil'], ['normal', 'normal'], ['hard', 'dificil']];
const STEP = 0.05;

// Todas las comprobaciones viven en suite(G, o): devuelve los fallos (sin repetir) y estadísticas. Con el motor real debe dar 0; con motores rotos, > 0.
function suite(G, o) {
  o = o || {};
  const fails = [];
  let checks = 0;
  const ok = (c, m) => { checks++; if (!c && fails.indexOf(m) < 0) fails.push(m); };
  const TS = G.TS, I = G.AI_INIT, A = G.AI_LINES;
  const S = { starts: 0, watched: 0, doable: 0, doableDone: 0, roomsDo: 0, roomsAct: 0, spotted: 0, lv: {}, log: [] };
  LV.forEach(([d]) => { S.lv[d] = { starts: 0, doable: 0, doableDone: 0, first: [] }; });

  // azar fijo: la prueba es reproducible y los avisos aleatorios del caso 1 no cambian nada
  const oldRandom = Math.random;
  let seed = 20261023;
  Math.random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  try {
    run();
  } finally { Math.random = oldRandom; }
  return { fails, checks, S };

  function run() {
    const gen = (i, lvl) => G.generateCase(i * 7919 + 1, { level: lvl }).def;
    const mk = (def, diff, room, chapter) => {
      const st = new G.CaseState(def, diff), w = new G.World(st, { mode: 'solo' });
      st.chapter = chapter || 2; w.enterRoom(room); w.onChapter(); w.out.length = 0;
      const ai = w.players[1 - w.human], lead = w.players[w.human];
      lead.x = -6000; lead.y = -6000; // el jugador, lejos de todo
      return { st, w, ai, lead, def, diff, room };
    };
    const keysOf = (list) => list.map((c) => c.p.key).sort().join(',');
    const oracle = (c) => {
      const { st, w, ai } = c, out = [];
      w.room.props.forEach((p) => {
        if (!p.steps) return;
        const info = w.propStepInfo(p);
        if (!info || info.done) return;
        if (p.chapterMin && st.chapter < p.chapterMin) return;
        const s = info.step;
        if (!s.tool || s.tool === 'coop' || ai.tools.indexOf(s.tool) < 0) return;
        if (p.uvOnly && !w.revealed(p)) return;
        if (p.chat && !w.chatReady(p)) return;
        out.push(p.key);
      });
      return out.sort().join(',');
    };

    // ============================================================ 1) datos y avisos
    ok(I && I.wait && I.wait.easy >= 8 && I.wait.easy < I.wait.normal && I.wait.normal < I.wait.hard, 'la espera inicial sube con la dificultad y deja siempre la primera oportunidad al jugador (≥ 8 s)');
    ok(I && I.cool >= 4 && I.near >= 40 && I.blackSecs >= 20, 'descanso (≥ 4 s), distancia al jugador (≥ 40 px) y castigo de una tarea fallida (≥ 20 s) razonables');
    const TOOLS = ['lupa', 'ganzua', 'uv', 'grabadora'], TONES = ['noir', 'telenovela', 'documental', 'western', 'espias', 'cuento'];
    TOOLS.forEach((t) => {
      ok(A.start[t] && A.start[t].length >= 3, `3 avisos al ir con ${t}`);
      ok(A.done[t] && A.done[t].length >= 3, `3 avisos al acabar con ${t}`);
    });
    TONES.forEach((t) => ok(A.tone[t] && A.tone[t].length >= 2, `2 avisos de remate para el tono ${t}`));
    ok(A.open && A.open.length >= 2, '2 avisos neutros para un paso sin pista');
    const pools = [];
    TOOLS.forEach((t) => { (A.start[t] || []).forEach((s) => pools.push([s, true])); (A.done[t] || []).forEach((s) => pools.push([s, true])); });
    (A.open || []).forEach((s) => pools.push([s, false]));
    TONES.forEach((t) => (A.tone[t] || []).forEach((s) => pools.push([s, false])));
    pools.forEach(([s, needsObj]) => {
      ok(typeof s === 'string' && s.length >= 12 && s.length <= 110, 'cada aviso es un texto corto (12-110 caracteres)');
      ok(!/culpable|asesin|ladr[oó]n|sospechos|inocente|fue (él|ella)\b/i.test(s), 'ningún aviso de la IA acusa, nombra sospechosos ni revela al culpable');
      ok(!needsObj || /\{obj\}/.test(s), 'los avisos de ir y de acabar nombran el objeto');
    });
    // aiLine con casos reales
    const toneSeen = {};
    let nLines = 0;
    const variety = {};
    for (let i = 0; i < 14; i++) {
      const def = gen(i, LV[i % 3][1]);
      if (def.tone) toneSeen[def.tone] = true;
      Object.keys(def.rooms).forEach((rn) => {
        const c = mk(def, LV[i % 3][0], rn, 2);
        c.w.room.props.forEach((p) => {
          if (!p.steps) return;
          p.steps.forEach((s) => {
            if (!s.tool || s.tool === 'coop') return;
            const fill = (x) => x.replace(/\{obj\}/g, String(p.label || 'esto').toLowerCase());
            const st = G.aiLine('start', s.tool, def, p), st2 = G.aiLine('start', s.tool, def, p);
            const dn = G.aiLine('done', s.tool, def, p, true), dn2 = G.aiLine('done', s.tool, def, p, true), op = G.aiLine('done', s.tool, def, p, false);
            nLines++;
            ok(st === st2 && dn === dn2, 'el aviso es determinista (mismo caso y objeto → mismo aviso)');
            ok(typeof st === 'string' && typeof dn === 'string' && typeof op === 'string' && !/[{}]/.test(st + dn + op), 'los avisos se rellenan sin dejar llaves');
            ok((A.start[s.tool] || []).map(fill).indexOf(st) >= 0, 'el aviso de ir sale del grupo de su herramienta');
            ok(((A.done[s.tool] || []).concat(A.tone[def.tone] || [])).map(fill).indexOf(dn) >= 0, 'el aviso de acabar con pista sale de su herramienta o de su tono');
            ok((A.open || []).map(fill).indexOf(op) >= 0, 'sin pista el aviso de acabar es neutro');
            ok(String(p.label || '').length === 0 || st.indexOf(String(p.label).toLowerCase()) >= 0, 'el aviso nombra el objeto');
            variety[s.tool] = variety[s.tool] || {}; variety[s.tool][st] = true; variety[s.tool][dn] = true;
          });
        });
      });
    }
    ok(nLines > 20, 'se probaron avisos de al menos 20 pasos reales');
    ok(Object.keys(variety).every((t) => Object.keys(variety[t]).length >= 3), 'cada herramienta usa al menos 3 avisos distintos en casos reales');
    ok(Object.keys(toneSeen).length >= 1 && Object.keys(toneSeen).every((t) => A.tone[t] && A.tone[t].length >= 2), 'todos los tonos de los casos generados tienen avisos propios');

    // ============================================================ 2) qué puede hacer la IA (aiCandidates contra el oráculo)
    const cover = { coop: 0, hiddenUV: 0, chat: 0, chapterMin: 0, otherTool: 0, withCand: 0 };
    const withCand = [], multi = [];
    for (let i = 0; i < 24; i++) {
      const [diff, lvl] = LV[i % 3];
      const def = gen(i, lvl);
      Object.keys(def.rooms).forEach((rn) => {
        [1, 2].forEach((chap) => {
          const c = mk(def, diff, rn, chap);
          const { w, ai, lead } = c;
          w.room.props.forEach((p) => {
            if (!p.steps) return;
            const info = w.propStepInfo(p);
            if (!info || info.done) return;
            const s = info.step;
            if (s.tool === 'coop') cover.coop++;
            else if (s.tool && ai.tools.indexOf(s.tool) < 0) cover.otherTool++;
            if (p.chat) cover.chat++;
            if (p.chapterMin && chap < p.chapterMin) cover.chapterMin++;
          });
          const got = keysOf(w.aiCandidates(ai, lead));
          ok(got === oracle(c), 'aiCandidates da exactamente lo que la IA puede hacer (su herramienta, visible, del capítulo, sin coop, sin UV oculta, sin charla muda)');
          // todo a la vista (como cuando el jugador ya abrió el cajón de la cadena): la UV sin iluminar sigue sin verla
          const cv = mk(def, diff, rn, chap);
          cv.w.propVisible = () => true;
          cv.w.room.props.forEach((p) => { if (!p.steps) return; const info = cv.w.propStepInfo(p); if (info && !info.done && p.uvOnly && !cv.w.revealed(p)) cover.hiddenUV++; });
          ok(keysOf(cv.w.aiCandidates(cv.ai, cv.lead)) === oracle(cv), 'con todo a la vista la IA sigue sin ver las marcas UV que no ha iluminado');
          // un trabajo en equipo en marcha: la IA no se ofrece a nada
          w.coopWork = { fake: true };
          ok(w.aiCandidates(ai, lead).length === 0, 'mientras hay un trabajo en equipo la IA no se ofrece a nada');
          w.coopWork = null;
          // charlas: si uno de los dos personajes no está, no hay charla que grabar
          w.room.props.forEach((p) => {
            if (!p.chat) return;
            const na = w.npcs[p.chat.a], old = na.room;
            na.room = '__fuera';
            ok(got === '' || keysOf(w.aiCandidates(ai, lead)).split(',').indexOf(p.key) < 0, 'la IA no va a grabar una charla que no suena (falta uno de los dos)');
            ok(oracle(c) === keysOf(w.aiCandidates(ai, lead)), 'sin charla audible, la IA y el oráculo coinciden');
            na.room = old;
          });
          if (got) { cover.withCand++; withCand.push(c); if (got.indexOf(',') >= 0) multi.push(c); }
        });
      });
    }
    ok(cover.coop > 0 && cover.hiddenUV > 0 && cover.chat > 0 && cover.chapterMin > 0 && cover.otherTool > 0 && cover.withCand >= 20, 'los casos de prueba tienen objetos coop, UV oculta, charlas, capítulos futuros, herramientas del jugador y objetos para la IA');

    // ============================================================ 3) lo del jugador es del jugador
    withCand.slice(0, 14).forEach((c) => {
      const { w, ai, lead } = c;
      const first = w.aiCandidates(ai, lead)[0].p, cc = { x: (first.x + first.w / 2) * TS, y: (first.y + first.h / 2) * TS };
      const has = () => w.aiCandidates(ai, lead).some((q) => q.p === first);
      lead.x = cc.x; lead.y = cc.y + 4;
      ok(!has(), 'la IA deja el objeto que tiene el jugador al lado (menos de 70 px)');
      lead.x = (first.x + first.w) * TS + I.near + 40; lead.y = cc.y;
      ok(has(), 'a más de 70 px el objeto vuelve a estar a disposición de la IA');
      lead.work = { target: first };
      ok(!has(), 'la IA no se pone con lo que el jugador está haciendo');
      lead.work = null; lead.focus = { p: first };
      ok(!has(), 'la IA no se pone con lo que el jugador tiene en foco');
      lead.focus = null; lead.x = lead.y = -6000;
    });

    // ============================================================ 4) cómo decide (aiInit): espera, descanso, el más cercano, castigo y avisos
    const dist = (ai, p) => G.dist(ai.x, ai.y, (p.x + p.w / 2) * TS, (p.y + p.h / 2) * TS);
    const mature = (c) => { c.w.aiCandidates(c.ai, c.lead).forEach((q) => { c.w.aiCand[q.p.key] = c.w.time - 1000; }); };
    withCand.slice(0, 10).forEach((c) => {
      const { w, ai, lead, def } = c;
      // espera: un objeto recién visto no se hace todavía
      w.time = 500; w.aiLast = 0; w.aiCand = {}; ai.task = null;
      ok(w.aiInit(ai, lead) === false && !ai.task, 'la IA espera antes de ofrecerse: un objeto recién visto no se hace todavía');
      // descanso
      mature(c); w.aiLast = w.time - 1;
      ok(w.aiInit(ai, lead) === false && !ai.task, 'la IA descansa tras cada tarea: no empieza otra enseguida');
      // empieza la tarea con aviso
      w.aiLast = w.time - 1000; w.aiSayCool = 0; ai.bubble = null;
      const before = w.aiCandidates(ai, lead);
      const near = before.slice().sort((a, b) => dist(ai, a.p) - dist(ai, b.p))[0];
      ok(w.aiInit(ai, lead) === true && ai.task && ai.task.init === true && ai.task.kind === 'prop' && !ai.task.coop, 'pasada la espera y el descanso la IA se pone en marcha con una tarea de iniciativa');
      if (ai.task) {
        ok(Math.abs(dist(ai, ai.task.target) - dist(ai, near.p)) < 1e-6, 'la IA elige el objeto más cercano');
        ok(ai.bubble && ai.bubble.text === G.aiLine('start', ai.task.step.tool, def, ai.task.target), 'al ir, la IA avisa con una frase de su herramienta y el objeto');
        ok(w.aiSayCool > 0, 'el aviso al ir respeta el silencio entre frases');
      }
      // acabar bien: sin castigo y con aviso
      if (ai.task) {
        const t = ai.task, p = t.target;
        w.aiSayCool = 0; ai.bubble = null;
        w.aiTaskEnd(ai, true);
        ok(ai.task === null && w.aiBlack[p.key] === undefined, 'una tarea bien hecha no se castiga');
        ok(ai.bubble && ai.bubble.text === G.aiLine('done', t.step.tool, def, p, !!t.step.clue), 'al acabar, la IA avisa (con pista o neutro según el paso)');
        ok(w.aiLast === w.time, 'al acabar empieza el descanso');
      }
      // fallar: se aparta 40 s; nunca dos veces el mismo objeto seguido
      w.aiCand = {}; ai.task = null; w.aiBlack = {}; mature(c);
      const n = w.aiCandidates(ai, lead).length, picked = [];
      for (let k = 0; k < n + 3; k++) {
        w.aiLast = w.time - 1000; ai.task = null;
        if (!w.aiInit(ai, lead)) break;
        picked.push(ai.task.target.key);
        w.aiTaskEnd(ai, false);
        ok(w.aiBlack[picked[picked.length - 1]] > w.time, 'una tarea fallida aparta el objeto un rato');
      }
      ok(picked.length === n && new Set(picked).size === n, 'tras fallar, la IA no repite el objeto: prueba los demás y para');
      w.time += I.blackSecs + 1; w.aiLast = w.time - 1000; mature(c); ai.task = null;
      ok(w.aiInit(ai, lead) === true, 'pasado el castigo la IA puede volver a intentarlo');
      // fallar una tarea que pidió el jugador no castiga el objeto
      w.aiBlack = {}; ai.task = null;
      const q = w.aiCandidates(ai, lead)[0];
      if (q) {
        w.dispatch(ai, { kind: 'prop', p: q.p, step: q.step });
        w.aiTaskEnd(ai, false);
        ok(w.aiBlack[q.p.key] === undefined, 'una tarea que pidió el jugador y falla no se castiga como si fuera de iniciativa');
      }
    });

    // ============================================================ 4b) sigilo: la IA espera la ventana segura del vigilante (murmullo de Baguette, caso 1)
    ['normal', 'hard'].forEach((diff) => {
      const c = mk(G.CASES.tarta, diff, 'callejon', 2), { w, ai, lead } = c;
      const p = w.room.props.find((q) => q.id === 'murmullo');
      if (!p || !p.watcher) { ok(false, 'el caso 1 tiene su murmullo vigilado'); return; }
      const step = p.steps[0], n = w.npcs[p.watcher];
      w.dispatch(ai, { kind: 'prop', p, step }); ai.task.init = true;
      const spot = w.workSpots(p, 'prop')[0];
      ai.x = (spot.x + 0.5) * TS; ai.y = (spot.y + 0.5) * TS + 1; ai.path = null;
      n.watching = true;
      w.updateCompanion(0.016);
      ok(ai.task && !ai.task.started && !ai.work, 'sigilo: con el vigilante mirando, la IA espera quieta junto al objeto (' + diff + ')');
      n.watching = false;
      const wc = G.watchConfig(c.def, p.watcher), dur = w.stepDuration(step.tool, step, p.chat || null) + 0.25;
      let tt = null;
      for (let x = 0; x < 80 && tt === null; x += 0.05) if (G.watchClear(wc, diff, x - 0.1, dur)) tt = x;
      ok(tt !== null, 'sigilo: el caso 1 tiene una ventana segura para el murmullo (' + diff + ')');
      if (tt !== null) { w.time = tt; w.updateCompanion(0.016); ok(ai.task ? ai.task.started === true : !!ai.work, 'sigilo: en la ventana segura la IA se pone a grabar (' + diff + ')'); }
    });

    // ============================================================ 5) solo cuando la IA está activa
    try {
      const def = gen(1, 'normal');
      const st = new G.CaseState(def, 'normal'), w = new G.World(st, { mode: 'online', me: 0 });
      st.chapter = 2; w.enterRoom(Object.keys(def.rooms)[0]); w.onChapter();
      for (let t = 0; t < 40; t += 0.1) w.update(0.1, true);
      ok(!w.aiActive() && (!w.players[1].task) && Object.keys(w.aiCand || {}).length === 0, 'en online, con compañero humano, la IA no hace nada por su cuenta');
    } catch (e) { ok(false, 'el mundo online arranca sin errores (' + e.message + ')'); }

    // ============================================================ 6) partidas simuladas con el jugador parado
    const sim = (def, diff, chapter, secs, acc) => {
      const st = new G.CaseState(def, diff), w = new G.World(st, { mode: 'solo' });
      st.chapter = chapter;
      const calls = {};
      ['startTalk', 'ask', 'chat', 'press', 'present', 'accuse'].forEach((n) => { if (typeof st[n] === 'function') { const f = st[n].bind(st); st[n] = (...a) => { calls[n] = (calls[n] || 0) + 1; return f(...a); }; } });
      const ai = w.players[1 - w.human], lead = w.players[w.human];
      Object.keys(def.rooms).forEach((rn) => {
        w.enterRoom(rn); w.onChapter(); w.out.length = 0;
        const t0 = w.time;
        const props = w.room.props.filter((p) => p.steps);
        const prog0 = {};
        props.forEach((p) => { prog0[p.key] = st.progress[p.key] || 0; });
        const last = Object.assign({}, prog0);
        const doable = props.filter((p) => {
          const info = w.propStepInfo(p);
          if (!info || info.done) return false;
          if (p.chapterMin && st.chapter < p.chapterMin) return false;
          const s = info.step;
          return s.tool && s.tool !== 'coop' && ai.tools.indexOf(s.tool) >= 0 && !(p.uvOnly && !w.revealed(p)) && !(p.chat && !w.chatReady(p)) &&
            G.rectDist(lead.x, lead.y - 4, p.x * TS, p.y * TS, p.w * TS, p.h * TS) >= I.near;
        });
        let lastEnd = -1e9, firstAct = null;
        for (let t = 0; t < secs; t += STEP) {
          const before = ai.task;
          w.update(STEP, true);
          w.out.forEach((e) => { if (e.t === 'spotted' && e.who === ai.id) acc.spotted++; });
          w.out.length = 0;
          if (before && !ai.task) lastEnd = w.time;
          if (ai.task && ai.task !== before && ai.task.init) {
            const tk = ai.task, p = tk.target;
            acc.starts++; acc.lv[diff].starts++;
            if (p.watcher) acc.watched++;
            acc.log.push(w.time.toFixed(2) + ':' + p.key);
            ok(w.time - t0 >= I.wait[diff] - 0.06, 'partida: la IA espera antes de ofrecerse (el jugador va primero)');
            ok(w.time - lastEnd >= I.cool - 0.06, 'partida: la IA descansa entre tareas');
            ok(tk.kind === 'prop' && !tk.coop && tk.step.tool !== 'coop' && ai.tools.indexOf(tk.step.tool) >= 0, 'partida: la IA solo se pone con SU herramienta');
            ok(!(p.uvOnly && !w.revealed(p)), 'partida: la IA no se pone con marcas UV sin iluminar');
            ok(!(p.chat && !w.chatReady(p)), 'partida: la IA no se pone con una charla que no suena');
            ok(!(p.chapterMin && st.chapter < p.chapterMin), 'partida: la IA no se pone con lo de capítulos futuros');
            ok(G.rectDist(lead.x, lead.y - 4, p.x * TS, p.y * TS, p.w * TS, p.h * TS) >= I.near, 'partida: la IA deja lo que tiene el jugador al lado');
          }
          props.forEach((p) => {
            const n = st.progress[p.key] || 0;
            if (n !== last[p.key]) {
              const s = p.steps[last[p.key]];
              ok(s && s.tool && s.tool !== 'coop' && ai.tools.indexOf(s.tool) >= 0, 'partida: la IA solo avanza pasos de SU herramienta (nunca coop ni los del jugador)');
              if (firstAct === null) { firstAct = w.time - t0; acc.lv[diff].first.push(firstAct); }
              last[p.key] = n;
            }
          });
        }
        let done = 0;
        doable.forEach((p) => { acc.doable++; acc.lv[diff].doable++; if ((st.progress[p.key] || 0) > prog0[p.key]) { acc.doableDone++; acc.lv[diff].doableDone++; done++; } });
        if (doable.length) { acc.roomsDo++; if (done) acc.roomsAct++; }
      });
      ok(Object.keys(calls).length === 0, 'partida: la IA nunca habla con sospechosos, enseña pruebas ni acusa (' + Object.keys(calls).join(',') + ')');
    };
    const N = o.light ? 4 : 10, N1 = o.light ? 2 : 4;
    LV.forEach(([diff, lvl]) => {
      for (let i = 0; i < N; i++) {
        const def = gen(i + 100, lvl);
        sim(def, diff, 2, 90, S);
        if (i < N1) sim(def, diff, 1, 60, S);
      }
    });
    LV.forEach(([diff]) => sim(G.CASES.tarta, diff, 2, 90, S)); // el caso 1: su murmullo vigilado lo hace la IA
    ok(S.spotted === 0, 'partida: el vigilante nunca pilla a la IA (espera su ventana segura)');
    ok(S.starts >= (o.light ? 8 : 25), 'partida: la IA se pone en marcha por su cuenta en muchos objetos (' + S.starts + ')');
    ok(S.watched >= 1, 'partida: se probó al menos un objeto vigilado');
    ok(S.doable >= 20, 'partida: había objetos que la IA podía hacer');
    ok(S.doable > 0 && S.doableDone / S.doable >= 0.6, 'partida: la IA hace al menos el 60 % de lo que puede ver y no tiene cerca el jugador (' + (S.doable ? Math.round(100 * S.doableDone / S.doable) : 0) + ' %)');
    ok(S.roomsDo > 0 && S.roomsAct / S.roomsDo >= 0.85, 'partida: en el 85 % de las salas con trabajo para la IA hace algo');
    LV.forEach(([d]) => ok(S.lv[d].starts > 0, 'partida: la IA toma la iniciativa en el nivel ' + d));

    // ============================================================ 7) determinismo: misma semilla, mismas decisiones
    const tl = (diff, lvl) => { const a = { starts: 0, watched: 0, doable: 0, doableDone: 0, roomsDo: 0, roomsAct: 0, spotted: 0, lv: { easy: { starts: 0, doable: 0, doableDone: 0, first: [] }, normal: { starts: 0, doable: 0, doableDone: 0, first: [] }, hard: { starts: 0, doable: 0, doableDone: 0, first: [] } }, log: [] }; sim(gen(7, lvl), diff, 2, 60, a); return a.log.join('|'); };
    LV.forEach(([diff, lvl]) => {
      seed = 777; const x = tl(diff, lvl);
      seed = 777; const y = tl(diff, lvl);
      ok(x === y, 'con la misma semilla la IA toma las mismas decisiones en los mismos instantes (' + diff + ')');
    });
  }
}

const fmt = (r) => {
  const S = r.S;
  const lines = [];
  LV.forEach(([d]) => {
    const l = S.lv[d], f = l.first.slice().sort((a, b) => a - b);
    lines.push(`  ${d}: ${l.starts} tareas por iniciativa · ${l.doableDone} de ${l.doable} objetos hechos (${l.doable ? Math.round(100 * l.doableDone / l.doable) : 0} %) · primera acción (mediana) ${f.length ? f[Math.floor(f.length / 2)].toFixed(1) : '-'} s`);
  });
  return lines.join('\n');
};

const real = suite(loadG(EXTRA));
real.fails.forEach((f) => console.log('  ✗ ' + f));
console.log(fmt(real));
console.log(`${real.checks} comprobaciones, ${real.fails.length} fallos · vigilados ${real.S.watched} · pillada por el vigilante ${real.S.spotted}`);
let bad = real.fails.length;
if (process.argv.indexOf('--sin-mutaciones') >= 0) process.exit(bad ? 1 : 0);

// ================================================================ mutaciones: el código de la IA roto DEBE hacer fallar la prueba
const F = 'companion.js';
const MUT = [
  [F, "if (!s.tool || s.tool === 'coop' || ai.tools.indexOf(s.tool) < 0) return;", 'if (!s.tool) return;', 'la IA hace cualquier herramienta (también las del jugador y las coop)'],
  [F, 'if (p.uvOnly && !this.revealed(p)) return;', '', 'la IA ve las marcas UV sin iluminar'],
  [F, 'if (p.chat && !this.chatReady(p)) return;', '', 'la IA graba charlas que no suenan'],
  [F, 'if (p.chapterMin && this.st.chapter < p.chapterMin) return;', '', 'la IA toca lo de capítulos futuros'],
  [F, 'if (lead.work && lead.work.target === p) return;', '', 'la IA pisa lo que el jugador está haciendo'],
  [F, 'if (lead.focus && lead.focus.p === p) return;', '', 'la IA pisa lo que el jugador tiene en foco'],
  [F, 'if (G.rectDist(lead.x, lead.y - 4, p.x * TS, p.y * TS, p.w * TS, p.h * TS) < G.AI_INIT.near) return;', '', 'la IA no deja al jugador lo que tiene cerca'],
  [F, 'if (this.coopWork) return out;', '', 'la IA se ofrece mientras hay un trabajo en equipo'],
  [F, 'this.time - this.aiCand[c.p.key] >= wait', 'true', 'la IA no espera antes de ofrecerse'],
  [F, 'this.time - this.aiLast < C.cool', 'false', 'la IA no descansa entre tareas'],
  [F, 'ready.sort((a, b) => d(a) - d(b));', 'ready.sort((a, b) => d(b) - d(a));', 'la IA elige el objeto más lejano'],
  [F, 'if (!ok) { this.aiBlack[p.key] = this.time + G.AI_INIT.blackSecs; return; }', 'if (!ok) { return; }', 'una tarea fallida no se aparta'],
  [F, 'if (!t || !t.init) return;', 'if (!t) return;', 'también se castiga una tarea que pidió el jugador'],
  [F, ' && !(this.aiBlack[c.p.key] > this.time)', '', 'la IA repite al instante el objeto que le salió mal'],
  [F, "if (t.kind === 'prop' && t.target.watcher && t.step.tool !== 'coop' && !this.watchClear(t)) return;", '', 'la IA no espera la ventana segura del vigilante'],
  [F, 'const cands = this.aiCandidates(ai, lead);', 'const cands = [];', 'la IA nunca tiene candidatos'],
  [F, 'if (this.aiInit(ai, lead)) return;', '', 'la iniciativa no está conectada al compañero'],
  [F, ".replace(/\\{obj\\}/g, String(p.label || 'esto').toLowerCase())", '', 'los avisos no nombran el objeto'],
  [F, 'l && this.aiSay(ai, l, 3.4);', '', 'la IA no avisa al acabar'],
  [F, 'if (l) { ai.say(l, 3.4); this.aiSayCool = 3.2; }', '', 'la IA no avisa al ir'],
  [F, 'wait: { easy: 10, normal: 14, hard: 20 }', 'wait: { easy: 0, normal: 0, hard: 0 }', 'datos: espera inicial a 0'],
  [F, 'cool: 8,', 'cool: 0,', 'datos: descanso a 0'],
];
MUT.forEach(([file, from, to, name]) => {
  let applied = false;
  let r;
  try {
    r = suite(loadG(EXTRA, (f, text) => { if (f !== file) return text; if (text.indexOf(from) < 0) throw new Error('la mutación no encaja: ' + name); applied = true; return text.replace(from, to); }), { light: true });
  } catch (e) { r = { fails: ['ERROR: ' + e.message], checks: 0 }; }
  const caught = applied && r.fails.length > 0 && !/^ERROR/.test(r.fails[0]);
  console.log(`  mutación «${name}»: ${caught ? 'detectada (' + r.fails.length + ' fallos)' : 'NO DETECTADA ✗' + (r.fails[0] ? ' ' + r.fails[0] : '')}`);
  if (!caught) bad++;
});
console.log(bad ? `\n✗ ${bad} problemas` : `\nCompañero IA en orden: avisos, candidatos, decisiones, partidas simuladas en 3 niveles, determinismo y ${MUT.length} mutaciones detectadas.`);
process.exit(bad ? 1 : 0);
