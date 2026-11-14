// CL-3: cifra INFORMATIVA «cuándo se podría acusar» (mediana, minutos de bot) por nivel con Acusar por razones (v7). Solo informa, nunca falla.
// Uso: node tools/acusacion_temprana.js [N por nivel = 20]  (usa GENV=7 sin subir GEN_VERSION)
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
G.GEN_VERSION = 7;
const N = +process.argv[2] || 20, DN = { facil: 'easy', normal: 'normal', dificil: 'hard' }, by = { facil: [], normal: [], dificil: [] };
for (let i = 1; i < 400 && Object.keys(by).some((k) => by[k].length < N); i++) { const r = G.generateCase(i * 7919 + 1, { register: true }); if (r.error || !r.def.genLevel) continue; if (by[r.def.genLevel].length < N) by[r.def.genLevel].push(r.def); }
const med = (a) => { a = a.slice().sort((x, y) => x - y); return a.length ? a[a.length >> 1] : NaN; };
console.log('CL-3 · cuándo se podría acusar (minutos HUMANOS = bot × 1,7, como la duración oficial; solo informa)\nNivel   · casos · temprana (mediana · mín–máx) · partida completa (mediana) · ganó temprana/completa');
Object.keys(by).forEach((lv) => {
  const e = [], f = []; let we = 0, wf = 0;
  by[lv].forEach((def) => { const a = G.botPlay(def, { difficulty: DN[lv], early: true }), b = G.botPlay(def, { difficulty: DN[lv] }); if (a.win) { we++; if (a.early) e.push(a.earlySeconds * 1.7 / 60); } if (b.win) wf++; if (b.humanMinutes) f.push(b.humanMinutes); });
  console.log(lv.padEnd(7) + ' · ' + by[lv].length + ' · ' + med(e).toFixed(1) + ' min (' + Math.min(...e).toFixed(1) + '–' + Math.max(...e).toFixed(1) + ') · ' + med(f).toFixed(1) + ' min · ' + we + '/' + wf + ' de ' + by[lv].length);
});
