// companion.js — IA del compañero (modo solitario): sigue al jugador con búsqueda de rutas (A*), ejecuta tareas
// con sus herramientas, detecta marcas UV por iniciativa propia, propone teorías y comenta con humor.
(function (root) {
  'use strict';
  const G = root.G;
  const TS = G.TS;
  const W = G.World.prototype;

  // ------------------------------------------------------------ A*
  G.findPath = function (world, sx, sy, tx, ty, maxNodes) {
    const room = world.room;
    const blockedNpc = {};
    world.npcsHere().forEach((n) => { if (!n.cat) blockedNpc[Math.floor(n.x / TS) + ',' + Math.floor((n.y - 1) / TS)] = true; });
    const free = (x, y) => !room.isSolidTile(x, y) && !blockedNpc[x + ',' + y];
    sx = G.clamp(sx, 0, room.w - 1); sy = G.clamp(sy, 0, room.h - 1);
    if (!free(tx, ty)) {
      // 4D-2: la baldosa libre más cercana al objetivo debe ser ALCANZABLE desde donde estoy (antes se elegía sin comprobarlo: una baldosa metida en una bolsa de suelo cerrada
      // por objetos y personajes dejaba al bot y al compañero IA dando vueltas; semilla 24611318). Si la más cercana ya era alcanzable, el resultado es el mismo de siempre.
      const seen = new Set([sy * room.w + sx]), stk = [[sx, sy]];
      while (stk.length) { const [cx, cy] = stk.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= room.w || ny >= room.h || !free(nx, ny) || seen.has(ny * room.w + nx)) return; seen.add(ny * room.w + nx); stk.push([nx, ny]); }); }
      let best = null, bd = 1e9;
      for (let r = 1; r < 2 && !best; r++) for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (free(x, y) && seen.has(y * room.w + x)) { const d = Math.abs(x - tx) + Math.abs(y - ty); if (d < bd) { bd = d; best = [x, y]; } }
      if (!best) return null;
      tx = best[0]; ty = best[1];
    }
    const key = (x, y) => y * room.w + x;
    const open = [{ x: sx, y: sy, g: 0, f: 0 }];
    const came = {}, gs = { [key(sx, sy)]: 0 }, closed = {};
    let n = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    while (open.length && n++ < (maxNodes || 1500)) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      const ck = key(cur.x, cur.y);
      if (closed[ck]) continue;
      closed[ck] = true;
      if (cur.x === tx && cur.y === ty) {
        const path = [];
        let k = ck;
        while (k !== undefined) { const x = k % room.w, y = Math.floor(k / room.w); path.push({ x: (x + 0.5) * TS, y: (y + 1) * TS - 6 }); k = came[k]; }
        path.reverse();
        path.shift();
        return path;
      }
      for (const [dx, dy] of dirs) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (!free(nx, ny)) continue;
        if (dx && dy && (!free(cur.x + dx, cur.y) || !free(cur.x, cur.y + dy))) continue;
        const g = cur.g + (dx && dy ? 1.42 : 1);
        const nk = key(nx, ny);
        if (gs[nk] !== undefined && gs[nk] <= g) continue;
        gs[nk] = g; came[nk] = ck;
        open.push({ x: nx, y: ny, g, f: g + Math.hypot(tx - nx, ty - ny) });
      }
    }
    return null;
  };

  const pickLine = (arr) => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);

  // ------------------------------------------------------------ A5 IA-1: iniciativa del compañero
  // La IA, por iniciativa propia, va a los objetos de la sala que exigen SU herramienta (no la del jugador, no los «los dos a la vez», no las puertas),
  // espera antes de moverse para que el jugador tenga siempre la primera oportunidad, respeta el sigilo y NUNCA habla con sospechosos, enseña pruebas ni acusa.
  // Los avisos van aquí (datos de código) y no en el caso: los casos generados no cambian (ni `GEN_VERSION` ni los códigos).
  G.AI_INIT = {
    wait: { easy: 10, normal: 14, hard: 20 }, // segundos que un objeto lleva a la vista antes de que la IA se ofrezca (el jugador va primero)
    cool: 8,       // segundos de descanso tras cada tarea de la IA
    near: 70,      // si el jugador está a menos de esto del objeto, la IA lo deja para él
    blackSecs: 40, // si una tarea sale mal (sin camino, vigilante, interrumpida), no se repite ese objeto durante este tiempo
  };
  G.AI_LINES = {
    start: {
      lupa: ['Eso de «{obj}» tiene pinta de esconder algo. Voy con la lupa.', 'Permitidme: la lupa y yo tenemos asuntos con «{obj}».', 'Hmm, «{obj}»... Mi lupa se ha puesto nerviosa. Voy.'],
      ganzua: ['«{obj}» cerrado y yo con mi ganzúa. Qué casualidad.', 'Dejadme «{obj}»: las cerraduras me adoran.', 'Una cerradura es solo una conversación educada. Voy con «{obj}».'],
      uv: ['Mi linterna UV quiere ver «{obj}». No le digas que no.', 'Apago la luz y enciendo la UV: voy a «{obj}».', 'Esto me brilla en la cabeza. Voy a «{obj}» con la linterna.'],
      grabadora: ['Voy a poner la oreja en «{obj}». Con grabadora, claro.', 'Silencio, que «{obj}» va a cantar... o a murmurar.', 'La grabadora y yo vamos a «{obj}». Prometemos discreción.'],
    },
    done: {
      lupa: ['Listo con «{obj}»: la lupa ha hablado. Mirad el cuaderno.', '«{obj}» examinado. Se me ha empañado la lupa de tanta pista.', 'Había algo en «{obj}». Apuntado: ¡a pensar!'],
      ganzua: ['«{obj}» ya no se nos resiste. Mirad el cuaderno.', 'Cerradura de «{obj}» vencida y con buenos modales. Algo nuevo en el cuaderno.', 'Abierto «{obj}». Que conste que he sido muy amable.'],
      uv: ['La UV ha hablado sobre «{obj}». Algo nuevo en el cuaderno.', 'Brillaba, sí: «{obj}» guardaba algo. Mirad el cuaderno.', '«{obj}» al descubierto. La linterna pide una galleta.'],
      grabadora: ['Grabado en «{obj}». Algo nuevo en el cuaderno.', 'Ya está la grabación de «{obj}». Qué cosas se dicen cuando nadie mira.', '«{obj}» grabado. Mirad el cuaderno, que está jugoso.'],
    },
    open: ['«{obj}» ya está. Sin pistas, pero con mucho estilo.', 'Hecho con «{obj}». A veces solo se abre una puerta.'],
    tone: {
      noir: ['Otra pieza del rompecabezas. Esta ciudad no duerme.', 'En este negocio, las pistas llegan siempre con lluvia.'],
      telenovela: ['¡Un giro que no esperaba nadie! Bueno, yo sí.', 'Esto da para un capítulo entero, lo juro.'],
      documental: ['Observemos: el detective ha obtenido una pista en su hábitat.', 'Un hallazgo notable, y sin molestar a la fauna local.'],
      western: ['Esta pista no sale de la ciudad con vida.', 'Pistas al amanecer, compañeros.'],
      espias: ['Dato obtenido. Repito: dato obtenido.', 'Operación «pista», fase completada.'],
      cuento: ['Y la pista, colorín colorado, apareció.', 'Érase una pista que estaba esperando a ser encontrada.'],
    },
  };
  // elige un aviso de forma determinista (mismo caso y objeto → mismo aviso) y rellena {obj}
  G.aiLine = (kind, tool, def, p, hasClue) => {
    const A = G.AI_LINES;
    let pool;
    if (kind === 'start') pool = A.start[tool];
    else if (!hasClue) pool = A.open;
    else pool = (A.done[tool] || []).concat((def && def.tone && A.tone[def.tone]) || []);
    if (!pool || !pool.length) return null;
    const h = G.hash((def && def.id || '') + ':ai:' + kind + ':' + (p.key || p.id));
    return pool[h % pool.length].replace(/\{obj\}/g, String(p.label || 'esto').toLowerCase());
  };

  W.initCompanion = function () {
    this.aiIdle = 0;
    this.aiSeenClues = this.st.clueCount();
    this.aiTheory = null;
    this.aiRoomSay = null;
    this.aiSensed = {};
    this.aiSayCool = 0;
    this.aiCand = {};   // A5 IA-1: objeto → momento en que la IA lo vio por primera vez como candidato en esta sala
    this.aiBlack = {};  // objeto → hasta cuándo no se repite (tarea fallida)
    this.aiLast = 0;    // fin de la última tarea de la IA (de iniciativa o por llamada)
  };

  W.banter = function (id) { return (this.st.def.banter || {})[id] || {}; };

  W.aiSay = function (ai, text, secs) {
    if (!text || this.aiSayCool > 0) return false;
    ai.say(text, secs);
    this.aiSayCool = 3.2;
    return true;
  };

  // el jugador pide ayuda al compañero (tecla de pista en solitario) — devuelve true si lo ha dicho
  W.aiHint = function (text) {
    if (!this.aiActive()) return false;
    const ai = this.players[1 - this.human];
    ai.say(text, 5);
    this.aiSayCool = 4;
    return true;
  };

  W.dispatch = function (ai, f) {
    const target = f.kind === 'door' ? f.d : f.p;
    const step = f.kind === 'door' ? { tool: f.d.locked.tool, time: f.d.locked.time, text: f.d.locked.text } : f.step;
    ai.work = null;
    ai.path = null;
    ai.task = { f, target, kind: f.kind === 'door' ? 'door' : 'prop', step, coop: !!f.coop, arrived: false, started: false, t: 0, repath: 0, prog0: f.kind === 'door' ? 0 : (this.st.progress[target.key] || 0) };
    const b = this.banter(ai.id);
    ai.say(pickLine(b.help) || '¡Voy!', 2.2);
    this.aiSayCool = 2.5;
  };

  // casillas desde las que se puede trabajar sobre un objeto
  // ¿puede la tarea de la IA empezar ahora sin que el vigilante la vea mientras trabaja?
  W.watchClear = function (t) {
    const wc = G.watchConfig(this.st.def, t.target.watcher), tool = t.step.tool && t.step.tool !== 'coop' ? t.step.tool : null;
    const n = this.npcs[t.target.watcher]; // el estado «mirando» del vigilante va un fotograma por detrás del reloj: también se mira el estado actual y un pelín hacia atrás
    if (n && n.watching) return false;
    return G.watchClear(wc, this.st.diff.id, this.time - 0.1, this.stepDuration(tool, t.step, t.kind === 'prop' && t.target && t.target.chat ? t.target.chat : null) + 0.25);
  };

  W.workSpots = function (target, kind) {
    const room = this.room;
    const rx = target.x, ry = kind === 'door' ? (target.y || 0) : target.y, rw = kind === 'door' ? 1 : target.w || 1, rh = kind === 'door' ? 1 : target.h || 1;
    const out = [];
    for (let y = ry - 1; y <= ry + rh; y++)
      for (let x = rx - 1; x <= rx + rw; x++) {
        if (x >= rx && x < rx + rw && y >= ry && y < ry + rh) continue;
        if (room.isSolidTile(x, y)) continue;
        out.push({ x, y });
      }
    return out;
  };

  W.followPath = function (a, dt, speed) {
    if (!a.path || !a.path.length) { a.moving = false; return true; }
    const wp = a.path[0];
    const dx = wp.x - a.x, dy = wp.y - a.y, d = Math.hypot(dx, dy);
    if (d < 6) { a.path.shift(); return !a.path.length; }
    const ox = a.x, oy = a.y;
    this.moveActor(a, (dx / d) * speed * dt, (dy / d) * speed * dt);
    this.setFace(a, dx, dy);
    a.moving = true;
    a.anim += dt;
    const moved = Math.hypot(a.x - ox, a.y - oy);
    a.stuck = moved < speed * dt * 0.25 ? (a.stuck || 0) + dt : 0;
    if (a.stuck > 0.45) { a.path = null; a.stuck = 0; return true; }
    return false;
  };


  // A5 IA-1: objetos de la sala que la IA podría hacer por iniciativa (solo SU herramienta, nada del jugador)
  W.aiCandidates = function (ai, lead) {
    const out = [];
    if (this.coopWork) return out;
    this.room.props.forEach((p) => {
      if (!p.steps) return;
      const info = this.propStepInfo(p);
      if (!info || info.done) return;
      if (p.chapterMin && this.st.chapter < p.chapterMin) return;
      const s = info.step;
      if (!s.tool || s.tool === 'coop' || ai.tools.indexOf(s.tool) < 0) return;
      if (p.uvOnly && !this.revealed(p)) return;       // la IA solo ve la marca UV cuando la ilumina (no es adivina)
      if (p.chat && !this.chatReady(p)) return;        // nadie habla todavía
      if (lead.work && lead.work.target === p) return; // el jugador ya está en ello
      if (lead.focus && lead.focus.p === p) return;
      if (G.rectDist(lead.x, lead.y - 4, p.x * TS, p.y * TS, p.w * TS, p.h * TS) < G.AI_INIT.near) return;
      out.push({ p, step: s });
    });
    return out;
  };

  // devuelve true si la IA acaba de ponerse en marcha
  W.aiInit = function (ai, lead) {
    const st = this.st, C = G.AI_INIT;
    const cands = this.aiCandidates(ai, lead);
    const seen = {};
    cands.forEach((c) => { seen[c.p.key] = true; if (this.aiCand[c.p.key] === undefined) this.aiCand[c.p.key] = this.time; });
    Object.keys(this.aiCand).forEach((k) => { if (!seen[k]) delete this.aiCand[k]; });
    if (!cands.length || this.time - this.aiLast < C.cool) return false;
    const wait = C.wait[st.diff && st.diff.id] || C.wait.normal;
    const ready = cands.filter((c) => this.time - this.aiCand[c.p.key] >= wait && !(this.aiBlack[c.p.key] > this.time));
    if (!ready.length) return false;
    const d = (c) => G.dist(ai.x, ai.y, (c.p.x + c.p.w / 2) * TS, (c.p.y + c.p.h / 2) * TS);
    ready.sort((a, b) => d(a) - d(b));
    const c = ready[0];
    this.dispatch(ai, { kind: 'prop', p: c.p, step: c.step });
    ai.task.init = true;
    const l = G.aiLine('start', c.step.tool, st.def, c.p);
    if (l) { ai.say(l, 3.4); this.aiSayCool = 3.2; }
    return true;
  };

  // fin de una tarea de la IA (ok = el objeto avanzó). Las de iniciativa que salen mal se apartan un rato.
  W.aiTaskEnd = function (ai, ok) {
    const t = ai.task;
    ai.task = null;
    this.aiLast = this.time;
    if (!t || !t.init) return;
    const p = t.target;
    if (!ok) { this.aiBlack[p.key] = this.time + G.AI_INIT.blackSecs; return; }
    const l = G.aiLine('done', t.step.tool, this.st.def, p, !!t.step.clue);
    l && this.aiSay(ai, l, 3.4);
  };

  W.updateCompanion = function (dt) {
    if (!this.aiActive()) return;
    const st = this.st;
    const ai = this.players[1 - this.human];
    const lead = this.players[this.human];
    this.aiSayCool = Math.max(0, this.aiSayCool - dt);
    ai.moving = false;
    ai.focus = null;

    // ---- iniciativa: detectar marcas UV con la linterna
    ai.autoUV = false;
    if (ai.tools.indexOf('uv') >= 0) {
      const r = G.stats().uvRadius * 1.7;
      this.room.props.forEach((p) => {
        if (!p.uvOnly || !this.propVisible(p)) return;
        const info = this.propStepInfo(p);
        if (!info || info.done) return;
        const c = this.propCenter(p);
        if (G.dist(ai.x, ai.y, c.x, c.y) < r) {
          ai.autoUV = true;
          if (!this.aiSensed[p.id]) {
            this.aiSensed[p.id] = true;
            this.aiSay(ai, '¡Mi linterna UV ha detectado algo por aquí! Acércate y pulsa el botón.', 4);
            this.sparkleBurst(c.x, c.y, 10);
            G.audio.sfx('hint');
          }
        }
      });
    }

    // ---- comentarios
    if (st.clueCount() !== this.aiSeenClues) { this.aiSeenClues = st.clueCount(); this.aiIdle = 0; }
    this.aiIdle += dt;
    const b = this.banter(ai.id);
    if (this.aiRoomSay && this.aiRoomSay.t > 0) {
      this.aiRoomSay.t -= dt;
      if (this.aiRoomSay.t <= 0) { const l = pickLine(b.enter && b.enter[this.aiRoomSay.room]); l && this.aiSay(ai, l, 3.6); this.aiRoomSay = null; }
    }
    const top = st.topSuspect();
    if (top && top !== this.aiTheory && !ai.task) {
      this.aiTheory = top;
      const l = pickLine(b.theory && b.theory[top]);
      l && this.aiSay(ai, l, 4.5);
    }
    if (this.aiIdle > 70 && !ai.task) { this.aiIdle = 0; const l = pickLine(b.idle); l && this.aiSay(ai, l, 4); }

    if (ai.work) return;

    // ---- tarea
    if (ai.task) {
      const t = ai.task;
      t.t += dt;
      if (t.t > 30) { this.aiTaskEnd(ai, false); return; }
      if (t.started) {
        if (!ai.work) {
          if (t.init) this.aiTaskEnd(ai, (st.progress[t.target.key] || 0) > t.prog0);
          else { this.aiTaskEnd(ai, true); const l = pickLine(b.done); l && this.aiSay(ai, l, 2.6); }
        }
        return;
      }
      const rect = t.kind === 'door' ? G.doorRect(t.target) : [t.target.x * TS, t.target.y * TS, (t.target.w || 1) * TS, (t.target.h || 1) * TS];
      const dist = G.rectDist(ai.x, ai.y - 4, rect[0], rect[1], rect[2], rect[3]);
      if (dist < 46 || (t.pathed && ai.path && !ai.path.length && dist < 96)) {
        t.arrived = true;
        this.faceToward(ai, rect[0] + rect[2] / 2, rect[1] + rect[3] / 2);
        if (t.coop) {
          if (!this.coopWork) { ai.task = null; }
          return;
        }
        // sigilo: si un vigilante nombra este objeto, la IA espera quieta a que no mire (la acción entera + un pelín de margen) en vez de lanzarse y que la pillen
        if (t.kind === 'prop' && t.target.watcher && t.step.tool !== 'coop' && !this.watchClear(t)) return;
        this.equip(ai, t.step.tool);
        this.startWork(ai, t.kind, t.target, t.step, t.f);
        t.started = true;
        return;
      }
      t.repath -= dt;
      if (!ai.path || !ai.path.length || t.repath <= 0) {
        t.repath = 0.7;
        const spots = this.workSpots(t.target, t.kind).sort((p, q) => G.dist(p.x, p.y, ai.x / TS, ai.y / TS) - G.dist(q.x, q.y, ai.x / TS, ai.y / TS));
        ai.path = null;
        for (let i = 0; i < Math.min(spots.length, 5) && !ai.path; i++) ai.path = G.findPath(this, Math.floor(ai.x / TS), Math.floor((ai.y - 1) / TS), spots[i].x, spots[i].y);
        if (!ai.path) { this.aiTaskEnd(ai, false); return; }
        t.pathed = true;
      }
      this.followPath(ai, dt, G.stats().speed * 2.6 * 1.05);
      return;
    }

    // ---- iniciativa propia (A5 IA-1)
    if (this.aiInit(ai, lead)) return;

    // ---- seguir al jugador (con la herramienta guardada)
    if (!ai.autoUV) ai.toolIdx = G.startToolOf(ai.id, this.st.def);
    const d = G.dist(ai.x, ai.y, lead.x, lead.y);
    if (d > 800) { ai.x = lead.x - 30; ai.y = lead.y; ai.path = null; return; }
    if (d > 92) {
      ai.repath = (ai.repath || 0) - dt;
      if (!ai.path || !ai.path.length || ai.repath <= 0) {
        ai.repath = 0.5;
        ai.path = G.findPath(this, Math.floor(ai.x / TS), Math.floor((ai.y - 1) / TS), Math.floor(lead.x / TS), Math.floor((lead.y - 1) / TS));
      }
      const sp = G.stats().speed * 2.6 * (d > 260 ? 1.12 : 1.0);
      if (ai.path) this.followPath(ai, dt, sp);
    } else {
      ai.path = null;
      if (d > 20) this.faceToward(ai, lead.x, lead.y);
    }
  };

  // al entrar en una sala nueva, el compañero comenta
  const oldEnter = W.enterRoom;
  W.enterRoom = function (id, fromDoor, first) {
    oldEnter.call(this, id, fromDoor, first);
    if (this.aiCand) this.aiCand = {};
    if (this.aiActive() && !first && !this.aiSaidRoom) this.aiSaidRoom = {};
    if (this.aiActive() && !first && this.aiSaidRoom && !this.aiSaidRoom[id]) {
      this.aiSaidRoom[id] = true;
      this.aiRoomSay = { room: id, t: 1.4 };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
