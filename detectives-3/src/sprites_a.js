// sprites_a.js — pixel art generado por código: paleta, baldosas y objetos.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});

  G.makeCanvas = function (w, h) {
    if (typeof document !== 'undefined' && document.createElement) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }
    return root.__makeCanvas(w, h); // pruebas sin navegador
  };

  const P = (G.PAL = {
    ink: '#2a1b30', ink2: '#40294a',
    wood1: '#c48b52', wood2: '#b27a45', wood3: '#8f5c33', woodD: '#6b4226',
    cream: '#f7e9cb', cream2: '#ead7ae', white: '#fff9ee', grey: '#b9b4c4', grey2: '#8a8498', greyD: '#5d576b',
    red: '#d94a3f', red2: '#a8322f', pink: '#f5a8bd', pink2: '#e47a9a', orange: '#f09a3e', yellow: '#f7d54a',
    green: '#5dae5a', green2: '#3d8446', teal: '#3fb5b0', teal2: '#2a8187', blue: '#4d7fd6', blue2: '#35559a',
    purple: '#8e5bc4', purple2: '#5f3b8e', brown: '#7a4a2b', skin1: '#f2c9a0', skin2: '#d9a273', skin3: '#a96f46',
    stone1: '#8d8a99', stone2: '#797686', stone3: '#615e6f', night: '#2d2540', glow: '#7dffe7', glow2: '#ff7df0',
  });

  const rect = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

  // Registro de sprites: { c: canvas, w, h, ox, oy }
  G.spr = {};
  G.sprDup = []; // ids definidos dos veces (el segundo pisaría al primero); lo vigilan test_police.js y test_anim.js
  function S(name, w, h, fn, opts) {
    opts = opts || {};
    if (G.spr[name]) G.sprDup.push(name);
    const m = opts.outline ? 1 : 0;
    const cv = G.makeCanvas(w + m * 2, h + m * 2);
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(m, m);
    fn(ctx, (col, x, y, ww, hh) => rect(ctx, col, x, y, ww, hh));
    ctx.restore();
    if (m && ctx.getImageData) {
      const id = ctx.getImageData(0, 0, cv.width, cv.height);
      const d = id.data, W = cv.width, H = cv.height;
      const oc = opts.outline;
      const rgb = [parseInt(oc.slice(1, 3), 16), parseInt(oc.slice(3, 5), 16), parseInt(oc.slice(5, 7), 16)];
      const src = new Uint8ClampedArray(d);
      const op = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : src[(y * W + x) * 4 + 3]);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (src[i + 3] === 0 && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) {
            d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
          }
        }
      ctx.putImageData(id, 0, 0);
    }
    G.spr[name] = { c: cv, w: w + m * 2, h: h + m * 2, ox: m, oy: m, tw: w, th: h };
    return G.spr[name];
  }
  G.defSprite = S;

  // Dibujo de sprite en coordenadas de pantalla (x,y = esquina sup-izq del sprite sin margen)
  G.drawSpr = function (ctx, name, x, y, opt) {
    const s = G.spr[name];
    if (!s) return;
    opt = opt || {};
    const k = opt.scale || G.S;
    ctx.imageSmoothingEnabled = false;
    const dx = Math.round(x - s.ox * k), dy = Math.round(y - s.oy * k);
    const dw = Math.round(s.w * k), dh = Math.round(s.h * k);
    if (opt.alpha !== undefined) ctx.globalAlpha = opt.alpha;
    if (opt.flip) {
      ctx.save();
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(s.c, 0, 0, dw, dh);
      ctx.restore();
    } else ctx.drawImage(s.c, dx, dy, dw, dh);
    if (opt.alpha !== undefined) ctx.globalAlpha = 1;
  };

  const R = G.rng(7);
  function speckle(c, x, y, w, h, cols, n, seed) {
    const r = G.rng(seed || 1);
    for (let i = 0; i < n; i++) rect(c, cols[Math.floor(r() * cols.length)], x + Math.floor(r() * w), y + Math.floor(r() * h), 1, 1);
  }

  // ---------------- BALDOSAS ----------------
  S('floor_wood', 16, 16, (c, r) => {
    r(P.wood1, 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) r(P.wood3, 0, y + 3, 16, 1);
    r(P.wood2, 0, 0, 16, 1);
    for (let y = 0; y < 16; y += 4) { const o = (y * 5) % 11; r(P.wood3, 3 + o, y, 1, 3); }
    speckle(c, 0, 0, 16, 16, [P.wood2, '#cd9a63'], 10, 3);
  });
  S('floor_wood2', 16, 16, (c, r) => {
    r(P.wood1, 0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) r(P.wood3, 0, y + 3, 16, 1);
    for (let y = 0; y < 16; y += 4) { const o = (y * 3 + 5) % 12; r(P.wood3, 2 + o, y, 1, 3); }
    speckle(c, 0, 0, 16, 16, [P.wood2, '#cd9a63'], 10, 9);
  });
  S('floor_tile', 16, 16, (c, r) => {
    r('#f3ead7', 0, 0, 16, 16);
    r('#e0d4b8', 0, 0, 8, 8); r('#e0d4b8', 8, 8, 8, 8);
    r('#c9bb9a', 0, 15, 16, 1); r('#c9bb9a', 15, 0, 1, 16);
    r('#fffaf0', 1, 1, 2, 1);
  });
  S('floor_cobble', 16, 16, (c, r) => {
    r(P.stone2, 0, 0, 16, 16);
    const rows = [[0, 0, 7, 5], [8, 0, 8, 5], [0, 6, 5, 4], [6, 6, 6, 4], [13, 6, 3, 4], [0, 11, 8, 5], [9, 11, 7, 5]];
    rows.forEach((q, i) => { r(i % 2 ? P.stone1 : '#9a97a8', q[0], q[1], q[2], q[3]); r(P.stone3, q[0], q[1] + q[3] - 1, q[2], 1); });
    speckle(c, 0, 0, 16, 16, [P.stone3, '#a8a5b6'], 8, 5);
  });
  S('floor_grass', 16, 16, (c, r) => {
    r('#6cb85f', 0, 0, 16, 16);
    speckle(c, 0, 0, 16, 16, ['#5aa04f', '#7cc96f', '#4f9246'], 22, 11);
    r('#3d8446', 4, 5, 1, 2); r('#3d8446', 11, 10, 1, 2);
  });
  S('floor_carpet', 16, 16, (c, r) => {
    r('#9b3b45', 0, 0, 16, 16);
    r('#b4505a', 0, 0, 16, 1); r('#b4505a', 0, 0, 1, 16);
    r('#e8c05a', 2, 2, 12, 1); r('#e8c05a', 2, 13, 12, 1); r('#e8c05a', 2, 2, 1, 12); r('#e8c05a', 13, 2, 1, 12);
    r('#7d2b35', 7, 7, 2, 2);
  });
  S('floor_lab', 16, 16, (c, r) => {
    r('#cfe3ea', 0, 0, 16, 16); r('#b6d0da', 0, 15, 16, 1); r('#b6d0da', 15, 0, 1, 16);
    r('#e9f6fa', 1, 1, 3, 1);
  });
  // Muro: cara frontal (hay suelo debajo) y tapa
  S('wall_face', 16, 16, (c, r) => {
    r('#e9d6b0', 0, 0, 16, 16);
    r('#dcc79c', 0, 0, 16, 2);
    for (let x = 0; x < 16; x += 8) r('#cdb88c', x, 4, 1, 12);
    r('#a8895c', 0, 11, 16, 1);
    r('#8f5c33', 0, 12, 16, 4); r('#6b4226', 0, 15, 16, 1); r('#a87445', 0, 12, 16, 1);
  });
  S('wall_face_stone', 16, 16, (c, r) => {
    r('#7f7b90', 0, 0, 16, 16);
    r('#6b677c', 0, 5, 16, 1); r('#6b677c', 0, 11, 16, 1);
    r('#6b677c', 4, 0, 1, 5); r('#6b677c', 11, 6, 1, 5); r('#6b677c', 5, 12, 1, 4);
    r('#928fa3', 0, 0, 16, 1);
    r('#4c485a', 0, 15, 16, 1);
  });
  S('wall_top', 16, 16, (c, r) => {
    r('#3a2c48', 0, 0, 16, 16); r('#4a3a5c', 1, 1, 14, 2);
  });
  S('wall_top_stone', 16, 16, (c, r) => {
    r('#4c485a', 0, 0, 16, 16); r('#5d596c', 1, 1, 14, 2);
  });
  S('void', 16, 16, (c, r) => { r('#17101f', 0, 0, 16, 16); });

  // ---------------- OBJETOS (16x16 salvo indicación) ----------------
  const O = { outline: '#2a1b30' };
  S('counter', 16, 16, (c, r) => {
    r(P.wood3, 0, 6, 16, 10); r(P.wood1, 0, 3, 16, 5); r('#e0aa6e', 0, 3, 16, 1); r(P.woodD, 0, 15, 16, 1);
    r(P.wood2, 2, 9, 5, 5); r(P.wood2, 9, 9, 5, 5); r(P.wood3, 3, 10, 3, 3); r(P.wood3, 10, 10, 3, 3);
  }, O);
  S('display_case', 16, 16, (c, r) => {
    r(P.wood3, 0, 10, 16, 6); r(P.woodD, 0, 15, 16, 1);
    r('#cfeaf2', 0, 1, 16, 10); r('#e9f8fb', 1, 2, 3, 8); r('#9fcad6', 0, 1, 16, 1);
    r('#fff9ee', 3, 7, 10, 2);
    r(P.pink2, 4, 5, 3, 3); r(P.yellow, 9, 5, 3, 3); r(P.red, 5, 4, 1, 1); r(P.red, 10, 4, 1, 1);
  }, O);
  S('display_empty', 16, 16, (c, r) => {
    r(P.wood3, 0, 10, 16, 6); r(P.woodD, 0, 15, 16, 1);
    r('#cfeaf2', 0, 1, 16, 10); r('#e9f8fb', 1, 2, 3, 8); r('#9fcad6', 0, 1, 16, 1);
    r('#fff9ee', 3, 7, 10, 2); r(P.cream2, 5, 6, 6, 1);
    r(P.pink2, 6, 5, 1, 1); r(P.cream, 9, 6, 1, 1);
  }, O);
  S('cake_big', 16, 16, (c, r) => {
    r(P.white, 1, 12, 14, 3); r(P.grey, 1, 14, 14, 1);
    r(P.cream2, 2, 8, 12, 5); r(P.pink, 2, 5, 12, 4); r(P.pink2, 3, 8, 10, 1);
    r(P.white, 3, 4, 10, 2);
    r(P.red, 7, 1, 2, 3); r(P.green, 8, 0, 2, 1);
    r(P.red, 4, 3, 2, 2); r(P.red, 10, 3, 2, 2); r(P.yellow, 3, 9, 1, 1); r(P.yellow, 12, 9, 1, 1);
  }, O);
  S('plate_empty', 16, 16, (c, r) => {
    r(P.white, 1, 10, 14, 4); r(P.grey, 1, 13, 14, 1);
    r(P.pink2, 5, 11, 1, 1); r(P.pink, 9, 12, 1, 1); r(P.cream2, 11, 11, 2, 1);
  }, O);
  S('table', 16, 16, (c, r) => {
    r(P.wood3, 2, 12, 2, 4); r(P.wood3, 12, 12, 2, 4);
    r(P.wood1, 0, 4, 16, 9); r('#dca36a', 0, 4, 16, 1); r(P.wood3, 0, 12, 16, 1);
    r(P.white, 4, 6, 8, 5); r('#e6dcc4', 4, 10, 8, 1); r(P.red, 7, 7, 2, 2);
  }, O);
  S('chair', 16, 16, (c, r) => {
    r(P.wood3, 4, 2, 8, 7); r(P.wood1, 5, 3, 6, 5); r(P.wood2, 3, 9, 10, 4); r(P.wood3, 4, 13, 2, 3); r(P.wood3, 10, 13, 2, 3);
  }, O);
  S('stool', 16, 16, (c, r) => {
    r(P.red, 3, 7, 10, 4); r(P.red2, 3, 10, 10, 1); r(P.grey2, 4, 11, 2, 5); r(P.grey2, 10, 11, 2, 5);
  }, O);
  S('oven', 16, 32, (c, r) => {
    r('#8a4b3c', 0, 4, 16, 28); r('#a65d4a', 1, 5, 14, 3); r('#6e3a2f', 0, 31, 16, 1);
    r('#2a1b30', 3, 14, 10, 10); r('#ff8a2a', 4, 18, 8, 5); r('#ffd24a', 6, 20, 4, 3); r('#ff5a2a', 5, 22, 6, 1);
    r(P.grey2, 4, 12, 8, 1); r('#5a2f27', 7, 0, 2, 5); r('#3a2020', 6, 0, 4, 1);
  }, O);
  S('stove', 16, 16, (c, r) => {
    r(P.grey, 0, 4, 16, 12); r('#d9d5e2', 0, 4, 16, 3); r(P.greyD, 2, 5, 5, 2); r(P.greyD, 9, 5, 5, 2);
    r(P.ink, 2, 10, 12, 5); r(P.grey2, 3, 11, 10, 3); r(P.red, 3, 8, 1, 1); r(P.red, 12, 8, 1, 1);
    r(P.greyD, 0, 15, 16, 1);
  }, O);
  S('sink', 16, 16, (c, r) => {
    r(P.grey, 0, 6, 16, 10); r('#d9d5e2', 0, 6, 16, 2); r('#7fb7d9', 2, 8, 12, 4); r('#a5d3ec', 3, 9, 4, 1);
    r(P.grey2, 7, 2, 2, 5); r(P.grey2, 7, 2, 5, 1); r(P.greyD, 0, 15, 16, 1);
  }, O);
  S('fridge', 16, 32, (c, r) => {
    r('#dfe8ee', 1, 1, 14, 30); r('#f4fafc', 2, 2, 3, 28); r('#b8c6d0', 1, 12, 14, 1); r('#9aa8b4', 1, 30, 14, 1);
    r(P.grey2, 12, 5, 1, 4); r(P.grey2, 12, 16, 1, 6); r(P.pink2, 4, 6, 3, 3); r(P.yellow, 8, 18, 3, 3);
  }, O);
  S('shelf_flour', 16, 32, (c, r) => {
    r(P.wood3, 0, 0, 16, 32); r(P.woodD, 0, 0, 16, 2);
    for (let i = 0; i < 3; i++) {
      const y = 3 + i * 10;
      r(P.wood2, 1, y + 7, 14, 2); r(P.woodD, 1, y + 9, 14, 1);
      r('#f4ead2', 2, y, 5, 7); r('#d6c8a6', 2, y + 6, 5, 1); r(P.red2, 3, y + 2, 3, 2);
      r('#f4ead2', 8, y + 1, 6, 6); r('#d6c8a6', 8, y + 6, 6, 1); r(P.blue2, 9, y + 3, 4, 1);
    }
  }, O);
  S('shelf_bread', 16, 32, (c, r) => {
    r(P.wood3, 0, 0, 16, 32); r(P.woodD, 0, 0, 16, 2);
    for (let i = 0; i < 3; i++) {
      const y = 3 + i * 10;
      r(P.wood2, 1, y + 7, 14, 2); r(P.woodD, 1, y + 9, 14, 1);
      r('#d9944a', 2, y + 2, 6, 5); r('#e9b06a', 3, y + 2, 4, 1);
      r('#c97d3a', 9, y + 3, 5, 4); r('#e9b06a', 10, y + 3, 3, 1);
    }
  }, O);
  S('sack_a', 16, 16, (c, r) => {
    r('#efe3c4', 3, 4, 10, 11); r('#d6c8a6', 3, 13, 10, 2); r('#e4d6b4', 4, 2, 8, 3); r(P.brown, 6, 3, 4, 1);
    r(P.blue2, 5, 7, 6, 4); r(P.white, 6, 8, 4, 2);
  }, O);
  S('sack_b', 16, 16, (c, r) => {
    r('#efe3c4', 3, 4, 10, 11); r('#d6c8a6', 3, 13, 10, 2); r('#e4d6b4', 4, 2, 8, 3); r(P.brown, 6, 3, 4, 1);
    r(P.blue2, 5, 7, 6, 4); r(P.white, 6, 8, 4, 2); r(P.red2, 9, 9, 1, 1);
  }, O);
  S('drawer', 16, 16, (c, r) => {
    r(P.wood3, 1, 3, 14, 13); r(P.wood1, 1, 3, 14, 3); r('#dca36a', 1, 3, 14, 1);
    r(P.wood2, 3, 7, 10, 3); r(P.wood2, 3, 11, 10, 3); r(P.yellow, 7, 8, 2, 1); r(P.yellow, 7, 12, 2, 1);
    r(P.woodD, 1, 15, 14, 1);
  }, O);
  S('drawer_locked', 16, 16, (c, r) => {
    r(P.wood3, 1, 3, 14, 13); r(P.wood1, 1, 3, 14, 3); r('#dca36a', 1, 3, 14, 1);
    r(P.wood2, 3, 7, 10, 3); r(P.wood2, 3, 11, 10, 3); r(P.yellow, 6, 8, 4, 3); r(P.ink, 7, 9, 2, 1);
    r(P.woodD, 1, 15, 14, 1);
  }, O);
  S('hooks', 16, 16, (c, r) => {
    r(P.wood3, 1, 2, 14, 7); r(P.wood1, 1, 2, 14, 1);
    r(P.grey2, 3, 4, 1, 3); r(P.grey2, 7, 4, 1, 3); r(P.grey2, 11, 4, 1, 3);
    r(P.yellow, 3, 6, 2, 2); r(P.yellow, 11, 6, 2, 2);
  }, O);
  S('coat_rack', 16, 32, (c, r) => {
    r(P.wood3, 7, 4, 2, 26); r(P.wood3, 3, 28, 10, 2); r(P.woodD, 2, 30, 12, 1);
    r(P.wood2, 3, 6, 10, 1); r(P.wood2, 4, 4, 2, 2); r(P.wood2, 10, 4, 2, 2);
    r('#5f4a8a', 2, 7, 5, 11); r('#4a3870', 2, 16, 5, 2); r(P.yellow, 4, 11, 1, 1);
    r('#c9a35a', 9, 7, 5, 8);
  }, O);
  S('plant', 16, 16, (c, r) => {
    r(P.red2, 4, 10, 8, 6); r('#c0504a', 4, 10, 8, 2); r(P.brown, 5, 9, 6, 2);
    r(P.green2, 7, 3, 2, 7); r(P.green, 3, 4, 5, 3); r(P.green, 8, 2, 5, 3); r(P.green, 4, 7, 4, 2); r(P.green2, 9, 6, 4, 2);
  }, O);
  S('barrel', 16, 16, (c, r) => {
    r(P.wood2, 3, 2, 10, 13); r(P.wood1, 4, 2, 3, 13); r(P.woodD, 3, 5, 10, 1); r(P.woodD, 3, 11, 10, 1);
    r(P.wood3, 4, 1, 8, 2); r(P.woodD, 3, 14, 10, 1);
  }, O);
  S('crate', 16, 16, (c, r) => {
    r(P.wood1, 1, 3, 14, 12); r(P.wood3, 1, 3, 14, 1); r(P.wood3, 1, 14, 14, 1); r(P.wood3, 1, 3, 1, 12); r(P.wood3, 14, 3, 1, 12);
    r(P.wood3, 7, 4, 2, 10); r(P.wood3, 2, 8, 12, 2); r(P.wood2, 3, 5, 3, 2);
  }, O);
  S('wheelbarrow', 16, 16, (c, r) => {
    r('#4f7fa8', 2, 4, 11, 6); r('#6aa0cf', 3, 4, 9, 2); r('#3a5f80', 2, 9, 11, 1);
    r(P.wood3, 12, 8, 4, 2); r(P.wood3, 0, 9, 3, 1);
    r(P.ink, 5, 10, 5, 5); r(P.grey, 6, 11, 3, 3); r(P.grey2, 7, 12, 1, 1);
    r(P.red, 4, 5, 2, 2); r(P.red2, 8, 6, 1, 1);
  }, O);
  S('wheelbarrow_clean', 16, 16, (c, r) => {
    r('#4f7fa8', 2, 4, 11, 6); r('#6aa0cf', 3, 4, 9, 2); r('#3a5f80', 2, 9, 11, 1);
    r(P.wood3, 12, 8, 4, 2); r(P.wood3, 0, 9, 3, 1);
    r(P.ink, 5, 10, 5, 5); r(P.grey, 6, 11, 3, 3); r(P.grey2, 7, 12, 1, 1);
  }, O);
  S('trash', 16, 16, (c, r) => {
    r(P.grey2, 4, 4, 8, 11); r(P.grey, 3, 3, 10, 2); r(P.greyD, 5, 6, 1, 7); r(P.greyD, 8, 6, 1, 7); r(P.greyD, 11, 6, 1, 7);
  }, O);
  S('lamp_post', 16, 32, (c, r) => {
    r(P.greyD, 7, 8, 2, 22); r(P.greyD, 5, 29, 6, 2); r(P.greyD, 6, 6, 4, 2);
    r('#fff2a8', 4, 0, 8, 7); r('#ffe36a', 5, 1, 6, 5); r(P.greyD, 4, 0, 8, 1);
  }, O);
  S('window', 16, 16, (c, r) => {
    r(P.wood3, 1, 0, 14, 14); r('#a9dcf0', 3, 2, 10, 10); r('#d7f1fa', 3, 2, 4, 4);
    r(P.wood3, 7, 2, 2, 10); r(P.wood3, 3, 6, 10, 2); r(P.woodD, 0, 13, 16, 2); r(P.wood1, 0, 12, 16, 1);
  }, O);
  S('window_night', 16, 16, (c, r) => {
    r(P.wood3, 1, 0, 14, 14); r('#2c3a73', 3, 2, 10, 10); r('#fff2a8', 10, 3, 2, 2); r('#fff', 5, 4, 1, 1);
    r(P.wood3, 7, 2, 2, 10); r(P.wood3, 3, 6, 10, 2); r(P.woodD, 0, 13, 16, 2); r(P.wood1, 0, 12, 16, 1);
  }, O);
  S('clock', 16, 16, (c, r) => {
    r(P.woodD, 3, 1, 10, 10); r(P.white, 4, 2, 8, 8); r(P.ink, 8, 3, 1, 5); r(P.ink, 8, 7, 3, 1);
    r(P.red, 8, 7, 1, 1); r(P.woodD, 5, 11, 6, 3); r(P.yellow, 7, 12, 2, 2);
  }, O);
  S('painting', 16, 16, (c, r) => {
    r(P.yellow, 2, 1, 12, 10); r('#7fc8f0', 3, 2, 10, 8); r('#79c368', 3, 6, 10, 4); r(P.white, 5, 3, 3, 1); r(P.red, 9, 5, 2, 2);
  }, O);
  S('menu_board', 16, 16, (c, r) => {
    r(P.woodD, 1, 1, 14, 12); r('#2f3a34', 2, 2, 12, 10);
    r(P.white, 4, 4, 8, 1); r(P.white, 4, 6, 6, 1); r(P.yellow, 4, 8, 7, 1); r(P.pink, 4, 10, 4, 1);
  }, O);
  S('sofa', 16, 16, (c, r) => {
    r(P.teal2, 0, 4, 16, 10); r(P.teal, 1, 5, 14, 5); r('#59cbc6', 2, 6, 12, 1); r(P.teal2, 0, 3, 3, 12); r(P.teal2, 13, 3, 3, 12);
    r('#1d5e63', 0, 14, 16, 1);
  }, O);
  S('desk', 16, 16, (c, r) => {
    r(P.wood3, 1, 8, 2, 8); r(P.wood3, 13, 8, 2, 8);
    r(P.wood1, 0, 3, 16, 7); r('#dca36a', 0, 3, 16, 1); r(P.wood3, 0, 9, 16, 1);
    r(P.white, 3, 4, 5, 4); r(P.blue, 10, 5, 3, 3); r(P.red, 9, 4, 1, 1);
  }, O);
  S('corkboard', 16, 16, (c, r) => {
    r(P.woodD, 0, 1, 16, 13); r('#c79a5e', 1, 2, 14, 11);
    r(P.white, 2, 3, 4, 4); r(P.yellow, 7, 4, 3, 3); r(P.pink, 11, 3, 3, 4); r(P.white, 4, 8, 5, 4); r(P.red, 10, 9, 3, 1);
    r(P.red, 3, 3, 1, 1); r(P.blue, 8, 4, 1, 1); r(P.red, 12, 3, 1, 1);
  }, O);
  S('locker', 16, 32, (c, r) => {
    r(P.blue2, 1, 1, 14, 30); r(P.blue, 2, 2, 5, 28); r(P.blue, 9, 2, 5, 28);
    r('#2a3d70', 7, 1, 2, 30); r(P.yellow, 6, 14, 1, 3); r(P.yellow, 9, 14, 1, 3);
    r('#2a3d70', 3, 5, 3, 1); r('#2a3d70', 10, 5, 3, 1);
  }, O);
  S('files', 16, 32, (c, r) => {
    r(P.grey2, 1, 1, 14, 30); r(P.grey, 2, 2, 12, 8); r(P.grey, 2, 12, 12, 8); r(P.grey, 2, 22, 12, 8);
    r(P.greyD, 6, 5, 4, 1); r(P.greyD, 6, 15, 4, 1); r(P.greyD, 6, 25, 4, 1); r(P.white, 4, 3, 2, 2);
  }, O);
  S('coffee', 16, 16, (c, r) => {
    r(P.greyD, 3, 2, 10, 13); r(P.red, 5, 4, 6, 3); r(P.ink, 5, 9, 6, 4); r(P.white, 7, 10, 3, 3); r(P.grey, 3, 14, 10, 1);
  }, O);
  S('bookshelf', 16, 32, (c, r) => {
    r(P.wood3, 0, 0, 16, 32); r(P.woodD, 0, 0, 16, 1);
    const cols = [P.red, P.blue, P.green, P.yellow, P.purple, P.teal];
    for (let row = 0; row < 3; row++) {
      const y = 2 + row * 10;
      r(P.woodD, 1, y + 8, 14, 2);
      let x = 1;
      for (let i = 0; i < 6; i++) { const w = 2 + ((i + row) % 2); r(cols[(i + row * 2) % 6], x, y + (i % 3 === 0 ? 1 : 0), w, 8 - (i % 3 === 0 ? 1 : 0)); x += w + 0; if (x > 14) break; }
    }
  }, O);
  S('trophy', 16, 16, (c, r) => {
    r(P.wood3, 0, 10, 16, 6); r(P.yellow, 5, 2, 6, 6); r('#fff2a8', 6, 3, 2, 3); r(P.yellow, 3, 3, 2, 3); r(P.yellow, 11, 3, 2, 3);
    r(P.yellow, 7, 8, 2, 3); r('#c9a000', 5, 11, 6, 2);
  }, O);
  S('rug_round', 32, 32, (c, r) => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5);
      if (d < 15) { c.fillStyle = d < 6 ? '#e8c05a' : d < 10 ? '#d94a3f' : d < 13 ? '#f7e9cb' : '#9b3b45'; c.fillRect(x, y, 1, 1); }
    }
  });
  S('mailbox', 16, 16, (c, r) => {
    r(P.wood3, 7, 8, 2, 8); r(P.blue, 3, 2, 10, 7); r(P.blue2, 3, 7, 10, 2); r(P.red, 12, 0, 2, 4); r(P.ink, 5, 4, 6, 1);
  }, O);
  S('bench', 16, 16, (c, r) => {
    r(P.wood1, 0, 5, 16, 3); r(P.wood3, 0, 8, 16, 1); r(P.wood2, 0, 9, 16, 3); r(P.greyD, 1, 12, 2, 4); r(P.greyD, 13, 12, 2, 4);
  }, O);
  S('bush', 16, 16, (c, r) => {
    r('#2f7a3c', 1, 5, 14, 10); r('#44a14f', 2, 3, 12, 8); r('#62c26a', 4, 4, 4, 3); r('#2f7a3c', 0, 9, 3, 5); r('#2f7a3c', 13, 9, 3, 5);
    r(P.red, 5, 8, 1, 1); r(P.red, 10, 6, 1, 1);
  }, O);
  S('crate_stack', 16, 32, (c, r) => {
    r(P.wood1, 1, 3, 14, 12); r(P.wood3, 1, 3, 14, 1); r(P.wood3, 1, 14, 14, 1); r(P.wood3, 7, 4, 2, 10);
    r(P.wood2, 1, 17, 14, 14); r(P.wood3, 1, 17, 14, 1); r(P.wood3, 1, 30, 14, 1); r(P.wood3, 1, 17, 1, 14); r(P.wood3, 14, 17, 1, 14);
    r(P.wood3, 2, 22, 12, 2);
  }, O);

  // ---- puertas ----
  S('door', 16, 16, (c, r) => {
    r(P.wood3, 1, 0, 14, 16); r(P.wood1, 2, 1, 12, 14); r(P.wood2, 3, 2, 4, 5); r(P.wood2, 9, 2, 4, 5); r(P.wood2, 3, 8, 4, 6); r(P.wood2, 9, 8, 4, 6);
    r(P.yellow, 11, 9, 2, 2);
  });
  S('door_open', 16, 16, (c, r) => {
    r('#1c1226', 2, 1, 12, 15); r(P.wood3, 1, 0, 14, 1); r(P.wood3, 1, 0, 1, 16); r(P.wood3, 14, 0, 1, 16);
    r(P.wood1, 2, 1, 3, 14);
  });
  S('door_locked', 16, 16, (c, r) => {
    r(P.wood3, 1, 0, 14, 16); r(P.wood1, 2, 1, 12, 14); r(P.wood2, 3, 2, 4, 5); r(P.wood2, 9, 2, 4, 5); r(P.wood2, 3, 8, 4, 6); r(P.wood2, 9, 8, 4, 6);
    r(P.grey2, 6, 7, 4, 5); r(P.greyD, 7, 8, 2, 2); r(P.grey, 6, 5, 4, 2);
  });
  S('door_metal', 16, 16, (c, r) => {
    r(P.greyD, 1, 0, 14, 16); r(P.grey2, 2, 1, 12, 14); r(P.grey, 3, 2, 10, 2); r(P.greyD, 3, 6, 10, 1); r(P.greyD, 3, 11, 10, 1);
    r(P.yellow, 11, 8, 2, 2);
  });
  S('door_metal_open', 16, 16, (c, r) => {
    r('#1c1226', 2, 1, 12, 15); r(P.greyD, 1, 0, 14, 1); r(P.greyD, 1, 0, 1, 16); r(P.greyD, 14, 0, 1, 16); r(P.grey2, 2, 1, 3, 14);
  });
  S('door_metal_locked', 16, 16, (c, r) => {
    r(P.greyD, 1, 0, 14, 16); r(P.grey2, 2, 1, 12, 14); r(P.grey, 3, 2, 10, 2); r(P.greyD, 3, 6, 10, 1); r(P.greyD, 3, 11, 10, 1);
    r(P.yellow, 6, 7, 4, 5); r(P.ink, 7, 9, 2, 1); r(P.yellow, 6, 5, 4, 2);
  });

  // ---- marcas del suelo / pistas ----
  S('decal_boots', 16, 16, (c, r) => {
    const col = 'rgba(60,40,30,0.55)';
    r(col, 2, 2, 4, 6); r(col, 3, 8, 3, 2); r(col, 9, 6, 4, 6); r(col, 10, 12, 3, 2);
  });
  S('decal_wheel', 16, 16, (c, r) => {
    r('rgba(50,40,40,0.5)', 3, 0, 2, 16); r('rgba(50,40,40,0.5)', 11, 0, 2, 16);
    r('rgba(200,50,70,0.8)', 3, 4, 2, 2); r('rgba(200,50,70,0.8)', 11, 10, 2, 2); r('rgba(200,50,70,0.8)', 3, 13, 2, 1);
  });
  S('decal_paws', 16, 16, (c, r) => {
    const col = 'rgba(90,60,40,0.6)';
    [[3, 10], [9, 5]].forEach(([x, y]) => { r(col, x, y + 2, 3, 2); r(col, x - 1, y, 1, 1); r(col, x + 1, y - 1, 1, 1); r(col, x + 3, y, 1, 1); });
  });
  S('decal_crumbs', 16, 16, (c, r) => {
    speckle(c, 2, 4, 12, 10, [P.cream2, '#e0b878', P.pink], 12, 21);
  });
  // brillos UV (se dibujan con la linterna)
  S('uv_lips', 16, 16, (c, r) => {
    r(P.glow2, 4, 3, 2, 10); r(P.glow2, 2, 3, 6, 1); r(P.glow2, 2, 5, 1, 1);
    r(P.glow2, 9, 8, 5, 2); r(P.glow2, 10, 10, 3, 1); r('#fff', 10, 8, 1, 1);
  });
  S('uv_hand', 16, 16, (c, r) => {
    r(P.glow, 4, 6, 8, 7); r(P.glow, 4, 3, 1, 4); r(P.glow, 6, 2, 1, 5); r(P.glow, 8, 2, 1, 5); r(P.glow, 10, 3, 1, 4); r(P.glow, 2, 8, 2, 2);
  });
  S('uv_text', 16, 16, (c, r) => {
    r(P.glow, 2, 3, 12, 1); r(P.glow, 2, 6, 9, 1); r(P.glow, 2, 9, 11, 1); r(P.glow, 2, 12, 6, 1); r('#fff', 3, 3, 2, 1);
  });
  S('sparkle', 8, 8, (c, r) => {
    r('#fff', 3, 0, 2, 8); r('#fff', 0, 3, 8, 2); r(P.yellow, 2, 2, 4, 4);
  });
  S('shadow', 16, 8, (c, r) => {
    r('rgba(20,10,30,0.32)', 3, 2, 10, 4); r('rgba(20,10,30,0.32)', 1, 3, 14, 2);
  });
  S('paper', 16, 16, (c, r) => {
    r(P.white, 3, 3, 10, 11); r(P.grey, 3, 13, 10, 1); r(P.grey2, 5, 5, 6, 1); r(P.grey2, 5, 7, 6, 1); r(P.grey2, 5, 9, 4, 1);
  }, O);
})(typeof window !== 'undefined' ? window : globalThis);
