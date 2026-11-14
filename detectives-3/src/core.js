// core.js — utilidades, entrada (teclado/mando/ratón), audio procedural, guardado y voz.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const hasDOM = typeof root.addEventListener === 'function';

  G.VERSION = '0.7.60';
  G.BUILD = '__BUILD__';
  // Servidores TURN propios (opcional): pega aquí las credenciales de una cuenta gratuita de metered.ca,
  // p. ej. [{ urls: 'turn:global.relay.metered.ca:443', username: '...', credential: '...' }]
  G.TURN = [];
  G.VW = 960; // resolución lógica
  G.VH = 540;
  G.TILE = 16;
  G.S = 3; // escala del mundo
  G.TS = G.TILE * G.S; // tamaño de baldosa en pantalla

  // ---------- utilidades ----------
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  G.rng = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // hash de texto → entero estable (mismo resultado en todos los móviles)
  G.hash = (str) => { let h = 2166136261 >>> 0; str = String(str); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  G.pick = (arr, r) => arr[Math.floor((r ? r() : Math.random()) * arr.length)];
  G.fmtTime = (s) => {
    s = Math.max(0, Math.floor(s));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  G.wrap = function (ctx, text, maxW) {
    const out = [];
    String(text).split('\n').forEach((para) => {
      const words = para.split(' ');
      let line = '';
      words.forEach((w) => {
        const t = line ? line + ' ' + w : w;
        if (ctx.measureText(t).width > maxW && line) {
          out.push(line);
          line = w;
        } else line = t;
      });
      out.push(line);
    });
    return out;
  };

  // ---------- guardado y ajustes ----------
  const SAVE_KEY = 'agencia-detectives-v1';
  G.defaultSave = () => ({
    v: 1,
    money: 0,
    rep: 0,
    upgrades: {},
    done: {}, // caseId -> { best: {difficulty: stars}, count }
    ach: {},
    settings: { difficulty: 'normal', voice: false, music: true, sfx: true, bigText: false, adaptive: true, mode: 'coop' },
  });
  // Valida y limpia una partida (de localStorage o importada): tipos correctos, sin claves peligrosas y con migración por versión.
  const BAD = { __proto__: 1, constructor: 1, prototype: 1 };
  const clean = (o, depth) => {
    if (!o || typeof o !== 'object' || depth > 14) return Array.isArray(o) ? [] : {};
    const out = Array.isArray(o) ? [] : {};
    Object.keys(o).forEach((k) => {
      if (BAD[k] === 1 || k === '__proto__') return;
      const v = o[k];
      out[k] = v && typeof v === 'object' ? clean(v, depth + 1) : typeof v === 'number' ? (isFinite(v) ? v : 0) : v;
    });
    return out;
  };
  G.SAVE_VERSION = 1;
  // migraciones: cuando cambie el formato, añadir aquí `2: (d) => {...}` (de la 1 a la 2) y subir SAVE_VERSION
  G.SAVE_MIGRATIONS = {};
  G.sanitizeSave = function (d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
    d = clean(d, 0);
    let v = Number(d.v) || 0;
    if (v < 1 || v > G.SAVE_VERSION) return null; // de una versión futura: no la tocamos
    while (v < G.SAVE_VERSION) { const m = G.SAVE_MIGRATIONS[v + 1]; if (m) d = m(d) || d; v++; d.v = v; }
    const base = G.defaultSave();
    const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
    const num = (x) => (typeof x === 'number' && isFinite(x) && x >= 0 ? Math.floor(x) : 0);
    return Object.assign(base, d, { money: num(d.money), rep: num(d.rep), upgrades: obj(d.upgrades), done: obj(d.done), ach: obj(d.ach), settings: Object.assign(base.settings, obj(d.settings)) });
  };
  G.save = {
    data: G.defaultSave(),
    load() {
      try {
        const raw = root.localStorage && root.localStorage.getItem(SAVE_KEY);
        if (raw) {
          const d = G.sanitizeSave(JSON.parse(raw));
          if (d) this.data = d;
        }
      } catch (e) {}
      return this.data;
    },
    store() {
      try {
        root.localStorage && root.localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      } catch (e) {}
    },
    reset() {
      this.data = G.defaultSave();
      this.store();
    },
    // código para pasar el progreso a otro móvil o navegador
    exportCode() {
      return 'LOC1.' + btoa(unescape(encodeURIComponent(JSON.stringify(this.data))));
    },
    importCode(code) {
      try {
        code = String(code || '').trim().replace(/\s+/g, '');
        if (code.indexOf('LOC1.') !== 0) return false;
        const d = JSON.parse(decodeURIComponent(escape(atob(code.slice(5)))));
        const s = G.sanitizeSave(d);
        if (!s) return false;
        this.data = s;
        this.store();
        return true;
      } catch (e) { return false; }
    },
  };

  // ---------- logros ----------
  G.ACH = [
    { id: 'primer_caso', name: 'Primer caso', desc: 'Resuelve un caso.' },
    { id: 'impecable', name: 'Impecable', desc: 'Resuelve un caso sin ninguna acusación fallida.' },
    { id: 'relampago', name: 'Relámpago', desc: 'Resuelve un caso dentro del tiempo de referencia.' },
    { id: 'lupa_oro', name: 'Lupa de oro', desc: 'Encuentra todas las pistas de un caso.' },
    { id: 'protesto', name: '¡Protesto!', desc: 'Desmonta una mentira enseñando la prueba correcta.' },
    { id: 'cazamentiras', name: 'Cazamentiras', desc: 'Desmonta todas las mentiras de un mismo caso.' },
    { id: 'gato', name: 'Amigo de Bigotes', desc: 'Acaricia a Bigotes hasta que te regale una moneda.' },
    { id: 'hierro', name: 'Detective de hierro', desc: 'Resuelve un caso en dificultad Difícil.' },
  ];
  G.hasAch = (id) => !!(G.save.data.ach && G.save.data.ach[id]);
  G.award = function (id) {
    const a = G.ACH.find((x) => x.id === id);
    if (!a || G.hasAch(id)) return false;
    G.save.data.ach = G.save.data.ach || {};
    G.save.data.ach[id] = Date.now();
    G.save.store();
    try { G.ui.toast('Logro: ' + a.name, 4, { icon: 'ico_star', color: '#ffd45a' }); G.audio.sfx('success'); } catch (e) {}
    return true;
  };

  // ---------- voz (síntesis del navegador, opcional) ----------
  G.speak = function (text) {
    try {
      if (!G.save.data.settings.voice || !root.speechSynthesis) return;
      root.speechSynthesis.cancel();
      const u = new root.SpeechSynthesisUtterance(String(text).replace(/[*_#]/g, ''));
      u.lang = 'es-ES';
      u.rate = 1.05;
      root.speechSynthesis.speak(u);
    } catch (e) {}
  };

  // ---------- entrada ----------
  const keys = {};
  const pressedKeys = {};
  const I = (G.input = {
    mode: 'coop', // 'coop' | 'solo'
    mouse: { x: 0, y: 0, down: false, clicked: false, moved: false },
    p: [newPad(), newPad()],
    menu: { up: false, down: false, left: false, right: false, ok: false, back: false },
    anyPressed: false,
    padsConnected: 0,
    // controles táctiles (iPhone): joystick flotante a la izquierda, botones de acción y herramienta a la derecha
    touch: {
      enabled: (() => { try { return !!(root.matchMedia && root.matchMedia('(pointer: coarse)').matches) || (root.navigator && root.navigator.maxTouchPoints > 1 && !/Win|Mac(?!.*Mobile)|Linux x86/.test(root.navigator.platform || '') ); } catch (e) { return false; } })(), playing: false, inPlay: false, mx: 0, my: 0,
      stick: { id: null, ox: 0, oy: 0, x: 0, y: 0 },
      A: { id: null, x: 860, y: 375, r: 62 },
      T: { id: null, x: 742, y: 428, r: 44 },
      S: { id: null, x: 752, y: 322, r: 32 },
    },
  });

  // ---------- disposición: zona segura y franjas laterales (FIX-4a parte 1) ----------
  // El juego sigue siendo 960×540 lógicos (G.VW × G.VH) y todo el código de escenas dibuja ahí. Con táctil JUGANDO el lienzo se ensancha con
  // dos franjas a los lados, FUERA del mapa: el juego se dibuja desplazado `sx` y los controles viven en las franjas (coordenadas de juego:
  // x < 0 = franja izquierda, x > VW = franja derecha). `G.safe()` = rectángulo del juego donde debe caber todo el texto y las burbujas.
  G.SAFE_PAD = 8;
  G.safe = function () { const p = G.SAFE_PAD; return { x: p, y: p, w: G.VW - 2 * p, h: G.VH - 2 * p, r: G.VW - p, b: G.VH - p }; };
  const L = (G.layout = {
    sx: 0, // ancho de CADA franja (0 = sin franjas)
    fw: G.VW, // ancho lógico total del lienzo = VW + 2·sx
    MIN_STRIP: 112, MAX_STRIP: 200,
    // ancho de franja para una caja de pantalla (px CSS) y si se quieren franjas: el hueco natural del aspecto, entre MIN y MAX
    compute(boxW, boxH, want) {
      if (!want) return 0;
      const natural = boxW > 0 && boxH > 0 ? (G.VH * boxW / boxH - G.VW) / 2 : 0;
      return Math.round(Math.min(L.MAX_STRIP, Math.max(L.MIN_STRIP, natural)));
    },
    set(sx) { L.sx = sx; L.fw = G.VW + 2 * sx; L.place(); },
    // coloca los botones táctiles en la franja derecha (el joystick vive en la izquierda: cualquier toque en ella)
    place() {
      const T = I.touch, sx = L.sx;
      if (sx <= 0) return;
      const cx = G.VW + sx / 2, rA = Math.min(46, sx / 2 - 8);
      T.A.x = cx; T.A.y = G.VH - 118; T.A.r = rA;
      T.T.x = cx; T.T.y = G.VH - 236; T.T.r = Math.min(34, rA);
      T.S.x = cx; T.S.y = G.VH - 322; T.S.r = Math.min(28, rA);
      T.rest = { x: -sx / 2, y: G.VH - 140, r: Math.min(44, sx / 2 - 8) }; // aro de reposo del joystick (solo pista visual)
    },
  });
  function newPad() {
    return { mx: 0, my: 0, action: false, actionDown: false, tool: false, toolDown: false, book: false, swap: false, pause: false };
  }
  const SCHEMES = [
    { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], action: ['KeyE'], tool: ['KeyQ'], book: ['KeyF'] },
    { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], action: ['Enter'], tool: ['ShiftRight'], book: ['Period'] },
  ];
  const SOLO = {
    up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
    action: ['KeyE', 'Enter', 'Space', 'TouchA'], tool: ['KeyQ', 'ShiftRight', 'ShiftLeft', 'TouchT'], book: ['KeyF', 'Period'],
  };
  const anyDown = (codes) => codes.some((c) => keys[c]);
  const anyPress = (codes) => codes.some((c) => pressedKeys[c]);
  const padPrev = [{}, {}];

  if (hasDOM) {
    root.addEventListener('keydown', (e) => {
      if (!/^(Shift|Control|Alt|Meta)/.test(e.code) && I.touch.stick.id === null) I.touch.enabled = false;
      if (!keys[e.code]) pressedKeys[e.code] = true;
      keys[e.code] = true;
      I.anyPressed = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      G.audio.unlock();
    });
    root.addEventListener('keyup', (e) => {
      keys[e.code] = false;
    });
    root.addEventListener('blur', () => {
      Object.keys(keys).forEach((k) => (keys[k] = false));
    });
  }

  // ---------- diagnóstico ligero del táctil (FIX-6c, parte LOW) ----------
  // Siempre graba (anillo de 80 eventos, casi sin coste). Se ve con ?diag en la URL o la tecla F9. No cambia el comportamiento del juego.
  // Sirve para saber, cuando el táctil «deja de responder», si el iPhone dejó de enviar toques (nada en «página»), si el juego los recibió
  // y no los usó (cuenta «lienzo» sube pero «ids» atascados), o si el juego se congeló (huecos de fotograma largos).
  const diag = (I.diag = {
    on: false, ring: [], n: { pagina: 0, lienzo: 0, down: 0, up: 0, cancel: 0, lostcap: 0, blur: 0, hidden: 0 },
    lastPage: 0, lastCanvas: 0, lastFrame: 0, gaps: [], maxGap: 0, t0: 0,
    now() { return (root.performance && root.performance.now) ? root.performance.now() : Date.now(); },
    log(kind, e, extra) {
      const t = diag.now();
      const T = I.touch;
      diag.ring.push({ t, k: kind, id: e && e.pointerId, ty: e && e.pointerType, x: e && Math.round(e.clientX), y: e && Math.round(e.clientY), ids: [T.stick.id, T.A.id, T.T.id, T.S.id], x2: extra || '' });
      if (diag.ring.length > 80) diag.ring.shift();
    },
    frame(now) { // llamado en cada fotograma: un hueco largo = el juego (o el navegador) se congeló
      if (diag.lastFrame) { const g = now - diag.lastFrame; if (g > diag.maxGap) diag.maxGap = g; if (g > 400) { diag.gaps.push({ t: now, g: Math.round(g) }); if (diag.gaps.length > 12) diag.gaps.shift(); } }
      diag.lastFrame = now;
    },
    ago(t) { return t ? ((diag.now() - t) / 1000).toFixed(1) + ' s' : 'nunca'; },
    summary() {
      const T = I.touch;
      return ['táctil ' + (T.enabled ? 'sí' : 'no') + ' · ids stick/A/T/S ' + [T.stick.id, T.A.id, T.T.id, T.S.id].join('/') + ' · mouse.down ' + I.mouse.down,
        'página ' + diag.n.pagina + ' (hace ' + diag.ago(diag.lastPage) + ') · lienzo ' + diag.n.lienzo + ' (hace ' + diag.ago(diag.lastCanvas) + ')',
        'down ' + diag.n.down + ' · up ' + diag.n.up + ' · cancel ' + diag.n.cancel + ' · pérdida captura ' + diag.n.lostcap + ' · blur ' + diag.n.blur + ' · oculta ' + diag.n.hidden,
        'mayor hueco de fotograma ' + Math.round(diag.maxGap) + ' ms · huecos > 400 ms: ' + (diag.gaps.map((g) => g.g).join(', ') || 'ninguno')];
    },
    dump() { return diag.summary().concat(diag.ring.slice(-20).map((r) => ((r.t - diag.t0) / 1000).toFixed(2) + ' ' + r.k + ' #' + r.id + ' ' + (r.ty || '') + ' (' + r.x + ',' + r.y + ') ids ' + r.ids.join('/') + (r.x2 ? ' ' + r.x2 : ''))).join('\n'); },
    draw(ctx) { // recuadro de texto pequeño arriba a la izquierda (coordenadas de juego)
      const L1 = diag.summary().concat(diag.ring.slice(-6).map((r) => ((r.t - diag.t0) / 1000).toFixed(1) + ' ' + r.k + ' #' + r.id + ' ids ' + r.ids.join('/') + (r.x2 ? ' ' + r.x2 : '')));
      ctx.save(); ctx.globalAlpha = 0.82; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 560, 14 * L1.length + 10); ctx.globalAlpha = 1;
      ctx.fillStyle = '#9f9'; ctx.font = '11px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      L1.forEach((l, i) => ctx.fillText(l.slice(0, 100), 6, 16 + i * 14)); ctx.restore();
    },
  });
  diag.t0 = diag.now();
  if (hasDOM) {
    try { if (/[?&]diag\b/.test(root.location && root.location.search || '')) diag.on = true; } catch (e) {}
    const doc = root.document;
    ['pointerdown', 'pointerup', 'pointercancel'].forEach((ty) => doc.addEventListener(ty, (e) => { diag.n.pagina++; diag.lastPage = diag.now(); diag.log('pág-' + ty.slice(7), e); }, true));
    root.addEventListener('blur', () => { diag.n.blur++; diag.log('blur'); });
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) diag.n.hidden++; diag.log(doc.hidden ? 'oculta' : 'visible'); });
    root.addEventListener('keydown', (e) => { if (e.code === 'F9') diag.on = !diag.on; });
  }
  I.bindCanvas = function (canvas) {
    const toLogical = (e) => {
      const r = canvas.getBoundingClientRect();
      const k = Math.min(r.width / L.fw, r.height / G.VH);
      const ox = (r.width - L.fw * k) / 2;
      const oy = (r.height - G.VH * k) / 2;
      I.mouse.x = (e.clientX - r.left - ox) / k - L.sx; // coordenadas de JUEGO (pueden ser <0 o >VW dentro de las franjas)
      I.mouse.y = (e.clientY - r.top - oy) / k;
      I.mouse.moved = true;
    };
    const T = I.touch;
    // FIX-6c 1/4 · dedos «fantasma»: si el navegador pierde un pointerup/pointercancel (gesto del sistema, aviso, cambio de app, captura perdida),
    // el id del dedo se quedaba ocupado y el stick/botón dejaba de responder. Se sueltan los ids al perder la captura, al perder el foco o ocultarse la página,
    // y en cada toque nuevo se barren los ids cuya captura ya no existe.
    const captured = {};
    const releaseId = (id, why) => {
      let any = false;
      if (T.A.id === id) { T.A.id = null; keys.TouchA = false; any = true; }
      if (T.T.id === id) { T.T.id = null; keys.TouchT = false; any = true; }
      if (T.S.id === id) { T.S.id = null; keys.TouchS = false; any = true; }
      if (T.stick.id === id) { T.stick.id = null; T.mx = 0; T.my = 0; any = true; }
      delete captured[id]; delete orphans[id];
      if (any && I.diag) I.diag.log('suelta-' + why, { pointerId: id });
      return any;
    };
    I.releaseTouches = (why) => { [T.A.id, T.T.id, T.S.id, T.stick.id].forEach((id) => { if (id !== null) releaseId(id, why || 'todo'); }); I.mouse.down = false; Object.keys(orphans).forEach((k) => delete orphans[k]); };
    const sweepStale = () => {
      [T.A.id, T.T.id, T.S.id, T.stick.id].forEach((id) => {
        if (id === null || !captured[id]) return; // solo se barren dedos cuya captura SÍ se logró y luego desapareció
        let has = true; try { has = canvas.hasPointerCapture(id); } catch (err) {}
        if (!has) releaseId(id, 'obsoleto');
      });
    };
    // FIX-6c 3/4 · dedo apoyado durante un diálogo o una transición (T.playing false): no coge el stick y, si sigue apoyado al acabar, quedaba «muerto»
    // hasta levantarlo y volver a tocar. Se recuerdan esos dedos («huérfanos») y, al volver a jugar, los de la zona del stick lo cogen (origen = donde estén).
    // Los botones NO se adoptan (una acción no debe dispararse sola).
    const orphans = {};
    const inStickZone = (x, y) => x < 0 || (x < G.VW * 0.45 && y > 110 && y < G.VH - 84);
    I.adoptTouches = () => {
      const ids = Object.keys(orphans);
      if (!ids.length) return;
      if (!(T.playing && T.enabled)) return;
      ids.forEach((k) => {
        const o = orphans[k]; delete orphans[k];
        if (T.stick.id === null && inStickZone(o.x, o.y)) {
          T.stick.id = +k; T.stick.ox = T.stick.x = o.x; T.stick.oy = T.stick.y = o.y; T.mx = 0; T.my = 0;
          if (I.diag) I.diag.log('adopta-stick', { pointerId: +k });
        }
      });
    };
    if (hasDOM) {
      canvas.addEventListener('lostpointercapture', (e) => releaseId(e.pointerId, 'captura'));
      root.addEventListener('blur', () => I.releaseTouches('blur'));
      root.document.addEventListener('visibilitychange', () => { if (root.document.hidden) I.releaseTouches('oculta'); });
    }
    const inCircle = (b, x, y) => Math.hypot(x - b.x, y - b.y) < b.r + 14;
    canvas.addEventListener('pointermove', (e) => {
      toLogical(e);
      if (orphans[e.pointerId]) { orphans[e.pointerId].x = I.mouse.x; orphans[e.pointerId].y = I.mouse.y; }
      if (T.stick.id === e.pointerId) {
        const dx = I.mouse.x - T.stick.ox, dy = I.mouse.y - T.stick.oy, R = 58;
        const d = Math.hypot(dx, dy), k = d > R ? R / d : 1;
        T.stick.x = T.stick.ox + dx * k; T.stick.y = T.stick.oy + dy * k;
        const m = Math.min(1, d / R);
        if (m < 0.18) { T.mx = 0; T.my = 0; } else { T.mx = (dx / d) * m; T.my = (dy / d) * m; }
      }
    });
    canvas.addEventListener('pointerdown', (e) => {
      diag.n.lienzo++; diag.n.down++; diag.lastCanvas = diag.now(); diag.log('lienzo-down', e);
      toLogical(e);
      G.audio.unlock();
      const touchLike = e.pointerType === 'touch' || e.pointerType === 'pen';
      if (touchLike) T.enabled = true; else if (e.pointerType === 'mouse') T.enabled = false;
      try { if (touchLike && !document.fullscreenElement) { const rf = canvas.requestFullscreen || canvas.webkitRequestFullscreen; if (rf) { const pr = rf.call(canvas, { navigationUI: 'hide' }); pr && pr.catch && pr.catch(() => {}); } } } catch (err) {}
      sweepStale();
      try { canvas.setPointerCapture(e.pointerId); captured[e.pointerId] = canvas.hasPointerCapture(e.pointerId); } catch (err) {}
      const x = I.mouse.x, y = I.mouse.y;
      if (touchLike && T.playing) {
        if (T.A.id === null && inCircle(T.A, x, y)) { T.A.id = e.pointerId; keys.TouchA = true; pressedKeys.TouchA = true; return; }
        if (I.mode === 'solo' && T.swapOn !== false && T.S.id === null && Math.hypot(x - T.S.x, y - T.S.y) < T.S.r + 10) { T.S.id = e.pointerId; keys.TouchS = true; pressedKeys.TouchS = true; return; }
        if (T.T.id === null && inCircle(T.T, x, y)) { T.T.id = e.pointerId; keys.TouchT = true; pressedKeys.TouchT = true; return; }
        if (T.stick.id === null && (x < 0 || (x < G.VW * 0.45 && y > 110 && y < G.VH - 84))) { // franja izquierda (cualquier y) o parte izquierda del mapa
          T.stick.id = e.pointerId; T.stick.ox = T.stick.x = x; T.stick.oy = T.stick.y = y; T.mx = 0; T.my = 0; return;
        }
      }
      if (touchLike && !T.playing && T.enabled) orphans[e.pointerId] = { x, y };
      I.mouse.down = true;
      I.mouse.clicked = true;
    });
    const release = (e) => {
      diag.n.lienzo++; diag.lastCanvas = diag.now(); if (e.type === 'pointercancel') diag.n.cancel++; else diag.n.up++; diag.log('lienzo-' + (e.type === 'pointercancel' ? 'cancel' : 'up'), e);
      I.mouse.down = false;
      if (T.A.id === e.pointerId) { T.A.id = null; keys.TouchA = false; }
      if (T.T.id === e.pointerId) { T.T.id = null; keys.TouchT = false; }
      if (T.S.id === e.pointerId) { T.S.id = null; keys.TouchS = false; }
      if (T.stick.id === e.pointerId) { T.stick.id = null; T.mx = 0; T.my = 0; }
      delete captured[e.pointerId]; delete orphans[e.pointerId];
    };
    canvas.addEventListener('lostpointercapture', (e) => { diag.n.lostcap++; diag.log('pierde-captura', e); });
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  I.key = (code) => !!keys[code];
  I.keyPressed = (code) => !!pressedKeys[code];

  I.update = function () {
    if (I.adoptTouches) I.adoptTouches();
    // mandos
    let pads = [];
    try {
      pads = (root.navigator && root.navigator.getGamepads && Array.from(root.navigator.getGamepads())) || [];
    } catch (e) {}
    pads = pads.filter((p) => p && p.connected);
    I.padsConnected = pads.length;
    const solo = I.mode === 'solo';
    for (let i = 0; i < 2; i++) {
      const o = I.p[i];
      const sc = solo ? (i === 0 ? SOLO : null) : SCHEMES[i];
      let mx = 0, my = 0, action = false, actionDown = false, tool = false, toolDown = false, book = false;
      if (sc) {
        mx = (anyDown(sc.right) ? 1 : 0) - (anyDown(sc.left) ? 1 : 0);
        my = (anyDown(sc.down) ? 1 : 0) - (anyDown(sc.up) ? 1 : 0);
        action = anyPress(sc.action);
        actionDown = anyDown(sc.action);
        tool = anyPress(sc.tool);
        toolDown = anyDown(sc.tool);
        book = anyPress(sc.book);
      }
      if (solo && i === 0 && (I.touch.mx || I.touch.my)) { mx = I.touch.mx; my = I.touch.my; }
      const pad = pads[solo ? 0 : i];
      if (pad && (i === 0 || !solo)) {
        const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
        const dz = 0.25;
        if (Math.abs(ax) > dz) mx = ax;
        if (Math.abs(ay) > dz) my = ay;
        if (pad.buttons[14] && pad.buttons[14].pressed) mx = -1;
        if (pad.buttons[15] && pad.buttons[15].pressed) mx = 1;
        if (pad.buttons[12] && pad.buttons[12].pressed) my = -1;
        if (pad.buttons[13] && pad.buttons[13].pressed) my = 1;
        const b = (n) => !!(pad.buttons[n] && pad.buttons[n].pressed);
        const prev = padPrev[i];
        const cur = { a: b(0), x: b(2), y: b(3), sel: b(8), st: b(9), bk: b(1) };
        if (cur.a && !prev.a) action = true;
        if (cur.a) actionDown = true;
        if (cur.x && !prev.x) tool = true;
        if (cur.x) toolDown = true;
        if (cur.y && !prev.y) book = true;
        o._padSwap = cur.sel && !prev.sel;
        o._padPause = cur.st && !prev.st;
        o._padBack = cur.bk && !prev.bk;
        padPrev[i] = cur;
      } else {
        o._padSwap = o._padPause = o._padBack = false;
      }
      const len = Math.hypot(mx, my);
      if (len > 1) { mx /= len; my /= len; }
      o.mx = mx; o.my = my; o.action = action; o.actionDown = actionDown; o.tool = tool; o.toolDown = toolDown; o.book = book;
    }
    const lbNow = !!(pads[0] && pads[0].buttons[4] && pads[0].buttons[4].pressed);
    I.hint = anyPress(['KeyH']) || (lbNow && !I._lbPrev);
    I._lbPrev = lbNow;
    I.p[0].swap = anyPress(['Tab', 'TouchS']) || I.p[0]._padSwap;
    I.p[0].pause = anyPress(['Escape', 'KeyP']) || I.p[0]._padPause || I.p[1]._padPause;
    // menús (cualquier jugador)
    const m = I.menu;
    const gp = pads[0];
    const gpPress = (n) => !!(gp && gp.buttons[n] && gp.buttons[n].pressed && !padPrev.menuPrev?.[n]);
    m.up = anyPress(['KeyW', 'ArrowUp']);
    m.down = anyPress(['KeyS', 'ArrowDown']);
    m.left = anyPress(['KeyA', 'ArrowLeft']);
    m.right = anyPress(['KeyD', 'ArrowRight']);
    m.ok = anyPress(['Enter', 'KeyE', 'Space']) || I.p[0]._padA || false;
    m.back = anyPress(['Escape', 'Backspace', 'KeyQ']) || I.p[0]._padBack || I.p[1]._padBack;
    // mando en menús
    let nowM = {};
    if (gp) {
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      nowM = { 12: gp.buttons[12]?.pressed || ay < -0.5, 13: gp.buttons[13]?.pressed || ay > 0.5, 14: gp.buttons[14]?.pressed || ax < -0.5, 15: gp.buttons[15]?.pressed || ax > 0.5, 0: gp.buttons[0]?.pressed };
      const pm = padPrev.menuPrev || {};
      if (nowM[12] && !pm[12]) m.up = true;
      if (nowM[13] && !pm[13]) m.down = true;
      if (nowM[14] && !pm[14]) m.left = true;
      if (nowM[15] && !pm[15]) m.right = true;
      if (nowM[0] && !pm[0]) m.ok = true;
    }
    padPrev.menuPrev = nowM;
  };
  I.endFrame = function () {
    Object.keys(pressedKeys).forEach((k) => delete pressedKeys[k]);
    I.mouse.clicked = false;
    I.mouse.moved = false;
    I.anyPressed = false;
  };

  // ---------- audio procedural ----------
  const A = (G.audio = {
    ctx: null,
    master: null,
    ready: false,
    nextBeat: 0,
    beat: 0,
    mode: 'off',
    musicGain: null,
    unlock() {
      if (this.ctx || !hasDOM) return;
      try {
        const AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.7;
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.5;
        this.musicGain.connect(this.master);
        this.ready = true;
        this.nextBeat = this.ctx.currentTime + 0.1;
      } catch (e) {}
    },
    tone(freq, dur, type, vol, slide, delay, dest) {
      if (!this.ready) return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(dest || this.master);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    sfx(name) {
      if (!this.ready || !G.save.data.settings.sfx) return;
      const T = (f, d, ty, v, s, dl) => this.tone(f, d, ty, v, s, dl);
      switch (name) {
        case 'select': T(520, 0.06, 'square', 0.08); break;
        case 'ok': T(660, 0.07, 'square', 0.1); T(880, 0.09, 'square', 0.1, 0, 0.06); break;
        case 'back': T(440, 0.08, 'square', 0.09, 0.6); break;
        case 'error': T(200, 0.18, 'sawtooth', 0.12, 0.7); break;
        case 'pickup': T(700, 0.07, 'triangle', 0.14); T(1050, 0.12, 'triangle', 0.14, 0, 0.07); break;
        case 'clue': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.14, 'triangle', 0.14, 0, i * 0.07)); break;
        case 'unlock': T(300, 0.05, 'square', 0.1); T(450, 0.05, 'square', 0.1, 0, 0.08); T(900, 0.14, 'triangle', 0.14, 0, 0.16); break;
        case 'door': T(180, 0.15, 'triangle', 0.15, 0.6); break;
        case 'tool': T(420, 0.05, 'square', 0.07); break;
        case 'work': T(300 + Math.random() * 120, 0.04, 'square', 0.05); break;
        case 'hint': T(880, 0.1, 'sine', 0.12); T(880, 0.1, 'sine', 0.1, 0, 0.14); break;
        case 'talk': T(240 + Math.random() * 160, 0.035, 'square', 0.05); break;
        case 'crack': [392, 330, 262].forEach((f, i) => T(f, 0.16, 'sawtooth', 0.1, 0.9, i * 0.1)); break;
        case 'success': [523, 659, 784, 659, 784, 1047].forEach((f, i) => T(f, 0.16, 'triangle', 0.15, 0, i * 0.09)); break;
        case 'fanfare': [392, 392, 392, 523, 659, 523, 659, 784].forEach((f, i) => T(f, 0.2, 'triangle', 0.16, 0, i * 0.12)); break;
        case 'objection': T(150, 0.25, 'sawtooth', 0.18, 0.5); T(300, 0.12, 'square', 0.14, 0, 0.02); [392, 523, 659].forEach((f, i) => T(f, 0.12, 'square', 0.12, 0, 0.12 + i * 0.07)); break;
        case 'boing': T(200, 0.3, 'sine', 0.2, 3); break;
        case 'meow': T(700, 0.25, 'triangle', 0.1, 1.6); T(900, 0.2, 'triangle', 0.08, 0.7, 0.2); break;
        case 'creak': T(120, 0.45, 'sawtooth', 0.045, 0.55); T(310, 0.3, 'square', 0.02, 0.5, 0.05); T(95, 0.5, 'triangle', 0.05, 0.7, 0.18); break; // 4C-4b: algo cruje (madera vieja)
      }
    },
    // Ambiente (4C-4b): zumbido grave continuo (dos senos desafinados: se oye el «latido» + el octavo). `level` 0..1; el mundo lo pide cada fotograma
    // y, si deja de pedirlo (salir de la partida), se apaga solo en menos de medio segundo. Respeta el ajuste de efectos de sonido.
    ambience(level) { this.ambLevel = level || 0; this.ambStamp = this.ctx ? this.ctx.currentTime : 0; },
    humStep() {
      const now = this.ctx.currentTime, want = G.save.data.settings.sfx && this.ambLevel > 0 && now - this.ambStamp < 0.4 ? this.ambLevel : 0;
      if (want > 0 && !this.hum) {
        const g = this.ctx.createGain();
        g.gain.value = 0;
        g.connect(this.master);
        [[70, 1], [71.2, 1], [140, 0.35]].forEach(([f, v]) => { const o = this.ctx.createOscillator(), og = this.ctx.createGain(); o.type = 'sine'; o.frequency.value = f; og.gain.value = v; o.connect(og); og.connect(g); o.start(); });
        this.hum = { g };
      }
      if (this.hum) this.hum.g.gain.setTargetAtTime(want * 0.05, now, 0.6);
    },
    setMode(m) {
      if (this.mode !== m) {
        this.mode = m;
        this.beat = 0;
        if (this.ready) this.nextBeat = this.ctx.currentTime + 0.05;
      }
    },
    // Música: bajo "caminante" + vibráfono suave con acordes de jazz ligero.
    tick() {
      if (!this.ready) return;
      this.humStep();
      const on = G.save.data.settings.music && this.mode !== 'off';
      this.musicGain.gain.value = on ? 0.5 : 0;
      if (!on) { this.nextBeat = this.ctx.currentTime + 0.1; return; }
      const bpm = this.mode === 'tense' ? 124 : this.mode === 'office' ? 96 : 108;
      const step = 60 / bpm / 2;
      const chords = [
        { root: 50, tones: [62, 65, 69, 72] }, // Dm7
        { root: 43, tones: [59, 62, 65, 69] }, // G7
        { root: 48, tones: [60, 64, 67, 71] }, // Cmaj7
        { root: 45, tones: [61, 64, 67, 71] }, // A7
      ];
      const mf = (n) => 440 * Math.pow(2, (n - 69) / 12);
      while (this.nextBeat < this.ctx.currentTime + 0.25) {
        const b = this.beat;
        const bar = Math.floor(b / 8) % chords.length;
        const k = b % 8;
        const ch = chords[bar];
        const t = this.nextBeat - this.ctx.currentTime;
        if (k % 2 === 0) {
          const walk = [0, 4, 7, 9][(k / 2) % 4];
          this.tone(mf(ch.root - 12 + (walk === 9 ? 2 : walk)), step * 1.8, 'triangle', 0.2, 0, t, this.musicGain);
        }
        if (k === 0 || k === 3 || k === 6) {
          const n = ch.tones[(b * 7 + k) % 4];
          this.tone(mf(n), step * 3, 'sine', 0.09, 0, t, this.musicGain);
        }
        if (this.mode === 'tense' && k % 2 === 1) this.tone(mf(ch.tones[0] - 12), 0.05, 'square', 0.03, 0, t, this.musicGain);
        if (this.mode !== 'office' && k === 4) this.tone(mf(ch.tones[(b + 1) % 4] + 12), step * 2, 'sine', 0.05, 0, t, this.musicGain);
        this.beat++;
        this.nextBeat += step;
      }
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
