// anim_sheet.js — hoja de muestra de la animación de objetos (4C-3b-1): cada animación en cuadros sucesivos y una escena de calle en 4 instantes.
// Uso: node build.js && node tools/anim_sheet.js [salida.png]   (necesita Chromium; mira cdp.js). Solo para revisar la animación a ojo.
const { launch } = require('./cdp'), fs = require('fs'), path = require('path');
const OUT = process.argv[2] || path.join(require('os').tmpdir(), 'animacion.png');
(async () => {
  const b = await launch('file://' + path.join(__dirname, '..', 'dist', 'index.html'), { wait: 2500 });
  const url = await b.eval(`(() => {
    const W = 1180, H = 1020, c = document.createElement('canvas'), x = c.getContext('2d'); c.width = W; c.height = H;
    x.fillStyle = '#3c2a5a'; x.fillRect(0, 0, W, H); x.imageSmoothingEnabled = false; x.fillStyle = '#fff'; x.font = '13px monospace';
    const spr = (id, px, py, k) => { const s = G.spr[id]; if (!s) { x.fillText('FALTA ' + id, px, py + 12); return; } x.drawImage(s.c, 0, 0, s.w, s.h, px - s.ox * k, py - s.oy * k, s.w * k, s.h * k); };
    x.fillText('ANIMACIONES: fotogramas sucesivos (cada cuadro = 0,25 s; la farola y la mesa solo parpadean a ratos, se muestran 24 cuadros)', 8, 16);
    const ids = Object.keys(G.ANIMS);
    ids.forEach((id, r) => {
      const y0 = 30 + r * 92, a = G.ANIMS[id], big = G.spr[a.frames[0]].tw > 16, n = a.seq ? 24 : 8, k = big ? 2 : 3;
      x.fillStyle = '#fff'; x.fillText(id, 8, y0 + 12);
      for (let i = 0; i < n; i++) { const st = G.animState(id, (a.seq ? i + 18 : i) * 0.25, 'demo'); x.fillStyle = '#5b5560'; x.fillRect(150 + i * 42, y0 - 4, 40, 84); spr(st.name, 154 + i * 42, y0 + 4, k); }
    });
    const by = 30 + ids.length * 92 + 10; x.fillStyle = '#fff'; x.fillText('ESCENA DE CALLE en 4 instantes (0 s, 0,35 s, 0,7 s, 1,05 s): sirena con resplandor, cinta que ondea, farola, charco', 8, by);
    [0, 0.35, 0.7, 1.05].forEach((t, i) => {
      const ox = 10 + (i % 2) * 580, oy = by + 14 + Math.floor(i / 2) * 215, K = 3;
      for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 11; tx++) spr('floor_cobble', ox + tx * 16 * K, oy + ty * 16 * K, K);
      const draw = (id, tx, ty, key) => { const st = G.animState(id, t, key) || { name: id }; spr(st.name, ox + tx * 16 * K, oy + ty * 16 * K, K); return st; };
      const glowAt = (st, cx, by2) => { if (st.glow) { const gs = G.spr[st.glow.sprite]; spr(st.glow.sprite, cx - gs.tw * K / 2 + st.glow.dx * K, by2 - gs.th * K / 2 + st.glow.dy * K, K); } };
      draw('decal_puddle', 6, 2, 'p'); const car = G.animState('police_car_0', t); glowAt(car, ox + 2 * 16 * K, oy + 3 * 16 * K); spr(car.name, ox + 1 * 16 * K, oy + 2 * 16 * K, K);
      draw('police_tape_h', 4, 3, 'a'); draw('police_tape_h', 5, 3, 'b'); draw('police_tape_v', 7, 1, 'c'); draw('police_tape_v', 7, 2, 'd'); draw('cone', 8, 3); draw('cone', 3, 3);
      const lamp = G.animState('lamp_post_blink', t + 18, 'l'); glowAt(lamp, ox + 9.5 * 16 * K, oy + 2.4 * 16 * K); spr(lamp.name, ox + 9 * 16 * K, oy + 0.8 * 16 * K, K);
      spr('agente_a_down_0', ox + 4.5 * 16 * K, oy + 1.2 * 16 * K, K);
      x.fillStyle = '#fff'; x.fillText('t = ' + t + ' s', ox, oy + 4 * 16 * K + 14);
    });
    return c.toDataURL('image/png'); })()`);
  fs.writeFileSync(OUT, Buffer.from(String(url).split(',')[1], 'base64')); console.log('Guardado', OUT, '· errores:', await b.eval('JSON.stringify(G.errors)'));
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
