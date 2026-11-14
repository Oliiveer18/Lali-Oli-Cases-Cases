// police_sheet.js — hoja de muestra del arte de policía y comisaría (4C-3a): aspectos (de frente, de espaldas y de lado), objetos, decals y el coche con sirena (2 fotogramas).
// Uso: node build.js && node tools/police_sheet.js [salida.png]   (necesita Chromium; mira cdp.js). Solo para revisar el arte a ojo.
const { launch } = require('./cdp'), fs = require('fs'), path = require('path');
const OUT = process.argv[2] || path.join(require('os').tmpdir(), 'policia.png');
(async () => {
  const b = await launch('file://' + path.join(__dirname, '..', 'dist', 'index.html'), { wait: 2500 });
  const url = await b.eval(`(() => {
    const K = 6, W = 1100, bg = '#3c2a5a', c = document.createElement('canvas'), x = c.getContext('2d'); c.width = W; c.height = 960;
    x.fillStyle = bg; x.fillRect(0, 0, W, 960); x.imageSmoothingEnabled = false; x.font = '13px monospace'; x.fillStyle = '#fff';
    const draw = (id, px, py, k) => { const s = G.spr[id]; if (s) x.drawImage(s.c, 0, 0, s.w, s.h, px, py, s.w * (k || K), s.h * (k || K)); else { x.fillStyle = '#f55'; x.fillText('FALTA ' + id, px, py + 12); x.fillStyle = '#fff'; } };
    const ids = [].concat(G.POLICE_LOOKS.agente, G.POLICE_LOOKS.inspector, G.POLICE_LOOKS.comisario), rex = ['rex', 'luna'];
    x.fillText('PERSONAJES: de frente, de espaldas, de lado (+ Rex y Luna para comparar)', 8, 16);
    ids.concat(rex).forEach((id, i) => { const px = 10 + i * 105, py = 26; draw(id + '_down_0', px, py); draw(id + '_up_0', px, py + 140); draw(id + '_side_0', px, py + 280); x.fillText(id.replace('_', ' '), px, py + 420); });
    const base = 470; x.fillText('OBJETOS Y ESCENA', 8, base);
    const props = ['station_counter', 'interrogation_table', 'clue_board', 'police_sign', 'cone', 'police_tape_h', 'police_tape_v', 'decal_puddle', 'decal_stain', 'decal_jam'];
    props.forEach((id, i) => { const px = 10 + i * 104; x.fillStyle = '#8a7a6a'; x.fillRect(px - 2, base + 12, 16 * K + 4, 16 * K + 4); draw(id, px, base + 14); x.fillStyle = '#fff'; x.font = '11px monospace'; x.fillText(id, px, base + 124); x.font = '13px monospace'; });
    x.fillStyle = '#fff'; x.fillText('cell_bars (celda)', 10, base + 150); x.fillStyle = '#8a7a6a'; x.fillRect(8, base + 160, 16 * K + 4, 32 * K + 4); draw('cell_bars', 10, base + 162);
    x.fillStyle = '#fff'; x.fillText('police_car_0 / police_car_1 (sirena)', 140, base + 150);
    x.fillStyle = '#5b5560'; x.fillRect(140, base + 160, 2 * 32 * K + 30, 16 * K + 20); draw('police_car_0', 150, base + 170); draw('police_car_1', 150 + 32 * K + 20, base + 170);
    x.fillStyle = '#fff'; x.fillText('escena: coche + cinta + conos + charco', 140, base + 290);
    x.fillStyle = '#5b5560'; x.fillRect(140, base + 300, 560, 130); draw('decal_puddle', 360, base + 330, 4); draw('police_car_0', 150, base + 310, 4); ['police_tape_h', 'police_tape_h'].forEach((id, i) => draw(id, 290 + i * 64, base + 384, 4)); draw('cone', 450, base + 380, 4); draw('cone', 560, base + 380, 4); draw('police_tape_v', 510, base + 330, 4); draw('agente_a_down_0', 600, base + 316, 4);
    return c.toDataURL('image/png'); })()`);
  fs.writeFileSync(OUT, Buffer.from(String(url).split(',')[1], 'base64')); console.log('Guardado', OUT, '· errores:', await b.eval('JSON.stringify(G.errors)'));
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
