// looks_sheet.js — hoja de muestra de los aspectos de personaje (4B): los 7 de siempre y el pool generado (asp_01…), de frente.
// Uso: node build.js && node tools/looks_sheet.js [salida.png]   (necesita Chromium; mira cdp.js). Solo para revisar el arte a ojo.
const { launch } = require('./cdp'), fs = require('fs'), path = require('path');
const OUT = process.argv[2] || path.join(require('os').tmpdir(), 'aspectos.png');
(async () => {
  const b = await launch('file://' + path.join(__dirname, '..', 'dist', 'index.html'), { wait: 2500 });
  const url = await b.eval(`(() => {
    const ids = ['rex', 'luna', 'hogaza', 'baguette', 'merengue', 'pimienta', 'cliente'].concat(G.GEN_LOOK_IDS), K = 5, cols = 10, cw = 16 * K + 24, ch = 22 * K + 30;
    const c = document.createElement('canvas'); c.width = cols * cw; c.height = Math.ceil(ids.length / cols) * ch; const x = c.getContext('2d');
    x.fillStyle = '#3c2a5a'; x.fillRect(0, 0, c.width, c.height); x.imageSmoothingEnabled = false; x.font = '12px monospace'; x.fillStyle = '#fff';
    ids.forEach((id, i) => { const s = G.spr[id + '_down_0'], px = (i % cols) * cw + 12, py = Math.floor(i / cols) * ch + 6; if (s) x.drawImage(s.c, 0, 0, s.w, s.h, px, py, s.w * K, s.h * K); x.fillText(id, px, py + 22 * K + 16); });
    return c.toDataURL('image/png'); })()`);
  fs.writeFileSync(OUT, Buffer.from(String(url).split(',')[1], 'base64')); console.log('Guardado', OUT, '· errores:', await b.eval('JSON.stringify(G.errors)'));
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
