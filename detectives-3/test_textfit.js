// Prueba (sin navegador) del AYUDANTE COMÚN DE TEXTO (FIX-4a c): U.textLayout y U.text con maxH.
// Comprueba: cabe siempre en la caja; reduce antes de recortar; nunca baja de minSize; recorta con «…» sin salirse del ancho;
// sin maxH no cambia nada; respeta «Texto grande»; es determinista; y mide los textos reales de casos generados en las cajas del juego.
const fs = require('fs'), vm = require('vm'), path = require('path');
const mkCtx = () => { const t = { font: '' }; return new Proxy(t, { get: (o, k) => (k === 'measureText' ? (s) => ({ width: String(s).length * (parseFloat(o.font.replace(/^bold /, '')) || 16) * 0.5 }) : k in o ? o[k] : () => {}), set: (o, k, v) => ((o[k] = v), true) }); };
const sb = { console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Uint8ClampedArray, Uint32Array, parseInt, parseFloat, isFinite, Infinity, Proxy, setTimeout, btoa: (s) => Buffer.from(s, 'binary').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('binary') };
sb.globalThis = sb; sb.crypto = require('crypto').webcrypto;
const mkPlain = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'getImageData' ? undefined : () => {}), set: (t, k, v) => ((t[k] = v), true) });
sb.__makeCanvas = (w, h) => ({ width: w, height: h, getContext: () => mkPlain() });
vm.createContext(sb);
['core.js', 'sprites_a.js', 'sprites_b.js', 'sprites_c.js', 'ui.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'), sb, { filename: f }));
const G = sb.G, U = G.ui, ctx = mkCtx();
G.save.data = G.defaultSave();
let fails = 0, n = 0;
const t = (name, ok, extra) => { n++; if (!ok) { fails++; console.log(' FALLA ' + name + (extra ? ' ' + extra : '')); } };
const words = 'el detective encontró una pista muy rara bajo la alfombra de la cocina mientras la sospechosa fingía no saber nada del asunto'.split(' ');
const mk = (k) => Array.from({ length: k }, (_, i) => words[(i * 7) % words.length]).join(' ');
let shrunk = 0, trunc = 0;
for (const bigText of [false, true]) {
  G.save.data.settings.bigText = bigText;
  for (const size of [13, 15, 17, 18]) for (const maxW of [120, 200, 342, 500]) for (const maxH of [20, 40, 60, 95, 195]) for (const k of [1, 5, 12, 30, 80, 200]) {
    const str = mk(k), o = { size, maxW, maxH, lineH: Math.round(size * 1.3), minSize: 11 };
    const L = U.textLayout(ctx, str, o), tag = `size=${size} W=${maxW} H=${maxH} k=${k} big=${bigText}`;
    t('nunca baja de minSize ' + tag, L.size >= Math.min(size, 11) && L.size <= size);
    t('nunca pasa del alto, salvo 1 línea mínima ' + tag, L.h <= maxH + 0.01 || L.lines.length === 1, JSON.stringify([L.h, L.lines.length]));
    t('si se recorta, ya está al mínimo ' + tag, !L.truncated || L.size === Math.min(size, 11));
    t('recortado acaba en «…» ' + tag, !L.truncated || /…$/.test(L.lines[L.lines.length - 1]));
    ctx.font = U.font(L.size);
    t('ninguna línea se sale del ancho ' + tag, L.lines.every((l) => ctx.measureText(l).width <= maxW + 0.01 || !/ /.test(l)));
    t('determinista ' + tag, JSON.stringify(U.textLayout(ctx, str, o)) === JSON.stringify(L));
    if (L.shrunk) shrunk++; if (L.truncated) trunc++;
    const big = U.textLayout(ctx, str, Object.assign({}, o, { maxH: 100000 }));
    t('si cabe, no se toca (tamaño y líneas) ' + tag, big.size === size && !big.truncated && !big.shrunk);
  }
}
G.save.data.settings.bigText = false;
const L1 = U.textLayout(ctx, 'hola\nque tal', { size: 16 });
t('sin maxW separa por saltos de línea', L1.lines.length === 2 && !L1.truncated);
t('texto vacío / null no rompe', U.textLayout(ctx, '', { size: 16, maxW: 100, maxH: 30 }).lines.length >= 1 && U.textLayout(ctx, null, { size: 16, maxW: 100, maxH: 30 }).h >= 0);
// U.text sin maxH devuelve lo mismo que antes (líneas × interlineado)
t('U.text sin maxH: altura = líneas × lineH', U.text(ctx, mk(30), 0, 0, { size: 15, maxW: 200, lineH: 20 }) === G.wrap((ctx.font = U.font(15), ctx), mk(30), 200).length * 20);
t('U.text con maxH cabe en la caja', U.text(ctx, mk(200), 0, 0, { size: 17, maxW: 410, lineH: 25, maxH: 195, minSize: 12 }) <= 195 + 0.01);

// textos reales: casos generados en las cajas del juego (pista 410×195 a 17 px, mín. 12; declaración 500 × 140; diálogo 18 px en ~700×104, mín. 12)
require('child_process');
const gl = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
let clues = 0, clueTrunc = 0, clueShrunk = 0, lines = 0, lineTrunc = 0, worst = 0;
for (let s = 0; s < 60; s++) {
  const r = gl.generateCase(s); if (r.error) continue;
  Object.values(r.def.clues).forEach((c) => { clues++; const L = U.textLayout(ctx, c.text, { size: 17, maxW: 410, lineH: 25, maxH: 195, minSize: 12 }); if (L.truncated) clueTrunc++; if (L.shrunk) clueShrunk++; });
  const strs = []; const walk = (o) => { if (typeof o === 'string') strs.push(o); else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
  Object.values(r.def.npcs).forEach((nd) => walk([nd.first, nd.topics, nd.chat, nd.press, nd.evidence, nd.evidenceDefault]));
  strs.filter((l) => l.length > 25).forEach((l) => { lines++; const L = U.textLayout(ctx, l, { size: 18, maxW: 700, lineH: 25, maxH: 104, minSize: 12 }); if (L.truncated) lineTrunc++; worst = Math.max(worst, L.lines.length); });
}
t('ninguna pista real se recorta en la libreta', clueTrunc === 0, clueTrunc + ' recortadas');
t('ninguna línea de diálogo real se recorta', lineTrunc === 0, lineTrunc + ' recortadas');
console.log(`casos mixtos: ${shrunk} reducidos y ${trunc} recortados · pistas reales ${clues} (reducidas ${clueShrunk}, recortadas ${clueTrunc}) · líneas de diálogo ${lines} (recortadas ${lineTrunc}, máx. ${worst} líneas)`);
console.log(`${n} comprobaciones, ${fails} fallos`);
console.log(fails ? 'HAY FALLOS' : 'Todo en orden');
process.exit(fails ? 1 : 0);
