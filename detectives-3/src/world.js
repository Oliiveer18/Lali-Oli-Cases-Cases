// world.js — el mundo cenital: salas, colisiones, cámara (con pantalla dividida), interacción de un solo botón,
// herramientas físicas (UV, ganzúa, lupa, grabadora), efectos y dibujo.
(function (root) {
  'use strict';
  const G = root.G;
  const TS = G.TS, S = G.S;
  const HALF = 9, DEPTH = 10;
  const U = () => G.ui;

  G.rectDist = function (x, y, rx, ry, rw, rh) {
    const dx = Math.max(rx - x, 0, x - (rx + rw));
    const dy = Math.max(ry - y, 0, y - (ry + rh));
    return Math.hypot(dx, dy);
  };

  // ============================================================ SALA
  class Room {
    constructor(world, id) {
      const st = world.st;
      this.world = world;
      this.id = id;
      this.def = st.def.rooms[id];
      const map = this.def.map;
      this.w = map[0].length;
      this.h = map.length;
      this.pw = this.w * TS;
      this.ph = this.h * TS;
      this.props = this.def.props.map((p) => {
        const q = Object.assign({}, p);
        q.w = p.w || 1;
        q.h = p.h || 1;
        q.key = p.ref || p.id;
        if (p.ref) {
          const r = this.def.props.find((x) => x.id === p.ref);
          q.steps = r.steps; q.doneText = r.doneText; q.uvMark = r.uvMark; q.shimmer = r.shimmer; q.uvOnly = r.uvOnly;
          q.label = p.label || r.label;
        }
        const mv = st.moved[p.id];
        if (mv) { q.x += mv.dx; q.y += mv.dy; }
        q.t0 = Math.random() * 10;
        return q;
      });
      this.doors = this.def.doors.map((d) => Object.assign({}, d));
      // 4C-3b-1: objetos animados (como mucho G.ANIM_MAX_PER_ROOM por sala; el resto se dibuja quieto, en su primer fotograma)
      this.animDecor = []; this.animSkip = new Set();
      let na = 0;
      this.props.forEach((q) => { if (G.ANIMS && G.ANIMS[q.sprite] && na < G.ANIM_MAX_PER_ROOM) { q.animOn = true; na++; } });
      ['decor', 'decals'].forEach((k) => (this.def[k] || []).forEach((d, i) => {
        if (G.ANIMS && G.ANIMS[d.sprite] && na < G.ANIM_MAX_PER_ROOM) { na++; this.animSkip.add(d); this.animDecor.push({ sprite: d.sprite, x: d.x, y: d.y, key: k + i + '_' + d.x + '_' + d.y }); }
      }));
      this.animCount = na;
      this.buildStatic();
      this.rebuild();
    }
    isSolidTile(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return true;
      return this.solid[ty][tx];
    }
    isSolidAt(px, py) { return this.isSolidTile(Math.floor(px / TS), Math.floor((py - 0.01) / TS)); }
    rebuild() {
      const map = this.def.map;
      this.solid = [];
      for (let y = 0; y < this.h; y++) {
        const row = [];
        for (let x = 0; x < this.w; x++) row.push(map[y][x] === '#');
        this.solid.push(row);
      }
      this.props.forEach((p) => {
        if (!p.solid || !this.world.propVisible(p)) return;
        for (let yy = 0; yy < p.h; yy++) for (let xx = 0; xx < p.w; xx++) if (this.solid[p.y + yy] && this.solid[p.y + yy][p.x + xx] !== undefined) this.solid[p.y + yy][p.x + xx] = true;
      });
    }
    buildStatic() {
      const cv = G.makeCanvas(this.pw, this.ph);
      const c = cv.getContext('2d');
      c.imageSmoothingEnabled = false;
      const map = this.def.map;
      const stone = this.def.wallStyle === 'stone';
      const fl = 'floor_' + (this.def.floor || 'wood');
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          const ch = map[y][x];
          let name;
          if (ch === '#') {
            if (y === 0 && x > 0 && x < this.w - 1) name = stone ? 'wall_face_stone' : 'wall_face';
            else name = stone ? 'wall_top_stone' : 'wall_top';
          } else name = fl === 'floor_wood' && (x + y) % 2 ? 'floor_wood2' : fl;
          G.drawSpr(c, name, x * TS, y * TS, { scale: S });
        }
      }
      (this.def.decor || []).forEach((d) => { if (!this.animSkip.has(d)) G.drawSpr(c, d.sprite, d.x * TS, d.y * TS, { scale: S }); });
      (this.def.decals || []).forEach((d) => { if (!this.animSkip.has(d)) G.drawSpr(c, d.sprite, d.x * TS, d.y * TS, { scale: S }); });
      this.static = cv;
    }
  }
  G.Room = Room;

  // ============================================================ ACTOR
  class Actor {
    constructor(id, look, x, y) {
      this.id = id; this.look = look;
      this.x = x; this.y = y;
      this.face = 'down';
      this.moving = false;
      this.anim = 0;
      this.bubble = null;
      this.work = null;
      this.focus = null;
      this.ctrl = null;
      this.tools = [];
      this.toolIdx = 0;
      this.speedMul = 1;
      this.cat = look === 'cat';
    }
    get tool() { return this.tools[this.toolIdx] || null; }
    say(text, secs) { this.bubble = { text, t: secs || Math.max(2.4, text.length * 0.055) }; }
  }
  G.Actor = Actor;

  // ============================================================ MUNDO
  const st0 = (w, p) => (w.st.progress[p.key] || 0);
  class World {
    constructor(st, opts) {
      this.st = st;
      this.mode = opts.mode;
      this.rooms = {};
      this.out = [];
      this.fx = [];
      this.hintIds = {};
      this.time = 0;
      this.fade = null;
      this.cam = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
      this.npcs = {};
      this.coopWork = null;
      this.target = null;
      this.targetT = 0;
      this.arrowOn = false;
      this.visited = {};
      this.uvc = null;
      const def = st.def;
      this.roomId = def.start.room;
      const rex = new Actor('rex', 'rex', 0, 0);
      const luna = new Actor('luna', 'luna', 0, 0);
      rex.tools = G.toolsOf('rex', def);
      luna.tools = G.toolsOf('luna', def);
      this.players = [rex, luna];
      rex.toolIdx = G.startToolOf('rex', def);
      luna.toolIdx = G.startToolOf('luna', def); // la linterna UV se enciende a propósito (botón de herramienta)
      this.human = opts.me || 0;
      this.assignControls();
      this.enterRoom(this.roomId, null, true);
      const s = def.start;
      rex.x = (s.p1[0] + 0.5) * TS; rex.y = (s.p1[1] + 1) * TS - 6;
      luna.x = (s.p2[0] + 0.5) * TS; luna.y = (s.p2[1] + 1) * TS - 6;
      this.placeNPCs(true);
      this.snapCamera();
      this.initCompanion && this.initCompanion();
    }
    assignControls() {
      const solo = this.mode === 'solo', online = this.mode === 'online';
      if (solo || online) {
        this.players.forEach((p, i) => (p.ctrl = i === this.human ? 'p0' : online ? 'remote' : 'ai'));
        G.input.mode = 'solo';
      } else {
        this.players[0].ctrl = 'p0';
        this.players[1].ctrl = 'p1';
        G.input.mode = 'coop';
      }
    }
    get room() { return this.rooms[this.roomId]; }
    // ¿manda la IA sobre el compañero? (modo 1 jugador, o modo online con el compañero desconectado)
    aiActive() { return this.mode === 'solo' || (this.mode === 'online' && !!this.aiTakeover); }
    leader() { return this.players[this.mode !== 'coop' ? this.human : 0]; }
    swapSolo() {
      if (this.mode !== 'solo') return;
      this.human = 1 - this.human;
      this.assignControls();
      this.players.forEach((p) => { p.work = null; p.path = null; p.task = null; });
      G.audio.sfx('tool');
    }
    propVisible(p) { return !p.visible || G.evalCond(p.visible, this.st, null); }

    // ---------- salas y personajes
    enterRoom(id, fromDoorId, first) {
      if (!this.rooms[id]) this.rooms[id] = new Room(this, id);
      this.roomId = id;
      const r = this.rooms[id];
      if (fromDoorId) {
        const d = r.doors.find((x) => x.id === fromDoorId);
        if (d) {
          this.players.forEach((p, i) => {
            if (p.ctrl === 'remote') return;
            const sp = G.doorSpawn(d, i, r);
            p.x = sp.x; p.y = sp.y;
            p.work = null; p.path = null; p.task = null;
          });
        }
      }
      this.players.forEach((p) => { if (p.ctrl !== 'remote') this.unstick(p); });
      this.coopWork = null;
      this.placeNPCs(true);
      if (!this.visited[id]) { this.visited[id] = true; this.out.push({ t: 'room_first', room: id }); }
      this.out.push({ t: 'room', room: id });
      this.snapCamera();
    }
    // FIX-1 (red de seguridad): si un jugador queda con la caja metida en un sólido, o en una baldosa cerrada que no
    // conecta con ninguna puerta, se le recoloca en el punto libre más cercano de la zona principal de la sala.
    mainTiles() {
      const r = this.room, key = (x, y) => y * 1000 + x, all = new Set();
      r.doors.forEach((d) => {
        const ins = G.doorInside(d);
        if (r.isSolidTile(ins.x, ins.y) || all.has(key(ins.x, ins.y))) return;
        all.add(key(ins.x, ins.y));
        const q = [[ins.x, ins.y]];
        while (q.length) {
          const [x, y] = q.pop();
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            if (r.isSolidTile(nx, ny) || all.has(key(nx, ny))) return;
            all.add(key(nx, ny)); q.push([nx, ny]);
          });
        }
      });
      return all.size ? all : null; // unión de las zonas conectadas con alguna puerta
    }
    boxFree(x, y) { const r = this.room; return !(r.isSolidAt(x - HALF, y - DEPTH) || r.isSolidAt(x + HALF, y - DEPTH) || r.isSolidAt(x - HALF, y) || r.isSolidAt(x + HALF, y)); }
    unstick(a) {
      const main = this.mainTiles();
      if (!main) return false;
      const key = (x, y) => y * 1000 + x;
      const tileOk = (x, y) => main.has(key(Math.floor(x / TS), Math.floor((y - 0.01) / TS)));
      if (this.boxFree(a.x, a.y) && tileOk(a.x, a.y)) return false;
      let best = null, bd = Infinity;
      for (let dy = -240; dy <= 240; dy += 4) for (let dx = -240; dx <= 240; dx += 4) {
        const x = a.x + dx, y = a.y + dy, d = dx * dx + dy * dy;
        if (d >= bd || !this.boxFree(x, y) || !tileOk(x, y) || !tileOk(x - HALF, y) || !tileOk(x + HALF, y)) continue;
        bd = d; best = { x, y };
      }
      if (!best) return false;
      a.x = best.x; a.y = best.y; a.work = null; a.path = null; a.task = null;
      this.puff && this.puff(a.x, a.y - 20);
      return true;
    }
    placeNPCs(snap) {
      const st = this.st;
      Object.keys(st.def.npcs).forEach((id) => {
        const p = st.placementOf(id);
        let n = this.npcs[id];
        if (!n) {
          n = this.npcs[id] = new Actor(id, st.def.npcs[id].look, 0, 0);
          n.isNpc = true; n.cat = !!st.def.npcs[id].cat; n.wanderT = 2 + Math.random() * 3; n.room = null;
        }
        if (!p) { n.room = null; return; }
        if (n.room !== p.room || n.chPlaced !== st.chapter) {
          const wasHere = n.room === this.roomId && n.chPlaced !== undefined;
          n.room = p.room;
          n.chPlaced = st.chapter;
          n.x = (p.x + 0.5) * TS; n.y = (p.y + 1) * TS - 6;
          n.home = { x: n.x, y: n.y };
          n.face = p.face || 'down';
          n.wanderList = p.wander ? p.wander.map(([x, y]) => ({ x: (x + 0.5) * TS, y: (y + 1) * TS - 6 })) : null;
          if (!snap && p.room === this.roomId && wasHere !== undefined) this.puff(n.x, n.y - 20);
        }
      });
    }
    npcsHere() {
      const out = [];
      Object.keys(this.npcs).forEach((id) => { const n = this.npcs[id]; if (n.room === this.roomId) out.push(n); });
      return out;
    }
    onChapter() { this.placeNPCs(false); this.hintIds = {}; this.target = null; this.targetT = 0; }

    // ---------- movimiento / colisión
    hits(a, x, y) {
      const r = this.room;
      if (r.isSolidAt(x - HALF, y - DEPTH) || r.isSolidAt(x + HALF, y - DEPTH) || r.isSolidAt(x - HALF, y) || r.isSolidAt(x + HALF, y)) return true;
      if (!a.isNpc || !a.cat) {
        const ns = this.npcsHere();
        for (let i = 0; i < ns.length; i++) {
          const n = ns[i];
          if (n === a || n.cat) continue;
          if (Math.abs(x - n.x) < 17 && Math.abs(y - n.y) < 10) return true;
        }
      }
      return false;
    }
    moveActor(a, dx, dy) {
      const ox = a.x, oy = a.y;
      if (dx && !this.hits(a, a.x + dx, a.y)) a.x += dx;
      if (dy && !this.hits(a, a.x, a.y + dy)) a.y += dy;
      return Math.abs(a.x - ox) + Math.abs(a.y - oy) > 0.01;
    }
    setFace(a, dx, dy) {
      if (Math.abs(dx) > Math.abs(dy)) a.face = dx > 0 ? 'right' : 'left';
      else if (dy) a.face = dy > 0 ? 'down' : 'up';
    }
    faceToward(a, tx, ty) { this.setFace(a, tx - a.x, ty - a.y); }

    // ---------- pistas visuales
    uvActive(a) { return a.tools.indexOf('uv') >= 0 && (a.tool === 'uv' || a.autoUV); }
    uvSources() {
      const r = G.stats().uvRadius;
      return this.players.filter((p) => !p.hidden && this.uvActive(p)).map((p) => ({ x: p.x, y: p.y - 24, r: p.ctrl === 'ai' && p.autoUV ? r * 1.8 : r }));
    }
    propCenter(p) { return { x: (p.x + p.w / 2) * TS, y: (p.y + p.h / 2) * TS }; }
    revealed(p) {
      if (!p.uvOnly) return true;
      const c = this.propCenter(p);
      return this.uvSources().some((s) => G.dist(s.x, s.y, c.x, c.y) < s.r);
    }
    propStepInfo(p) {
      const st = this.st;
      if (!p.steps || !this.propVisible(p)) return null;
      const step = p.steps[st.progress[p.key] || 0];
      if (!step) return { done: true };
      if (step.requires && !G.evalCond(step.requires, st, null)) return null;
      return { step };
    }
    doorState(d) {
      const st = this.st;
      if (!d.locked || st.flags['unlocked_' + d.id]) return 'open';
      if (st.chapter < (d.locked.chapterMin || 1)) return 'wait';
      if (!d.locked.tool) return 'auto';
      return 'tool';
    }

    // ---------- interacción
    findFocus(a) {
      const st = this.st, room = this.room;
      let best = null, bd = 1e9;
      this.npcsHere().forEach((n) => {
        const d = G.dist(a.x, a.y, n.x, n.y) - 8;
        if (d < 62 && d < bd) { bd = d; best = { kind: 'npc', id: n.id, ent: n, label: st.def.npcs[n.id].name, verb: n.cat ? 'Acariciar' : 'Hablar', icon: n.cat ? 'ico_heart' : 'ico_question' }; }
      });
      room.props.forEach((p) => {
        let info = this.propStepInfo(p);
        // CL-5c-c 4/4: un PUZLE generado (pz_N) al que aún le faltan pistas SÍ se puede examinar (antes el objeto no respondía y no se sabía por qué): avisa de cuántas faltan. El resto de objetos con `requires` sigue como siempre.
        if (!info && /^pz_\d+$/.test(p.id) && p.steps && this.propVisible(p)) { const s0 = p.steps[st.progress[p.key] || 0]; if (s0 && s0.requires) info = { step: s0, locked: true }; }
        if (!info) return;
        if (p.uvOnly && !this.revealed(p)) return;
        if (!p.steps) return;
        const d = G.rectDist(a.x, a.y - 4, p.x * TS, p.y * TS, p.w * TS, p.h * TS) + (info.done ? 28 : 0);
        const reach = p.listen ? G.LISTEN_REACH * (G.stats().listenRange || 1) : 40; // A4 2/4: el «Micrófono directivo» alarga el alcance de los puntos de escucha
        if (d < reach && d < bd) {
          bd = d;
          const f = { kind: 'prop', p, label: p.label || 'Objeto', done: !!info.done, icon: 'ico_hand', verb: 'Examinar' }; // 24 oct: lo libre (sin herramienta) lleva la MANO, no la lupa; la lupa solo sale cuando el paso pide la lupa (más abajo)
          if (!info.done) {
            const s = info.step;
            f.step = s;
            if (s.mini && !s.tool) { f.verb = s.mini.verb || 'Abrir'; f.icon = s.mini.icon || 'ico_key'; }
            if (s.tool === 'coop') { f.verb = 'Empujar (los dos)'; f.icon = 'ico_hand'; }
            else if (s.tool) {
              const T = G.TOOLS[s.tool];
              f.verb = 'Usar ' + T.name; f.icon = T.icon; f.needs = s.tool;
              f.mine = a.tools.indexOf(s.tool) >= 0;
              if (!f.mine) f.verb = this.aiActive() ? 'Llamar a ' + G.roleName(G.toolOwner(s.tool, this.st.def)) : this.mode === 'online' ? 'Avisar a ' + G.roleName(G.toolOwner(s.tool, this.st.def)) : 'Hace falta ' + G.roleName(G.toolOwner(s.tool, this.st.def));
            }
          } else { f.verb = 'Mirar'; }
          if (info.locked) { f.locked = true; f.verb = 'Examinar'; f.icon = 'ico_hand'; f.missing = ((info.step.requires.clue) || []).filter((id) => !st.hasClue(id)).length; }
          if (p.chat && !info.done && !this.chatReady(p)) { f.quiet = true; f.verb = 'Nadie habla aquí'; f.icon = 'ico_rec'; }
          best = f;
        }
      });
      room.doors.forEach((dr) => {
        const rc = G.doorRect(dr), d = G.rectDist(a.x, a.y - 4, rc[0], rc[1], rc[2], rc[3]);
        if (d < 36 && d < bd) {
          bd = d;
          const state = this.doorState(dr);
          const f = { kind: 'door', d: dr, label: dr.label || 'Puerta', verb: 'Entrar', icon: 'ico_arrow', state };
          if (state === 'tool') { const T = G.TOOLS[dr.locked.tool]; f.verb = 'Forzar con ' + T.name; f.icon = T.icon; f.needs = dr.locked.tool; f.mine = a.tools.indexOf(dr.locked.tool) >= 0; if (!f.mine) f.verb = this.aiActive() ? 'Llamar a ' + G.roleName(G.toolOwner(dr.locked.tool, this.st.def)) : 'Hace falta ' + G.roleName(G.toolOwner(dr.locked.tool, this.st.def)); }
          else if (state === 'wait') { f.icon = 'ico_lock'; f.verb = 'Cerrada'; }
          best = f;
        }
      });
      return best;
    }
    stepDuration(tool, step, chat) {
      const base = G.stepBaseSeconds({ time: step.time, tool });
      if (chat) return Math.max(0.35, base); // una charla no se acelera: las frases necesitan su tiempo (el micrófono mejorado alarga el alcance, no acorta la charla)
      const mul = tool && G.stats().toolMul[tool] ? G.stats().toolMul[tool] : 1;
      return Math.max(0.35, base * mul);
    }
    // A4 2/4: un punto de escucha con `chat` solo suena si los dos personajes están ahora en esta sala
    chatReady(p) {
      const c = p && p.chat;
      if (!c) return true;
      const na = this.npcs[c.a], nb = this.npcs[c.b];
      return !!(na && nb && na.room === this.roomId && nb.room === this.roomId);
    }
    // el jugador pulsa acción
    interact(a) {
      const f = a.focus;
      if (!f || a.work) return;
      const st = this.st;
      if (f.kind === 'npc') {
        this.faceToward(a, f.ent.x, f.ent.y);
        this.faceToward(f.ent, a.x, a.y);
        this.out.push({ t: 'talk', npc: f.id, who: a.id });
        return;
      }
      if (f.kind === 'door') {
        const d = f.d;
        if (f.state === 'open') { this.useDoor(d); return; }
        if (f.state === 'wait') { this.out.push({ t: 'denied', who: a.id, text: d.locked.denied }); G.audio.sfx('error'); return; }
        if (f.state === 'auto') { st.setFlag('unlocked_' + d.id); G.audio.sfx('unlock'); this.out.push({ t: 'toast', text: G.autoDoorText(d), icon: 'ico_key' }); return; }
        if (f.state === 'tool') {
          if (f.mine) { this.equip(a, d.locked.tool); this.startWork(a, 'door', d, { tool: d.locked.tool, time: d.locked.time, text: d.locked.text }, f); }
          else this.callPartner(a, f);
        }
        return;
      }
      if (f.kind === 'prop') {
        const p = f.p;
        if (f.done) { a.say(p.doneText || 'Ya he mirado aquí.', 2.4); return; }
        if (f.locked) { const n = f.missing || 1; a.say(n === 1 ? 'Aquí hace falta una pista más del caso. Sigamos investigando.' : 'Aquí hacen falta ' + n + ' pistas más del caso. Sigamos investigando.', 3); G.audio.sfx('error'); this.out.push({ t: 'denied_soft' }); return; }
        if (f.quiet) { a.say('Ahora no habla nadie por aquí. Volvamos más tarde.', 2.6); G.audio.sfx('error'); this.out.push({ t: 'denied_soft' }); return; }
        const s = f.step;
        if (s.mini && !s.tool) { this.faceToward(a, (p.x + p.w / 2) * TS, (p.y + p.h / 2) * TS); G.audio.sfx('select'); this.out.push({ t: 'mini', p, step: s, who: a.id }); return; }
        if (s.tool === 'coop') { this.startCoop(a, p, s); return; }
        if (s.tool && !f.mine) { this.callPartner(a, f); return; }
        if (s.tool) this.equip(a, s.tool);
        this.faceToward(a, (p.x + p.w / 2) * TS, (p.y + p.h / 2) * TS);
        this.startWork(a, 'prop', p, s, f);
      }
    }
    equip(a, tool) {
      const i = a.tools.indexOf(tool);
      if (i >= 0 && a.toolIdx !== i) { a.toolIdx = i; G.audio.sfx('tool'); }
    }
    cycleTool(a) {
      if (a.work) return;
      a.toolIdx = (a.toolIdx + 1) % a.tools.length;
      G.audio.sfx('tool');
      this.out.push({ t: 'tool', who: a.id, tool: a.tool });
    }
    callPartner(a, f) {
      if (this.aiActive()) {
        const ai = this.players[1 - this.human];
        if (ai.task && ai.task.f === f.p) return;
        this.dispatch(ai, f);
      } else {
        const owner = G.toolOwner(f.needs, this.st.def);
        if (this.mode === 'online') this.out.push({ t: 'call', label: f.label, tool: f.needs });
        a.say(this.mode === 'online' ? '¡Aviso enviado a ' + G.roleName(owner) + '! Necesito su ' + G.TOOLS[f.needs].name : '¡Eso es trabajo para ' + G.roleName(owner) + '! (' + G.TOOLS[f.needs].name + ')', 2.6);
        G.audio.sfx('error');
        this.out.push({ t: 'denied_soft' });
      }
    }
    startWork(a, kind, target, step, f) {
      const tool = step.tool && step.tool !== 'coop' ? step.tool : null;
      const chat = kind === 'prop' && tool === 'grabadora' && target.chat && this.chatReady(target) ? { a: target.chat.a, b: target.chat.b, lines: target.chat.lines, idx: -1 } : null;
      // A4 3/4-b1: cartel de primer uso de cada herramienta (una vez por herramienta y partida). Va como bandera «tip_<herramienta>» del caso:
      // así se guarda con la partida a medias y se comparte online sin tocar el formato de nada más. El compañero remoto no la dispara aquí.
      if (tool && a.ctrl !== 'remote' && G.TOOLS[tool] && G.TOOLS[tool].first && !this.st.flags['tip_' + tool]) {
        this.st.setFlag('tip_' + tool);
        this.out.push({ t: 'tooltip', tool, text: G.TOOLS[tool].first, icon: G.TOOLS[tool].icon });
      }
      const dur = this.stepDuration(tool, step, chat);
      a.work = { kind, target, step, tool, t: 0, dur, tick: 0, x0: a.x, y0: a.y, watcher: kind === 'prop' && target.watcher ? target.watcher : null, chat };
      G.audio.sfx(tool ? 'tool' : 'select');
    }
    startCoop(a, p, step) {
      if (!this.coopWork || this.coopWork.p !== p) this.coopWork = { p, step, idx: st0(this, p), t: 0, dur: step.time || 2.2, idle: 0, warned: false };
      this.faceToward(a, (p.x + p.w / 2) * TS, (p.y + p.h / 2) * TS);
      if (this.mode === 'online' && !this.aiTakeover) this.out.push({ t: 'call', label: p.label || 'objeto', tool: 'coop' });
      if (this.aiActive()) {
        const ai = this.players[1 - this.human];
        this.dispatch(ai, { kind: 'prop', p, step, coop: true });
      }
    }
    useDoor(d) {
      this.out.push({ t: 'door', door: d });
    }
    completeStep(p, step, a) {
      const st = this.st;
      st.progress[p.key] = (st.progress[p.key] || 0) + 1;
      const fx = step.fx;
      if (fx) {
        if (fx.flag) st.setFlag(fx.flag);
        if (fx.money) st.bonusMoney += fx.money; // 4F-0a/4: monedas sueltas (se cobran al resolver el caso, regla P1 en CaseState.reward)
        if (fx.moveProp) {
          const q = this.room.props.find((x) => x.id === fx.moveProp.id);
          if (q) {
            q.x += fx.moveProp.dx; q.y += fx.moveProp.dy;
            const mv = st.moved[q.id] || { dx: 0, dy: 0 };
            mv.dx += fx.moveProp.dx; mv.dy += fx.moveProp.dy; st.moved[q.id] = mv;
            this.room.rebuild();
            this.puff((q.x + 0.5) * TS, (q.y + 0.8) * TS);
            G.audio.sfx('door');
          }
        }
      }
      let isNew = false;
      if (step.tool === 'grabadora' && p.chat) st.setFlag('grab_' + p.id); // GRAB-1: charla grabada (la transcripción del cuaderno sale de `chat.lines` si esta bandera está puesta)
      if (step.clue) isNew = st.addClue(step.clue, p.id);
      G.audio.sfx(fx && fx.sfx ? fx.sfx : isNew ? 'clue' : 'pickup');
      this.sparkleBurst((p.x + p.w / 2) * TS, (p.y + p.h / 2) * TS, isNew ? 14 : 6);
      this.out.push({ t: 'discover', who: step.who || a.id, text: step.text, clue: isNew ? step.clue : null, prop: p.id, by: a.id });
    }
    completeDoorWork(d, step, a) {
      this.st.setFlag('unlocked_' + d.id);
      G.audio.sfx('unlock');
      this.sparkleBurst((d.x + 0.5) * TS, TS * 0.6, 8);
      this.out.push({ t: 'toast', text: step.text || '¡Abierto!', icon: 'ico_key' });
    }

    // ---------- coop
    isPushing(a, p) {
      if (a.ctrl === 'ai') return !!(a.task && a.task.arrived && a.task.f && a.task.f.p === p);
      if (a.ctrl === 'remote') return !a.hidden && !!a.pushing && G.rectDist(a.x, a.y - 4, p.x * TS, p.y * TS, p.w * TS, p.h * TS) < 60;
      const inp = G.input.p[a.ctrl === 'p1' ? 1 : 0];
      return inp.actionDown && G.rectDist(a.x, a.y - 4, p.x * TS, p.y * TS, p.w * TS, p.h * TS) < 46;
    }
    updateCoop(dt) {
      const cw = this.coopWork;
      if (!cw) return;
      const n = this.players.filter((a) => this.isPushing(a, cw.p)).length;
      this.players.forEach((a) => { if (a.ctrl === 'remote') return; a.pushing = this.isPushing(a, cw.p); });
      this.players.forEach((a) => { if (a.ctrl === 'remote' && (a.hidden || !this.isPushing(a, cw.p))) a.rPush = false; else if (a.ctrl === 'remote') a.rPush = true; });
      if (n >= 2) {
        cw.t += dt; cw.idle = 0;
        if (Math.random() < dt * 8) this.sparkleBurst((cw.p.x + 0.5) * TS + (Math.random() - 0.5) * 30, (cw.p.y + 1) * TS, 1, true);
      } else {
        cw.idle += dt;
        if (n === 1 && !cw.warned && cw.idle > 0.9) {
          cw.warned = true;
          const a = this.players.find((q) => this.isPushing(q, cw.p));
          a && a.say(this.aiActive() ? '¡Aguanta! Mantén pulsado el botón mientras empujamos.' : '¡Necesita otro empujón! Mantened el botón los dos a la vez.', 3);
        }
        if (n === 0 && cw.idle > 0.6) this.coopWork = null;
      }
      if (cw && cw.t >= cw.dur) {
        const p = cw.p, step = cw.step;
        this.coopWork = null;
        this.players.forEach((a) => { if (a.ctrl !== 'remote') a.pushing = false; });
        const who = this.players[this.mode !== 'coop' ? this.human : 0];
        if ((this.st.progress[p.key] || 0) === cw.idx) this.completeStep(p, step, who);
      }
    }

    // ---------- efectos
    puff(x, y) { for (let i = 0; i < 7; i++) this.fx.push({ t: 0, life: 0.6, x: x + (Math.random() - 0.5) * 24, y: y + (Math.random() - 0.5) * 14, vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 20, k: 'puff', r: 8 + Math.random() * 8 }); }
    sparkleBurst(x, y, n, small) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 70; this.fx.push({ t: 0, life: 0.7 + Math.random() * 0.4, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, k: 'spark', r: small ? 4 : 7 }); } }
    updateFx(dt) {
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i];
        f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.k === 'spark' ? 90 : -10) * dt;
        if (f.t >= f.life) this.fx.splice(i, 1);
      }
    }

    // ---------- cámara
    viewports() { return [{ x: 0, y: 0, w: G.VW, h: G.VH }]; }
    camTarget(vp, fx, fy) {
      const r = this.room;
      let x = fx - vp.w / 2, y = fy - vp.h / 2;
      x = r.pw <= vp.w ? -(vp.w - r.pw) / 2 : G.clamp(x, 0, r.pw - vp.w);
      y = r.ph <= vp.h ? -(vp.h - r.ph) / 2 : G.clamp(y, 0, r.ph - vp.h);
      return { x, y };
    }
    focusPoint() {
      const p = this.players;
      if (this.mode !== 'coop') { const l = this.leader(); return { x: l.x, y: l.y - 20 }; }
      return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 - 20 };
    }
    snapCamera() {
      const f = this.focusPoint();
      const t = this.camTarget(this.viewports()[0], f.x, f.y);
      this.cam[0].x = t.x; this.cam[0].y = t.y;
      this.cam[1].x = t.x; this.cam[1].y = t.y;
    }
    updateCamera(dt) {
      const k = Math.min(1, dt * 6);
      const f = this.focusPoint();
      const t = this.camTarget(this.viewports()[0], f.x, f.y);
      this.cam[0].x += (t.x - this.cam[0].x) * k; this.cam[0].y += (t.y - this.cam[0].y) * k;
      this.cam[1].x = this.cam[0].x; this.cam[1].y = this.cam[0].y;
    }

    // ---------- objetivo (flecha amistosa)
    roomRoute(from, to) {
      if (from === to) return null;
      const defs = this.st.def.rooms;
      const q = [[from, null]], seen = { [from]: true };
      while (q.length) {
        const [cur, first] = q.shift();
        for (const d of defs[cur].doors) {
          const nx = d.to.room;
          if (seen[nx]) continue;
          seen[nx] = true;
          const f = first || d;
          if (nx === to) return f;
          q.push([nx, f]);
        }
      }
      return null;
    }
    targetPos() {
      const t = this.target;
      if (!t) return null;
      const defs = this.st.def.rooms;
      if (t.kind === 'accuse') return null;
      let rm = t.room;
      if (t.kind === 'npc') { const pl = this.st.placementOf(t.id); rm = pl && pl.room; }
      if (!rm) return null;
      if (rm !== this.roomId) {
        const door = this.roomRoute(this.roomId, rm);
        return door ? G.doorTarget(door) : null;
      }
      if (t.kind === 'npc') { const n = this.npcs[t.id]; return n ? { x: n.x, y: n.y - 24 } : null; }
      const r = this.rooms[rm] || { props: [], doors: [] };
      const p = (r.props || []).find((q) => q.id === t.id);
      if (p) return { x: (p.x + p.w / 2) * TS, y: (p.y + p.h / 2) * TS };
      const d = (r.doors || []).find((q) => q.id === t.id);
      if (d) return G.doorTarget(d);
      return null;
    }
    refreshTarget(dt) {
      this.targetT -= dt;
      if (this.targetT <= 0) { this.targetT = 0.8; this.target = this.st.nextAction(); }
    }

    // ---------- actualización
    update(dt, enabled) {
      this.time += dt;
      const st = this.st;
      this.updateFx(dt);
      this.refreshTarget(dt);
      // burbujas
      this.players.concat(this.npcsHere()).forEach((a) => { if (a.bubble) { a.bubble.t -= dt; if (a.bubble.t <= 0) a.bubble = null; } });
      if (!enabled) { this.players.forEach((a) => { a.moving = false; }); return; }
      this.unstickT = (this.unstickT || 0) - dt;
      if (this.unstickT <= 0) { this.unstickT = 0.5; this.players.forEach((p) => { if (p.ctrl !== 'remote') this.unstick(p); }); }

      const speed = G.stats().speed * 2.6;
      // jugadores humanos
      this.players.forEach((a) => {
        if (a.ctrl === 'ai' || a.ctrl === 'remote') return;
        const inp = G.input.p[a.ctrl === 'p1' ? 1 : 0];
        let mx = inp.mx, my = inp.my;
        if (a.work) {
          const w = a.work;
          let moved = Math.hypot(mx, my) > 0.2;
          if (w.chat) { // GRAB-1: zona muerta; un roce no corta, hace falta empujar de verdad un rato seguido
            w.mv = Math.hypot(mx, my) > G.REC_DEADZONE ? (w.mv || 0) + dt : Math.max(0, (w.mv || 0) - dt * 1.5);
            moved = w.mv > G.REC_GRACE;
          }
          if (moved && w.dur > 0.6 && !(w.kind === 'prop' && w.target.stay)) {
            const wasChat = !!w.chat;
            a.work = null;
            a.say('¡Me he movido!', wasChat ? 2 : 1.2);
            if (wasChat) this.out.push({ t: 'toast', text: 'Grabación cortada: quédate quieto cerca de ellos para repetirla', icon: 'ico_rec' }); // GRAB-1: aviso claro
            G.audio.sfx('back');
          } else {
            this.stepWork(a, dt);
          }
          a.moving = false;
        } else {
          const len = Math.hypot(mx, my);
          if (len > 0.05) {
            const sp = speed * a.speedMul;
            this.moveActor(a, mx * sp * dt, my * sp * dt);
            this.setFace(a, mx, my);
            a.moving = true;
            a.anim += dt;
          } else a.moving = false;
          if (inp.tool) this.cycleTool(a);
        }
        a.focus = a.work ? a.focus : this.findFocus(a);
        if (inp.action && !a.work) this.interact(a);
      });
      // IA del compañero
      this.updateCompanion && this.updateCompanion(dt);
      this.players.forEach((a) => { if (a.ctrl === 'ai' && a.work) this.stepWork(a, dt); });
      this.updateCoop(dt);
      this.updateNPCs(dt);
      this.updateCamera(dt);
      // linterna UV automática (visible)
      // sonido ambiente de la herramienta de grabar
    }
    stepWork(a, dt) {
      const w = a.work;
      if (!w) return;
      // vigilante (sigilo)
      if (w.watcher) {
        const n = this.npcs[w.watcher];
        const seen = n && n.watching;
        if (seen) {
          a.work = null;
          this.out.push({ t: 'spotted', who: a.id, npc: w.watcher });
          n.say(G.watchConfig(this.st.def, w.watcher).spotted, 2.6);
          a.say('¡Nos ha visto casi!', 2);
          G.audio.sfx('error');
          this.puff(a.x, a.y - 30);
          return;
        }
      }
      w.t += dt;
      w.tick += dt;
      if (w.tick > 0.22) { w.tick = 0; G.audio.sfx('work'); }
      if (w.chat) this.playChat(w);
      if (w.t >= w.dur) {
        a.work = null;
        if (w.kind === 'prop') this.completeStep(w.target, w.step, a);
        else this.completeDoorWork(w.target, w.step, a);
      }
    }
    // A4 2/4: mientras se graba, los dos personajes se turnan las frases (burbujas) y se miran entre sí; la frase i dura lo que le toca de la grabación
    playChat(w) {
      const c = w.chat, n = c.lines.length, slot = w.dur / n, i = Math.min(n - 1, Math.floor(w.t / slot));
      if (i === c.idx) return;
      c.idx = i;
      const ln = c.lines[i], npc = this.npcs[ln.who];
      if (npc && npc.room === this.roomId) { npc.say(ln.text, Math.max(0.6, slot * 0.98)); npc.bubble.chat = true; }
    }
    updateNPCs(dt) {
      const st = this.st;
      const ps = this.players;
      // quién está charlando ahora (alguien graba su charla); al acabar, se interrumpa o se cambie de sala, se callan solos
      const talking = {};
      ps.forEach((p) => { if (p.work && p.work.chat) { talking[p.work.chat.a] = p.work.chat.b; talking[p.work.chat.b] = p.work.chat.a; } });
      Object.keys(this.npcs).forEach((id) => {
        const n = this.npcs[id];
        if (talking[id]) n.chatWith = talking[id];
        else if (n.chatWith) { n.chatWith = null; if (n.bubble && n.bubble.chat) n.bubble = null; }
      });
      this.npcsHere().forEach((n) => {
        // mirar al jugador más cercano si está cerca
        let near = null, nd = 1e9;
        ps.forEach((p) => { const d = G.dist(p.x, p.y, n.x, n.y); if (d < nd) { nd = d; near = p; } });
        if (n.cat) {
          n.anim += dt;
          if (n.wanderList && n.wanderList.length) {
            n.wanderT -= dt;
            if (!n.dest && n.wanderT <= 0) { n.dest = n.wanderList[Math.floor(Math.random() * n.wanderList.length)]; }
            if (n.dest) {
              const dx = n.dest.x - n.x, dy = n.dest.y - n.y, d = Math.hypot(dx, dy);
              if (d < 4) { n.dest = null; n.wanderT = 3 + Math.random() * 5; n.moving = false; }
              else { this.moveActor(n, (dx / d) * 52 * dt, (dy / d) * 52 * dt); this.setFace(n, dx, 0); n.moving = true; }
            }
          }
          if (nd < 70 && !n.bubble && Math.random() < dt * 0.15) { n.say('Miau', 1.5); G.audio.sfx('meow'); }
          return;
        }
        if (n.chatWith) { const o = this.npcs[n.chatWith]; if (o && o.room === n.room) { this.faceToward(n, o.x, o.y); return; } }
        // vigilante: alterna mirar al frente / de espaldas si algún objeto de esta sala lo nombra en «watcher» (ritmo: G.watchConfig)
        if (this.room.props.some((p) => p.watcher === n.id)) {
          const wc = G.watchConfig(st.def, n.id);
          n.watching = G.watchLooking(wc, st.diff.id, this.time);
          if (n.watching) n.face = wc.face.watching; else if (!n.faceLock) n.face = wc.face.idle;
          return;
        }
        if (nd < 90) this.faceToward(n, near.x, near.y);
      });
    }

    // ============================================================ DIBUJO
    draw(ctx, dt) {
      const vps = this.viewports();
      ctx.fillStyle = '#120a1c';
      ctx.fillRect(0, 0, G.VW, G.VH);
      vps.forEach((vp, i) => this.drawView(ctx, vp, this.cam[i], null, i));
    }
    actorSpriteName(a) {
      if (a.cat) return 'cat_' + (a.moving ? 'walk' : 'sit') + '_' + (Math.floor(a.anim * 6) % 2);
      const dir = a.face === 'up' ? 'up' : a.face === 'down' ? 'down' : 'side';
      let fr = a.moving ? Math.floor(a.anim * 7) % 2 : 0;
      if (G.spr[`${a.look}_${dir}_2`]) fr = a.moving ? 1 + fr : 0; // personajes con 3 fotogramas: 0 = quieto, 1-2 = pasos
      if (dir === 'side' && a.face === 'left' && G.spr[`${a.look}_sideL_${fr}`]) return `${a.look}_sideL_${fr}`; // perfil izquierdo propio (pelo de Oli)
      return `${a.look}_${dir}_${fr}`;
    }
    drawActor(ctx, a) {
      const name = this.actorSpriteName(a);
      const s = G.spr[name];
      if (!s) return;
      G.drawSpr(ctx, 'shadow', a.x - 8 * S, a.y - 3 * S, { scale: S });
      const flip = a.face === 'left' && name.indexOf('_sideL_') < 0;
      let bob = a.moving ? Math.abs(Math.sin(a.anim * 14)) * 2 : 0;
      if (!a.moving && !a.cat && G.ANIM_BREATH !== false) bob = this.breath(a); // 4C-3b-1: respira en reposo (1 px lógico, solo visual)
      if (a.cat) G.drawSpr(ctx, name, a.x - 8 * S, a.y - 12 * S + 2, { scale: S, flip: a.face === 'left' });
      else G.drawSpr(ctx, name, a.x - 8 * S, a.y - 22 * S + 4 - bob, { scale: S, flip });
    }
    breath(a) { if (a.breathPh === undefined) a.breathPh = (G.hash(String(a.id)) % 628) / 100; return Math.sin(this.time * 2.1 + a.breathPh) > 0.5 ? G.S / 3 : 0; } // la fase se calcula una vez por personaje (no un hash por fotograma)
    propSprite(p) {
      if (p.swap && this.st.flags[p.swap.flag]) return p.swap.sprite;
      return p.sprite;
    }
    drawProp(ctx, p, t) {
      let name = this.propSprite(p);
      if (!name) return;
      if (p.animOn) name = G.animFrame(name, t, p.id);
      const s = G.spr[name];
      if (!s) return;
      const x = p.x * TS + ((p.w * TS - s.tw * S) / 2);
      const y = (p.y + p.h) * TS - s.th * S + (p.dy || 0) * S;
      let yy = y;
      if (p.pigeon) yy += Math.abs(Math.sin(t * 3 + p.t0)) * -2 + (Math.sin(t * 0.7 + p.t0) > 0.95 ? -6 : 0);
      G.drawSpr(ctx, name, x, yy, { scale: S });
    }
    // Capa de suelo animada (4C-3b-1): decoración y charcos animados, y los resplandores (sirena, farola) bajo los objetos y personajes.
    drawAnimLayer(ctx, t) {
      const room = this.room;
      if (!room.animCount) return;
      room.animDecor.forEach((d) => {
        const st = G.animState(d.sprite, t, d.key);
        if (!st) return;
        G.drawSpr(ctx, st.name, d.x * TS, d.y * TS, { scale: S });
        if (st.glow) { const s = G.spr[d.sprite]; this.drawGlow(ctx, st.glow, d.x * TS + (s ? s.tw : 16) * S / 2, d.y * TS + (s ? s.th : 16) * S); }
      });
      room.props.forEach((p) => {
        if (!p.animOn || !this.propVisible(p) || p.uvOnly) return;
        const st = G.animState(this.propSprite(p), t, p.id);
        if (st && st.glow) this.drawGlow(ctx, st.glow, p.x * TS + p.w * TS / 2, (p.y + p.h) * TS);
      });
    }
    drawGlow(ctx, g, cx, by) {
      const s = G.spr[g.sprite];
      if (!s) return;
      G.drawSpr(ctx, g.sprite, cx - s.tw * S / 2 + g.dx * S, by - s.th * S / 2 + g.dy * S, { scale: S });
    }
    shimmerOn(p, a) {
      const d = this.st.diff;
      if (d.sparkle === 'all') return true;
      if (this.hintIds[p.id]) return true;
      const sn = G.stats().sniff;
      if (sn && a) { const c = this.propCenter(p); if (G.dist(a.x, a.y, c.x, c.y) < sn * S * 1.2) return true; }
      return false;
    }
    drawView(ctx, vp, cam, only, vi) {
      const room = this.room, st = this.st, t = this.time;
      ctx.save();
      ctx.beginPath();
      ctx.rect(vp.x, vp.y, vp.w, vp.h);
      ctx.clip();
      ctx.fillStyle = '#120a1c';
      ctx.fillRect(vp.x, vp.y, vp.w, vp.h);
      ctx.save();
      ctx.translate(Math.round(vp.x - cam.x), Math.round(vp.y - cam.y));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(room.static, 0, 0);
      this.drawAnimLayer(ctx, t);
      // puertas
      room.doors.forEach((d) => {
        const state = this.doorState(d);
        let name = d.sprite;
        if (state !== 'open') name = d.lockedSprite || d.sprite;
        else {
          const rc = G.doorRect(d);
          const near = this.players.some((p) => !p.hidden && G.rectDist(p.x, p.y, rc[0], rc[1], rc[2], rc[3]) < 60);
          if (near && G.spr[d.sprite + '_open']) name = d.sprite + '_open';
        }
        G.drawSpr(ctx, name, d.x * TS, (d.y || 0) * TS, { scale: S });
      });
      // objetos y personajes ordenados por profundidad
      const list = [];
      room.props.forEach((p) => {
        if (!this.propVisible(p) || p.uvOnly) return;
        list.push({ k: (p.y + p.h) * TS + (p.solid ? 0 : 2), o: p, type: 'p' });
      });
      this.players.forEach((a) => { if (!a.hidden) list.push({ k: a.y, o: a, type: 'a' }); });
      this.npcsHere().forEach((a) => list.push({ k: a.y, o: a, type: 'a' }));
      list.sort((a, b) => a.k - b.k);
      list.forEach((e) => (e.type === 'p' ? this.drawProp(ctx, e.o, t) : this.drawActor(ctx, e.o)));
      // brillos de pista
      room.props.forEach((p) => {
        const info = this.propStepInfo(p);
        if (!info || info.done || !p.shimmer) return;
        const a = only || this.leader();
        if (!this.shimmerOn(p, a)) return;
        const c = this.propCenter(p);
        if (p.uvOnly) { const k2 = 0.5 + 0.5 * Math.sin(t * 3 + p.t0); U().icon(ctx, 'ico_question', c.x - 14, c.y - 40 - k2 * 4, 28); return; }
        const k = 0.5 + 0.5 * Math.sin(t * 4 + p.t0);
        G.drawSpr(ctx, 'sparkle', c.x - 4 * S, c.y - 26 - k * 5, { scale: S * (0.7 + k * 0.5), alpha: 0.9 });
      });
      // partículas
      this.fx.forEach((f) => {
        const a = 1 - f.t / f.life;
        ctx.globalAlpha = a;
        if (f.k === 'spark') G.drawSpr(ctx, 'sparkle', f.x - 4 * S * 0.5, f.y - 4 * S * 0.5, { scale: S * 0.5 * (0.6 + a) });
        else { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.4 - a * 0.6), 0, 6.3); ctx.fill(); }
        ctx.globalAlpha = 1;
      });
      ctx.restore();

      // ---- luz UV
      const uvs = this.uvSources();
      if (uvs.length) this.drawUV(ctx, vp, cam, uvs);

      // ---- ambiente
      const amb = room.def.ambient;
      if (amb) { ctx.fillStyle = amb; ctx.fillRect(vp.x, vp.y, vp.w, vp.h); }
      this.drawVignette(ctx, vp);
      this.drawMood(ctx, vp, t); // 4C-4b: luz tenue, niebla o polvo (solo en inquietante y macabro)

      // ---- elementos de interfaz en el mundo
      const w2s = (x, y) => ({ x: vp.x + x - cam.x, y: vp.y + y - cam.y });
      // interrogantes sobre PNJ
      this.npcsHere().forEach((n) => {
        if (n.cat) return;
        const nd = st.def.npcs[n.id];
        const fresh = !st.flags['talked_' + n.id] || st.topicsFor(n.id).some((q) => !q.seen);
        if (fresh) {
          const s = w2s(n.x, n.y - 26 * S - 6 - Math.abs(Math.sin(t * 3 + n.x)) * 4);
          U().icon(ctx, st.flags['talked_' + n.id] ? 'ico_exclaim' : 'ico_question', s.x - 14, s.y - 10, 28);
        }
      });
      // burbujas
      const placedBubbles = (this.hudZones || []).slice(); // FIX-4a (a)(b): globos ya colocados en este fotograma + zonas del HUD, para no solapar
      this.players.concat(this.npcsHere()).forEach((a) => {
        if (!a.bubble || a.hidden) return;
        if (only && a !== only && !a.isNpc) return;
        const s = w2s(a.x, a.y - (a.cat ? 14 * S : 24 * S) - 8);
        const feet = w2s(a.x, a.y); // pies de quien habla: si el globo no cabe encima, va debajo (FIX-4a parte 2)
        U().bubble(ctx, a.bubble.text, s.x, s.y, { alpha: Math.min(1, a.bubble.t * 3), feetY: feet.y + 6, avoid: placedBubbles });
      });
      // anillos de progreso y avisos
      this.players.forEach((a) => {
        if (a.hidden) return;
        if (a.work) this.drawRing(ctx, w2s(a.x, a.y - 24 * S - 12), a.work.t / a.work.dur, a.work.tool ? G.TOOLS[a.work.tool].icon : 'ico_hand');
        if (a.work && a.work.chat) { // GRAB-1: barra de grabación bajo el anillo; roja al llenarse el aviso de movimiento
          const bs = w2s(a.x, a.y - 24 * S - 12), bw = 56, bh = 7, fr = G.clamp(a.work.t / a.work.dur, 0, 1), warn = G.clamp((a.work.mv || 0) / G.REC_GRACE, 0, 1);
          ctx.save();
          ctx.fillStyle = 'rgba(30,18,50,0.9)'; ctx.fillRect(bs.x - bw / 2 - 2, bs.y + 25, bw + 4, bh + 4);
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bs.x - bw / 2, bs.y + 27, bw, bh);
          ctx.fillStyle = warn > 0.15 ? '#ff7a5a' : '#e24a4a'; ctx.fillRect(bs.x - bw / 2, bs.y + 27, bw * fr, bh);
          if (warn > 0.15) { ctx.fillStyle = '#ffd45a'; ctx.fillRect(bs.x - bw / 2, bs.y + 27 + bh - 2, bw * warn, 2); } // tira amarilla: te estás moviendo, ¡quieto!
          ctx.restore();
        }
        if (a.work && a.work.chat && Math.floor(this.time * 2.5) % 2 === 0) { // A4 2/4: punto rojo parpadeante «REC» mientras se graba una charla
          const rs = w2s(a.x, a.y - 24 * S - 12);
          ctx.save(); ctx.fillStyle = '#e83a3a'; ctx.beginPath(); ctx.arc(rs.x + 26 * S, rs.y - 14 * S, 4 * S, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        if (this.coopWork && (a.ctrl === 'remote' ? a.rPush : a.pushing)) {
          const s = w2s(a.x, a.y - 24 * S - 12);
          this.drawRing(ctx, s, this.coopWork.t / this.coopWork.dur, 'ico_hand');
        }
      });
      // flecha objetivo
      const lead = only || this.leader();
      if (this.arrowOn) this.drawArrow(ctx, vp, cam, lead);
      // indicador de jugador (solo cuando hay dos en pantalla)
      if (this.mode === 'online') {
        this.players.forEach((a) => {
          if (a.hidden) return;
          const s = w2s(a.x, a.y - 24 * S - 14);
          const col = a.id === 'rex' ? '#f0909c' : '#8cc4f0';
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.moveTo(s.x - 5, s.y - 9); ctx.lineTo(s.x + 5, s.y - 9); ctx.lineTo(s.x, s.y); ctx.closePath(); ctx.fill();
          if (a.ctrl === 'remote') U().text(ctx, G.ROLES[a.id].name, s.x, s.y - 28, { size: 12, align: 'center', color: col });
        });
      } else if (!only && this.mode === 'coop') {
        this.players.forEach((a, i) => {
          const s = w2s(a.x, a.y - 24 * S - 18);
          const col = a.id === 'rex' ? '#f0909c' : '#8cc4f0';
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.moveTo(s.x - 6, s.y - 10); ctx.lineTo(s.x + 6, s.y - 10); ctx.lineTo(s.x, s.y); ctx.closePath(); ctx.fill();
          U().text(ctx, 'J' + (i + 1), s.x, s.y - 28, { size: 12, align: 'center', color: col });
        });
      } else if (this.mode === 'solo' || this.aiTakeover) {
        const a = this.leader();
        const s = w2s(a.x, a.y - 24 * S - 14);
        ctx.fillStyle = a.id === 'rex' ? '#f0909c' : '#8cc4f0';
        ctx.beginPath(); ctx.moveTo(s.x - 5, s.y - 9); ctx.lineTo(s.x + 5, s.y - 9); ctx.lineTo(s.x, s.y); ctx.closePath(); ctx.fill();
      }
      // prompt de acción
      const prompt = (a, i) => {
        if (!a.focus || a.work || a.ctrl === 'ai' || a.ctrl === 'remote') return;
        if (only && a !== only) return;
        const f = a.focus;
        const s = w2s(a.x, a.y - 24 * S - 36);
        const key = G.input.touch.enabled ? 'A' : G.keyLabel(a.ctrl === 'p1' ? 1 : 0);
        let txt = f.verb + (f.label && f.kind !== 'npc' ? ': ' + f.label : f.kind === 'npc' ? ' con ' + f.label : '');
        if (f.kind === 'door') txt = (f.state === 'wait' ? 'Cerrada: ' : f.verb + ': ') + f.label;
        ctx.save();
        ctx.font = U().font(15);
        const w = ctx.measureText(txt).width + 64;
        const bad = f.needs && !f.mine && this.mode === 'coop';
        U().panel(ctx, s.x - w / 2, s.y - 26, w, 34, { fill: 'rgba(30,18,50,0.93)', stroke: bad ? '#ff7a6b' : '#ffd45a', r: 17, shadow: false });
        ctx.restore();
        U().icon(ctx, f.icon, s.x - w / 2 + 8, s.y - 23, 26);
        U().text(ctx, txt, s.x - w / 2 + 38, s.y - 19, { size: 15, color: bad ? '#ffb0a8' : '#fff4dc' });
        const kw = Math.max(22, U().measure(ctx, key, 13) + 12);
        U().panel(ctx, s.x + w / 2 - kw - 4, s.y - 22, kw, 26, { fill: '#ffd45a', stroke: '#c9a000', r: 6, shadow: false, lw: 1 });
        U().text(ctx, key, s.x + w / 2 - kw / 2 - 4, s.y - 18, { size: 13, color: '#2a1b30', align: 'center', shadow: false });
      };
      this.players.forEach(prompt);
      ctx.restore();
    }
    drawRing(ctx, s, frac, icon) {
      ctx.save();
      ctx.fillStyle = 'rgba(30,18,50,0.9)';
      ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, 6.3); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.arc(s.x, s.y, 17, 0, 6.3); ctx.stroke();
      ctx.strokeStyle = '#ffd45a';
      ctx.beginPath(); ctx.arc(s.x, s.y, 17, -Math.PI / 2, -Math.PI / 2 + 6.2832 * G.clamp(frac, 0, 1)); ctx.stroke();
      ctx.restore();
      U().icon(ctx, icon, s.x - 10, s.y - 10, 20);
    }
    drawArrow(ctx, vp, cam, lead) {
      const tp = this.targetPos();
      if (!tp) return;
      const sx = vp.x + tp.x - cam.x, sy = vp.y + tp.y - cam.y;
      const ax = vp.x + lead.x - cam.x, ay = vp.y + lead.y - cam.y - 40;
      const dx = sx - ax, dy = sy - ay, d = Math.hypot(dx, dy);
      const onScreen = sx > vp.x + 30 && sx < vp.x + vp.w - 30 && sy > vp.y + 30 && sy < vp.y + vp.h - 30;
      if (onScreen && d < 140) return;
      const ang = Math.atan2(dy, dx);
      let px, py;
      if (onScreen) { px = ax + Math.cos(ang) * 70; py = ay + Math.sin(ang) * 70; }
      else {
        const m = 34;
        const k = Math.min((dx > 0 ? vp.x + vp.w - m - ax : vp.x + m - ax) / (dx || 1e-6), (dy > 0 ? vp.y + vp.h - m - ay : vp.y + m - ay) / (dy || 1e-6));
        px = ax + dx * Math.min(k, 1); py = ay + dy * Math.min(k, 1);
      }
      const pulse = 1 + Math.sin(this.time * 6) * 0.12;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#ffd45a'; ctx.strokeStyle = '#2a1b30'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-8, -13); ctx.lineTo(-3, 0); ctx.lineTo(-8, 13); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.restore();
    }
    drawUV(ctx, vp, cam, uvs) {
      if (!this.uvc) this.uvc = G.makeCanvas(G.VW, G.VH);
      const c = this.uvc.getContext('2d');
      c.clearRect(0, 0, G.VW, G.VH);
      c.fillStyle = 'rgba(25,0,60,0.5)';
      c.fillRect(0, 0, vp.w, vp.h);
      c.globalCompositeOperation = 'destination-out';
      uvs.forEach((u) => {
        const x = u.x - cam.x, y = u.y - cam.y;
        const g = c.createRadialGradient(x, y, u.r * 0.15, x, y, u.r);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, u.r, 0, 6.3); c.fill();
      });
      c.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.uvc, 0, 0, vp.w, vp.h, vp.x, vp.y, vp.w, vp.h);
      // marcas y objetos ocultos
      ctx.save();
      ctx.beginPath(); ctx.rect(vp.x, vp.y, vp.w, vp.h); ctx.clip();
      ctx.translate(Math.round(vp.x - cam.x), Math.round(vp.y - cam.y));
      const pulse = 0.75 + 0.25 * Math.sin(this.time * 5);
      this.room.props.forEach((p) => {
        if (!this.propVisible(p)) return;
        const c2 = this.propCenter(p);
        const inside = uvs.some((u) => G.dist(u.x, u.y, c2.x, c2.y) < u.r);
        if (!inside) return;
        if (p.uvOnly) {
          const info = this.propStepInfo(p);
          ctx.globalAlpha = pulse;
          this.drawProp(ctx, p, this.time);
          ctx.globalAlpha = 1;
        }
        if (p.uvMark && (this.st.progress[p.key] || 0) >= p.uvMark.afterStep) {
          const s = G.spr[p.uvMark.sprite];
          if (s) {
            ctx.globalAlpha = pulse;
            ctx.shadowColor = '#7dffe7'; ctx.shadowBlur = 14;
            G.drawSpr(ctx, p.uvMark.sprite, p.x * TS, (p.y + p.h) * TS - s.th * S + (p.uvMark.dy || 0) * S - 4, { scale: S });
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
          }
        }
      });
      ctx.restore();
    }
    // ---------- 4C-4b: ambiente (luz tenue, niebla o polvo, zumbido y crujidos) según `def.mood`. En claro, o sin `mood` (el caso 1), no dibuja ni suena nada.
    atmos() {
      if (!this._atm || this._atm.room !== this.roomId) this._atm = { room: this.roomId, fx: G.moodFx ? G.moodFx(this.st.def, this.room.def.template) : null, phase: (G.hash(String(this.roomId)) % 628) / 100 };
      return this._atm.fx ? this._atm : null;
    }
    drawMood(ctx, vp, t) {
      const A = this.atmos();
      if (!A) return;
      const fx = A.fx, ph = A.phase;
      // la bombilla respira (parpadeo suave) y de vez en cuando se apaga un instante
      const soft = 0.5 + 0.5 * Math.sin(t * 1.7 + ph) * Math.sin(t * 5.3 + ph * 2);
      const dip = Math.max(0, 1 - Math.abs(((t + ph * 3) % fx.dipEvery) - 0.2) * 6);
      const a = Math.min(0.6, fx.dark * (1 + fx.flicker * (0.25 * soft + 0.6 * dip)));
      ctx.fillStyle = 'rgba(8,4,20,' + a.toFixed(3) + ')';
      ctx.fillRect(vp.x, vp.y, vp.w, vp.h);
      for (let i = 0; i < fx.vig; i++) this.drawVignette(ctx, vp);
      this.drawFog(ctx, vp, t, fx, ph);
    }
    drawFog(ctx, vp, t, fx, ph) {
      if (fx.fog === 'niebla') { // calle: tres bancos de niebla que cruzan despacio
        if (!this.fogTex) {
          const cv = G.makeCanvas(256, 64), c = cv.getContext('2d'), g = c.createRadialGradient(128, 128, 4, 128, 128, 128);
          g.addColorStop(0, 'rgba(205,215,235,0.9)'); g.addColorStop(1, 'rgba(205,215,235,0)');
          c.scale(1, 0.25); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
          this.fogTex = cv;
        }
        for (let i = 0; i < 3; i++) {
          const x = vp.x + ((t * (7 + i * 4) + i * vp.w * 0.45) % (vp.w * 1.6)) - vp.w * 0.5, y = vp.y + vp.h * (0.5 + i * 0.16) + Math.sin(t * 0.35 + i * 2 + ph) * 7;
          ctx.globalAlpha = fx.fogA * (0.75 + 0.25 * Math.sin(t * 0.5 + i * 1.3));
          ctx.drawImage(this.fogTex, x, y, vp.w * 1.1, vp.h * 0.22);
        }
        ctx.globalAlpha = 1;
        return;
      }
      // interior: motas de polvo que flotan y se encienden y apagan
      const f = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }, md = (v, m) => ((v % m) + m) % m;
      for (let i = 0; i < 28; i++) {
        const x = vp.x + md(f(i) * vp.w + t * (2 + f(i + 50) * 5), vp.w), y = vp.y + md(f(i + 100) * vp.h + Math.sin(t * 0.5 + i) * 9 - t * (0.8 + f(i + 150) * 1.6), vp.h);
        ctx.fillStyle = 'rgba(232,226,255,' + (fx.fogA * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 1.7))).toFixed(3) + ')';
        ctx.fillRect(x, y, S, S);
      }
    }
    // zumbido continuo y crujidos de vez en cuando (los llama la escena cada fotograma, también con diálogos abiertos; `on` = false lo apaga, p. ej. en la pantalla de resultados)
    ambience(dt, on) {
      const A = on ? this.atmos() : null;
      if (G.audio && G.audio.ambience) G.audio.ambience(A ? A.fx.hum : 0);
      if (!A || !A.fx.creak) { this.creakT = undefined; return; }
      if (this.creakT === undefined) this.creakT = A.fx.creak * (0.3 + 0.7 * Math.random());
      this.creakT -= dt;
      if (this.creakT <= 0) { if (G.audio) G.audio.sfx('creak'); this.creakT = A.fx.creak * (0.6 + 0.8 * Math.random()); }
    }
    drawVignette(ctx, vp) {
      if (!this.vig) {
        const cv = G.makeCanvas(G.VW, G.VH);
        const c = cv.getContext('2d');
        const g = c.createRadialGradient(G.VW / 2, G.VH / 2, G.VH * 0.45, G.VW / 2, G.VH / 2, G.VH * 0.95);
        g.addColorStop(0, 'rgba(10,0,25,0)');
        g.addColorStop(1, 'rgba(10,0,25,0.5)');
        c.fillStyle = g;
        c.fillRect(0, 0, G.VW, G.VH);
        this.vig = cv;
      }
      ctx.drawImage(this.vig, 0, 0, G.VW, G.VH, vp.x, vp.y, vp.w, vp.h);
    }
  }
  G.World = World;

  G.keyLabel = function (pi) {
    const solo = G.input.mode === 'solo';
    if (G.input.padsConnected && (solo ? pi === 0 : G.input.padsConnected > pi)) return 'A';
    return solo ? 'E' : pi === 0 ? 'E' : 'Intro';
  };
})(typeof window !== 'undefined' ? window : globalThis);
