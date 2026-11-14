// ui.js — interfaz inmediata: paneles, botones, menús navegables con teclado/mando/ratón, globos y avisos.
(function (root) {
  'use strict';
  const G = root.G;
  const P = G.PAL;
  const U = (G.ui = {});

  U.colors = {
    panel: 'rgba(28,18,44,0.94)', panel2: 'rgba(52,36,76,0.96)', stroke: '#6b4f9a', text: '#fff4dc', dim: '#b9a9d4',
    accent: '#ffd45a', good: '#7de38a', bad: '#ff7a6b', teal: '#5fe0d0', pink: '#ff9fc4',
  };
  U.font = (size, bold) => `${bold === false ? '' : 'bold '}${Math.round(size * (G.save.data.settings.bigText ? 1.18 : 1))}px "Trebuchet MS","Segoe UI",Verdana,sans-serif`;

  U.rrect = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  };
  U.panel = function (ctx, x, y, w, h, o) {
    o = o || {};
    ctx.save();
    U.rrect(ctx, x, y, w, h, o.r === undefined ? 12 : o.r);
    if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4; }
    ctx.fillStyle = o.fill || U.colors.panel;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = o.lw || 2;
    ctx.strokeStyle = o.stroke || U.colors.stroke;
    ctx.stroke();
    ctx.restore();
  };
  // FIX-4a (c): AYUDANTE COMÚN DE TEXTO. Geometría PURA (sin dibujar): reparte `str` en líneas dentro de una caja o.maxW × o.maxH.
  // Si no cabe, reduce el tamaño de 1 en 1 hasta o.minSize (11 por defecto); si aun así no cabe, recorta por líneas y acaba con «…».
  // Sin o.maxH solo ajusta por ancho. Devuelve {lines, size, lh, h, truncated, shrunk}. Respeta «Texto grande» (U.font) y o.lineH (escala con el tamaño).
  U.textLayout = function (ctx, str, o) {
    o = o || {};
    const base = o.size || 16, big = G.save.data.settings.bigText ? 1.15 : 1, minS = Math.min(base, o.minSize || 11);
    str = String(str === undefined || str === null ? '' : str);
    ctx.save();
    try {
      let size = base, res = null;
      for (; ; size--) {
        ctx.font = U.font(size, o.bold);
        const lh = o.lineH ? o.lineH * size / base : Math.round(size * 1.3 * big);
        const lines = o.maxW ? G.wrap(ctx, str, o.maxW) : str.split('\n');
        res = { lines, size, lh, h: lines.length * lh, truncated: false, shrunk: size < base };
        if (!o.maxH || res.h <= o.maxH || size <= minS) break;
      }
      if (o.maxH && res.h > o.maxH) {
        const keep = Math.max(1, Math.floor(o.maxH / res.lh));
        if (res.lines.length > keep) {
          const lines = res.lines.slice(0, keep);
          let last = lines[keep - 1].replace(/[\s.,;:!?¿¡-]+$/, '');
          while (last.length > 1 && o.maxW && ctx.measureText(last + '…').width > o.maxW) last = last.slice(0, -1).replace(/\s+$/, '');
          lines[keep - 1] = last + '…';
          res.lines = lines; res.h = keep * res.lh; res.truncated = true;
        }
      }
      return res;
    } finally { ctx.restore(); }
  };
  U.textInfo = null; // último diseño de U.text con o.maxH (lo leen las pruebas)
  // texto con ajuste de línea; devuelve la altura usada. Con o.maxH (alto de la caja) se ajusta con U.textLayout (reduce o recorta con «…»)
  U.text = function (ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.fillStyle = o.color || U.colors.text;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = 'top';
    let lines, lh;
    if (o.maxH) {
      const L = U.textLayout(ctx, str, o);
      U.textInfo = L; lines = L.lines; lh = L.lh; ctx.font = U.font(L.size, o.bold);
    } else {
      ctx.font = U.font(o.size || 16, o.bold);
      lh = o.lineH || Math.round((o.size || 16) * 1.3 * (G.save.data.settings.bigText ? 1.15 : 1));
      lines = o.maxW ? G.wrap(ctx, str, o.maxW) : String(str).split('\n');
    }
    lines.forEach((ln, i) => {
      if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(ln, x + 1, y + i * lh + 1.5); ctx.fillStyle = o.color || U.colors.text; }
      ctx.fillText(ln, x, y + i * lh);
    });
    ctx.restore();
    return lines.length * lh;
  };
  U.measure = function (ctx, str, size, bold) {
    ctx.save();
    ctx.font = U.font(size, bold);
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  };
  U.icon = function (ctx, name, x, y, size) {
    const s = G.spr[name];
    if (!s) return;
    const k = (size || 32) / s.tw;
    G.drawSpr(ctx, name, x, y, { scale: k });
  };
  U.meter = function (ctx, x, y, w, h, frac, color, bg) {
    ctx.save();
    U.rrect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = bg || 'rgba(0,0,0,0.45)';
    ctx.fill();
    if (frac > 0) {
      U.rrect(ctx, x, y, Math.max(h, w * G.clamp(frac, 0, 1)), h, h / 2);
      ctx.fillStyle = color || U.colors.accent;
      ctx.fill();
    }
    ctx.restore();
  };
  U.portrait = function (ctx, lookId, x, y, size, bg) {
    const s = G.spr[`${lookId}_down_0`];
    ctx.save();
    U.rrect(ctx, x, y, size, size, 12);
    ctx.fillStyle = bg || '#3c2a5a';
    ctx.fill();
    ctx.clip();
    if (s) {
      ctx.imageSmoothingEnabled = false;
      const k = (size * 1.05) / 14; // recorte de cabeza y torso
      ctx.drawImage(s.c, 0, s.top || 0, s.w, 15, x + (size - s.w * k) / 2, y + size * 0.04, s.w * k, 15 * k);
    }
    ctx.restore();
    ctx.save();
    U.rrect(ctx, x, y, size, size, 12);
    ctx.lineWidth = 3;
    ctx.strokeStyle = U.colors.stroke;
    ctx.stroke();
    ctx.restore();
  };

  // ---------- botones / menús ----------
  U.hit = (x, y, w, h) => {
    const m = G.input.mouse;
    return m.x >= x && m.x <= x + w && m.y >= y && m.y <= y + h;
  };
  U.button = function (ctx, x, y, w, h, label, o) {
    o = o || {};
    const hover = o.hover || (!o.disabled && U.hit(x, y, w, h));
    ctx.save();
    U.rrect(ctx, x, y, w, h, 10);
    ctx.fillStyle = o.disabled ? 'rgba(60,50,80,0.6)' : hover ? '#7b55c4' : o.fill || '#5b3f9a';
    ctx.fill();
    ctx.lineWidth = hover ? 3 : 2;
    ctx.strokeStyle = o.disabled ? '#4d4266' : hover ? U.colors.accent : '#8d6fd0';
    ctx.stroke();
    ctx.restore();
    let tx = x + w / 2;
    if (o.icon) {
      U.icon(ctx, o.icon, x + 10, y + (h - 28) / 2, 28);
      tx += 18;
    }
    U.text(ctx, label, tx, y + (h - (o.size || 17) * 1.2) / 2, { size: o.size || 17, align: 'center', color: o.disabled ? '#8c80a4' : U.colors.text });
    return hover && G.input.mouse.clicked && !o.disabled;
  };

  // Menú vertical navegable
  U.Menu = class {
    constructor(items, o) {
      this.items = items;
      this.sel = 0;
      this.o = Object.assign({ x: 0, y: 0, w: 360, h: 46, gap: 8, cols: 1 }, o || {});
      this.chosen = null;
      this.hoverSel = -1;
      this.scroll = 0;  // FIX-6a: desplazamiento vertical (solo con o.view = {top,bottom})
    }
    setItems(items) { this.items = items; this.sel = G.clamp(this.sel, 0, Math.max(0, items.length - 1)); }
    firstEnabled(dir, from) {
      const n = this.items.length;
      for (let i = 1; i <= n; i++) {
        const k = (from + dir * i + n * 4) % n;
        if (!this.items[k].disabled) return k;
      }
      return from;
    }
    // devuelve el índice elegido (o -1) y 'back' si pidió volver
    update() {
      const m = G.input.menu;
      const n = this.items.length;
      const o = this.o;
      let result = -1;
      if (!n) return { chosen: -1, back: m.back };
      let arrowHit = 0;  // FIX-6a: flechas ▲▼ tocables cuando la lista no cabe
      if (o.view && o.cols <= 1) {
        const ar = this.arrows();
        if (G.input.mouse.clicked) {
          if (ar.up && U.hit(ar.up.x, ar.up.y, ar.up.w, ar.up.h)) arrowHit = -1;
          else if (ar.down && U.hit(ar.down.x, ar.down.y, ar.down.w, ar.down.h)) arrowHit = 1;
        }
        if (arrowHit) { for (let k = 0; k < 3; k++) this.sel = this.firstEnabled(arrowHit, this.sel); G.audio.sfx('select'); }
      }
      if (m.up) { this.sel = this.firstEnabled(-1, this.sel); G.audio.sfx('select'); }
      if (m.down) { this.sel = this.firstEnabled(1, this.sel); G.audio.sfx('select'); }
      if (o.cols > 1) {
        if (m.left) { this.sel = G.clamp(this.sel - 1, 0, n - 1); G.audio.sfx('select'); }
        if (m.right) { this.sel = G.clamp(this.sel + 1, 0, n - 1); G.audio.sfx('select'); }
      }
      // ratón
      const mouse = G.input.mouse;
      this.fitScroll();
      this.rects = this.layout();
      const inView = (r) => !o.view || (r.y >= o.view.top - 0.5 && r.y + r.h <= o.view.bottom + 0.5);  // solo filas enteras visibles
      this.rects.forEach((r, i) => {
        if (mouse.moved && inView(r) && U.hit(r.x, r.y, r.w, r.h) && !this.items[i].disabled) this.sel = i;
      });
      if (m.ok) result = this.sel;
      if (mouse.clicked && !arrowHit) {
        this.rects.forEach((r, i) => {
          if (inView(r) && U.hit(r.x, r.y, r.w, r.h) && !this.items[i].disabled) { this.sel = i; result = i; }
        });
      }
      if (result >= 0 && this.items[result].disabled) { G.audio.sfx('error'); result = -1; }
      if (result >= 0) G.audio.sfx('ok');
      if (m.back && result < 0) G.audio.sfx('back');
      return { chosen: result, back: m.back };
    }
    // FIX-6a: contenido total y ajuste del desplazamiento (la fila elegida siempre queda entera dentro de la ventana)
    contentH() {
      const o = this.o;
      let h = 0;
      this.items.forEach((it, i) => { h += (it.h || o.h) + (i ? o.gap : 0); });
      return h;
    }
    fitScroll() {
      const o = this.o;
      if (!o.view || o.cols > 1 || !this.items.length) { this.scroll = 0; return; }
      const viewH = o.view.bottom - o.view.top;
      const total = this.contentH();
      if (total <= viewH) { this.scroll = 0; this.lastSel = this.sel; return; }
      // posición de la fila elegida (sin desplazar)
      let y0 = 0;
      for (let i = 0; i < this.sel; i++) y0 += (this.items[i].h || o.h) + o.gap;
      const y1 = y0 + (this.items[this.sel].h || o.h);
      if (this.lastSel !== this.sel || this.lastSel === undefined) {
        if (y0 - this.scroll < 0) this.scroll = y0;
        if (y1 - this.scroll > viewH) this.scroll = y1 - viewH;
        this.lastSel = this.sel;
      }
      this.scroll = G.clamp(this.scroll, 0, total - viewH);
      this.scrollBase = o.view.top;  // el contenido arranca en view.top cuando hay desplazamiento
    }
    // flechas ▲▼ (solo si hay más contenido arriba o abajo)
    arrows() {
      const o = this.o, ar = {};
      if (!o.view || o.cols > 1) return ar;
      const total = this.contentH(), viewH = o.view.bottom - o.view.top;
      if (total <= viewH) return ar;
      const x = o.x + o.w - 34;
      if (this.scroll > 0.5) ar.up = { x, y: o.view.top, w: 34, h: 24 };
      if (this.scroll < total - viewH - 0.5) ar.down = { x, y: o.view.bottom - 24, w: 34, h: 24 };
      return ar;
    }
    layout() {
      const o = this.o;
      const rects = [];
      if (o.cols <= 1) {
        let y = o.y;
        const sc = o.view ? this.scroll : 0;
        this.items.forEach((it) => { const h = it.h || o.h; rects.push({ x: o.x, y: y - sc, w: o.w, h }); y += h + o.gap; });
        return rects;
      }
      const cw = (o.w - o.gap * (o.cols - 1)) / o.cols;
      this.items.forEach((it, i) => {
        const c = i % o.cols, r = Math.floor(i / o.cols);
        rects.push({ x: o.x + c * (cw + o.gap), y: o.y + r * (o.h + o.gap), w: cw, h: it.h || o.h });
      });
      return rects;
    }
    draw(ctx) {
      const o = this.o;
      this.fitScroll();
      this.rects = this.layout();
      if (o.view) { ctx.save(); ctx.beginPath(); ctx.rect(o.x - 30, o.view.top, o.w + 60, o.view.bottom - o.view.top); ctx.clip(); }
      const arr0 = o.view ? this.arrows() : {};  // FIX-6b: las filas bajo una flecha ▲▼ reservan su sitio
      this.items.forEach((it, i) => {
        const r = this.rects[i];
        if (o.view && (r.y + r.h < o.view.top || r.y > o.view.bottom)) return;
        let ash = 0;
        [arr0.up, arr0.down].forEach((a) => { if (a && r.y < a.y + a.h && r.y + r.h > a.y) ash = Math.max(ash, r.x + r.w - a.x + 4); });
        const sel = i === this.sel;
        ctx.save();
        U.rrect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.fillStyle = it.disabled ? 'rgba(50,40,70,0.7)' : sel ? '#6a47b8' : 'rgba(70,50,110,0.85)';
        ctx.fill();
        ctx.lineWidth = sel ? 3 : 1.5;
        ctx.strokeStyle = it.disabled ? '#4d4266' : sel ? U.colors.accent : '#7d62b8';
        ctx.stroke();
        ctx.restore();
        let tx = r.x + 16;
        if (it.icon) { U.icon(ctx, it.icon, r.x + 8, r.y + (r.h - 30) / 2, 30); tx = r.x + 46; }
        const col = it.disabled ? '#8c80a4' : it.color || U.colors.text;
        // FIX-6a (fallos 2 y 3): el texto de la derecha («sin pistas», «ya mostrada»…) reserva su sitio y el de la izquierda se ajusta al resto
        const rw = (it.right ? Math.ceil(U.measure(ctx, it.right, 16, true)) + 12 : 0) + ash;
        const mw = Math.max(40, r.w - (tx - r.x) - 12 - rw);
        if (it.sub) {
          U.text(ctx, it.label, tx, r.y + 6, { size: 17, color: col, maxW: mw, maxH: 22, minSize: 12 });
          U.text(ctx, it.sub, tx, r.y + 6 + 21, { size: 13, color: it.disabled ? '#7c708f' : U.colors.dim, bold: false, maxW: r.w - (tx - r.x) - 14 - ash, maxH: r.h - 27 - 4, minSize: 10 });
        } else {
          const L = U.textLayout(ctx, it.label, { size: 17, maxW: mw, maxH: r.h - 8, minSize: 11 });
          U.text(ctx, it.label, tx, r.y + (r.h - L.h) / 2, { size: 17, color: col, maxW: mw, maxH: r.h - 8, minSize: 11 });
        }
        if (it.right) U.text(ctx, it.right, r.x + r.w - 14 - ash, r.y + (r.h - 17 * 1.2) / 2, { size: 16, align: 'right', color: it.rightColor || U.colors.accent });
        if (sel && !it.disabled) U.icon(ctx, 'ico_arrow', r.x - 18, r.y + r.h / 2 - 10, 20);
      });
      if (o.view) {
        ctx.restore();
        const ar = this.arrows();
        [['up', '▲'], ['down', '▼']].forEach(([k, ch]) => {
          const a = ar[k];
          if (!a) return;
          ctx.save();
          U.rrect(ctx, a.x, a.y, a.w, a.h, 8);
          ctx.fillStyle = 'rgba(20,12,40,0.88)'; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = U.colors.accent; ctx.stroke();
          ctx.restore();
          U.text(ctx, ch, a.x + a.w / 2, a.y + 3, { size: 15, align: 'center', color: U.colors.accent });
        });
      }
    }
  };

  // ---------- avisos (toasts) ----------
  U.toasts = [];
  U.toast = function (msg, secs, o) {
    o = o || {};
    U.toasts.push({ msg, t: secs || 3, life: secs || 3, icon: o.icon, color: o.color });
    if (U.toasts.length > 4) U.toasts.shift();
  };
  U.drawToasts = function (ctx, dt) {
    for (let i = U.toasts.length - 1; i >= 0; i--) {
      U.toasts[i].t -= dt;
      if (U.toasts[i].t <= 0) U.toasts.splice(i, 1);
    }
    let y = G.VH - 214;
    for (let i = U.toasts.length - 1; i >= 0; i--) {
      const t = U.toasts[i];
      const a = G.clamp(Math.min(t.t, t.life - t.t) * 4, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = U.font(17);
      const w = ctx.measureText(t.msg).width + (t.icon ? 70 : 40);
      const x = (G.VW - w) / 2;
      U.panel(ctx, x, y, w, 40, { fill: 'rgba(40,26,64,0.96)', stroke: t.color || U.colors.accent, r: 20 });
      if (t.icon) U.icon(ctx, t.icon, x + 12, y + 6, 28);
      U.text(ctx, t.msg, x + (t.icon ? 50 : 20), y + 10, { size: 17, color: t.color || U.colors.text });
      ctx.restore();
      y -= 48;
    }
  };

  // ---------- globo de diálogo en el mundo ----------
  // Geometría PURA del globo (FIX-4a parte 2): siempre dentro de la zona segura G.safe(). Prefiere ir ENCIMA de quien habla (sy = punto sobre su cabeza);
  // si encima no cabe, va DEBAJO (o.feetY = pies de quien habla); la punta sigue apuntando al que habla aunque el globo se desplace a un lado.
  U.bubbleRect = function (ctx, text, sx, sy, o) {
    o = o || {};
    const sf = G.safe();
    const maxW = Math.min(o.maxW || 230, sf.w - 22);
    // FIX-4a (c): el texto se ajusta con el ayudante común (reduce hasta 11 px y, si aun así no cabe, recorta con «…»)
    const L = U.textLayout(ctx, text, { size: 15, maxW, maxH: sf.h - 14, lineH: 19, minSize: 11 });
    const lines = L.lines, lh = L.lh;
    ctx.font = U.font(L.size);
    let w = 0;
    lines.forEach((l) => (w = Math.max(w, ctx.measureText(l).width)));
    w = Math.min(w + 22, sf.w);
    const h = Math.min(lines.length * lh + 14, sf.h);
    const x = G.clamp(sx - w / 2, sf.x, sf.r - w);
    const above = sy - h - 14;
    const feet = o.feetY === undefined ? sy + 40 : o.feetY;
    let below = false, y = above;
    if (above < sf.y) {
      below = true;
      y = feet + 14;
      if (y + h > sf.b) { // ni encima ni debajo caben del todo: el que menos se sale, ajustado a la zona segura
        const room = (sy - sf.y) >= (sf.b - feet) ? 'above' : 'below';
        y = room === 'above' ? G.clamp(above, sf.y, sf.b - h) : G.clamp(y, sf.y, sf.b - h);
        below = room === 'below';
      }
    } else if (above + h > sf.b) y = G.clamp(above, sf.y, sf.b - h);
    let res = { x, y, w, h, lh, lines, below, tx: G.clamp(sx, x + 14, x + w - 14) };
    // FIX-4a (a): globos de personajes pegados no se solapan entre sí. o.avoid = globos ya colocados en este fotograma ({x,y,w,h}).
    // Se prueban, por orden: lo preferido, el lado contrario (encima/debajo) y desplazar el globo a izquierda/derecha; sale el primero sin
    // solape y, si ninguno lo logra, el de menor solape. Todos los candidatos quedan dentro de G.safe() y no tapan a quien habla.
    if (o.avoid && o.avoid.length) {
      const M = 4, ov = (c) => o.avoid.reduce((a, r) => {
        const iw = Math.min(c.x + c.w, r.x + r.w + M) - Math.max(c.x, r.x - M), ih = Math.min(c.y + c.h, r.y + r.h + M) - Math.max(c.y, r.y - M);
        return a + (iw > 0 && ih > 0 ? iw * ih : 0);
      }, 0);
      if (ov(res) > 0) {
        const cands = [], aboveY = sy - h - 14, belowY = feet + 14;
        const ys = [];
        if (aboveY >= sf.y && aboveY + h <= sf.b) ys.push([aboveY, false]);
        if (belowY >= sf.y && belowY + h <= sf.b) ys.push([belowY, true]);
        // posiciones horizontales de la más cercana a la preferida a la más lejana (paso 12 px), dentro de la zona segura
        const xs = [x];
        for (let d = 12; d <= sf.w; d += 12) { if (x - d >= sf.x) xs.push(x - d); if (x + d <= sf.r - w) xs.push(x + d); }
        xs.forEach((xx) => ys.forEach(([yy, bl]) => cands.push({ x: xx, y: yy, w, h, lh, lines, below: bl, tx: G.clamp(sx, xx + 14, xx + w - 14) }))); // a igual desplazamiento, encima y debajo antes que alejarse más
        // último recurso: apilar encima de los otros (sube de nivel en nivel sin salir de la zona segura); la punta sigue apuntando al hablante
        for (let k = 1; k <= 2; k++) { const yy = aboveY - k * (h + M); if (yy >= sf.y) xs.forEach((xx) => cands.push({ x: xx, y: yy, w, h, lh, lines, below: false, tx: G.clamp(sx, xx + 14, xx + w - 14) })); }
        let best = res, bo = ov(res);
        for (const c of cands) { const v = ov(c) + (c === cands[0] ? 0 : 0.001); if (v < bo) { best = c; bo = v; if (bo < 1) break; } }
        res = best;
      }
    }
    res.size = L.size; res.truncated = L.truncated;
    return res;
  };
  U.bubbleLog = null; // las pruebas ponen aquí un array para recoger los globos dibujados
  U.bubble = function (ctx, text, sx, sy, o) {
    o = o || {};
    ctx.save();
    const b = U.bubbleRect(ctx, text, sx, sy, o);
    if (o.avoid) o.avoid.push({ x: b.x, y: b.y, w: b.w, h: b.h });
    if (U.bubbleLog) U.bubbleLog.push({ x: b.x, y: b.y, w: b.w, h: b.h, below: b.below, sx, sy, feetY: o.feetY });
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    U.rrect(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fillStyle = '#fffaf0';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = o.color || '#2a1b30';
    ctx.stroke();
    ctx.beginPath();
    if (b.below) { ctx.moveTo(b.tx - 6, b.y + 1); ctx.lineTo(b.tx, b.y - 9); ctx.lineTo(b.tx + 6, b.y + 1); }
    else { ctx.moveTo(b.tx - 6, b.y + b.h - 1); ctx.lineTo(b.tx, b.y + b.h + 9); ctx.lineTo(b.tx + 6, b.y + b.h - 1); }
    ctx.fillStyle = '#fffaf0';
    ctx.fill();
    ctx.restore();
    b.lines.forEach((l, i) => U.text(ctx, l, b.x + 11, b.y + 7 + i * b.lh, { size: b.size || 15, color: '#2a1b30', shadow: false }));
  };

  // ---------- máquina de escribir ----------
  U.Typer = class {
    constructor() { this.set(''); }
    set(text) { this.text = text; this.n = 0; this.acc = 0; this.done = !text; }
    update(dt) {
      if (this.done) return;
      this.acc += dt * 62;
      const add = Math.floor(this.acc);
      this.acc -= add;
      for (let i = 0; i < add; i++) {
        this.n++;
        if (this.n % 3 === 0) G.audio.sfx('talk');
        if (this.n >= this.text.length) { this.n = this.text.length; this.done = true; break; }
      }
    }
    skip() { this.n = this.text.length; this.done = true; }
    get shown() { return this.text.slice(0, this.n); }
  };

  // Fondo con degradado y viñeta para pantallas de menú
  U.backdrop = function (ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, G.VH);
    g.addColorStop(0, '#1b1230');
    g.addColorStop(1, '#3a2358');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, G.VW, G.VH);
  };
})(typeof window !== 'undefined' ? window : globalThis);
