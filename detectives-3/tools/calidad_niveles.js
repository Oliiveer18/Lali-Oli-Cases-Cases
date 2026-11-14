// calidad_niveles.js — S3b-1 de 4D-2: la calidad de CADA nivel por separado (regla del usuario, 19 oct). Unidad = par (caso, dificultad).
// Uso: node tools/calidad_niveles.js [N=60] [inicio=1] [paso=7919]   (semilla = i*paso+1; para cada semilla genera el caso en los 3 niveles y el bot lo juega en su dificultad)
// Imprime, por nivel: casos, nota mín/media/máx, aceptados, duración (media y % dentro de su banda) y las componentes medias. Con --json imprime también el objeto.
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
if (process.env.GENV) G.GEN_VERSION = +process.env.GENV; // GENV=7 mide la receta v7 sin subir la versión
const args = process.argv.slice(2).filter((a) => !/^--/.test(a)), N = +args[0] || 60, I0 = +args[1] || 1, STEP = +args[2] || 7919;
// 27 oct (cp. 260): los minutos se miden contra la banda VIGENTE (decisión del usuario, cp. 170; Fácil 20-28 · Normal 28-36 · Difícil 36-45, techo 45), no contra la de v5 (20-30 · 30-40 · 40-55) de `QUALITY_CFG.profiles`. Solo cambia lo que imprime esta herramienta, no la nota de calidad. (Hecho en TIEMPOS-1: ahora los lee de los datos.)
// 27 oct (cp. 261, TIEMPOS-1): la banda sale de los DATOS (`GEN_DATA.compile.durationV7`); si faltaran, se usa la copia de respaldo de abajo.
const DV7 = G.GEN_DATA && G.GEN_DATA.compile && G.GEN_DATA.compile.durationV7, RESPALDO = { facil: [20, 28], normal: [28, 36], dificil: [36, 45] };
const BANDA_VIGENTE = DV7 ? { facil: DV7.levels.facil.range, normal: DV7.levels.normal.range, dificil: DV7.levels.dificil.range } : RESPALDO;
const LEVELS = ['facil', 'normal', 'dificil'], out = {};
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0), r1 = (x) => Math.round(x * 10) / 10;
LEVELS.forEach((L) => {
  const rows = [];
  for (let i = I0; i < I0 + N; i++) { const r = G.generateCase(i * STEP + 1, { register: true, level: L }); if (r.error) continue; rows.push(G.qualityCase(r.def)); }
  const q = rows.map((x) => x.quality), m = rows.map((x) => x.bot.humanMinutes), b = BANDA_VIGENTE[L], inBand = rows.filter((x) => x.bot.humanMinutes >= b[0] && x.bot.humanMinutes <= b[1]).length;
  const parts = {}; Object.keys(rows[0].parts).forEach((k) => { parts[k] = r1(mean(rows.map((x) => x.parts[k]))); });
  const sd = Math.sqrt(mean(q.map((x) => (x - mean(q)) ** 2)));
  out[L] = { casos: rows.length, nota: { min: Math.min(...q), media: r1(mean(q)), max: Math.max(...q), desv: r1(sd) }, intrinseca: r1(mean(rows.map((x) => x.intrinseca))), ajuste: r1(mean(rows.map((x) => x.ajuste))), aceptados: rows.filter((x) => x.accept).length, errores: rows.filter((x) => !x.ok).length,
    minutos: { min: Math.min(...m), media: r1(mean(m)), max: Math.max(...m) }, banda: b[0] + '-' + b[1], enBanda_pct: Math.round(100 * inBand / rows.length), con100: rows.filter((x) => x.quality >= 100).length, partes: parts };
});
LEVELS.forEach((L) => { const o = out[L]; console.log(`${L.padEnd(7)} n ${o.casos} · nota ${o.nota.min}/${o.nota.media}/${o.nota.max} (desv ${o.nota.desv}) · intrínseca ${o.intrinseca} · ajuste ${o.ajuste} · aceptados ${o.aceptados}/${o.casos} · errores ${o.errores} · min ${o.minutos.min}/${o.minutos.media}/${o.minutos.max} · banda ${o.banda}: ${o.enBanda_pct} % dentro · con 100: ${o.con100}`); console.log('        partes', JSON.stringify(o.partes)); });
if (process.argv.includes('--json')) console.log(JSON.stringify(out));
