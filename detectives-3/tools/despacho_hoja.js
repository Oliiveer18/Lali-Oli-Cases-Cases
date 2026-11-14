// despacho_hoja.js — hoja de muestra del arte del Despacho (4F-0b 2/4-b) SIN navegador: lienzo simulado con píxeles → JSON → PNG (con PIL).
// Uso: node tools/despacho_hoja.js [salida.json]  y luego python3 tools/despacho_hoja.py salida.json salida.png  (solo para revisar a ojo).
const fs = require('fs');
const OVER = `(function(){ const G = globalThis.G || (globalThis.G = {});
  const col = (s) => { if (s[0] === '#') { const h = s.length === 4 ? s.slice(1).split('').map((x) => x + x).join('') : s.slice(1); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 255]; }
    const m = /rgba?\\(([^)]+)\\)/.exec(s); if (m) { const a = m[1].split(',').map(Number); return [a[0], a[1], a[2], a.length > 3 ? Math.round(a[3] * 255) : 255]; } return [255, 0, 255, 255]; };
  G.makeCanvas = (w, h) => { const d = new Uint8ClampedArray(w * h * 4); let tx = 0, ty = 0, st = []; const ctx = { fillStyle: '#000', imageSmoothingEnabled: false,
    save() { st.push([tx, ty]); }, restore() { const s = st.pop(); tx = s[0]; ty = s[1]; }, translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, ww, hh) { const c = col(this.fillStyle); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const X = x + i + tx, Y = y + j + ty; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const k = (Y * w + X) * 4; const a = c[3] / 255; for (let q = 0; q < 3; q++) d[k + q] = a >= 1 ? c[q] : Math.round(c[q] * a + d[k + q] * (1 - a)); d[k + 3] = Math.max(d[k + 3], c[3]); } },
    getImageData() { return { data: d, width: w, height: h }; }, putImageData() {}, drawImage() {} }; return { width: w, height: h, data: d, getContext: () => ctx }; };
})();
`;
const patch = (f, src) => f !== 'sprites_a.js' ? src : src.replace('G.makeCanvas = function (w, h) {', OVER + 'G.makeCanvasOrig = function (w, h) {');
const G = require('./load_g.js')(['gen_data.js'], patch);
const ids = ['portrait', 'desk_boss', 'safe', 'armchair', 'globe', 'trophy', 'desk', 'bookshelf', 'sofa', 'coat_rack'], K = 6, out = [];
ids.forEach((id) => { const s = G.spr[id]; if (!s) { out.push({ id, falta: true }); return; } out.push({ id, w: s.w, h: s.h, px: Array.from(s.c.data) }); });
fs.writeFileSync(process.argv[2] || '/tmp/despacho_hoja.json', JSON.stringify({ K, out })); console.log('sprites:', out.map((o) => o.id + (o.falta ? '(FALTA)' : '')).join(' '));
