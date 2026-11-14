// scenes.js — título, selección de modo, despacho (casos, tienda, ajustes) y arranque.
(function (root) {
  'use strict';
  const G = root.G;
  const U = G.ui;
  const C = U.colors;
  G.scenes = G.scenes || {};

  G.go = function (scene, args) {
    G.scene = scene;
    G.input.touch.playing = false;
    G.input.touch.inPlay = false; // la escena de juego lo activa en enter(): con táctil ensancha el lienzo con franjas laterales
    G.fadeIn = 0.25;
    scene.enter && scene.enter(args || {});
  };

  G.rankName = function (rep) { return rep < 10 ? 'Aprendiz' : rep < 40 ? 'Detective' : rep < 100 ? 'Inspector' : 'Leyenda de Villa Migas'; };

  // ---------- fondo del despacho (dibujado una vez)
  let officeBG = null;
  function buildOffice() {
    if (officeBG) return officeBG;
    const cv = G.makeCanvas(G.VW, G.VH);
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#e4cfa6';
    c.fillRect(0, 0, G.VW, 108);
    for (let x = 0; x < G.VW; x += 96) { c.fillStyle = '#d9c298'; c.fillRect(x, 0, 6, 108); }
    for (let x = 0; x < G.VW / 48; x++) G.drawSpr(c, 'wall_face', x * 48, 108, { scale: 3 });
    for (let y = 0; y < 9; y++) for (let x = 0; x < 21; x++) G.drawSpr(c, (x + y) % 2 ? 'floor_wood2' : 'floor_wood', x * 48, 156 + y * 48, { scale: 3 });
    const put = (n, x, y, k) => G.drawSpr(c, n, x, y, { scale: k || 3 });
    put('window_night', 70, 70); put('window_night', 330, 70);
    put('painting', 200, 72); put('clock', 450, 68);
    put('corkboard', 8, 76, 4);
    put('bookshelf', 480, 92, 1.5 * 2);
    put('rug_round', 120, 330, 4);
    put('desk', 150, 190, 4); put('desk', 214, 190, 4);
    put('chair', 190, 268, 3);
    put('plant', 10, 190, 3); put('plant', 430, 440, 3);
    put('coat_rack', 380, 240, 3);
    put('trophy', 300, 200, 3);
    put('sofa', 250, 420, 4);
    officeBG = cv;
    return cv;
  }

  // ---------- TÍTULO ----------
  class Title {
    enter() {
      this.t = 0;
      this.menu = new U.Menu([
        { label: 'Jugar', icon: 'ico_star' },
        { label: 'Cómo se juega', icon: 'ico_question' },
        { label: 'Ajustes', icon: 'ico_bulb' },
      ], { x: G.VW / 2 - 160, y: 330, w: 320, h: 50, gap: 10 });
      this.help = false;
      G.audio.setMode('office');
      this.stars = Array.from({ length: 60 }, (_, i) => ({ x: (i * 97) % G.VW, y: (i * 53) % 220, s: 1 + (i % 3), p: i }));
    }
    update(dt) {
      this.t += dt;
      if (this.help) { if (G.input.menu.ok || G.input.menu.back || G.input.mouse.clicked) this.help = false; return; }
      const r = this.menu.update();
      if (r.chosen === 0) G.go(G.scenes.mode);
      if (r.chosen === 1) this.help = true;
      if (r.chosen === 2) G.go(G.scenes.hub, { state: 'settings', from: 'title' });
    }
    draw(ctx) {
      const t = this.t;
      const g = ctx.createLinearGradient(0, 0, 0, G.VH);
      g.addColorStop(0, '#120a28'); g.addColorStop(0.6, '#3a2358'); g.addColorStop(1, '#8a4a6a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, G.VW, G.VH);
      this.stars.forEach((s) => { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t + s.p)); ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, s.s, s.s); });
      ctx.globalAlpha = 1;
      // luna
      ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(800, 100, 46, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#e6d28e'; ctx.beginPath(); ctx.arc(784, 88, 8, 0, 6.3); ctx.arc(818, 116, 11, 0, 6.3); ctx.fill();
      // ciudad
      for (let i = 0; i < 18; i++) {
        const bw = 56 + (i * 13) % 34, bh = 90 + ((i * 47) % 150), bx = i * 56 - 10;
        ctx.fillStyle = i % 2 ? '#241838' : '#2d1f45'; ctx.fillRect(bx, G.VH - bh - 40, bw, bh + 40);
        for (let wy = 0; wy < bh - 14; wy += 24) for (let wx = 8; wx < bw - 12; wx += 18) {
          const on = (i * 7 + wy + wx * 3) % 5 !== 0;
          ctx.fillStyle = on ? ((i + wy) % 3 ? '#ffd45a' : '#ff9fc4') : '#3a2a58'; ctx.globalAlpha = on ? 0.55 + 0.2 * Math.sin(t * 2 + i + wy) : 0.6; ctx.fillRect(bx + wx, G.VH - bh - 30 + wy, 9, 12);
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#1a102a'; ctx.fillRect(0, G.VH - 40, G.VW, 40);
      // detectives
      const bob = Math.sin(t * 2) * 2;
      G.drawSpr(ctx, 'rex_down_0', 130, 390 + bob, { scale: 6 });
      G.drawSpr(ctx, 'luna_down_0', 760, 390 - bob, { scale: 6 });
      G.drawSpr(ctx, 'cat_sit_0', 640, 466, { scale: 4, flip: true });
      // título
      U.text(ctx, 'AGENCIA', G.VW / 2, 42, { size: 26, align: 'center', color: C.accent });
      ctx.save();
      ctx.font = 'bold 76px "Trebuchet MS","Segoe UI",Verdana,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.lineWidth = 10; ctx.strokeStyle = '#2a1b30'; ctx.strokeText('LALI & OLI CASES', G.VW / 2, 70);
      ctx.fillStyle = '#fff4dc'; ctx.fillText('LALI & OLI CASES', G.VW / 2, 70);
      ctx.restore();
      U.text(ctx, 'Detectives de lo Absurdo', G.VW / 2, 170, { size: 24, align: 'center', color: C.pink });
      U.text(ctx, '1-2 jugadores · misterios de 20-30 minutos', G.VW / 2, 206, { size: 15, align: 'center', color: C.dim, bold: false });
      this.menu.draw(ctx);
      if (/iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone) U.text(ctx, 'Pantalla completa: Compartir ▸ Añadir a pantalla de inicio', G.VW / 2, G.VH - 52, { size: 14, align: 'center', color: C.accent, bold: false });
      U.text(ctx, 'Hecho con mucho cariño (y un poco de sal)', G.VW / 2, G.VH - 26, { size: 12, align: 'center', color: '#8a7aa8', bold: false });
      U.text(ctx, 'v' + G.VERSION + ' · ' + G.BUILD, G.VW - 14, G.VH - 24, { size: 12, align: 'right', color: '#8a7aa8', bold: false });
      if (this.help) G.drawHelp(ctx, G.save.data.settings.mode);
    }
  }

  // ---------- ELEGIR MODO ----------
  class ModeSel {
    enter() {
      this.sel = G.save.data.settings.mode === 'solo' ? 0 : 1;
      this.t = 0;
    }
    update(dt) {
      this.t += dt;
      const m = G.input.menu;
      if (m.left || m.up) { this.sel = 0; G.audio.sfx('select'); }
      if (m.right || m.down) { this.sel = 1; G.audio.sfx('select'); }
      const mouse = G.input.mouse;
      [0, 1].forEach((i) => { if (U.hit(70 + i * 430, 130, 390, 300)) { if (mouse.moved) this.sel = i; if (mouse.clicked) { this.sel = i; this.choose(); } } });
      if (m.ok) this.choose();
      if (m.back) G.go(G.scenes.title);
    }
    choose() {
      G.save.data.settings.mode = this.sel === 0 ? 'solo' : 'online';
      G.save.store();
      G.audio.sfx('ok');
      G.go(G.scenes.hub, { from: 'mode' });
    }
    draw(ctx) {
      U.backdrop(ctx);
      U.text(ctx, '¿Cómo queréis jugar?', G.VW / 2, 50, { size: 34, align: 'center', color: C.accent });
      const cards = [
        { t: '1 jugador', d: 'Tú llevas a un detective y tu compañero con IA te sigue, usa sus herramientas cuando se lo pides y detecta pistas por su cuenta.\n\nCambia de personaje con el botón «Detective» (o con Tab en ordenador).', look: 'rex', look2: 'luna', col: '#f0c070' },
        { t: '2 jugadores online', d: 'Cada uno en su iPhone, estéis donde estéis. Uno crea una sala y el otro entra con el código de 5 letras. Oli y Lali tienen herramientas distintas y algunos puzzles necesitan a los dos a la vez.', look: 'rex', look2: 'luna', col: '#5fe0d0', two: true },
      ];
      cards.forEach((c, i) => {
        const x = 70 + i * 430, sel = this.sel === i;
        U.panel(ctx, x, 130 + (sel ? -6 : 0), 390, 300, { fill: sel ? 'rgba(88,60,140,0.97)' : 'rgba(40,26,64,0.9)', stroke: sel ? C.accent : '#6b4f9a', lw: sel ? 4 : 2 });
        U.text(ctx, c.t, x + 195, 150 + (sel ? -6 : 0), { size: 28, align: 'center', color: c.col });
        const bob = Math.sin(this.t * 3 + i) * 3;
        G.drawSpr(ctx, 'rex_down_0', x + (c.two ? 120 : 170), 196 + bob + (sel ? -6 : 0), { scale: 5 });
        if (c.two) G.drawSpr(ctx, 'luna_down_0', x + 200, 196 - bob + (sel ? -6 : 0), { scale: 5 });
        else G.drawSpr(ctx, 'luna_down_0', x + 250, 210 - bob + (sel ? -6 : 0), { scale: 4, alpha: 0.75 });
        U.text(ctx, c.d, x + 24, 330 + (sel ? -6 : 0), { size: 15, maxW: 342, bold: false, lineH: 20, maxH: 92, minSize: 11 });
      });
      U.text(ctx, '←/→ elegir · Intro aceptar · Esc volver', G.VW / 2, G.VH - 40, { size: 14, align: 'center', color: C.dim, bold: false });
    }
  }

  // ---------- DESPACHO ----------
  class Hub {
    enter(args) {
      args = args || {};
      this.t = 0;
      this.caseId = null;
      this.from = args.from;
      this.toast = null;
      this.confirmReset = false;
      this.pruebaDiff = {};
      [['G6-3wje', 'easy'], ['G6-2prl', 'normal'], ['G6-95yj', 'hard']].forEach(([code, df]) => { try { const sd = G.caseSeedFromCode(code); if (sd.error) return; const gr = G.generateCase(sd.seed, { register: true, theme: sd.theme }); if (!gr.error) this.pruebaDiff[gr.def.id] = df; } catch (e) {} });
      this.setState(args.state || 'main');
      G.audio.setMode('office');
    }
    caseList() { return Object.keys(G.CASES).map((k) => G.CASES[k]).sort((a, b) => a.level - b.level); }
    isGen(d) { return /^gen_/.test(d.id); }
    caseCodeOf(d) { return d.id.replace(/^gen_/, '').replace('_', '-').toUpperCase(); }
    unlocked(def) {
      const list = this.caseList().filter((d) => !this.isGen(d));
      const i = list.indexOf(def);
      return i === 0 || /^gen_/.test(def.id) || !!G.save.data.done[list[i - 1].id]; // los casos generados cargados por código (MP) no esperan al anterior
    }
    setState(s) {
      this.state = s;
      const sv = G.save.data, set = sv.settings;
      const base = { x: 548, y: 118, w: 372, h: 52, gap: 8 };
      const mainBase = { x: 548, y: 84, w: 372, h: 46, gap: 6 };
      if (s === 'main') {
        const items = [];
        const run = sv.run && G.CASES[sv.run.caseId] && (sv.run.mode === 'online') === (set.mode === 'online') ? sv.run : null;
        if (run) items.push({ id: 'continue', label: run.mode === 'online' ? 'Continuar caso (online)' : 'Continuar caso', icon: 'ico_arrow', sub: G.CASES[run.caseId].title + ' · cap. ' + run.snap.chapter + ' · ' + G.DIFFS[run.diff].name, h: 60 });
        items.push({ id: 'cases', label: 'Elegir caso', icon: 'ico_lupa' });
        items.push({ id: 'loadcode', label: 'Cargar código de caso', icon: 'ico_book', sub: 'Pega un código G6-… (los dos móviles, el mismo)', h: 52 });
        items.push({ id: 'ach', label: 'Logros', icon: 'ico_star', right: G.ACH.filter((a) => G.hasAch(a.id)).length + '/' + G.ACH.length });
        items.push({ id: 'shop', label: 'Tienda de equipo', icon: 'ico_coin', right: sv.money + '' });
        items.push({ id: 'settings', label: 'Ajustes', icon: 'ico_bulb' });
        items.push({ id: 'help', label: 'Cómo se juega', icon: 'ico_question' });
        items.push({ id: 'mode', label: 'Modo: ' + (set.mode === 'solo' ? '1 jugador' : '2 jugadores online'), icon: 'ico_hand', sub: 'Pulsa para cambiar', h: 52 });
        items.push({ id: 'title', label: 'Pantalla de título', icon: 'ico_book' });
        this.menu = new U.Menu(items, mainBase);
      } else if (s === 'cases') {
        // MP: los casos cargados por código (de prueba) van PRIMERO y rotulados; el caso principal va después y también se rotula
        const all = this.caseList(), gens = all.filter((d) => this.isGen(d)), mains = all.filter((d) => !this.isGen(d));
        const items = gens.concat(mains).map((d) => {
          const un = this.unlocked(d) || !!this.pruebaDiff[d.id], rec = sv.done[d.id], g = this.isGen(d);
          return { id: d.id, label: (g ? '★ PRUEBA ' + (this.pruebaDiff[d.id] ? G.DIFFS[this.pruebaDiff[d.id]].name + ' · ' : '· ') : 'PRINCIPAL · ') + d.title, sub: g ? 'Caso de prueba · código ' + this.caseCodeOf(d) + ' · dificultad ' + (this.pruebaDiff[d.id] ? G.DIFFS[this.pruebaDiff[d.id]].name : 'a elegir') : un ? 'Caso principal (reservado) · Nivel ' + d.level + ' · ' + d.client : 'Resuelve el caso anterior para desbloquearlo', icon: un ? 'ico_clue' : 'ico_lock', disabled: !un, right: rec ? '✔' : '', rightColor: C.good, h: 60 };
        });
        items.push({ id: 'back', label: 'Volver', icon: 'ico_arrow' });
        this.menu = new U.Menu(items, base);
      } else if (s === 'ach') {
        const items = G.ACH.map((a) => ({ id: a.id, label: a.name, icon: G.hasAch(a.id) ? 'ico_star' : 'ico_lock', right: G.hasAch(a.id) ? '✔' : '', rightColor: C.good, h: 40 }));
        items.push({ id: 'back', label: 'Volver', icon: 'ico_arrow', h: 40 });
        this.menu = new U.Menu(items, Object.assign({}, base, { y: 84, gap: 6 }));
      } else if (s === 'diff') {
        const def = G.CASES[this.caseId];
        const items = ['easy', 'normal', 'hard'].map((k) => ({ id: k, label: G.DIFFS[k].name, sub: G.DIFFS[k].short, color: G.DIFFS[k].color, h: 74 }));
        items.push({ id: 'back', label: 'Volver', icon: 'ico_arrow' });
        this.menu = new U.Menu(items, Object.assign({}, base, { y: 150 }));
      } else if (s === 'shop') {
        const items = G.UPGRADES.map((u) => {
          const lv = G.upgLevel(u.id);
          return { id: u.id, label: u.name, sub: u.desc, icon: u.icon, h: 56, right: lv >= u.max ? 'MÁX' : u.costs[lv] + '', rightColor: lv >= u.max ? C.good : sv.money >= u.costs[lv] ? C.accent : C.bad, lv, disabled: false };
        });
        items.push({ id: 'back', label: 'Volver', icon: 'ico_arrow' });
        this.menu = new U.Menu(items, Object.assign({}, base, { y: 96, h: 56, gap: 5 }));
      } else if (s === 'settings') {
        const on = (b) => (b ? 'sí' : 'no');
        const items = [
          { id: 'adaptive', label: 'Dificultad adaptativa', right: on(set.adaptive), sub: 'El juego ajusta las pistas si os atascáis', h: 46 },
          { id: 'voice', label: 'Voz narrada', right: on(set.voice), sub: 'Lee en voz alta los diálogos (si el navegador puede)', h: 46 },
          { id: 'music', label: 'Música', right: on(set.music), h: 38 },
          { id: 'sfx', label: 'Efectos de sonido', right: on(set.sfx), h: 38 },
          { id: 'bigText', label: 'Texto grande', right: on(set.bigText), h: 38 },
          { id: 'export', label: 'Copiar código de partida', icon: 'ico_book', sub: 'Para pasar tu progreso a otro móvil', h: 46 },
          { id: 'import', label: 'Pegar código de partida', icon: 'ico_key', sub: 'Reemplaza el progreso de este móvil', h: 46 },
          { id: 'reset', label: this.confirmReset ? '¿Seguro? Pulsa otra vez para borrar' : 'Borrar progreso', icon: 'ico_lock', color: this.confirmReset ? C.bad : C.text, h: 38 },
          { id: 'back', label: 'Volver', icon: 'ico_arrow', h: 38 },
        ];
        const keep = this.menu && this.state === 'settings' ? this.menu.sel : 0;
        this.menu = new U.Menu(items, Object.assign({}, base, { y: 84, gap: 6 }));
        this.menu.sel = keep;
      }
      if (this.menu && this.menu.sel >= this.menu.items.length) this.menu.sel = 0;
    }
    update(dt) {
      this.t += dt;
      if (this.state === 'help') { if (G.input.menu.ok || G.input.menu.back || G.input.mouse.clicked) this.setState('main'); return; }
      const r = this.menu.update();
      const sv = G.save.data, set = sv.settings;
      if (r.back) {
        if (this.state === 'main') G.go(G.scenes.title); else if (this.state === 'diff') this.setState('cases'); else this.setState('main');
        return;
      }
      if (r.chosen < 0) return;
      const it = this.menu.items[r.chosen];
      if (this.state === 'main') {
        if (it.id === 'continue') { const run = sv.run; if (run.mode === 'online') G.go(G.scenes.lobby, { caseId: run.caseId, diff: run.diff, resume: run }); else G.go(G.scenes.play, { caseId: run.caseId, diff: run.diff, mode: 'solo', resume: run }); }
        else if (it.id === 'cases') this.setState('cases');
        else if (it.id === 'loadcode') {
          let c = null; try { c = window.prompt('Pega aquí el código del caso (por ejemplo G6-2djn).\nEn el modo online, los dos móviles deben cargar el MISMO código antes de crear la sala.'); } catch (e) {}
          if (!c) return;
          const sd = G.caseSeedFromCode(c); if (sd.error) { G.audio.sfx('error'); this.flash(sd.error, C.bad); return; }
          const gr = G.generateCase(sd.seed, { register: true, theme: sd.theme }); if (gr.error) { G.audio.sfx('error'); this.flash('Ese código no da un caso válido', C.bad); return; }
          G.audio.sfx('success'); this.flash('Caso cargado: ' + gr.def.title, C.good); this.setState('cases');
        }
        else if (it.id === 'shop') this.setState('shop');
        else if (it.id === 'ach') this.setState('ach');
        else if (it.id === 'settings') this.setState('settings');
        else if (it.id === 'help') this.state = 'help';
        else if (it.id === 'mode') { set.mode = set.mode === 'solo' ? 'online' : 'solo'; G.save.store(); this.setState('main'); }
        else if (it.id === 'title') G.go(G.scenes.title);
      } else if (this.state === 'cases') {
        if (it.id === 'back') this.setState('main');
        else if (this.pruebaDiff[it.id]) { const df = this.pruebaDiff[it.id]; if (set.mode === 'online') G.go(G.scenes.lobby, { caseId: it.id, diff: df }); else G.go(G.scenes.play, { caseId: it.id, diff: df, mode: 'solo' }); }
        else { this.caseId = it.id; this.setState('diff'); }
      } else if (this.state === 'ach') {
        if (it.id === 'back') this.setState('main');
      } else if (this.state === 'diff') {
        if (it.id === 'back') this.setState('cases');
        else if (set.mode === 'online') G.go(G.scenes.lobby, { caseId: this.caseId, diff: it.id });
        else G.go(G.scenes.play, { caseId: this.caseId, diff: it.id, mode: set.mode === 'solo' ? 'solo' : 'solo' });
      } else if (this.state === 'shop') {
        if (it.id === 'back') { this.setState('main'); return; }
        const u = G.UPGRADES.find((x) => x.id === it.id), lv = G.upgLevel(u.id);
        if (lv >= u.max) { G.audio.sfx('error'); this.flash('Ya está al máximo', C.dim); return; }
        const cost = u.costs[lv];
        if (sv.money < cost) { G.audio.sfx('error'); this.flash('Te faltan ' + (cost - sv.money) + ' monedas', C.bad); return; }
        sv.money -= cost; sv.upgrades[u.id] = lv + 1; G.save.store(); G.audio.sfx('success');
        this.flash('¡' + u.name + ' mejorada!', C.good);
        this.setState('shop');
      } else if (this.state === 'settings') {
        if (it.id === 'back') { this.confirmReset = false; if (this.from === 'title') G.go(G.scenes.title); else this.setState('main'); return; }
        if (it.id === 'reset') {
          if (!this.confirmReset) { this.confirmReset = true; this.setState('settings'); return; }
          G.save.reset(); this.confirmReset = false; this.flash('Progreso borrado', C.bad); this.setState('settings'); return;
        }
        if (it.id === 'export') {
          const code = G.save.exportCode();
          const fallback = () => { try { window.prompt('Copia este código y pégalo en el otro móvil:', code); } catch (e) {} };
          try { navigator.clipboard.writeText(code).then(() => this.flash('Código copiado. Pégalo en el otro móvil.', C.good), fallback); } catch (e) { fallback(); }
          return;
        }
        if (it.id === 'import') {
          let c = null;
          try { c = window.prompt('Pega aquí el código de partida.\nOjo: reemplazará el progreso de este móvil.'); } catch (e) {}
          if (c) { if (G.save.importCode(c)) { G.audio.sfx('success'); this.flash('¡Partida importada!', C.good); } else { G.audio.sfx('error'); this.flash('Código no válido', C.bad); } this.setState('settings'); }
          return;
        }
        set[it.id] = !set[it.id];
        G.save.store();
        this.setState('settings');
      }
    }
    flash(msg, col) { this.toast = { msg, col, t: 2.4 }; }
    draw(ctx) {
      const sv = G.save.data;
      ctx.drawImage(buildOffice(), 0, 0, G.VW, G.VH);
      ctx.fillStyle = 'rgba(20,10,35,0.28)'; ctx.fillRect(0, 0, G.VW, G.VH);
      const bob = Math.sin(this.t * 2) * 1.5;
      G.drawSpr(ctx, 'rex_down_0', 110, 262 + bob, { scale: 5 });
      G.drawSpr(ctx, 'luna_down_0', 340, 252 - bob, { scale: 5 });
      G.drawSpr(ctx, 'cat_sit_0', 30, 330, { scale: 4 });
      // barra superior
      U.panel(ctx, 14, 10, 500, 56, { fill: 'rgba(24,14,40,0.9)', shadow: false });
      U.text(ctx, 'Lali & Oli Cases', 28, 16, { size: 19, color: C.accent });
      U.text(ctx, G.rankName(sv.rep) + ' · reputación ' + sv.rep, 28, 40, { size: 14, color: C.dim, bold: false });
      U.icon(ctx, 'ico_coin', 396, 20, 32);
      U.text(ctx, String(sv.money), 432, 26, { size: 22, color: C.accent });
      // panel del menú
      const titles = { main: 'Despacho', ach: 'Logros', cases: 'Casos', diff: 'Dificultad', shop: 'Tienda de equipo', settings: 'Ajustes', help: '' };
      U.panel(ctx, 530, 20, 410, G.VH - 40, { fill: 'rgba(24,14,40,0.88)' });
      U.text(ctx, titles[this.state] || '', 735, 34, { size: 28, align: 'center', color: C.accent });
      if (this.state === 'help') { G.drawHelp(ctx, sv.settings.mode); return; }
      this.menu.draw(ctx);
      // detalles
      if (this.state === 'cases') {
        const it = this.menu.items[this.menu.sel];
        const def = it && G.CASES[it.id];
        if (def) {
          U.panel(ctx, 14, 396, 500, 118, { fill: 'rgba(24,14,40,0.92)', shadow: false });
          U.text(ctx, def.title, 30, 404, { size: 19, color: C.accent });
          U.text(ctx, def.blurb, 30, 430, { size: 14, maxW: 470, bold: false, lineH: 18, maxH: 78, minSize: 11 });
          const rec = sv.done[def.id];
          if (rec) ['easy', 'normal', 'hard'].forEach((k, i) => { U.text(ctx, G.DIFFS[k].name, 30 + i * 160, 490, { size: 12, color: G.DIFFS[k].color }); for (let s = 0; s < 3; s++) U.icon(ctx, s < (rec.stars[k] || 0) ? 'ico_star' : 'ico_star_off', 86 + i * 160 + s * 17, 486, 17); });
        }
      }
      if (this.state === 'diff') {
        const def = G.CASES[this.caseId];
        U.text(ctx, def.title, 735, 74, { size: 20, align: 'center' });
        const rec = sv.done[def.id];
        this.menu.items.forEach((it, i) => {
          if (it.id === 'back') return;
          const r = this.menu.rects[i];
          for (let s = 0; s < 3; s++) U.icon(ctx, rec && s < (rec.stars[it.id] || 0) ? 'ico_star' : 'ico_star_off', r.x + r.w - 76 + s * 22 - 4, r.y + 8, 20);
        });
        const d = G.DIFFS[this.menu.items[this.menu.sel] && this.menu.items[this.menu.sel].id];
        U.panel(ctx, 14, 410, 500, 100, { fill: 'rgba(24,14,40,0.92)', shadow: false });
        U.text(ctx, d ? 'Recompensa x' + d.mult + (d.timeLimit ? ' · con límite de tiempo' : '') + ' · ' + d.strikes + (d.strikes === 1 ? ' intento de acusación' : ' intentos de acusación') + (d.wrongCut.length > 1 ? ' (cada fallo baja la recompensa; sin intentos, nada)' : ' (si fallas, sin recompensa)') : 'Vuelve a la lista de casos.', 30, 416, { size: 15, maxW: 470, color: C.text, bold: false });
        U.text(ctx, 'Puedes mezclar con la «dificultad adaptativa» de Ajustes para que el juego te eche una mano cuando te atasques.', 30, 450, { size: 13, maxW: 470, color: C.dim, bold: false, lineH: 18 });
      }
      if (this.state === 'ach') {
        const it = this.menu.items[this.menu.sel], a = it && G.ACH.find((x) => x.id === it.id);
        U.panel(ctx, 14, 410, 500, 100, { fill: 'rgba(24,14,40,0.92)', shadow: false });
        if (a) {
          U.text(ctx, a.name + (G.hasAch(a.id) ? '  ✔' : ''), 30, 418, { size: 18, color: G.hasAch(a.id) ? C.good : C.accent });
          U.text(ctx, a.desc, 30, 450, { size: 15, maxW: 470, bold: false, maxH: 54, minSize: 11 });
        } else U.text(ctx, 'Los logros se desbloquean jugando casos.', 30, 430, { size: 15, bold: false });
      }
      if (this.state === 'shop') {
        const m = this.menu, it = m.items[m.sel];
        U.panel(ctx, 14, 410, 500, 100, { fill: 'rgba(24,14,40,0.92)', shadow: false });
        const u = it && G.UPGRADES.find((x) => x.id === it.id);
        if (u) {
          U.text(ctx, u.name + '  (nivel ' + G.upgLevel(u.id) + '/' + u.max + ')', 30, 414, { size: 18, color: C.accent });
          U.text(ctx, u.desc, 30, 444, { size: 15, maxW: 470, bold: false, maxH: 60, minSize: 11 });
        } else U.text(ctx, 'Gana monedas resolviendo casos y mejora tu equipo.', 30, 420, { size: 15, bold: false });
      }
      if (this.toast) {
        this.toast.t -= 0.016;
        if (this.toast.t <= 0) this.toast = null;
        else U.text(ctx, this.toast.msg, 735, G.VH - 38, { size: 17, align: 'center', color: this.toast.col });
      }
    }
  }


  // ---------- SALA ONLINE (2 iPhones) ----------
  class Lobby {
    enter(args) {
      this.a = args;
      this.t = 0;
      this.msg = '';
      this.code = '';
      this.starting = false;
      this.setState('menu');
      G.net.avail = null;
      G.net.init().then((ok) => { G.net.avail = ok; if (!ok && this.state === 'menu') this.msg = 'Este visor no permite jugar online. Abre el enlace desde Claude con tu sesión iniciada.'; });
      G.net.onGo = (go) => {
        if (G.scene !== this || this.starting) return;
        if (G.net.versionMismatch()) { this.msg = G.net.versionMsg(); G.audio.sfx('error'); return; }
        { const gm = !G.CASES[go.c] && /^gen_g(\d+)([a-z]?)_([0-9a-z]+)$/.exec(go.c); if (gm) { const sd = G.caseSeedFromCode('G' + gm[1] + gm[2] + '-' + gm[3]); if (sd.seed !== undefined) try { G.generateCase(sd.seed, { register: true, theme: sd.theme }); } catch (e) {} } } // el invitado genera solo el caso de prueba que eligió el anfitrión (no hace falta cargar el código en los dos móviles)
        if (G.CASES[go.c]) { this.starting = true; const sv = G.save.data.run; G.go(G.scenes.play, { caseId: go.c, diff: go.d, mode: 'online', me: G.net.me, resume: go.r && sv && sv.caseId === go.c && sv.mode === 'online' ? sv : undefined }); }
      };
    }
    setState(s) {
      this.state = s;
      if (s === 'menu') this.menu = new U.Menu([
        { id: 'host', label: 'Crear sala', sub: 'Tú serás Oli y recibirás un código', icon: 'ico_star', h: 62 },
        { id: 'join', label: 'Unirme con código', sub: 'Tú serás Lali', icon: 'ico_key', h: 62 },
        { id: 'back', label: 'Volver', icon: 'ico_arrow' },
      ], { x: 300, y: 190, w: 360, h: 50, gap: 12 });
      if (s === 'host') this.menu = new U.Menu([
        { id: 'go', label: '¡Empezar el caso!', icon: 'ico_arrow', h: 56 },
        { id: 'back', label: 'Cancelar', icon: 'ico_arrow' },
      ], { x: 300, y: 400, w: 360, h: 50, gap: 10 });
      if (s === 'wait') this.menu = new U.Menu([{ id: 'back', label: 'Salir', icon: 'ico_arrow' }], { x: 300, y: 420, w: 360, h: 50, gap: 10 });
    }
    async open(code, me) {
      this.msg = 'Conectando…';
      try {
        await G.net.open(code, me);
        this.msg = '';
        this.setState(me === 0 ? 'host' : 'wait');
      } catch (e) {
        this.msg = G.net.error === 'unavailable' ? 'Este visor no permite jugar online. Abre el enlace desde Claude con tu sesión iniciada.' : G.net.errorText(G.net.error);
        this.setState('menu');
      }
    }
    keys() {
      const L = 'ABCDEFGHJKLMNPRSTUVXYZ'.split('');
      const out = L.map((c, i) => ({ c, x: 110 + (i % 8) * 92, y: 235 + Math.floor(i / 8) * 66, w: 82, h: 58 }));
      out.push({ c: '⌫', x: 110 + 6 * 92, y: 235 + 2 * 66, w: 82, h: 58, del: true });
      return out;
    }
    update(dt) {
      this.t += dt;
      const m = G.input.menu, N = G.net;
      if (this.state === 'join') {
        if (m.back) { this.setState('menu'); return; }
        if (G.input.mouse.clicked) {
          this.keys().forEach((k) => {
            if (!U.hit(k.x, k.y, k.w, k.h)) return;
            G.audio.sfx('select');
            if (k.del) this.code = this.code.slice(0, -1);
            else if (this.code.length < N.CODE_LEN) this.code += k.c;
          });
          if (U.hit(10, 10, 150, 46)) { this.setState('menu'); return; }
          if (this.code.length === N.CODE_LEN && !this.opening) { this.opening = true; this.open(this.code, 1).then(() => { this.opening = false; }); }
        }
        // teclado físico
        for (let c = 65; c <= 90; c++) { const ch = String.fromCharCode(c); if (G.input.keyPressed('Key' + ch) && this.code.length < N.CODE_LEN) this.code += ch; }
        if (G.input.keyPressed('Backspace')) this.code = this.code.slice(0, -1);
        if (this.code.length === N.CODE_LEN && !this.opening) { this.opening = true; this.open(this.code, 1).then(() => { this.opening = false; }); }
        return;
      }
      const r = this.menu.update();
      if (this.state === 'menu') {
        if (r.back || (r.chosen >= 0 && this.menu.items[r.chosen].id === 'back')) { G.net.leave(); G.go(G.scenes.hub, { from: 'lobby' }); return; }
        if (r.chosen >= 0) {
          const id = this.menu.items[r.chosen].id;
          if (id === 'host') this.open(N.genCode(), 0);
          if (id === 'join') { this.code = ''; this.opening = false; this.msg = ''; this.setState('join'); }
        }
      } else {
        if (r.back || (r.chosen >= 0 && this.menu.items[r.chosen].id === 'back')) { N.leave(); this.setState('menu'); return; }
        if (this.state === 'host' && r.chosen >= 0 && this.menu.items[r.chosen].id === 'go') {
          if (!N.remoteHere) { this.msg = 'Todavía no ha entrado nadie con el código.'; G.audio.sfx('error'); return; }
          if (N.versionMismatch()) { this.msg = N.versionMsg(); G.audio.sfx('error'); return; }
          this.starting = true;
          N.sendGo(this.a.caseId, this.a.diff, !!this.a.resume);
          G.go(G.scenes.play, { caseId: this.a.caseId, diff: this.a.diff, mode: 'online', me: N.me, resume: this.a.resume });
        }
      }
    }
    draw(ctx) {
      U.backdrop(ctx);
      const N = G.net;
      U.text(ctx, 'Sala online', G.VW / 2, 40, { size: 34, align: 'center', color: C.accent });
      if (this.state === 'menu') {
        U.text(ctx, 'Cada detective en su móvil. Hace falta conexión (datos o wifi).', G.VW / 2, 120, { size: 16, align: 'center', color: C.dim, bold: false });
        this.menu.draw(ctx);
      }
      const box = (code, y) => {
        const n = N.CODE_LEN;
        for (let i = 0; i < n; i++) {
          const x = G.VW / 2 - n * 62 + i * 124;
          U.panel(ctx, x + 8, y, 108, 96, { fill: 'rgba(24,14,40,0.9)', stroke: C.accent, shadow: false });
          U.text(ctx, code[i] || '', x + 62, y + 12, { size: 64, align: 'center' });
        }
      };
      if (this.state === 'join') {
        U.panel(ctx, 10, 10, 150, 46, { fill: 'rgba(24,14,40,0.88)', stroke: '#6b4f9a', shadow: false, r: 10 });
        U.text(ctx, '‹ Volver', 85, 20, { size: 18, align: 'center' });
        U.text(ctx, 'Escribe el código que te ha dado tu compañero', G.VW / 2, 70, { size: 18, align: 'center', color: C.text, bold: false });
        box(this.code, 100);
        this.keys().forEach((k) => {
          U.panel(ctx, k.x, k.y, k.w, k.h, { fill: U.hit(k.x, k.y, k.w, k.h) ? '#6a47b8' : 'rgba(70,50,110,0.9)', stroke: '#7d62b8', shadow: false, r: 12 });
          U.text(ctx, k.c, k.x + k.w / 2, k.y + 12, { size: 30, align: 'center' });
        });
      }
      if (this.state === 'host') {
        U.text(ctx, 'Dile este código a tu compañero', G.VW / 2, 90, { size: 20, align: 'center', bold: false });
        box(N.code || '', 130);
        const ok = N.remoteHere && !N.versionMismatch();
        if (N.remoteHere && N.versionMismatch()) this.msg = N.versionMsg(); else if (this.msg === N.versionMsg()) this.msg = '';
        U.text(ctx, ok ? 'Lali está conectada. ¡Cuando queráis!' : 'Esperando a Lali…' + '.'.repeat(1 + Math.floor(this.t * 2) % 3), G.VW / 2, 260, { size: 22, align: 'center', color: ok ? C.good : C.dim });
        { const lm = N.linkMode(); U.text(ctx, lm === 'directo' ? 'Enlace: directo entre móviles' : lm === 'respaldo' ? 'Enlace: por servidor de respaldo (funciona con datos móviles)' : 'Enlace: buscando…', G.VW / 2, 345, { size: 14, align: 'center', color: lm ? C.good : C.dim, bold: false }); }
        U.text(ctx, 'Elegiste: ' + (G.CASES[this.a.caseId] ? G.CASES[this.a.caseId].title : '') + ' · ' + G.DIFFS[this.a.diff].name, G.VW / 2, 310, { size: 16, align: 'center', color: C.dim, bold: false });
        this.menu.draw(ctx);
      }
      if (this.state === 'wait') {
        box(N.code || '', 120);
        if (N.remoteHere && N.versionMismatch()) this.msg = N.versionMsg();
        { const lm = N.linkMode(); U.text(ctx, lm === 'directo' ? 'Enlace: directo entre móviles' : lm === 'respaldo' ? 'Enlace: por servidor de respaldo (funciona con datos móviles)' : 'Enlace: buscando…', G.VW / 2, 330, { size: 14, align: 'center', color: lm ? C.good : C.dim, bold: false }); }
        U.text(ctx, N.remoteHere ? 'Conectada con Oli. Esperando a que empiece el caso…' : 'Entrando en la sala…', G.VW / 2, 270, { size: 22, align: 'center' });
        this.menu.draw(ctx);
      }
      if (this.msg) U.text(ctx, this.msg, G.VW / 2, G.VH - 60, { size: 16, align: 'center', color: C.bad, maxW: 800 });
    }
  }

  G.scenes.title = new Title();
  G.scenes.lobby = new Lobby();
  G.scenes.mode = new ModeSel();
  G.scenes.hub = new Hub();

  // ---------- arranque ----------
  // FIX-4c (P10): en el móvil en VERTICAL el juego (960×540) sale a 4-6 px y no se lee: se muestra un aviso «gira el teléfono».
  // Solo con táctil y ventana más alta que ancha; en ordenador (ratón) no sale nunca. Mientras sale, nada recibe toques ni avanza (salvo online).
  G.isPortrait = (w, h, touch) => !!touch && w > 0 && h > w * 1.05;
  G.drawRotateNotice = function (ctx) {
    const C = G.ui.colors, U = G.ui, t = (G.scene && G.scene.t) || 0;
    ctx.save();
    ctx.fillStyle = '#0d0716'; ctx.fillRect(0, 0, G.VW, G.VH);
    // teléfono que gira (dibujado, sin imágenes)
    ctx.translate(G.VW / 2, 150); ctx.scale(1.4, 1.4);
    ctx.rotate(-Math.PI / 2 * (0.5 + 0.5 * Math.sin((Date.now() / 700) % (Math.PI * 2))));
    U.rrect(ctx, -34, -60, 68, 120, 12); ctx.fillStyle = '#2a1b30'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.accent; ctx.stroke();
    U.rrect(ctx, -26, -46, 52, 84, 4); ctx.fillStyle = '#5a3f8c'; ctx.fill();
    ctx.restore();
    U.text(ctx, 'Gira el teléfono', G.VW / 2, 262, { size: 62, align: 'center', color: C.accent, maxW: 900 });
    U.text(ctx, 'Lali & Oli Cases se juega en horizontal.', G.VW / 2, 350, { size: 38, align: 'center', maxW: 900, bold: false });
    U.text(ctx, 'Si no gira, activa la rotación en el centro de control.', G.VW / 2, 408, { size: 32, align: 'center', color: C.dim, maxW: 900, bold: false });
  };
  G.boot = function (canvas) {
    const Q = 2;
    canvas.width = G.VW * Q;
    canvas.height = G.VH * Q;
    const ctx = canvas.getContext('2d');
    G.input.bindCanvas(canvas);
    G.save.load();
    G.errors = [];
    G.ctx = ctx;
    G.go(G.scenes.title);
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      G.input.diag.frame(now);
      try {
        // disposición: con táctil jugando, franjas laterales fuera del mapa (FIX-4a parte 1)
        const sx = G.layout.compute(canvas.clientWidth, canvas.clientHeight, !!(G.input.touch.enabled && G.input.touch.inPlay));
        if (sx !== G.layout.sx || canvas.width !== Math.round(G.layout.fw * Q)) { G.layout.set(sx); canvas.width = Math.round(G.layout.fw * Q); }
        G.input.update();
        const portrait = G.isPortrait(canvas.clientWidth, canvas.clientHeight, G.input.touch.enabled);
        G.rotateShown = portrait;
        if (!(portrait && !(G.scene && G.scene.online))) G.scene.update(dt); // en vertical todo se detiene y no recibe toques (salvo una partida online, que sigue para no dejar solo al compañero)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(Q, 0, 0, Q, G.layout.sx * Q, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, G.VW, G.VH); ctx.clip(); // el juego no se sale al área de las franjas
        G.scene.draw(ctx);
        if (G.fadeIn > 0) { ctx.fillStyle = `rgba(10,5,20,${G.fadeIn * 4})`; ctx.fillRect(0, 0, G.VW, G.VH); G.fadeIn -= dt; }
        if (portrait) G.drawRotateNotice(ctx);
        if (G.input.diag.on) G.input.diag.draw(ctx);
        ctx.restore();
        if (G.layout.sx > 0 && !portrait && G.scene.drawStrips) G.scene.drawStrips(ctx); // controles táctiles en las franjas
        G.audio.tick();
        G.input.endFrame();
      } catch (e) {
        G.errors.push(String(e && e.stack || e));
        if (G.errors.length < 4) console.error(e);
        ctx.setTransform(Q, 0, 0, Q, 0, 0);
        ctx.fillStyle = 'rgba(80,0,0,0.85)'; ctx.fillRect(0, 0, G.VW, 80);
        ctx.fillStyle = '#fff'; ctx.font = '14px monospace'; ctx.fillText('Error: ' + String(e && e.message || e).slice(0, 110), 12, 30);
        ctx.fillText('Pulsa F5 para recargar. (el progreso guardado no se pierde)', 12, 56);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
})(typeof window !== 'undefined' ? window : globalThis);
