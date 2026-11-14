// S2 de 4D-2: el bot juega N casos generados y resume atascos y duracion humana (sin leer logs enormes).
// Uso: node tools/bot_masa.js [N=1000] [inicio=1] [paso=7919]   (semilla = i*paso+1, como baseline)
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js', 'bot.js', 'quality.js']);
// GENV=7 → mide la receta de GEN_VERSION 7 SIN subir la versión del repositorio (solo en memoria), como tools/reparto_herramientas.js. Informa también CADA nivel por separado (mín / media / máx).
if (process.env.GENV) G.GEN_VERSION = +process.env.GENV;
const N = +process.argv[2] || 1000, I0 = +process.argv[3] || 1, STEP = +process.argv[4] || 7919;
let n = 0, err = 0, stuck = [], noWin = [], short = [], mins = [];
const byLevel = {};
for (let i = I0; i < I0 + N; i++) {
  const seed = i * STEP + 1, r = G.generateCase(seed, { register: true });
  if (r.error) { err++; continue; }
  const b = G.botPlay(JSON.parse(JSON.stringify(r.def))); n++;
  const m = b.humanMinutes; mins.push(m); (byLevel[r.def.genLevel || '?'] = byLevel[r.def.genLevel || '?'] || []).push(m);
  if (b.stuck) stuck.push(seed); else if (!(b.ok && b.win)) noWin.push(seed);
  if (m < 20) short.push([seed, m]);
}
mins.sort((a, b) => a - b); const q = (p) => mins[Math.min(mins.length - 1, Math.floor(p * mins.length))];
console.log(`casos ${n} · errores de generacion ${err} · atascos ${stuck.length} · sin ganar ${noWin.length} · < 20 min ${short.length} (${(100 * short.length / Math.max(1, n)).toFixed(1)} %)`);
console.log(`minutos humanos: min ${mins[0]} · p10 ${q(0.1)} · mediana ${q(0.5)} · media ${(mins.reduce((a, b) => a + b, 0) / mins.length).toFixed(1)} · max ${mins[mins.length - 1]}`);
['facil', 'normal', 'dificil', '?'].forEach((L) => { const a = byLevel[L]; if (a && a.length) console.log(`  ${L.padEnd(8)} n=${String(a.length).padStart(4)} · min ${Math.min(...a).toFixed(1)} · media ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1)} · max ${Math.max(...a).toFixed(1)}`); });
if (stuck.length) console.log('semillas atascadas:', stuck.slice(0, 10).join(' '));
if (noWin.length) console.log('semillas sin ganar:', noWin.slice(0, 10).join(' '));
if (short.length) console.log('peores (<20):', short.sort((a, b) => a[1] - b[1]).slice(0, 8).map((x) => x.join(':')).join(' '));
