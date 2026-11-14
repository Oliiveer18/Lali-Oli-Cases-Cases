// play.js — escena de juego: HUD, ventanas (diálogo, descubrimiento, cuaderno, pausa), capítulos, acusación y resultados.
(function (root) {
  'use strict';
  const G = root.G;
  const U = G.ui;
  const C = U.colors;

  // ------------------------------------------------------------ guardado de partida a medias
  G.CaseState.prototype.snapshot = function () {
    return JSON.parse(JSON.stringify({
      time: this.time, chapter: this.chapter, clues: this.clues, clueOrder: this.clueOrder, flags: this.flags, npc: this.npc,
      shown: this.shown, asked: this.asked, progress: this.progress, moved: this.moved, wrong: this.wrong, failedAccs: this.failedAccs, hintsUsed: this.hintsUsed,
      freeHints: this.freeHints, bonusMoney: this.bonusMoney, timePenalty: this.timePenalty, testimony: this.testimony || {},
    }));
  };
  G.CaseState.prototype.restore = function (s) { Object.assign(this, JSON.parse(JSON.stringify(s))); };

  G.speaker = function (def, who) {
    if (who === 'rex' || who === 'luna') return { name: G.ROLES[who].name, look: who, color: G.ROLES[who].color };
    if (!who || who === 'narrator') return { name: '', look: null, color: C.dim };
    const n = def.npcs[who];
    return { name: n ? n.name : who, look: n ? (n.cat ? null : n.look) : who, color: C.pink };
  };

  // ------------------------------------------------------------ MODAL: secuencia de líneas / descubrimiento
  class LineSeq {
    constructor(scene, lines, o) {
      this.s = scene;
      this.lines = lines;
      this.i = 0;
      this.o = o || {};
      this.typer = new U.Typer();
      this.t = 0;
      this.setLine();
    }
    setLine() {
      const l = this.lines[this.i];
      this.typer.set(l.text);
      G.speak(l.text);
    }
    update(dt) {
      this.t += dt;
      this.typer.update(dt);
      const m = G.input.menu;
      if (m.ok || G.input.mouse.clicked) {
        if (!this.typer.done) this.typer.skip();
        else {
          this.i++;
          if (this.i >= this.lines.length) return 'done';
          this.setLine();
          G.audio.sfx('select');
        }
      }
      if (m.back && this.o.skippable !== false && this.lines.length > 1) return 'done';
    }
    draw(ctx) {
      const def = this.s.st.def;
      const l = this.lines[this.i];
      const sp = G.speaker(def, l.who);
      const x = 36, y = 352, w = G.VW - 72, h = 158;
      U.panel(ctx, x, y, w, h);
      let tx = x + 24;
      if (sp.look) { U.portrait(ctx, sp.look, x + 18, y + 18, 108); tx = x + 148; }
      if (this.o.header) {
        const hw = U.measure(ctx, this.o.header, 15) + 28;
        U.panel(ctx, x + 20, y - 17, hw, 32, { fill: '#ffd45a', stroke: '#c9a000', r: 16, shadow: false });
        U.text(ctx, this.o.header, x + 34, y - 11, { size: 15, color: '#2a1b30', shadow: false });
        if (this.o.icon) U.icon(ctx, this.o.icon, x + 24 + hw, y - 22, 36);
      }
      if (sp.name) U.text(ctx, sp.name, tx, y + 14, { size: 18, color: sp.color });
      U.text(ctx, this.typer.shown, tx, y + (sp.name ? 42 : 20), { size: 18, maxW: w - (tx - x) - 28, lineH: 25, maxH: h - (sp.name ? 42 : 20) - 12, minSize: 12 });
      if (this.typer.done && Math.floor(this.t * 2.5) % 2 === 0) U.text(ctx, '▶', x + w - 34, y + h - 34, { size: 20, color: C.accent });
    }
  }

  // ------------------------------------------------------------ A3 INTRO-1: Informe del caso (al empezar, desde la Pausa y como pestaña «Caso» del Cuaderno)
  // Dibuja el informe dentro del rectángulo x,y,w (alto útil 356). Sin título: lo pone quien lo llama.
  G.drawBriefing = function (ctx, st, x, y, w, o) {
    o = o || {};
    const b = G.caseBriefing(st), ink = o.ink || '#2a1b30', lab = o.lab || '#8f5c33', num = o.num || '#d94a3f';
    const T = (txt, tx, ty, op) => U.text(ctx, txt, tx, ty, Object.assign({ color: ink, shadow: false, bold: false }, op));
    T('NOS CONTRATA', x, y, { size: 13, color: lab, bold: true });
    T(b.client, x, y + 16, { size: 21, bold: true, maxW: w, maxH: 28, minSize: 14 });
    T('QUÉ HA PASADO', x, y + 52, { size: 13, color: lab, bold: true });
    T(b.what, x, y + 70, { size: 18, maxW: w, lineH: 24, maxH: 100, minSize: 13 });
    T('QUÉ HAY QUE HACER', x, y + 178, { size: 13, color: lab, bold: true });
    b.todo.forEach((t, i) => {
      const ty = y + 198 + i * 52;
      ctx.fillStyle = num; ctx.beginPath(); ctx.arc(x + 14, ty + 14, 14, 0, Math.PI * 2); ctx.fill();
      T(String(i + 1), x + 14, ty + 5, { size: 16, align: 'center', color: '#fff', bold: true });
      T(t, x + 40, ty, { size: 17, maxW: w - 44, lineH: 22, maxH: 48, minSize: 12 });
    });
    return b;
  };
  class Briefing {
    constructor(scene, reopened) {
      this.s = scene; this.t = 0;
      this.menu = new U.Menu([{ label: reopened ? 'Volver' : 'Empezar a investigar', icon: 'ico_arrow' }], { x: G.VW / 2 - 170, y: 468, w: 340, h: 42 });
    }
    update(dt) {
      this.t += dt;
      if (this.t < 0.4) return; // un dedo apoyado de antes no lo cierra
      const r = this.menu.update();
      if (r.chosen === 0 || r.back) return 'done';
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(12,6,22,0.92)'; ctx.fillRect(0, 0, G.VW, G.VH);
      U.panel(ctx, 70, 22, G.VW - 140, 440, { fill: '#f6ead0', stroke: '#8f5c33', lw: 4, r: 14 });
      U.text(ctx, 'INFORME DEL CASO', G.VW / 2, 34, { size: 15, align: 'center', color: '#8f5c33', shadow: false, bold: true });
      U.text(ctx, this.s.st.def.title, G.VW / 2, 54, { size: 28, align: 'center', color: '#2a1b30', shadow: false, maxW: 780, maxH: 34, minSize: 16 });
      G.drawBriefing(ctx, this.s.st, 100, 98, 760);
      this.menu.draw(ctx);
    }
  }

  // ------------------------------------------------------------ MODAL: tarjeta de capítulo
  class Card {
    constructor(scene, big, small, secs) { this.s = scene; this.big = big; this.small = small; this.t = 0; this.secs = secs || 2.6; }
    update(dt) { this.t += dt; if (this.t > this.secs || (this.t > 0.5 && (G.input.menu.ok || G.input.mouse.clicked))) return 'done'; }
    draw(ctx) {
      const a = Math.min(1, this.t * 3, (this.secs - this.t) * 3);
      ctx.save();
      ctx.globalAlpha = Math.max(0, a) * 0.92;
      ctx.fillStyle = '#150d22';
      ctx.fillRect(0, 0, G.VW, G.VH);
      ctx.globalAlpha = Math.max(0, a);
      U.text(ctx, this.small, G.VW / 2, G.VH / 2 - 62, { size: 20, align: 'center', color: C.accent });
      U.text(ctx, this.big, G.VW / 2, G.VH / 2 - 26, { size: 40, align: 'center', maxW: 820 });
      ctx.fillStyle = C.accent;
      ctx.fillRect(G.VW / 2 - 90, G.VH / 2 + 44, 180, 3);
      ctx.restore();
    }
  }

  const nd0 = (nd) => (nd.cat ? '(Bigotes te mira con ojos de «¿tienes atún?»)' : '¿Qué queréis saber?');
  // ------------------------------------------------------------ MODAL: conversación con un personaje
  class Talk {
    constructor(scene, npcId) {
      this.s = scene;
      this.id = npcId;
      this.st = scene.st;
      this.nd = this.st.def.npcs[npcId];
      this.typer = new U.Typer();
      this.lines = [];
      this.li = 0;
      this.stage = 'say';
      this.menu = null;
      this.t = 0;
      this.pick = null;
      this.after = null;
      this.lastText = nd0(this.nd);
      this.obj = 0;
      const g = this.st.startTalk(npcId);
      if (g) this.show(g.lines, null);
      else this.openMenu();
    }
    show(lines, after) {
      this.lines = lines && lines.length ? lines : ['...'];
      this.li = 0;
      this.stage = 'say';
      this.after = after;
      this.typer.set(this.lines[0]);
      G.speak(this.lines[0]);
    }
    apply(res, record) {
      if (res.sfx) G.audio.sfx(res.sfx);
      if (res.objection) { this.obj = 1.7; G.audio.sfx('objection'); G.award('protesto'); if (res.allRefuted) G.award('cazamentiras'); }
      if (res.catReward) G.award('gato');
      if (res.newClues) res.newClues.forEach((c) => { const cd = this.st.def.clues[c]; U.toast('Pista: ' + cd.title, 3.4, { icon: cd.icon }); G.audio.sfx('clue'); });
      // FIX-3a: lo dicho por un ofendido: si se calla no se anota nada; si habla con rencor se anota aparte («Dicho con rencor»)
      if (record && (!res.offended || res.rancor)) {
        const T = (this.st.testimony = this.st.testimony || {});
        const e = { topic: record, text: res.lines.join(' ') };
        if (res.rancor) e.rancor = true;
        (T[this.id] = T[this.id] || []).push(e);
        if (T[this.id].length > 8) T[this.id].shift();
      }
      this.show(res.lines, () => this.openMenu());
    }
    openMenu() {
      const st = this.st, nd = this.nd, id = this.id;
      this.stage = 'menu';
      const items = [];
      st.topicsFor(id).forEach((t) => items.push({ kind: 'topic', id: t.id, label: t.label, icon: 'ico_question', right: t.seen ? '' : '¡nuevo!' }));
      if (nd.cat) items.push({ kind: 'chat', label: 'Acariciar', icon: 'ico_heart' });
      else {
        items.push({ kind: 'chat', label: 'Charlar amablemente', icon: 'ico_heart', sub: 'Gana confianza y baja la presión' });
        items.push({ kind: 'press', label: 'Presionar', icon: 'ico_fire', sub: 'Sube la presión: puede hacerles saltar... o cerrarse' });
        items.push({ kind: 'present', label: 'Mostrar una prueba…', icon: 'ico_clue', disabled: st.clueCount() === 0 });
      }
      items.push({ kind: 'bye', label: 'Despedirse', icon: 'ico_arrow' });
      // FIX-6a (fallo 1): la lista termina siempre en y=340; si no cabe, se desplaza dentro de la ventana [view.top, 340] en vez de salirse por arriba
      this.menu = new U.Menu(items, { x: 36, y: 14, w: 330, h: 44, gap: 6, view: { top: 14, bottom: 340 } });
      this.menu.items.forEach((it) => (it.h = it.sub ? 52 : 44));
      this.menu.o.y = Math.max(this.menu.o.view.top, this.menu.o.view.bottom - this.menu.contentH());
      this.menu.o.h = 44;
    }
    openPicker() {
      const st = this.st;
      this.stage = 'pick';
      const items = st.clueOrder.slice().reverse().map((c) => ({ id: c, label: st.def.clues[c].title, icon: st.def.clues[c].icon, right: st.shown[this.id + ':' + c] ? 'ya mostrada' : '', rightColor: C.dim }));
      items.push({ id: null, label: 'Volver', icon: 'ico_arrow' });
      // FIX-6a (fallo 3): ya no se corta la lista (antes slice(0, 9)); se desplaza dentro de la ventana [14, 340]
      this.pick = new U.Menu(items, { x: 36, y: 14, w: 420, h: 38, gap: 5, view: { top: 14, bottom: 340 } });
      this.pick.o.y = Math.max(14, 340 - this.pick.contentH());
    }
    update(dt) {
      this.t += dt;
      if (this.obj > 0) this.obj -= dt;
      this.typer.update(dt);
      const m = G.input.menu;
      if (this.stage === 'say') {
        if (m.ok || G.input.mouse.clicked) {
          if (!this.typer.done) this.typer.skip();
          else {
            this.li++;
            if (this.li >= this.lines.length) { const f = this.after; this.after = null; f ? f() : this.openMenu(); }
            else { this.typer.set(this.lines[this.li]); G.speak(this.lines[this.li]); G.audio.sfx('select'); }
          }
        }
        return;
      }
      if (this.stage === 'menu') {
        const r = this.menu.update();
        if (r.back) return 'done';
        if (r.chosen >= 0) {
          const it = this.menu.items[r.chosen];
          const st = this.st;
          if (it.kind === 'bye') return 'done';
          if (it.kind === 'topic') this.apply(st.ask(this.id, it.id), it.label);
          else if (it.kind === 'chat') { const res = st.chat(this.id); this.apply(res, null); this.s.dir.bump(); }
          else if (it.kind === 'press') { this.apply(st.press(this.id), null); }
          else if (it.kind === 'present') this.openPicker();
        }
        return;
      }
      if (this.stage === 'pick') {
        const r = this.pick.update();
        if (r.back) { this.openMenu(); return; }
        if (r.chosen >= 0) {
          const it = this.pick.items[r.chosen];
          if (it.id === null) this.openMenu();
          else this.openConfirm(it.id);   // FIX-6b (fallo 7): elegir una prueba solo la selecciona; se enseña con el botón «Mostrar prueba»
        }
        return;
      }
      if (this.stage === 'confirm') {
        const r = this.conf.update();
        if (r.back || r.chosen === 1) { this.stage = 'pick'; return; }
        if (r.chosen === 0) this.apply(this.st.present(this.id, this.confId), null);
      }
    }
    openConfirm(clueId) {
      this.stage = 'confirm';
      this.confId = clueId;
      const g = this.pickGeom();
      this.conf = new U.Menu([{ label: 'Mostrar prueba', icon: 'ico_clue' }, { label: 'Volver', icon: 'ico_arrow' }], { x: 470, y: g.py + g.ph + 8, w: 440, h: 44, gap: 10, cols: 2 });
      G.audio.sfx('select');
    }
    // sitio de la ficha de la prueba: sube lo justo para que debajo quepan los botones (sin pisar el panel de diálogo, y 352)
    pickGeom() {
      const lblUp = this.pick.o.y - 28 >= 4, ph = lblUp ? 140 : 154;
      return { lblUp, ph, dy: lblUp ? 0 : 22, py: Math.min(this.pick.o.y, 340 - ph - 52) };
    }
    draw(ctx) {
      const st = this.st, nd = this.nd;
      const x = 36, y = 352, w = G.VW - 72, h = 158;
      // panel de respuesta
      U.panel(ctx, x, y, w, h);
      if (nd.look && !nd.cat) U.portrait(ctx, nd.look, x + 18, y + 18, 108);
      else U.icon(ctx, 'ico_heart', x + 36, y + 36, 72);
      const tx = x + 148;
      U.text(ctx, nd.name, tx, y + 12, { size: 18, color: C.pink });
      U.text(ctx, nd.title || '', tx + U.measure(ctx, nd.name, 18) + 12, y + 16, { size: 13, color: C.dim, bold: false });
      // medidores
      const n = st.npc[this.id];
      if (!nd.cat) {
        U.icon(ctx, 'ico_heart', x + w - 250, y + 10, 22);
        for (let i = 0; i < 4; i++) { U.rrect(ctx, x + w - 224 + i * 18, y + 15, 14, 12, 4); ctx.fillStyle = i < n.trust ? '#ff7a9a' : 'rgba(255,255,255,0.15)'; ctx.fill(); }
        U.icon(ctx, 'ico_fire', x + w - 140, y + 10, 22);
        for (let i = 0; i < 4; i++) { U.rrect(ctx, x + w - 114 + i * 18, y + 15, 14, 12, 4); ctx.fillStyle = i < n.pressure ? '#ff9a3e' : 'rgba(255,255,255,0.15)'; ctx.fill(); }
      }
      const txt = this.stage === 'say' ? this.typer.shown : this.lastText || '';
      if (this.stage === 'say') this.lastText = this.typer.shown;
      U.text(ctx, this.lastText || '', tx, y + 42, { size: 18, maxW: w - (tx - x) - 28, lineH: 25, maxH: h - 42 - 12, minSize: 12 });
      if (this.stage === 'say' && this.typer.done && Math.floor(this.t * 2.5) % 2 === 0) U.text(ctx, '▶', x + w - 34, y + h - 34, { size: 20, color: C.accent });
      if (st.isLocked(this.id)) U.text(ctx, `Se ha cerrado en banda (${Math.ceil(st.lockLeft(this.id))} s)`, x + w - 20, y + h - 30, { size: 14, align: 'right', color: C.bad });
      if (this.stage === 'menu') this.menu.draw(ctx);
      if (this.stage === 'pick' || this.stage === 'confirm') {
        // FIX-6b (pendiente 2): con lista larga el rótulo ya no cabe encima (y < 0); pasa a la columna de la ficha
        const { lblUp, py, ph, dy } = this.pickGeom();
        if (lblUp) U.text(ctx, '¿Qué prueba le enseñas?', 40, this.pick.o.y - 28, { size: 16, color: C.accent });
        this.pick.draw(ctx);
        const it = this.pick.items[this.pick.sel];
        if (it && it.id) {
          const cd = st.def.clues[it.id];
          U.panel(ctx, 470, py, 440, ph);
          if (!lblUp) U.text(ctx, '¿Qué prueba le enseñas?', 490, py + 8, { size: 13, color: C.dim });
          U.text(ctx, cd.title, 490, py + 12 + dy, { size: 17, color: C.accent });
          U.text(ctx, cd.text, 490, py + 40 + dy, { size: 14, maxW: 400, bold: false, lineH: 19, maxH: ph - 40 - dy - 8, minSize: 11 });
        }
        if (this.stage === 'confirm') this.conf.draw(ctx);
      }
      if (this.obj > 0) {
        const k = this.obj;
        ctx.save();
        if (k > 1.5) { ctx.fillStyle = 'rgba(255,255,255,' + ((k - 1.5) / 0.2) * 0.85 + ')'; ctx.fillRect(0, 0, G.VW, G.VH); }
        const sc = 1 + Math.max(0, k - 1.35) * 1.6;
        ctx.translate(G.VW / 2 + (Math.random() - 0.5) * 8 * Math.min(1, k), 150 + (Math.random() - 0.5) * 6 * Math.min(1, k));
        ctx.rotate(-0.07);
        ctx.scale(sc, sc);
        ctx.globalAlpha = Math.min(1, k * 2.5);
        ctx.font = U.font(88);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 14; ctx.strokeStyle = '#2a1b30'; ctx.strokeText('¡PROTESTO!', 0, 0);
        ctx.fillStyle = '#ff5a4a'; ctx.fillText('¡PROTESTO!', 0, 0);
        ctx.font = U.font(22);
        ctx.lineWidth = 6; ctx.strokeStyle = '#2a1b30'; ctx.strokeText('Eso no cuadra con las pruebas', 0, 62);
        ctx.fillStyle = '#fff4dc'; ctx.fillText('Eso no cuadra con las pruebas', 0, 62);
        ctx.restore();
      }
    }
  }

  // ------------------------------------------------------------ MODAL: cuaderno de detective
  class Notebook {
    constructor(scene, tab) {
      this.s = scene;
      this.st = scene.st;
      this.tab = tab || 0;
      this.sel = [0, 0, 0];
      this.acc = { culprit: null, method: null, motive: null, proof: [] };
      // FIX-6b (fallo 8): si ya se falló, la pantalla de Acusar vuelve con lo elegido en el último intento fallado
      const lf = this.st.lastFailed && this.st.lastFailed();
      if (lf && !this.st.closed) this.acc = { culprit: lf.c, method: lf.m, motive: lf.v, proof: (lf.p || []).slice() };
      this.nFail = (this.st.failedAccs || []).length;
      this.rep = this.isRepeat();
      this.sub = 'slots';
      this.slots = null;
      this.chooser = null;
      this.confirm = null;
      this.t = 0;
      this.buildSlots();
    }
    tabsDef() { return ['Pistas', 'Sospechosos', 'Testimonios', 'Acusar', 'Caso']; }
    // FIX-6b (fallo 8): ¿lo elegido ahora es una combinación que ya falló?
    isRepeat() {
      const A = this.acc, o = this.st.boardOptions();
      const ready = A.culprit && (!o.method || A.method) && (!o.motive || A.motive) && (!o.proof || A.proof.length >= 2);
      return !!(ready && this.st.wasFailed && this.st.wasFailed(A));
    }
    buildSlots() {
      const o = this.st.boardOptions(), sol = this.st.def.solution, st7 = this.st;
      const A = this.acc;
      const nameOf = (list, id) => { const f = list.find((x) => x.id === id); return f ? f.name || f.text : '—'; };
      const items = [];
      items.push({ k: 'culprit', label: '¿Quién fue?', right: A.culprit ? nameOf(this.st.def.suspects, A.culprit) : '—', icon: 'ico_question' });
      // CL-3 (v7): orden quién · por qué · cómo; motivo y método llevan 🔒 hasta tener 1 pista del tema (elegir en un hueco cerrado no cuenta como fallo)
      const v7 = st7.isV7();
      const mItem = () => { const lk = !st7.gapOpen('method'); return { k: 'method', label: '¿Cómo lo hizo?', right: lk ? '🔒' : A.method ? '✔' : '—', sub: lk ? 'Aún no tenéis pistas sobre el método. Buscad cómo lo hizo.' : A.method ? sol.methods.find((m) => m.id === A.method).text : 'Elige el método', icon: 'ico_lupa', h: 54, disabled: lk }; };
      const vItem = () => { const lk = !st7.gapOpen('motive'); return { k: 'motive', label: '¿Por qué?', right: lk ? '🔒' : A.motive ? '✔' : '—', sub: lk ? 'Aún no tenéis pistas sobre el motivo. Buscad qué ganaba con ello.' : A.motive ? sol.motives.find((m) => m.id === A.motive).text : 'Elige el motivo', icon: 'ico_bulb', h: 54, disabled: lk }; };
      if (v7) { if (o.motive) items.push(vItem()); if (o.method) items.push(mItem()); }
      else {
        if (o.method) items.push({ k: 'method', label: '¿Cómo lo hizo?', right: A.method ? '✔' : '—', sub: A.method ? sol.methods.find((m) => m.id === A.method).text : 'Elige el método', icon: 'ico_lupa', h: 54 });
        if (o.motive) items.push({ k: 'motive', label: '¿Por qué?', right: A.motive ? '✔' : '—', sub: A.motive ? sol.motives.find((m) => m.id === A.motive).text : 'Elige el motivo', icon: 'ico_bulb', h: 54 });
      }
      if (o.proof) items.push({ k: 'proof', label: 'Pruebas clave', right: A.proof.length + '/3', sub: 'Elige hasta 3 pistas que lo demuestren', icon: 'ico_clue', h: 54 });
      const ready = A.culprit && (!o.method || A.method) && (!o.motive || A.motive) && (!o.proof || A.proof.length >= 2);
      const faltan = [].concat(!A.culprit ? ['quién fue'] : [], o.motive && !A.motive ? ['por qué'] : [], o.method && !A.method ? ['cómo'] : []);
      items.push({ k: 'go', label: this.isRepeat() ? '¡ACUSAR! (ya falló)' : '¡ACUSAR!', icon: 'ico_star', disabled: !ready, color: C.accent, h: v7 && !ready && faltan.length ? 54 : undefined, sub: v7 && !ready && faltan.length ? 'Falta elegir: ' + faltan.join(' / ') : undefined });
      const keep = this.slots ? this.slots.sel : 0;
      this.slots = new U.Menu(items, { x: 70, y: 168, w: 380, h: 44, gap: 8 });
      this.slots.sel = G.clamp(keep, 0, items.length - 1);
    }
    openChooser(k) {
      const st = this.st, sol = st.def.solution, o = st.boardOptions();
      const items = [];
      if (k === 'culprit') st.accuseList().forEach(({ s, ok }) => items.push({ id: s.id, label: s.name, sub: ok ? s.desc : 'Aún no habéis hablado con esta persona', h: 52, disabled: !ok, right: !ok ? '🔒' : st.diff.autoMark && st.suspectCleared(s.id) ? 'descartado' : '', rightColor: C.dim }));
      if (k === 'method') sol.methods.forEach((m) => items.push({ id: m.id, label: m.text, right: st.diff.autoMark && m.needs && m.needs.length ? (m.needs.every((c) => st.hasClue(c)) ? 'hay pistas' : 'sin pistas') : '', rightColor: m.needs && m.needs.every((c) => st.hasClue(c)) ? C.good : C.dim }));
      if (k === 'motive') sol.motives.forEach((m) => items.push({ id: m.id, label: m.text, right: st.diff.autoMark && m.needs && m.needs.length ? (m.needs.every((c) => st.hasClue(c)) ? 'hay pistas' : 'sin pistas') : '', rightColor: m.needs && m.needs.every((c) => st.hasClue(c)) ? C.good : C.dim }));
      if (k === 'proof') {
        st.clueOrder.forEach((c) => items.push({ id: c, label: st.def.clues[c].title, icon: st.def.clues[c].icon, right: this.acc.proof.indexOf(c) >= 0 ? '✔' : '', rightColor: C.good }));
        items.push({ id: '__done', label: 'Listo', icon: 'ico_arrow' });
      }
      // FIX-6a (fallos 2 y 3): motivos/métodos con filas más altas (hasta 3 líneas) y lista con desplazamiento en vez de cortarla (antes slice(0, 11))
      if (k === 'method' || k === 'motive') items.forEach((it) => (it.h = 56));
      this.chooser = { k, menu: new U.Menu(items, { x: 480, y: 136, w: 400, h: 40, gap: 5, view: { top: 136, bottom: 462 } }) };
      this.sub = 'choose';
    }
    update(dt) {
      this.t += dt;
      const m = G.input.menu, st = this.st;
      const mouse = G.input.mouse;
      // FIX-6b (fallo 8): si el compañero falla (online) o cambia la elección, el aviso se actualiza al momento
      const nf = (st.failedAccs || []).length, rp = this.isRepeat();
      const gk = st.isV7() ? (st.gapOpen('motive') ? 1 : 0) + (st.gapOpen('method') ? 2 : 0) : 0; // CL-3: un hueco se abre al encontrar su primera pista
      if (nf !== this.nFail || rp !== this.rep || gk !== this.gk) { this.nFail = nf; this.rep = rp; this.gk = gk; this.buildSlots(); }
      if (this.sub === 'confirm') {
        const r = this.confirm.update();
        if (r.back) { this.sub = 'slots'; return; }
        if (r.chosen === 0) { this.s.onAccuse({ culprit: this.acc.culprit, method: this.acc.method, motive: this.acc.motive, proof: this.acc.proof }); return 'done'; }
        if (r.chosen === 1) this.sub = 'slots';
        return;
      }
      if (this.sub === 'choose') {
        const r = this.chooser.menu.update();
        if (r.back) { this.sub = 'slots'; return; }
        if (r.chosen >= 0) {
          const it = this.chooser.menu.items[r.chosen], k = this.chooser.k;
          if (k === 'proof') {
            if (it.id === '__done') { this.sub = 'slots'; this.buildSlots(); return; }
            const i = this.acc.proof.indexOf(it.id);
            if (i >= 0) this.acc.proof.splice(i, 1); else if (this.acc.proof.length < 3) this.acc.proof.push(it.id);
            it.right = this.acc.proof.indexOf(it.id) >= 0 ? '✔' : '';
          } else { this.acc[k] = it.id; this.sub = 'slots'; this.buildSlots(); }
        }
        return;
      }
      // pestañas
      const tabs = this.tabsDef();
      if (m.back) return 'done';
      if (this.tab !== 3) {
        if (m.left) { this.tab = (this.tab + tabs.length - 1) % tabs.length; G.audio.sfx('select'); }
        if (m.right) { this.tab = (this.tab + 1) % tabs.length; G.audio.sfx('select'); }
      } else if (this.sub === 'slots') {
        const r = this.slots.update();
        if (m.left) { this.tab = 2; G.audio.sfx('select'); }
        if (m.right) { this.tab = 4; G.audio.sfx('select'); }
        if (r.chosen >= 0) {
          const it = this.slots.items[r.chosen];
          if (it.k === 'go') { this.confirm = new U.Menu([{ label: 'Sí, ¡acusar!', icon: 'ico_star', color: C.accent }, { label: 'Seguir investigando', icon: 'ico_arrow' }], { x: 490, y: 320, w: 340, h: 46, gap: 8 }); this.sub = 'confirm'; }
          else this.openChooser(it.k);
        }
      }
      if (mouse.clicked) {
        const tw = 150;
        tabs.forEach((t, i) => { if (U.hit(70 + i * (tw + 8), 44, tw, 38)) { this.tab = i; G.audio.sfx('select'); this.sub = 'slots'; } });
        if (U.hit(G.VW - 100, 44, 56, 38)) return 'done';
      }
      // listas
      if (this.tab === 0) {
        const n = st.clueOrder.length;
        if (n) {
          if (m.up) this.sel[0] = (this.sel[0] + n - 1) % n;
          if (m.down) this.sel[0] = (this.sel[0] + 1) % n;
          if (mouse.clicked) {
            const base = Math.max(0, Math.min(this.sel[0] - 3, n - 8));
            for (let i = 0; i < Math.min(8, n); i++) if (U.hit(70, 104 + i * 46, 330, 42)) this.sel[0] = base + i;
            if (U.hit(300, 472, 44, 34)) { this.sel[0] = (this.sel[0] + n - 1) % n; G.audio.sfx('select'); }
            if (U.hit(350, 472, 44, 34)) { this.sel[0] = (this.sel[0] + 1) % n; G.audio.sfx('select'); }
          }
        }
      }
      if (this.tab === 1) {
        const list = st.boardOptions().suspects, n = list.length;
        if (m.up || m.left) this.sel[1] = (this.sel[1] + n - 1) % n;
        if (m.down || m.right) this.sel[1] = (this.sel[1] + 1) % n;
        if (mouse.clicked) { const cw = Math.min(200, (G.VW - 160) / n - 10); for (let i = 0; i < n; i++) if (U.hit(70 + i * (cw + 12), 104, cw, 360)) { this.sel[1] = i; G.audio.sfx('select'); } }
      }
      if (this.tab === 2) {
        const n = Math.max(1, this.testimonyNpcs().length);
        if (m.up) this.sel[2] = (this.sel[2] + n - 1) % n;
        if (m.down) this.sel[2] = (this.sel[2] + 1) % n;
        if (mouse.clicked) for (let i = 0; i < this.testimonyNpcs().length; i++) if (U.hit(70, 104 + i * 62, 240, 56)) { this.sel[2] = i; G.audio.sfx('select'); }
      }
    }
    testimonyNpcs() {
      const st = this.st;
      return Object.keys(st.def.npcs).filter((id) => !st.def.npcs[id].cat && (st.testimony && st.testimony[id] && st.testimony[id].length));
    }
    lieRefuted(npcId) {
      const L = this.st.def.lies && this.st.def.lies[npcId];
      if (!L || !this.st.flags[L.flag]) return null;
      return L.refutedBy.some((c) => this.st.hasClue(c)) ? 'refuted' : 'open';
    }
    draw(ctx) {
      const st = this.st, def = st.def;
      ctx.fillStyle = 'rgba(12,6,22,0.72)';
      ctx.fillRect(0, 0, G.VW, G.VH);
      const px = 50, py = 30, pw = G.VW - 100, ph = G.VH - 56;
      U.panel(ctx, px, py + 50, pw, ph - 50, { fill: '#f6ead0', stroke: '#8f5c33', lw: 4, r: 14 });
      // anillas
      for (let i = 0; i < 9; i++) { ctx.fillStyle = '#8a8498'; ctx.fillRect(px + 20 + i * 92, py + 42, 10, 18); }
      const tabs = this.tabsDef();
      const cols = ['#d94a3f', '#4d7fd6', '#5dae5a', '#f09a3e', '#8c6bd6'];
      tabs.forEach((t, i) => {
        const x = 70 + i * 158, sel = i === this.tab;
        U.rrect(ctx, x, sel ? 40 : 46, 150, sel ? 46 : 38, 10);
        ctx.fillStyle = sel ? cols[i] : '#c9b690'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#2a1b30'; ctx.stroke();
        U.text(ctx, t, x + 75, (sel ? 40 : 46) + (sel ? 12 : 9), { size: 17, align: 'center', color: sel ? '#fff' : '#5d4a30', shadow: false });
      });
      U.icon(ctx, 'ico_arrow', G.VW - 94, 48, 28);
      U.text(ctx, G.input.touch.enabled ? '✕' : 'Esc', G.VW - 71, 56, { size: 12, color: '#fff', shadow: true });
      const ink = '#2a1b30';
      const body = (txt, x, y, o) => U.text(ctx, txt, x, y, Object.assign({ color: ink, shadow: false, size: 15, bold: false, lineH: 21 }, o));
      if (this.tab === 0) this.drawClues(ctx, ink, body);
      if (this.tab === 1) this.drawSuspects(ctx, ink, body);
      if (this.tab === 2) this.drawTestimony(ctx, ink, body);
      if (this.tab === 3) this.drawAccuse(ctx, ink, body);
      if (this.tab === 4) G.drawBriefing(ctx, st, 80, 108, G.VW - 160, { ink });
      U.text(ctx, G.input.touch.enabled ? 'Toca las pestañas y las listas · ✕ para cerrar' : '←/→ pestañas   ↑/↓ mover   Esc cerrar', px + pw / 2, py + ph - 26, { size: 12, align: 'center', color: '#8f7a55', shadow: false, bold: false });
    }
    drawClues(ctx, ink, body) {
      const st = this.st, n = st.clueOrder.length;
      if (!n) { body('Aún no habéis encontrado pistas.\nExplorad la escena: ¡acercaos a los objetos y pulsad el botón de acción!', 90, 140, { size: 18, lineH: 28 }); return; }
      const base = Math.max(0, Math.min(this.sel[0] - 3, n - 8));
      for (let i = 0; i < Math.min(8, n); i++) {
        const idx = base + i, id = st.clueOrder[idx], cd = st.def.clues[id], sel = idx === this.sel[0];
        U.rrect(ctx, 70, 104 + i * 46, 330, 42, 8);
        ctx.fillStyle = sel ? '#ffe59a' : 'rgba(143,92,51,0.12)'; ctx.fill();
        if (sel) { ctx.lineWidth = 2; ctx.strokeStyle = '#c9a000'; ctx.stroke(); }
        U.icon(ctx, cd.icon, 76, 108 + i * 46, 32);
        body(cd.title, 116, 114 + i * 46, { size: 15, bold: true, maxW: 276 });
      }
      body(n + ' pistas', 70, 478, { size: 13, color: '#8f7a55' });
      [['▲', 300], ['▼', 350]].forEach(([t, bx]) => {
        U.panel(ctx, bx, 472, 44, 34, { fill: U.hit(bx, 472, 44, 34) ? '#ffe59a' : '#fff6e0', stroke: '#a8895c', shadow: false, r: 8, lw: 2 });
        U.text(ctx, t, bx + 22, 479, { size: 16, align: 'center', color: ink, shadow: false });
      });
      const id = st.clueOrder[this.sel[0]], cd = st.def.clues[id];
      U.icon(ctx, cd.icon, 430, 108, 64);
      body(cd.title, 508, 112, { size: 22, bold: true });
      body(cd.kind.toUpperCase(), 508, 144, { size: 12, color: '#8f7a55', bold: true });
      const tr = this.chatTranscript(id); // GRAB-1: pista que vino de una charla grabada: se puede releer lo que dijeron
      if (tr) {
        body(cd.text, 430, 172, { size: 15, maxW: 410, lineH: 21, maxH: 96, minSize: 12 });
        body('TRANSCRIPCIÓN · ' + tr.place, 430, 276, { size: 12, color: '#8f7a55', bold: true });
        body(tr.lines.map((l) => l.name + ': ' + l.text).join('\n'), 430, 296, { size: 14, maxW: 410, lineH: 19, maxH: 150, minSize: 11, color: '#5a4630' });
      } else body(cd.text, 430, 190, { size: 17, maxW: 410, lineH: 25, maxH: 195, minSize: 12 });
      if (st.diff.autoMark && cd.sus) {
        const pts = Object.keys(cd.sus).filter((k) => cd.sus[k] !== 0).map((k) => { const s = st.def.suspects.find((q) => q.id === k); return (cd.sus[k] > 0 ? '▲ Señala a ' : '▼ Descarta a ') + (s ? s.name : k); });
        if (pts.length) body(pts.join('\n'), 430, tr ? 452 : 390, { size: 15, color: '#5f3b8e', bold: true });
      }
    }
    // GRAB-1: transcripción de la charla grabada que entregó esta pista (null si no vino de una charla o aún no se ha grabado)
    chatTranscript(clueId) {
      const st = this.st, rooms = st.def.rooms || {};
      for (const rid of Object.keys(rooms)) {
        const p = (rooms[rid].props || []).find((q) => q.id === 'obj_' + clueId && q.chat);
        if (p && st.flags['grab_' + p.id]) {
          const nm = (id) => (st.def.npcs[id] && st.def.npcs[id].name) || id;
          return { place: rooms[rid].name || rid, lines: p.chat.lines.map((l) => ({ name: nm(l.who), text: l.text })) };
        }
      }
      return null;
    }
    drawSuspects(ctx, ink, body) {
      const st = this.st, list = st.boardOptions().suspects;
      const cw = Math.min(200, (G.VW - 160) / list.length - 10);
      list.forEach((s, i) => {
        const x = 70 + i * (cw + 12), y = 104, sel = i === this.sel[1];
        U.rrect(ctx, x, y, cw, 360, 12);
        ctx.fillStyle = sel ? '#ffe59a' : '#fff6e0'; ctx.fill();
        ctx.lineWidth = sel ? 3 : 2; ctx.strokeStyle = sel ? '#c9a000' : '#a8895c'; ctx.stroke();
        if (s.look === 'cat') U.icon(ctx, 'ico_heart', x + cw / 2 - 40, y + 16, 80);
        else U.portrait(ctx, s.look, x + cw / 2 - 52, y + 14, 104);
        // FIX-6a (fallo 5): el nombre puede ocupar 2 líneas (máx. 52 px, se reduce hasta 13 px); la descripción empieza justo debajo y usa lo que quede hasta «Sospecha» (y+246)
        const nmL = U.textLayout(ctx, s.name, { size: 17, bold: true, maxW: cw - 16, maxH: 52, minSize: 13, lineH: 22 });
        body(s.name, x + cw / 2, y + 128, { size: 17, bold: true, align: 'center', maxW: cw - 16, maxH: 52, minSize: 13, lineH: 22 });
        const dy = Math.max(156, 128 + nmL.h + 4);
        body(s.desc, x + 12, y + dy, { size: 14, maxW: cw - 24, lineH: 19, maxH: 246 - dy, minSize: 11 });
        if (st.diff.autoMark) {
          const v = st.suspicion(s.id);
          body('Sospecha', x + 12, y + 250, { size: 13, color: '#8f7a55', bold: true });
          U.meter(ctx, x + 12, y + 272, cw - 24, 14, G.clamp(v / 6, 0, 1), v > 0 ? '#d94a3f' : '#8a8498', 'rgba(143,92,51,0.2)');
          if (st.suspectCleared(s.id)) {
            ctx.save(); ctx.translate(x + cw / 2, y + 320); ctx.rotate(-0.15);
            ctx.strokeStyle = '#3d8446'; ctx.lineWidth = 4; ctx.strokeRect(-66, -18, 132, 36);
            body('DESCARTADO', 0, -10, { size: 18, color: '#3d8446', bold: true, align: 'center' });
            ctx.restore();
          }
        }
      });
    }
    drawTestimony(ctx, ink, body) {
      const st = this.st, ids = this.testimonyNpcs();
      if (!ids.length) { body('Aún no habéis anotado declaraciones.\nHablad con los sospechosos y preguntadles qué hicieron anoche.', 90, 140, { size: 18, lineH: 28 }); return; }
      ids.forEach((id, i) => {
        const nd = st.def.npcs[id], sel = i === this.sel[2];
        U.rrect(ctx, 70, 104 + i * 62, 240, 56, 10);
        ctx.fillStyle = sel ? '#ffe59a' : 'rgba(143,92,51,0.12)'; ctx.fill();
        if (sel) { ctx.lineWidth = 2; ctx.strokeStyle = '#c9a000'; ctx.stroke(); }
        U.portrait(ctx, nd.look, 76, 108 + i * 62, 48);
        body(nd.name, 134, 118 + i * 62, { size: 15, bold: true, maxW: 170 });
        const lr = this.lieRefuted(id);
        if (lr === 'refuted') U.icon(ctx, 'ico_exclaim', 272, 112 + i * 62, 30);
      });
      const id = ids[G.clamp(this.sel[2], 0, ids.length - 1)];
      const nd = st.def.npcs[id];
      body('Declaraciones de ' + nd.name, 340, 108, { size: 20, bold: true });
      let y = 144;
      (st.testimony[id] || []).forEach((tm) => {
        body('«' + tm.topic + '»' + (tm.rancor ? ' · Dicho con rencor (sin pruebas)' : ''), 340, y, { size: 13, color: tm.rancor ? '#a8322f' : '#8f7a55', bold: true, maxW: 500 });
        y += 18;
        const h = U.text(ctx, tm.text, 340, y, { size: 15, color: ink, shadow: false, bold: false, maxW: 500, lineH: 20, maxH: Math.max(24, 402 - y), minSize: 11 });
        y += h + 10;
      });
      const L = st.def.lies && st.def.lies[id];
      if (L && st.flags[L.flag]) {
        const ref = this.lieRefuted(id) === 'refuted';
        U.panel(ctx, 340, 408, 500, 54, { fill: ref ? '#fde2dc' : '#f1ecd9', stroke: ref ? '#d94a3f' : '#a8895c', shadow: false, r: 10 });
        body(ref ? '¡Contradicción! Sus pruebas desmienten lo que dijo.' : 'Algo huele raro en esta declaración... ¿se podrá demostrar?', 354, 424, { size: 15, bold: true, color: ref ? '#a8322f' : '#5d4a30', maxW: 480 });
      }
    }
    drawAccuse(ctx, ink, body) {
      const st = this.st;
      if (this.isRepeat()) body('✗ Esta combinación ya falló: cambiad algo', 70, 100, { size: 20, bold: true, color: '#a8281e', maxW: 380, maxH: 24, minSize: 12 });
      else body('Montad vuestra acusación', 70, 100, { size: 20, bold: true });
      const cutNext = st.diff.wrongCut[Math.min(st.wrong + 1, st.diff.wrongCut.length - 1)];
      body('Intentos: ' + st.strikesLeft() + ' de ' + st.diff.strikes + '. ' + (st.strikesLeft() === 1 ? 'Último intento: si falláis, el caso termina sin recompensa.' : 'Si falláis, el acusado se ofende un rato' + (cutNext > 0 ? ' y la recompensa baja un ' + Math.round((cutNext - st.cut()) * 100) + ' %' : '') + '.'), 70, 124, { size: 15, maxW: 380, lineH: 20, maxH: 42, minSize: 12, color: '#8f7a55' });
      this.slots.draw(ctx);
      if (this.sub === 'choose') {
        U.panel(ctx, 466, 100, 430, 370, { fill: '#fff6e0', stroke: '#a8895c', shadow: false });
        const k = this.chooser.k;
        body(k === 'culprit' ? 'Elige al culpable' : k === 'method' ? 'Elige el método' : k === 'motive' ? 'Elige el motivo' : 'Elige hasta 3 pruebas', 484, 108, { size: 17, bold: true });
        this.chooser.menu.draw(ctx);
      } else if (this.sub === 'confirm') {
        U.panel(ctx, 466, 230, 430, 190, { fill: '#fff6e0', stroke: '#a8895c', shadow: false });
        body('¿Estáis seguros?', 490, 246, { size: 20, bold: true });
        body(this.isRepeat() ? 'Ya fallasteis con esta combinación. Os quedan ' + st.strikesLeft() + ' intento(s): cambiad algo.' : 'Os quedan ' + st.strikesLeft() + ' intento(s). Una acusación equivocada no sale gratis...', 490, 276, Object.assign({ size: 15, maxW: 390, maxH: 40, minSize: 12, lineH: 19 }, this.isRepeat() ? { color: '#a8281e' } : {}));
        this.confirm.draw(ctx);
      } else {
        const bd = G.spr['ico_book'] ? 1 : 0;
        U.icon(ctx, 'ico_star', 712, 170, 96);
        body('Cuando tengáis las pruebas,\n¡cerrad el caso!', 760, 290, { size: 18, align: 'center', bold: true, lineH: 26 });
      }
    }
  }


  // ------------------------------------------------------------ MODAL: minijuegos (código y línea de tiempo)
  class Mini {
    constructor(scene, cfg) {
      this.s = scene; this.cfg = cfg; this.t = 0; this.solved = false; this.shake = 0; this.doneT = 0;
      if (cfg.type === 'code') { this.entry = ''; this.keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'X']; }
      else {
        const ev = cfg.events.map((e, i) => Object.assign({ i }, e));
        const r = G.rng(cfg.events.length * 7 + 3);
        let guard = 0;
        do { for (let k = ev.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); const tmp = ev[k]; ev[k] = ev[j]; ev[j] = tmp; } } while (ev.every((e, i) => e.i === i) && guard++ < 20);
        this.ev = ev; this.picked = [];
        this.menu = new U.Menu(this.items(), { x: 150, y: 128, w: 660, h: 56, gap: 8 });
      }
    }
    items() {
      return this.ev.map((e) => {
        const n = this.picked.indexOf(e.i);
        const it = { label: e.text, sub: e.clue ? 'Según: ' + this.s.st.def.clues[e.clue].title : '', h: 56 };
        if (n >= 0) { it.disabled = true; it.right = this.cfg.events[e.i].time || (n + 1) + 'º'; it.rightColor = C.good; }
        return it;
      });
    }
    wrong(msg) {
      this.shake = 0.5; G.audio.sfx('error'); U.toast(msg, 2.6, { color: C.bad }); this.s.dir.denied();
    }
    win() { this.solved = true; this.doneT = 0.9; G.audio.sfx('unlock'); }
    press(ch) {
      if (this.solved || this.shake > 0) return;
      const code = this.cfg.code;
      if (ch === '⌫') { this.entry = this.entry.slice(0, -1); G.audio.sfx('select'); return; }
      if (ch === 'X') { this.closing = true; return; }
      if (this.entry.length >= code.length) return;
      this.entry += ch; G.audio.sfx('tool');
      if (this.entry.length === code.length) { if (this.entry === code) this.win(); else { this.wrong('Código incorrecto.'); this.entry = ''; } }
    }
    keyRects() {
      const out = [];
      this.keys.forEach((k, i) => out.push({ k, x: 350 + (i % 3) * 90, y: 250 + Math.floor(i / 3) * 60, w: 80, h: 52 }));
      return out;
    }
    update(dt) {
      this.t += dt;
      if (this.shake > 0) this.shake -= dt;
      if (this.solved) { this.doneT -= dt; if (this.doneT <= 0) return 'done'; return; }
      const m = G.input.menu, I = G.input;
      if (m.back || this.closing) return 'done';
      if (this.cfg.type === 'code') {
        for (let d = 0; d <= 9; d++) if (I.keyPressed('Digit' + d) || I.keyPressed('Numpad' + d)) this.press(String(d));
        if (I.keyPressed('Backspace')) this.press('⌫');
        if (I.mouse.clicked) {
          this.keyRects().forEach((r) => { if (U.hit(r.x, r.y, r.w, r.h)) this.press(r.k); });
          if (U.hit(640, 32, 36, 36)) return 'done';
        }
        return;
      }
      if (I.mouse.clicked && U.hit(790, 32, 36, 36)) return 'done';
      this.menu.setItems(this.items());
      const r = this.menu.update();
      if (r.chosen >= 0 && this.shake <= 0) {
        const e = this.ev[r.chosen];
        if (e.i === this.picked.length) {
          this.picked.push(e.i); G.audio.sfx('pickup');
          if (this.picked.length === this.ev.length) this.win();
        } else { this.picked = []; this.wrong('Ese no es el siguiente suceso. Empieza otra vez.'); }
      }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(12,6,22,0.8)'; ctx.fillRect(0, 0, G.VW, G.VH);
      const sx = this.shake > 0 ? Math.sin(this.t * 70) * 7 : 0;
      ctx.save(); ctx.translate(sx, 0);
      if (this.cfg.type === 'code') {
        U.panel(ctx, 280, 24, 400, 480, { lw: 3 });
        U.text(ctx, this.cfg.title || 'Candado', 480, 38, { size: 22, align: 'center', color: C.accent, maxW: 330, maxH: 28, minSize: 14 }); // CL-5c-c 4/4: con texto grande el título del puzle (más largo que el del caso 1) se encogía fuera del botón ✕
        U.text(ctx, this.cfg.hint || '', 480, 76, { size: 15, align: 'center', maxW: 360, bold: false, lineH: 20 });
        const n = this.cfg.code.length, w = 62, gap = 10, x0 = 480 - (n * w + (n - 1) * gap) / 2;
        for (let i = 0; i < n; i++) {
          U.panel(ctx, x0 + i * (w + gap), 160, w, 70, { fill: this.solved ? '#235a34' : 'rgba(12,6,22,0.9)', stroke: this.solved ? C.good : C.accent, shadow: false, r: 10 });
          U.text(ctx, this.entry[i] || (this.solved ? this.cfg.code[i] : ''), x0 + i * (w + gap) + w / 2, 170, { size: 44, align: 'center' });
        }
        this.keyRects().forEach((r) => {
          const hov = U.hit(r.x, r.y, r.w, r.h);
          U.panel(ctx, r.x, r.y, r.w, r.h, { fill: hov ? '#6a47b8' : 'rgba(70,50,110,0.92)', stroke: hov ? C.accent : '#7d62b8', shadow: false, r: 10 });
          U.text(ctx, r.k === 'X' ? 'Cerrar' : r.k, r.x + r.w / 2, r.y + (r.k === 'X' ? 17 : 8), { size: r.k === 'X' ? 15 : 28, align: 'center' });
        });
        U.panel(ctx, 640, 32, 36, 36, { fill: 'rgba(70,50,110,0.9)', shadow: false, r: 8 });
        U.text(ctx, '✕', 658, 39, { size: 18, align: 'center' });
        if (this.solved) U.text(ctx, '¡Se abre!', 480, 485, { size: 18, align: 'center', color: C.good });
      } else {
        U.panel(ctx, 130, 24, 700, 492, { lw: 3 });
        U.text(ctx, this.cfg.title || 'Línea de tiempo', 480, 36, { size: 24, align: 'center', color: C.accent, maxW: 580, maxH: 30, minSize: 15 });
        U.text(ctx, this.cfg.hint || 'Toca los sucesos de lo más antiguo a lo más reciente.', 480, 76, { size: 15, align: 'center', maxW: 620, bold: false });
        this.menu.draw(ctx);
        U.text(ctx, this.picked.length + ' de ' + this.ev.length + ' colocados', 480, 490, { size: 14, align: 'center', color: C.dim, bold: false });
        U.panel(ctx, 790, 32, 36, 36, { fill: 'rgba(70,50,110,0.9)', shadow: false, r: 8 });
        U.text(ctx, '✕', 808, 39, { size: 18, align: 'center' });
      }
      ctx.restore();
    }
  }

  // ------------------------------------------------------------ MODAL: pausa
  class Pause {
    constructor(scene) {
      this.s = scene;
      this.menu = new U.Menu([
        { label: 'Seguir jugando', icon: 'ico_arrow' },
        { label: 'Informe del caso', icon: 'ico_book' },
        { label: 'Cómo se juega', icon: 'ico_question' },
        { label: 'Música: ' + (G.save.data.settings.music ? 'sí' : 'no'), icon: 'ico_bulb' },
        { label: 'Voz narrada: ' + (G.save.data.settings.voice ? 'sí' : 'no'), icon: 'ico_rec' },
        { label: 'Salir al despacho', icon: 'ico_lock', sub: 'Se guarda el último capítulo alcanzado', h: 54 },
      ], { x: 300, y: 150, w: 360, h: 46, gap: 8 });
      this.help = false; this.brief = null;
    }
    update(dt) {
      if (this.brief) { if (this.brief.update(dt) === 'done') this.brief = null; return; }
      if (this.help) { if (G.input.menu.ok || G.input.menu.back || G.input.mouse.clicked) this.help = false; return; }
      const r = this.menu.update();
      if (r.back || G.input.p[0].pause) return 'done';
      if (r.chosen === 0) return 'done';
      if (r.chosen === 1) this.brief = new Briefing(this.s, true);
      if (r.chosen === 2) this.help = true;
      if (r.chosen === 3) { G.save.data.settings.music = !G.save.data.settings.music; this.menu.items[3].label = 'Música: ' + (G.save.data.settings.music ? 'sí' : 'no'); G.save.store(); }
      if (r.chosen === 4) { G.save.data.settings.voice = !G.save.data.settings.voice; this.menu.items[4].label = 'Voz narrada: ' + (G.save.data.settings.voice ? 'sí' : 'no'); G.save.store(); }
      if (r.chosen === 5) { this.s.exitToHub(); }
    }
    draw(ctx) {
      ctx.fillStyle = 'rgba(12,6,22,0.7)';
      ctx.fillRect(0, 0, G.VW, G.VH);
      if (this.brief) { this.brief.draw(ctx); return; }
      if (this.help) { G.drawHelp(ctx, this.s.world.mode); return; }
      U.text(ctx, 'PAUSA', G.VW / 2, 90, { size: 40, align: 'center', color: C.accent });
      this.menu.draw(ctx);
    }
  }

  // ------------------------------------------------------------ MODAL: resultados
  class Result {
    constructor(scene, res, ok, failMsg) {
      this.s = scene; this.res = res; this.ok = ok; this.failMsg = failMsg; this.t = 0;
      this.menu = new U.Menu([{ label: 'Volver al despacho', icon: 'ico_arrow' }], { x: G.VW / 2 - 170, y: 440, w: 340, h: 48 });
    }
    update(dt) {
      this.t += dt;
      if (this.t > 0.8) { const r = this.menu.update(); if (r.chosen === 0 || r.back) { this.s.exitToHub(true); } }
    }
    draw(ctx) {
      const r = this.res, st = this.s.st;
      ctx.fillStyle = 'rgba(12,6,22,0.9)'; ctx.fillRect(0, 0, G.VW, G.VH);
      U.text(ctx, this.ok ? '¡CASO RESUELTO!' : 'CASO FALLIDO', G.VW / 2, 36, { size: 44, align: 'center', color: this.ok ? C.good : C.bad });
      U.text(ctx, st.def.title, G.VW / 2, 92, { size: 22, align: 'center', color: C.accent });
      if (this.ok) for (let i = 0; i < 3; i++) {
        const k = G.clamp((this.t - 0.3 - i * 0.35) * 4, 0, 1);
        U.icon(ctx, i < r.stars ? 'ico_star' : 'ico_star_off', G.VW / 2 - 130 + i * 90, 126 - (1 - k) * 30, 80 * (0.6 + 0.4 * k));
      } else U.text(ctx, this.failMsg || '', G.VW / 2, 140, { size: 18, align: 'center', maxW: 700 });
      const rows = [
        ['Tiempo', G.fmtTime(r.time)],
        ['Pistas', st.clueCount() + ' de ' + st.totalClues()],
        ['Acusaciones falladas', String(st.wrong)],
        ['Dificultad', st.diff.name],
        ['Recompensa', '+' + r.money + ' monedas'],
        ['Reputación', '+' + r.rep],
      ];
      rows.forEach((row, i) => {
        const y = 236 + i * 32;
        U.text(ctx, row[0], G.VW / 2 - 200, y, { size: 19, color: C.dim });
        U.text(ctx, row[1], G.VW / 2 + 200, y, { size: 19, align: 'right', color: i === 4 ? C.accent : C.text });
      });
      // CL-3 (v7): la pantalla dice qué le faltó para la siguiente estrella
      if (this.ok && r.missing && r.missing.length && this.t > 0.8) U.text(ctx, 'Te faltó: ' + r.missing.join(' y '), G.VW / 2, 414, { size: 17, align: 'center', color: C.dim, maxW: 640 });
      if (this.t > 0.8) this.menu.draw(ctx);
    }
  }

  // ------------------------------------------------------------ ESCENA PRINCIPAL
  class PlayScene {
    enter(args) {
      const def = G.CASES[args.caseId];
      this.def = def;
      this.args = args;
      const st = (this.st = new G.CaseState(def, args.diff));
      st.testimony = {};
      this.dir = new G.Director(st);
      this.online = args.mode === 'online';
      this.world = new G.World(st, { mode: args.mode, me: this.online ? args.me || 0 : 0 });
      this.modals = [];
      G.input.touch.inPlay = true; // con táctil: franjas laterales fuera del mapa para los controles (G.layout)
      this.trans = null;
      this.hint = null;
      this.ended = false;
      this.unattended = 0;
      G.input.mode = args.mode === 'online' ? 'solo' : args.mode; // online: cada móvil lleva UN detective con los mismos controles que en solo (el táctil solo funciona en 'solo')
      G.input.touch.swapOn = args.mode === 'solo'; // el botón «Detective» (cambiar) solo existe en 1 jugador
      if (args.resume) {
        st.restore(args.resume.snap);
        const w = this.world;
        w.rooms = {};
        w.enterRoom(args.resume.room || def.start.room, null, true);
        const r = w.room, d = r.doors[0];
        w.players.forEach((p, i) => { const sp = G.doorSpawn(d, i, r); p.x = sp.x; p.y = sp.y; });
        w.placeNPCs(true);
        w.snapCamera();
        U.toast('Partida recuperada: capítulo ' + st.chapter, 3);
      } else {
        const ch = def.chapters[0];
        if (ch.intro) this.seq(ch.intro, null);
        if (!G.save.data.settings.seenHelp) this.modals.push(new Pause.Help(this));
        this.modals.push(new Briefing(this, false)); // A3 INTRO-1: tras la tarjeta del caso y antes de la ayuda y de la charla del capítulo 1
        this.modals.push(new Card(this, def.title, 'CASO ' + def.level + ' · ' + def.client, 3));
        this.autosave();
      }
      this.world.arrowOn = st.diff.sparkle === 'all';
      G.audio.setMode(st.diff.id === 'hard' ? 'tense' : 'play');
      if (this.online) {
        this.lastR = null; this.sTimer = 0; this.netT = 0; this.lastCa = G.net.remote ? G.net.remote.ca : undefined; this.lostT = 0;
        this.hadPartner = true;
      }
    }
    // ---------- red (2 móviles)
    netTick(dt) {
      const N = G.net, w = this.world, st = this.st;
      const playing = N.partnerPlaying();
      this.lostT = playing ? 0 : this.lostT + dt;
      // el compañero se cae: la IA toma su lugar; vuelve: se lo devuelve
      if (!w.aiTakeover && this.lostT > 6) {
        w.aiTakeover = true;
        const ai = w.players[1 - w.human], lead = w.players[w.human];
        ai.ctrl = 'ai'; ai.hidden = false; ai.work = null; ai.task = null; ai.path = null; ai.pushing = false;
        ai.x = lead.x - 30; ai.y = lead.y; ai.toolIdx = G.startToolOf(ai.id, w.st.def);
        w.initCompanion && w.initCompanion();
        U.toast('Tu compañero se ha desconectado. La IA ocupa su lugar hasta que vuelva.', 4, { color: C.accent });
      } else if (w.aiTakeover && playing) {
        w.aiTakeover = false;
        const ai = w.players[1 - w.human];
        ai.ctrl = 'remote'; ai.task = null; ai.path = null; ai.work = null; ai.autoUV = false; ai._wasHidden = true;
        U.toast('¡Tu compañero ha vuelto!', 3, { color: C.good });
        G.audio.sfx('success');
      }
      if (!w.aiTakeover) N.applyPose(w, dt);
      this.netT -= dt;
      if (this.netT <= 0) { this.netT = 0.07; N.patch(N.packPose(w)); }
      this.sTimer -= dt;
      if (this.sTimer <= 0) { this.sTimer = 0.5; N.patch(N.packState(st)); }
      const r = N.remote;
      if (r && r !== this.lastR) {
        this.lastR = r;
        const n0 = st.clueOrder.length;
        if (N.mergeState(st, w, r)) {
          st.clueOrder.slice(n0).forEach((id) => U.toast('Tu compañero ha encontrado: ' + st.def.clues[id].title, 3.2, { icon: st.def.clues[id].icon }));
          if (st.clueOrder.length > n0) { G.audio.sfx('clue'); this.dir.bump(); }
          let guard = 0;
          while (st.checkAdvance() && guard++ < 5);
          this.processCaseEvents();
        }
        if (r.ca !== undefined && r.ca !== this.lastCa) {
          this.lastCa = r.ca;
          U.toast((w.players[1 - w.human].id === 'rex' ? 'Oli' : 'Lali') + ' te necesita: ' + (r.cn || 'ayuda') + (r.ct === 'coop' ? ' (empujad a la vez)' : ''), 4.2, { color: C.accent });
          G.audio.sfx('hint');
        }
        if (r.fin && !this.ended) this.finish(r.fin === 1, r.fin === 1 ? '' : 'Vuestro compañero se ha quedado sin intentos.');
      }
    }
    // ---------- utilidades
    seq(lines, cb, o) { const m = new LineSeq(this, lines, o); m.onClose = cb; this.modals.push(m); }
    pushDiscovery(d, cb) {
      const cd = d.clue ? this.st.def.clues[d.clue] : null;
      const m = new LineSeq(this, [{ who: d.who, text: d.text }], { header: cd ? '¡PISTA ENCONTRADA! ' + cd.title : null, icon: cd ? cd.icon : null, skippable: false });
      m.onClose = cb;
      this.modals.push(m);
    }
    autosave() {
      const sv = G.save.data;
      sv.run = { caseId: this.def.id, diff: this.st.diffId, mode: this.args.mode, room: this.world.roomId, snap: this.st.snapshot() };
      G.save.store();
    }
    exitToHub(finished) {
      if (!finished) this.autosave();
      else { G.save.data.run = null; G.save.store(); }
      G.audio.setMode('office');
      if (this.online) { G.net.leave(); }
      G.go(G.scenes.hub, { from: 'play' });
    }
    // ---------- pistas
    showHint(h, manual) {
      const st = this.st, w = this.world;
      let text, tier = h.tier;
      if (!h.action) text = '¡Creo que ya lo tenéis todo! Abrid el cuaderno y acusad al culpable.';
      else text = tier === 1 ? h.action.text1 : h.action.text2;
      this.hint = { text, t: 9 };
      if (h.action && tier >= 2 && h.action.id) { w.hintIds[h.action.id] = true; }
      if (tier >= 3) w.arrowOn = true;
      w.aiHint && w.aiHint(text);
      G.audio.sfx('hint');
      if (manual && st.diff.hintCost && !h.free) U.toast('Pista pedida: +' + st.diff.hintCost + ' s de penalización', 2.6, { color: C.bad });
      if (manual && h.free) U.toast('Pista gratis del cuaderno de bolsillo', 2.4, { color: C.good });
    }
    // ---------- acusación
    onAccuse(sel) {
      const st = this.st, def = this.def;
      const res = st.accuse(sel);
      if (res.blocked) {   // FIX-3a: no se puede acusar a un gato ni a quien no se ha interrogado (no cuenta como fallo)
        G.audio.sfx('error');
        U.toast(res.blockedBy === 'motive' ? 'Aún no tenéis pistas sobre el motivo. Buscad qué ganaba con ello.' : res.blockedBy === 'method' ? 'Aún no tenéis pistas sobre el método. Buscad cómo lo hizo.' : 'Aún no podéis acusar a esa persona: hablad antes con ella.', 3, { color: C.bad });
        return;
      }
      if (res.ok) {
        G.audio.sfx('fanfare');
        this.finish(true);
        return;
      }
      G.audio.sfx('error');
      // FIX-3c: Rex y Luna comentan el fallo con humor SIN decir qué parte falló (culpable, método, motivo o pruebas)
      const lines = G.failLines(def, st.wrong, res.strikesLeft, res.cut);
      if (res.offended && def.npcs[res.offended]) U.toast(def.npcs[res.offended].name + ' se ha ofendido un rato.', 3, { color: C.bad });
      if (res.failed) {
        this.seq(lines.slice(0, 2), () => this.seq(def.epilogue.fail, () => this.finish(false, 'Os habéis quedado sin intentos: el caso se cierra sin recompensa.')));
      } else this.seq(lines, null);
    }
    finish(ok, msg) {
      if (this.ended) return;
      this.ended = true;
      const st = this.st, def = this.def;
      const r = st.reward();
      const sv = G.save.data;
      sv.money += r.money;
      sv.rep += r.rep;
      if (ok) {
        const rec = (sv.done[def.id] = sv.done[def.id] || { stars: {}, count: 0 });
        rec.count++;
        rec.stars[st.diffId] = Math.max(rec.stars[st.diffId] || 0, r.stars);
        G.award('primer_caso');
        if (st.wrong === 0) G.award('impecable');
        if (st.elapsed() <= def.parSeconds) G.award('relampago');
        if (st.clueCount() >= st.totalClues()) G.award('lupa_oro');
        if (st.diffId === 'hard') G.award('hierro');
      }
      sv.run = null;
      G.save.store();
      if (this.online) G.net.patch({ fin: ok ? 1 : 2 });
      const show = () => this.modals.push(new Result(this, r, ok, msg));
      if (ok) this.seq(def.epilogue.win, show); else show();
    }
    // ---------- eventos del caso
    processCaseEvents() {
      const st = this.st, def = this.def;
      const evs = st.events.splice(0);
      evs.forEach((ev) => {
        if (ev.type === 'chapter') this.onChapter(ev.from, ev.to);
      });
    }
    onChapter(from, to) {
      const def = this.def, st = this.st;
      const outro = def.chapters[from - 1].outro, intro = def.chapters[to - 1].intro;
      const nxt = def.chapters[to - 1];
      // se apilan en orden inverso (el último en entrar se muestra primero)
      const queue = [];
      if (outro) queue.push(() => this.seq(outro, null));
      queue.push(() => { this.modals.push(new Card(this, nxt.title, 'CAPÍTULO ' + to, 2.4)); });
      if (intro) queue.push(() => this.seq(intro, null));
      for (let i = queue.length - 1; i >= 0; i--) queue[i]();
      this.world.onChapter();
      this.dir.bump();
      this.world.arrowOn = st.diff.sparkle === 'all';
      this.autosave();
      G.audio.sfx('success');
    }
    // ---------- bucle
    update(dt) {
      dt = Math.min(dt, 0.05);
      this.lastDt = dt;
      const st = this.st, w = this.world;
      G.audio.setMode(this.modals.length && this.modals[this.modals.length - 1] instanceof Result ? 'office' : st.diff.id === 'hard' || (st.timeLimit() && st.timeLeft() < 120) ? 'tense' : 'play');
      w.ambience(dt, !(this.modals.length && this.modals[this.modals.length - 1] instanceof Result)); // 4C-4b: zumbido y crujidos del ambiente
      if (this.online) this.netTick(dt);
      this.asT = (this.asT || 0) + dt;
      if (this.asT > 30 && !this.ended) { this.asT = 0; this.autosave(); }
      G.input.touch.playing = !this.modals.length && !this.trans && !this.ended;
      if (this.trans) { this.updateTrans(dt); return; }
      const top = this.modals[this.modals.length - 1];
      if (top) {
        const r = top.update(dt);
        if (r === 'done') {
          const idx = this.modals.indexOf(top);
          if (idx >= 0) this.modals.splice(idx, 1);
          top.onClose && top.onClose();
          st.checkAdvance();
        }
        return;
      }
      this.updateFree(dt);
    }
    updateFree(dt) {
      const st = this.st, w = this.world, I = G.input;
      if (I.p[0].pause) { this.modals.push(new Pause(this)); return; }
      if (I.p[0].book || (this.args.mode === 'coop' && I.p[1].book)) { this.modals.push(new Notebook(this, 0)); G.audio.sfx('ok'); return; }
      if (I.hint) { this.showHint(this.dir.request(), true); }
      if (I.p[0].swap && this.args.mode === 'solo') w.swapSolo();
      if (I.mouse.clicked) {
        if (U.hit(G.VW - 150, G.VH - 52, 140, 42)) { this.modals.push(new Notebook(this, 0)); G.audio.sfx('ok'); return; }
        if (U.hit(G.VW / 2 - 70, G.VH - 52, 140, 42)) { this.showHint(this.dir.request(), true); }
        if (U.hit(G.VW - 54, 8, 44, 44)) { this.modals.push(new Pause(this)); return; }
      }
      st.time += dt;
      w.update(dt, true);
      // FIX-2: rótulo al entrar en una sala (se enseña ~2,6 s y se desvanece)
      if (this.bannerRoom !== w.roomId) { if (this.bannerRoom !== undefined) st.calmAll(); this.bannerRoom = w.roomId; this.bannerT = 2.6; }   // FIX-3a: cambiar de sala calma a los ofendidos
      this.bannerT = Math.max(0, (this.bannerT || 0) - dt);
      this.world.arrowOn = st.diff.sparkle === 'all' || (this.dir.tier >= 3);
      // eventos del mundo
      w.out.splice(0).forEach((ev) => this.handleWorldEvent(ev));
      this.processCaseEvents();
      const h = this.dir.update(dt, true);
      if (h) this.showHint(h, false);
      if (this.hint) { this.hint.t -= dt; if (this.hint.t <= 0) this.hint = null; }
      // tiempo límite
      if (st.timeLimit() && st.timeLeft() <= 0 && !this.ended) {
        this.seq(G.timeoutLines(this.def), () => this.finish(false, 'Se acabó el tiempo.'));
      }
    }
    handleWorldEvent(ev) {
      const st = this.st, w = this.world;
      if (ev.t === 'discover') {
        w.lastDiscover = ev.clue;
        this.dir.bump();
        this.pushDiscovery(ev, null);
      } else if (ev.t === 'talk') {
        this.modals.push(new Talk(this, ev.npc));
        this.dir.bump();
      } else if (ev.t === 'door') {
        const d = ev.door;
        if (d.firstOpen && !st.hasClue(d.firstOpen.clue)) {
          st.addClue(d.firstOpen.clue, 'door');
          this.pushDiscovery({ who: d.firstOpen.who, text: d.firstOpen.text, clue: d.firstOpen.clue }, () => this.startTrans(d));
        } else this.startTrans(d);
      } else if (ev.t === 'mini') {
        const p = ev.p, step = ev.step, idx = st.progress[p.key] || 0;
        const m = new Mini(this, step.mini);
        m.onClose = () => {
          if (m.solved && (st.progress[p.key] || 0) === idx) w.completeStep(p, step, w.players.find((q) => q.id === ev.who) || w.leader());
        };
        this.modals.push(m);
        this.dir.bump();
      } else if (ev.t === 'call') {
        G.net.patch({ ca: (G.net._ca = (G.net._ca || 0) + 1), cn: ev.label, ct: ev.tool });
      } else if (ev.t === 'denied') {
        const a = w.players.find((p) => p.id === ev.who) || w.leader();
        a.say(ev.text, 4);
        this.dir.denied();
      } else if (ev.t === 'toast') U.toast(ev.text, 2.6, { icon: ev.icon });
      else if (ev.t === 'tooltip') U.toast(ev.text, 4.2, { icon: ev.icon, color: C.accent });
      else if (ev.t === 'spotted') { this.dir.denied(); U.toast('¡Casi te ven! Espera a que mire hacia otro lado.', 3, { color: C.bad }); }
      else if (ev.t === 'denied_soft') this.dir.denied();
      else if (ev.t === 'room_first') { /* hueco para futuros comentarios */ }
    }
    startTrans(d) { this.trans = { phase: 'out', t: 0, door: d }; G.audio.sfx('door'); }
    updateTrans(dt) {
      const T = this.trans;
      T.t += dt;
      if (T.phase === 'out' && T.t >= 0.28) {
        T.phase = 'in'; T.t = 0;
        this.world.enterRoom(T.door.to.room, T.door.to.door);
        this.world.out.length = 0;
      } else if (T.phase === 'in' && T.t >= 0.28) this.trans = null;
      this.world.update(dt, false);
    }

    // ---------- dibujo
    // Controles táctiles en las franjas laterales (fuera del mapa), discretos; se llama desde G.boot DESPUÉS de dibujar el juego
    drawStrips(ctx) {
      const T = G.input.touch, L = G.layout;
      if (!T.enabled || !T.inPlay || L.sx <= 0) return;
      const w = this.world, me = w.players[w.human], f = me && me.focus;
      ctx.save();
      ctx.fillStyle = '#0a0512';
      ctx.fillRect(-L.sx, 0, L.sx, G.VH); ctx.fillRect(G.VW, 0, L.sx, G.VH);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(-1.5, 0, 1.5, G.VH); ctx.fillRect(G.VW, 0, 1.5, G.VH);
      ctx.restore();
      const live = T.playing; // con un menú o diálogo abierto, los controles se atenúan pero no se mueven
      const circle = (b, down, fill) => {
        ctx.save();
        ctx.globalAlpha = (live ? (down ? 0.9 : 0.5) : 0.2);
        ctx.fillStyle = fill; ctx.strokeStyle = 'rgba(255,212,90,0.7)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.restore();
      };
      const busy = !!(me && me.work);
      circle(T.A, T.A.id !== null, f && !busy ? 'rgba(255,212,90,0.4)' : 'rgba(40,26,64,0.7)');
      ctx.save(); ctx.globalAlpha = live ? 1 : 0.35;
      if (f && !busy) U.icon(ctx, f.icon, T.A.x - 16, T.A.y - 26, 32);
      U.text(ctx, 'ACCIÓN', T.A.x, T.A.y + 10, { size: 12, align: 'center' });
      ctx.restore();
      circle(T.T, T.T.id !== null, 'rgba(40,26,64,0.7)');
      ctx.save(); ctx.globalAlpha = live ? 1 : 0.35;
      const tl = me && me.tool;
      if (tl) U.icon(ctx, G.TOOLS[tl].icon, T.T.x - 14, T.T.y - 22, 28);
      U.text(ctx, 'Cambiar', T.T.x, T.T.y + 9, { size: 10, align: 'center' });
      ctx.restore();
      if (this.args.mode === 'solo') {
        circle(T.S, T.S.id !== null, 'rgba(40,26,64,0.7)');
        ctx.save(); ctx.globalAlpha = live ? 1 : 0.35;
        U.text(ctx, '⇄', T.S.x, T.S.y - 12, { size: 18, align: 'center' });
        U.text(ctx, 'Detective', T.S.x, T.S.y + 6, { size: 9, align: 'center' });
        ctx.restore();
      }
      const S2 = T.stick;
      if (S2.id !== null) {
        ctx.save();
        ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(S2.ox, S2.oy, 58, 0, 6.3); ctx.stroke();
        ctx.globalAlpha = 0.8; ctx.fillStyle = '#ffd45a';
        ctx.beginPath(); ctx.arc(S2.x, S2.y, 26, 0, 6.3); ctx.fill();
        ctx.restore();
      } else if (T.rest) {
        ctx.save(); ctx.globalAlpha = live ? 0.4 : 0.15; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(T.rest.x, T.rest.y, T.rest.r, 0, 6.3); ctx.stroke();
        ctx.restore();
        U.text(ctx, 'Mover', T.rest.x, T.rest.y - 8, { size: 12, align: 'center', color: C.dim, bold: false });
      }
    }
    draw(ctx) {
      const st = this.st, w = this.world;
      w.hudZones = this.hudZones(ctx); // FIX-4a (b): el mundo evita estas zonas al colocar los globos
      w.draw(ctx, 0);
      this.drawHUD(ctx);
      if (this.trans) {
        const a = this.trans.phase === 'out' ? this.trans.t / 0.28 : 1 - this.trans.t / 0.28;
        ctx.fillStyle = `rgba(10,5,20,${G.clamp(a, 0, 1)})`;
        ctx.fillRect(0, 0, G.VW, G.VH);
      }
      const top = this.modals[this.modals.length - 1];
      if (top) {
        if (top instanceof LineSeq || top instanceof Talk) { ctx.fillStyle = 'rgba(12,6,22,0.28)'; ctx.fillRect(0, 0, G.VW, G.VH); }
        top.draw(ctx);
      }
      U.drawToasts(ctx, this.lastDt || 0.016);
    }
    // FIX-4a (b): medidas del panel de objetivos (compartidas por el dibujo y por las zonas del HUD)
    objLayout(ctx, goals, roomName) {
      let h = roomName ? 62 : 40; // FIX-2: una línea más con la sala en la que estás
      ctx.font = U.font(14);
      const wrapped = goals.map((g) => G.wrap(ctx, g.text + (g.prog[1] > 1 ? ` (${g.prog[0]}/${g.prog[1]})` : ''), 256));
      wrapped.forEach((l) => (h += l.length * 18 + 5));
      return { h, wrapped };
    }
    // FIX-4a (b): rectángulos que el HUD ocupa sobre el mapa; los globos de diálogo los evitan (mismos números que drawHUD)
    hudZones(ctx) {
      if (this.modals.length && this.modals[this.modals.length - 1] instanceof Card) return [];
      const st = this.st, w = this.world, def = this.def, Z = [];
      const roomName = (def.rooms[w.roomId] && def.rooms[w.roomId].name) || '';
      const { h } = this.objLayout(ctx, st.goals(), roomName);
      Z.push({ x: 10, y: 10, w: 312, h: h + 6 });                                   // objetivos
      Z.push({ x: 650, y: 10, w: 246, h: 44 + (st.diff.strikes ? 30 : 0) });        // dinero / pistas / tiempo (+ corazones)
      Z.push({ x: G.VW - 54, y: 8, w: 44, h: 44 });                                 // pausa
      Z.push({ x: 10, y: G.VH - 78, w: 296, h: 68 }, { x: 316, y: G.VH - 78, w: this.online && this.args.mode !== 'coop' ? 200 : 296, h: 68 }); // herramientas
      Z.push({ x: G.VW - 150, y: G.VH - 52, w: 140, h: 42 }, { x: G.VW - 306, y: G.VH - 52, w: 140, h: 42 }); // Cuaderno y Pista
      if (this.hint) Z.push({ x: (G.VW - 560) / 2, y: G.VH - 160, w: 560, h: 66 });  // consejo
      return Z;
    }
    drawHUD(ctx) {
      const st = this.st, w = this.world, def = this.def;
      const showHud = !(this.modals.length && this.modals[this.modals.length - 1] instanceof Card);
      if (!showHud) return;
      // objetivos
      const ch = st.chapterDef();
      const goals = st.goals();
      const roomName = (def.rooms[w.roomId] && def.rooms[w.roomId].name) || '';
      const { h, wrapped } = this.objLayout(ctx, goals, roomName);
      U.panel(ctx, 10, 10, 312, h + 6, { fill: 'rgba(24,14,40,0.82)', shadow: false });
      U.text(ctx, 'Cap. ' + ch.id + ' · ' + ch.title, 22, 18, { size: 15, color: C.accent, maxW: 290 });
      if (roomName) U.text(ctx, '📍 ' + roomName, 22, 38, { size: 13, color: C.dim, maxW: 290, bold: false });
      let y = roomName ? 66 : 44;
      goals.forEach((g, i) => {
        ctx.fillStyle = g.done ? '#7de38a' : 'rgba(255,255,255,0.18)';
        ctx.beginPath(); ctx.arc(30, y + 8, 7, 0, 6.3); ctx.fill();
        if (g.done) U.text(ctx, '✔', 30, y + 1, { size: 11, align: 'center', color: '#1a3a22', shadow: false });
        wrapped[i].forEach((ln, k) => U.text(ctx, ln, 46, y + k * 18, { size: 14, color: g.done ? '#8ec99a' : C.text, bold: false }));
        y += wrapped[i].length * 18 + 5;
      });
      // FIX-2: rótulo grande y breve al entrar en una sala, entre el panel de objetivos y el de dinero
      if (roomName && this.bannerT > 0) {
        const al = Math.min(1, this.bannerT / 0.6), bx = 336, bw = 304;
        ctx.save(); ctx.globalAlpha = al;
        U.panel(ctx, bx, 10, bw, 40, { fill: 'rgba(24,14,40,0.88)', shadow: false, stroke: C.accent, r: 10 });
        U.text(ctx, roomName, bx + bw / 2, 20, { size: 18, align: 'center', color: C.accent, maxW: bw - 20 });
        ctx.restore();
      }
      // dinero / tiempo / pistas
      const lim = st.timeLimit();
      const tl = lim ? st.timeLeft() : st.elapsed();
      const ix = 650;
      U.panel(ctx, ix, 10, 246, 44, { fill: 'rgba(24,14,40,0.82)', shadow: false });
      U.icon(ctx, 'ico_coin', ix + 8, 18, 28);
      U.text(ctx, String(G.save.data.money), ix + 40, 20, { size: 17, color: C.accent });
      U.icon(ctx, 'ico_clue', ix + 100, 18, 28);
      U.text(ctx, String(st.clueCount()), ix + 132, 20, { size: 17 });
      U.text(ctx, (lim ? '⏱ ' : '') + G.fmtTime(tl), ix + 236, 20, { size: 17, align: 'right', color: lim && tl < 120 ? C.bad : C.text });
      for (let i = 0; i < st.diff.strikes; i++) {   // FIX-3a/3b: un corazón por intento; los gastados se apagan
        const spent = i >= st.strikesLeft();
        ctx.save(); ctx.globalAlpha = spent ? 0.28 : 1; U.icon(ctx, 'ico_heart', ix + 214 - i * 26, 58, 24); ctx.restore();
      }
      // pausa
      U.panel(ctx, G.VW - 54, 8, 44, 44, { fill: 'rgba(24,14,40,0.82)', shadow: false });
      U.text(ctx, 'II', G.VW - 32, 17, { size: 22, align: 'center' });
      // herramientas
      const toolPanel = (a, x, ctrlLabel, isAI) => {
        const bw = 296;
        U.panel(ctx, x, G.VH - 78, bw, 68, { fill: 'rgba(24,14,40,0.86)', shadow: false, stroke: a.id === 'rex' ? '#c9747f' : '#5d8fc0' });
        U.portrait(ctx, a.look, x + 8, G.VH - 70, 52);
        U.text(ctx, G.ROLES[a.id].name + (isAI ? ' (IA)' : ''), x + 68, G.VH - 72, { size: 14, color: G.ROLES[a.id].color });
        a.tools.forEach((t, i) => {
          const tx = x + 68 + i * 112, sel = a.toolIdx === i;
          U.rrect(ctx, tx, G.VH - 54, 106, 36, 8);
          ctx.fillStyle = sel ? 'rgba(255,212,90,0.25)' : 'rgba(255,255,255,0.07)'; ctx.fill();
          ctx.lineWidth = sel ? 2.5 : 1; ctx.strokeStyle = sel ? C.accent : '#6b4f9a'; ctx.stroke();
          U.icon(ctx, G.TOOLS[t].icon, tx + 4, G.VH - 52, 30);
          U.text(ctx, G.TOOLS[t].name.split(' ')[0], tx + 38, G.VH - 45, { size: 13, color: sel ? C.accent : C.dim });
        });
      };
      if (this.args.mode === 'coop') {
        toolPanel(w.players[0], 10, '', false);
        toolPanel(w.players[1], 316, '', false);
      } else if (this.online) {
        toolPanel(w.leader(), 10, '', false);
        const q = w.players[1 - w.human], ok = G.net.partnerPlaying();
        U.panel(ctx, 316, G.VH - 78, 200, 68, { fill: 'rgba(24,14,40,0.86)', shadow: false, stroke: ok ? '#4fd08a' : '#ff7a6b' });
        U.portrait(ctx, q.look, 324, G.VH - 70, 52);
        U.text(ctx, G.ROLES[q.id].name, 384, G.VH - 72, { size: 14, color: G.ROLES[q.id].color });
        U.text(ctx, ok ? (q.hidden ? 'en otra sala' : 'conectado') : w.aiTakeover ? 'IA al mando' : 'sin conexión', 384, G.VH - 50, { size: 13, color: ok ? C.good : C.bad, bold: false });
        U.text(ctx, 'Sala ' + G.net.code, 384, G.VH - 32, { size: 12, color: C.dim, bold: false });
      } else {
        toolPanel(w.leader(), 10, '', false);
        toolPanel(w.players[1 - w.human], 316, '', true);
      }
      if (this.online && this.lostT > 3 && !w.aiTakeover) {
        U.panel(ctx, G.VW / 2 - 230, 74, 460, 40, { fill: 'rgba(80,20,30,0.94)', stroke: C.bad, shadow: false });
        U.text(ctx, 'Conexión con tu compañero perdida. Si no vuelve, la IA ocupa su lugar…', G.VW / 2, 84, { size: 16, align: 'center' });
      }
      // botones centrales
      const hx = G.VW - 326;
      U.panel(ctx, G.VW - 150, G.VH - 52, 140, 42, { fill: U.hit(G.VW - 150, G.VH - 52, 140, 42) ? '#6a47b8' : 'rgba(24,14,40,0.88)', shadow: false, stroke: C.accent, r: 10 });
      U.icon(ctx, 'ico_book', G.VW - 144, G.VH - 47, 32);
      U.text(ctx, 'Cuaderno', G.VW - 106, G.VH - 41, { size: 15 });
      if (!G.input.touch.enabled) U.text(ctx, 'F', G.VW - 20, G.VH - 41, { size: 12, align: 'right', color: C.dim });
      U.panel(ctx, hx + 20, G.VH - 52, 140, 42, { fill: U.hit(hx + 20, G.VH - 52, 140, 42) ? '#6a47b8' : 'rgba(24,14,40,0.88)', shadow: false, stroke: '#6b4f9a', r: 10 });
      U.icon(ctx, 'ico_bulb', hx + 24, G.VH - 47, 32);
      U.text(ctx, G.input.touch.enabled ? 'Pista' : 'Pista (H)', hx + 62, G.VH - 41, { size: 15 });
      if (this.args.mode === 'solo' && !G.input.touch.enabled) U.text(ctx, 'Tab: cambiar de detective', G.VW - 20, G.VH - 80, { size: 12, align: 'right', color: C.dim, bold: false });
      // consejo
      if (this.hint) {
        const hw = 560, hy = G.VH - 160;
        U.panel(ctx, (G.VW - hw) / 2, hy, hw, 66, { fill: 'rgba(40,26,64,0.95)', stroke: C.accent, shadow: false });
        U.icon(ctx, 'ico_bulb', (G.VW - hw) / 2 + 12, hy + 14, 38);
        U.text(ctx, this.hint.text, (G.VW - hw) / 2 + 62, hy + 10, { size: 16, maxW: hw - 80, lineH: 22 });
      }
    }
  }

  // ------------------------------------------------------------ AYUDA DE CONTROLES (también en el despacho)
  G.drawHelp = function (ctx, mode) {
    ctx.fillStyle = 'rgba(12,6,22,0.88)';
    ctx.fillRect(0, 0, G.VW, G.VH);
    U.panel(ctx, 60, 40, G.VW - 120, G.VH - 80);
    U.text(ctx, 'CÓMO SE JUEGA', G.VW / 2, 56, { size: 30, align: 'center', color: C.accent });
    const col = (x, title, lines, color) => {
      U.text(ctx, title, x, 108, { size: 19, color });
      lines.forEach((l, i) => { U.text(ctx, l[0], x, 142 + i * 30, { size: 15, color: C.accent }); U.text(ctx, l[1], x + 118, 142 + i * 30, { size: 15, bold: false }); });
    };
    if (mode === 'solo' || mode === 'online') {
      col(90, 'Teclado y mando', [['WASD / flechas', 'Moverte'], ['E / Intro / Espacio', 'Acción (examinar, hablar, abrir)'], ['Q / Shift', 'Cambiar de herramienta'], ['F', 'Cuaderno de detective'], ['Tab', 'Cambiar de detective'], ['H', 'Pedir una pista'], ['Esc', 'Pausa']], '#f0c070');
      U.text(ctx, mode === 'online' ? 'En el móvil: arrastra a la izquierda para moverte, botón ACCIÓN para examinar,\nhablar y abrir. Oli usa Lupa y Ganzúa; Lali, Linterna UV y Grabadora.\nSi necesitas a tu compañero, te avisa solo. ¡Hablad por teléfono!' : 'Tu compañero con IA te sigue, usa sus herramientas cuando se lo pides\ny hasta detecta cosas por su cuenta. ¡Hazle caso cuando te hable!', 90, 372, { size: 15, bold: false, maxW: 760, lineH: 21 });
    } else {
      col(90, 'Jugador 1 · Oli', [['W A S D', 'Moverte'], ['E', 'Acción'], ['Q', 'Cambiar herramienta'], ['F', 'Cuaderno']], '#f0909c');
      col(490, 'Jugador 2 · Lali', [['Flechas', 'Moverte'], ['Intro', 'Acción'], ['Shift der.', 'Cambiar herramienta'], ['.', 'Cuaderno']], '#8cc4f0');
      U.text(ctx, 'Oli usa Lupa y Ganzúa · Lali usa Linterna UV y Grabadora. Algunos objetos necesitan a los dos.\nH: pedir pista · Esc: pausa · También funciona con mandos.', 90, 290, { size: 15, bold: false, maxW: 780, lineH: 22 });
    }
    U.text(ctx, 'Pulsa la tecla de acción cerca de algo brillante o interesante. Habla con todos: ¡hasta el gato!', 90, 440, { size: 15, color: C.accent, bold: false, maxW: 780 });
    U.text(ctx, 'Pulsa una tecla para continuar', G.VW / 2, 478, { size: 14, align: 'center', color: C.dim, bold: false });
  };
  Pause.Help = class {
    constructor(scene) { this.s = scene; this.t = 0; }
    update(dt) { this.t += dt; if (this.t > 0.4 && (G.input.menu.ok || G.input.menu.back || G.input.mouse.clicked)) { G.save.data.settings.seenHelp = true; G.save.store(); return 'done'; } }
    draw(ctx) { G.drawHelp(ctx, this.s.world.mode); }
  };

  G.scenes = G.scenes || {};
  G.scenes.play = new PlayScene();
  G.PlayModals = { LineSeq, Briefing, Card, Talk, Notebook, Pause, Result, Mini };
})(typeof window !== 'undefined' ? window : globalThis);
