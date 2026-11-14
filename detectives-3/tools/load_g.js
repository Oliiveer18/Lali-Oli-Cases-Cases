// load_g.js — carga el motor SIN navegador (en un contexto vm) para scripts y pruebas de la fábrica de casos.
// Uso: const G = require('./tools/load_g.js')(['bible.js', 'gen_truth.js']);   // extras = módulos de src/ a cargar al final
// Carga siempre: núcleo, sprites (lienzo simulado), ui, casos (case*.js), lógica, formato, revisor, mundo, compañero, bot y calidad.
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const BASE = ['core.js', 'sprites_a.js', 'sprites_b.js', 'sprites_c.js', 'ui.js'];
const AFTER = ['logic.js', 'schema.js', 'review.js', 'world.js', 'companion.js', 'bot.js', 'quality.js', 'meter.js'];
module.exports = function loadG(extra, patch) {
  extra = (extra || []).slice(); { const i = extra.indexOf('gen_data.js'); if (i >= 0 && extra.indexOf('gen_themes.js') < 0) extra.splice(i + 1, 0, 'gen_themes.js'); } // 4F-0a: el marco de temáticas va siempre justo después de gen_data.js   // patch(fichero, texto) → texto: solo para pruebas de mutación (cambia el código que se carga, no el disco)
  const mkCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'getImageData' ? undefined : () => {}), set: (t, k, v) => ((t[k] = v), true) });
  const sb = { console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Uint8ClampedArray, parseInt, isFinite, Infinity, Proxy };
  sb.globalThis = sb;
  sb.__makeCanvas = (w, h) => ({ width: w, height: h, getContext: () => mkCtx() });
  vm.createContext(sb);
  const cases = fs.readdirSync(SRC).filter((f) => /^case\d+\.js$/.test(f)).sort();
  BASE.concat(cases, AFTER, extra || []).forEach((f) => vm.runInContext(patch ? patch(f, fs.readFileSync(path.join(SRC, f), 'utf8')) : fs.readFileSync(path.join(SRC, f), 'utf8'), sb, { filename: f }));
  sb.G.save = { data: { settings: {}, upgrades: {} } };
  return sb.G;
};
